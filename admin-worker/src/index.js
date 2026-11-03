// index.js - The admin "backend", running as a free Cloudflare Worker.
// It checks your login, then saves photo changes to GitHub as commits.
// Every commit to main makes GitHub Actions rebuild the live site (.github/workflows/deploy.yml).
//
// Routes (all except /login need "Authorization: Bearer <token>"):
//   POST   /login        { username, password }  -> { token }  (valid for 7 days)
//   GET    /photos       the current photo list, read straight from GitHub
//   POST   /images       body = {"encoding":"base64","content":"..."}  -> { sha }
//                        The image is streamed to GitHub untouched (step 1 of an upload).
//   POST   /photos       { blobSha, extension, title, description, capturedBy } -> new photo
//                        Adds the image + updated photos.json in ONE commit (step 2 of an upload).
//   PUT    /photos/:id   { title, description, capturedBy } -> updated photo
//   DELETE /photos/:id   removes the photo and its image file
//
// Secrets (set with `npx wrangler secret put NAME`, never written in code):
//   GITHUB_TOKEN, ADMIN_USERNAME, ADMIN_PASSWORD, SESSION_SECRET
// Plain settings (repo name, allowed websites) live in wrangler.toml.

const PHOTOS_DIR = 'frontend/public/photos'; // the same folder the website reads images from
const PHOTOS_JSON = 'frontend/public/photos.json'; // the same photo list the website reads

const MAX_IMAGE_BYTES = 25 * 1024 * 1024; // 25 MB
// base64 makes a file about 4/3 bigger, plus a few bytes of JSON around it.
const MAX_UPLOAD_BODY = Math.ceil(MAX_IMAGE_BYTES / 3) * 4 + 1024;
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'tif', 'tiff'];
const CAPTURED_BY = ['', 'seestar', 'camera']; // allowed "captured by" values ('' = not set)

const SESSION_MS = 7 * 24 * 60 * 60 * 1000; // a login lasts 7 days
const MAX_FAILS = 5; // wrong passwords before a lockout
const LOCK_MS = 15 * 60 * 1000; // lockout length: 15 minutes

const REQUIRED_SECRETS = ['GITHUB_TOKEN', 'ADMIN_USERNAME', 'ADMIN_PASSWORD', 'SESSION_SECRET'];

// An error with an HTTP status code, turned into a JSON response at the end.
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    // A request from a website that isn't on the allowed list is refused outright.
    if (request.headers.get('Origin') && !cors) return json({ error: 'This website is not allowed.' }, 403);
    // Browsers send an OPTIONS "preflight" first to ask what's allowed.
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    let response;
    try {
      response = await route(request, env);
    } catch (err) {
      if (!(err instanceof HttpError)) console.error(err);
      response = err instanceof HttpError
        ? json({ error: err.message }, err.status)
        : json({ error: 'Something went wrong on the server.' }, 500);
    }
    for (const [name, value] of Object.entries(cors || {})) response.headers.set(name, value);
    return response;
  },
};

// Decide which function handles the request.
async function route(request, env) {
  const missing = REQUIRED_SECRETS.filter((name) => !env[name]);
  if (missing.length) throw new HttpError(500, `Worker secrets not set: ${missing.join(', ')}`);

  const { pathname } = new URL(request.url);
  const method = request.method;

  if (method === 'POST' && pathname === '/login') return login(request, env);

  // Everything below needs a valid login. This runs BEFORE any upload is read.
  await requireSession(request, env);

  if (method === 'GET' && pathname === '/photos') return json((await readState(env)).photos);
  if (method === 'POST' && pathname === '/images') return uploadImage(request, env);
  if (method === 'POST' && pathname === '/photos') return createPhoto(request, env);

  const match = pathname.match(/^\/photos\/([\w-]+)$/);
  if (match && method === 'PUT') return updatePhoto(request, env, match[1]);
  if (match && method === 'DELETE') return deletePhoto(env, match[1]);

  throw new HttpError(404, 'Not found.');
}

// ---------- CORS: only our own website may call this Worker ----------

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin');
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((o) => o.trim());
  if (!origin || !allowed.includes(origin)) return null;
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

// ---------- Login and sessions ----------

// Wrong-password counts per visitor IP. This lives in the Worker's memory, so it
// resets when Cloudflare restarts the Worker; good enough to slow down guessing.
const failedLogins = new Map(); // ip -> { fails, lockedUntil }

async function login(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const record = failedLogins.get(ip) || { fails: 0, lockedUntil: 0 };
  if (record.lockedUntil > Date.now()) {
    throw new HttpError(429, 'Too many wrong attempts. Try again in 15 minutes.');
  }

  const { username, password } = await readJson(request);
  // "&" (not "&&") so both checks always run and take the same time.
  const ok = (await sameText(username, env.ADMIN_USERNAME)) & (await sameText(password, env.ADMIN_PASSWORD));

  if (!ok) {
    record.fails += 1;
    failedLogins.set(ip, record);
    // Each wrong try waits a little longer (1 s, 2 s, 3 s ...), then a lockout.
    await sleep(Math.min(record.fails, MAX_FAILS) * 1000);
    if (record.fails >= MAX_FAILS) {
      record.fails = 0;
      record.lockedUntil = Date.now() + LOCK_MS;
    }
    throw new HttpError(401, 'Wrong username or password.');
  }

  failedLogins.delete(ip);
  return json({ token: await createToken(env) });
}

// Compare two strings without leaking (through timing) how much of them matched.
async function sameText(input, secret) {
  if (typeof input !== 'string') return false;
  const [a, b] = await Promise.all([sha256(input), sha256(secret)]);
  return crypto.subtle.timingSafeEqual(a, b);
}

// A token is "<data>.<signature>". Only someone with SESSION_SECRET can make a
// valid signature, so a token can't be faked or have its expiry changed.
async function createToken(env) {
  const data = toBase64Url(new TextEncoder().encode(JSON.stringify({ exp: Date.now() + SESSION_MS })));
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(env), new TextEncoder().encode(data));
  return `${data}.${toBase64Url(signature)}`;
}

async function requireSession(request, env) {
  const header = request.headers.get('Authorization') || '';
  const [data, signature] = header.replace(/^Bearer /, '').split('.');
  let session = null;
  try {
    const valid = await crypto.subtle.verify(
      'HMAC', await hmacKey(env), fromBase64Url(signature), new TextEncoder().encode(data)
    );
    if (valid) session = JSON.parse(new TextDecoder().decode(fromBase64Url(data)));
  } catch {
    // malformed token: treated as not logged in
  }
  if (!session) throw new HttpError(401, 'Please log in.');
  if (!(session.exp > Date.now())) throw new HttpError(401, 'Your login has expired. Please log in again.');
}

const hmacKey = (env) =>
  crypto.subtle.importKey(
    'raw', new TextEncoder().encode(env.SESSION_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']
  );

// ---------- Photos ----------

// Step 1 of an upload: stream the browser's request body straight to GitHub as a "blob".
// The Worker never reads or decodes the image, so it uses almost no CPU time,
// and the file stays exactly as it was (no resizing, no recompression).
async function uploadImage(request, env) {
  const length = Number(request.headers.get('Content-Length'));
  if (!length) throw new HttpError(411, 'Upload size is missing.');
  if (length > MAX_UPLOAD_BODY) throw new HttpError(413, 'Image is larger than 25 MB.');

  // FixedLengthStream passes the bytes through as they arrive and tells GitHub the exact size.
  const { readable, writable } = new FixedLengthStream(length);
  request.body.pipeTo(writable).catch(() => {}); // errors show up in the fetch below
  const res = await fetch(`${repoUrl(env)}/git/blobs`, {
    method: 'POST',
    headers: githubHeaders(env, { 'Content-Type': 'application/json' }),
    body: readable,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw githubError(res.status, data);
  return json({ sha: data.sha }, 201);
}

// Step 2 of an upload: add the uploaded image + the new photo's details in one commit.
async function createPhoto(request, env) {
  const body = await readJson(request);
  if (!/^[0-9a-f]{40}$/.test(body.blobSha || '')) throw new HttpError(400, 'Missing uploaded image.');
  const extension = String(body.extension || '').toLowerCase();
  if (!IMAGE_EXTENSIONS.includes(extension)) {
    throw new HttpError(400, 'Only jpg, jpeg, png, webp and tif images are allowed.');
  }

  // Random file name avoids clashes and unsafe characters: <timestamp>-<hex>.<ext>
  const hex = [...crypto.getRandomValues(new Uint8Array(4))].map((b) => b.toString(16).padStart(2, '0')).join('');
  const photo = {
    id: crypto.randomUUID(),
    title: cleanTitle(body.title),
    description: cleanDescription(body.description),
    filename: `${Date.now()}-${hex}.${extension}`,
    uploadDate: new Date().toISOString(),
    capturedBy: cleanCapturedBy(body.capturedBy),
  };
  if (!photo.title) throw new HttpError(400, 'Please enter a title.');

  await commitChange(env, `Add photo: ${photo.title}`, (photos) => ({
    photos: [photo, ...photos], // newest first
    files: [{ path: `${PHOTOS_DIR}/${photo.filename}`, mode: '100644', type: 'blob', sha: body.blobSha }],
  }));
  return json(photo, 201);
}

// Change title / description / captured by. Only photos.json changes.
async function updatePhoto(request, env, id) {
  const { title, description, capturedBy } = await readJson(request);
  let updated;
  await commitChange(env, `Edit photo: ${cleanTitle(title) || id}`, (photos) => {
    const photo = findPhoto(photos, id);
    if (cleanTitle(title)) photo.title = cleanTitle(title);
    if (typeof description === 'string') photo.description = cleanDescription(description);
    if (CAPTURED_BY.includes(capturedBy)) photo.capturedBy = capturedBy;
    updated = photo;
    return { photos, files: [] };
  });
  return json(updated);
}

// Remove the photo from photos.json AND delete its image file, in one commit.
async function deletePhoto(env, id) {
  await commitChange(env, `Delete photo: ${id}`, (photos) => {
    const photo = findPhoto(photos, id);
    // Only plain file names, so a bad entry can never point at another file in the repo.
    const files = /^[\w-]+\.[\w]+$/.test(photo.filename)
      ? [{ path: `${PHOTOS_DIR}/${photo.filename}`, mode: '100644', type: 'blob', sha: null }]
      : [];
    return { photos: photos.filter((p) => p.id !== id), files };
  });
  return json({ message: 'Deleted.' });
}

function findPhoto(photos, id) {
  const photo = photos.find((p) => p.id === id);
  if (!photo) throw new HttpError(404, 'Photo not found.');
  return photo;
}

const cleanTitle = (value) => (typeof value === 'string' ? value.trim().slice(0, 200) : '');
const cleanDescription = (value) => (typeof value === 'string' ? value.slice(0, 5000) : '');
const cleanCapturedBy = (value) => (CAPTURED_BY.includes(value) ? value : '');

// ---------- GitHub ----------

// Read the latest commit on the branch and the photo list in it.
async function readState(env) {
  const ref = await github(env, 'GET', `/git/ref/heads/${env.GITHUB_BRANCH}`);
  const commitSha = ref.object.sha;
  const [commit, file] = await Promise.all([
    github(env, 'GET', `/git/commits/${commitSha}`),
    github(env, 'GET', `/contents/${PHOTOS_JSON}?ref=${commitSha}`),
  ]);
  const text = new TextDecoder().decode(fromBase64Url(file.content.replace(/\s/g, '')));
  return { commitSha, treeSha: commit.tree.sha, photos: JSON.parse(text) };
}

// Make one commit: run `change` on the current photo list, then save the new list
// plus any image files it adds or removes. If someone else committed at the same
// moment, GitHub refuses the update and we simply try again on top of their commit.
async function commitChange(env, message, change) {
  for (let attempt = 1; ; attempt++) {
    const state = await readState(env);
    const { photos, files } = change(state.photos);
    const tree = await github(env, 'POST', '/git/trees', {
      base_tree: state.treeSha,
      tree: [
        { path: PHOTOS_JSON, mode: '100644', type: 'blob', content: JSON.stringify(photos, null, 2) },
        ...files,
      ],
    });
    const commit = await github(env, 'POST', '/git/commits', {
      message, tree: tree.sha, parents: [state.commitSha],
    });
    try {
      await github(env, 'PATCH', `/git/refs/heads/${env.GITHUB_BRANCH}`, { sha: commit.sha, force: false });
      return;
    } catch (err) {
      if (err.githubStatus !== 422 || attempt >= 3) throw err;
    }
  }
}

// Small helper for GitHub REST API calls with a JSON body.
async function github(env, method, path, body) {
  const res = await fetch(`${repoUrl(env)}${path}`, {
    method,
    headers: githubHeaders(env, body ? { 'Content-Type': 'application/json' } : {}),
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw githubError(res.status, data);
  return data;
}

const repoUrl = (env) => `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}`;

const githubHeaders = (env, extra) => ({
  Authorization: `Bearer ${env.GITHUB_TOKEN}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'astro-admin-worker', // GitHub requires one
  ...extra,
});

// Turn a GitHub failure into a message that says what to fix.
function githubError(status, data) {
  const detail = (data && data.message) || `status ${status}`;
  let message = `GitHub error: ${detail}`;
  if (status === 401) message = 'GitHub rejected the token. Check the GITHUB_TOKEN secret.';
  if (status === 403 || status === 404) {
    message = `GitHub refused access (${detail}). Check the token has Contents: Read and write on the repo.`;
  }
  const err = new HttpError(502, message);
  err.githubStatus = status;
  return err;
}

// ---------- Small helpers ----------

// Read a small JSON body (logins and photo details, never images).
async function readJson(request) {
  if (Number(request.headers.get('Content-Length')) > 100_000) throw new HttpError(413, 'Request too large.');
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, 'Invalid request.');
  }
}

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const sha256 = (text) => crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));

// base64url = base64 that is safe inside URLs and headers (- and _ instead of + and /).
const toBase64Url = (bytes) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

// Decodes both base64url and normal base64.
const fromBase64Url = (text) =>
  Uint8Array.from(atob(text.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
