// api.js - Every call to a server lives here, so components stay simple.
// Each function returns the parsed JSON, or throws an Error with a friendly message.
//
// Two kinds of calls:
//   Public (homepage): photos.json and images that are published with the site itself.
//   Admin: login, upload, edit, delete go to the Cloudflare Worker (see config/admin.js),
//          which saves the change to GitHub. GitHub Actions then rebuilds the live site.

import { GITHUB_BRANCH, GITHUB_REPO, WORKER_URL } from '../config/admin.js';

const BASE = import.meta.env.BASE_URL;
export const MAX_IMAGE_BYTES = 25 * 1024 * 1024; // 25 MB, same limit as the Worker
export const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'tif', 'tiff'];
// Shown after every successful upload or edit.
export const SAVED_MESSAGE = 'Saved! The live site will update in 1–2 minutes.';

// Full URL of an image published with the site.
export const imageUrl = (filename) => `${BASE}photos/${filename}`;

// Same image, straight from GitHub (used by the admin panel, which is always up to date).
export const githubImageUrl = (filename) =>
  `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/frontend/public/photos/${filename}`;

// ---------- Login session ----------
// The Worker gives us a signed "token" after login. We keep it in localStorage
// so you stay logged in for 7 days. try/catch: storage can be blocked (private mode).

const TOKEN_KEY = 'adminToken';
// App-wide signal that the login is gone (expired or logged out elsewhere).
export const SESSION_ENDED_EVENT = 'admin-session-ended';

const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export function logout() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // nothing stored
  }
}

// True if we have a token that hasn't expired. (The Worker checks it properly too.)
export function isLoggedIn() {
  const token = getToken();
  if (!token) return false;
  try {
    const data = token.split('.')[0].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(data)).exp > Date.now();
  } catch {
    return false;
  }
}

// ---------- Shared helpers ----------

// Check the response and throw the server's error message if it failed.
async function handle(response) {
  let data = null;
  try {
    data = await response.json();
  } catch {
    // response had no JSON body
  }
  if (response.status === 401) endSession();
  if (!response.ok) throw new Error((data && data.error) || 'Request failed.');
  return data;
}

// fetch() itself throws if the server can't be reached; give that a clearer message.
async function request(url, options) {
  try {
    return await handle(await fetch(url, options));
  } catch (err) {
    if (err instanceof TypeError) throw new Error('Cannot reach the server. Check your internet connection.');
    throw err;
  }
}

// Calls to the Worker: adds the login token, and checks the Worker URL was set.
function workerRequest(path, options = {}) {
  if (WORKER_URL.includes('YOUR-SUBDOMAIN')) {
    return Promise.reject(new Error('Set WORKER_URL in frontend/src/config/admin.js first.'));
  }
  return request(`${WORKER_URL}${path}`, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${getToken()}` },
  });
}

function endSession() {
  logout();
  window.dispatchEvent(new Event(SESSION_ENDED_EVENT));
}

const jsonBody = (method, data) => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});

// ---------- Public ----------

// 'no-cache' makes the browser check for a newer photos.json every time,
// so a fresh deploy never shows an old, cached photo list.
export const getPhotos = () => request(`${BASE}photos.json`, { cache: 'no-cache' });

// ---------- Admin ----------

export async function login(username, password) {
  const { token } = await workerRequest('/login', jsonBody('POST', { username, password }));
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    throw new Error('Your browser is blocking storage, so the login cannot be remembered.');
  }
}

export const getAdminPhotos = () => workerRequest('/photos');

export const updatePhoto = (id, title, description, capturedBy) =>
  workerRequest(`/photos/${id}`, jsonBody('PUT', { title, description, capturedBy }));

export const deletePhoto = (id) => workerRequest(`/photos/${id}`, { method: 'DELETE' });

// Upload in two steps, keeping the image exactly as it is (no resizing or recompression):
//   1. Send the file to the Worker, which streams it to GitHub untouched.
//      The browser turns it into base64 text first (the format GitHub needs),
//      so the Worker doesn't have to do any heavy work.
//   2. Send the details; the Worker commits image + photos.json together.
// onProgress(percent) is called while step 1 is sending.
export async function uploadPhoto(file, { title, description, capturedBy }, onProgress) {
  const extension = file.name.split('.').pop().toLowerCase();
  const base64 = await fileToBase64(file);
  const { sha } = await sendWithProgress('/images', `{"encoding":"base64","content":"${base64}"}`, onProgress);
  return workerRequest('/photos', jsonBody('POST', { blobSha: sha, extension, title, description, capturedBy }));
}

// Read a file as base64 text (the part after "data:image/jpeg;base64,").
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = () => reject(new Error('Could not read the image file.'));
    reader.readAsDataURL(file);
  });
}

// fetch() can't report upload progress, so this one call uses XMLHttpRequest.
function sendWithProgress(path, body, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${WORKER_URL}${path}`);
    xhr.setRequestHeader('Authorization', `Bearer ${getToken()}`);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      let data = null;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        // no JSON body
      }
      if (xhr.status === 401) endSession();
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else reject(new Error((data && data.error) || 'Upload failed.'));
    };
    xhr.onerror = () => reject(new Error('Upload failed. Check your internet connection.'));
    xhr.send(body);
  });
}
