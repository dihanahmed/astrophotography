# Astrophotography Portfolio

A dark, space-themed portfolio site for your astrophotos, with an online **Admin** section
(username + password) so you can upload, edit and delete photos from any device.

- **Website:** React + Vite, published on GitHub Pages.
- **Admin backend:** a free Cloudflare Worker (`admin-worker/`). It checks your login and saves
  every change to this GitHub repo as a commit.
- **Auto-deploy:** every commit to `main` triggers GitHub Actions, which rebuilds and republishes
  the site (about 1–2 minutes).
- **No database:** photo info is in `frontend/public/photos.json`, images in `frontend/public/photos/`.
  Images are stored exactly as uploaded: original resolution, never resized or recompressed (max 25 MB).

```
You (any device) ──login/upload──▶ Cloudflare Worker ──commit──▶ GitHub repo (main)
                                                                     │ GitHub Actions
                                                                     ▼
                                         Live site  ◀── gh-pages branch (GitHub Pages)
```

## 1. Install

You need Node.js 18 or newer (<https://nodejs.org>, LTS version). Then, in this folder:

```bash
npm run install:all
```

## 2. Run it locally

```bash
npm run dev
```

Open <http://localhost:5173>. It's the same site as the live one, with the **Admin** button.
Admin actions go through the Cloudflare Worker and change the real GitHub repo, just like online.

> After making changes in Admin, run `git pull` to see them on your local homepage
> (the admin panel itself always shows the latest).

## 3. One-time setup of the admin Worker

See the step-by-step checklist the project was set up with, summarised here:

1. **GitHub token:** github.com → Settings → Developer settings → Personal access tokens →
   **Fine-grained tokens** → Generate new token. Repository access: *Only select repositories* →
   `astrophotography`. Permissions → Repository → **Contents: Read and write**. Copy the token.
2. **Log in to Cloudflare:** `cd admin-worker` then `npx wrangler login` (opens your browser).
3. **Set the four secrets** (each command asks you to type/paste the value):

   ```bash
   npx wrangler secret put GITHUB_TOKEN
   npx wrangler secret put ADMIN_USERNAME
   npx wrangler secret put ADMIN_PASSWORD
   npx wrangler secret put SESSION_SECRET   # any long random text, e.g. from: openssl rand -hex 32
   ```

4. **Deploy the Worker:** `npx wrangler deploy`. It prints the Worker's address
   (`https://astro-admin.<something>.workers.dev`).
5. Paste that address into `WORKER_URL` in `frontend/src/config/admin.js`, then commit and push.

## 4. Using Admin

1. Click **Admin** (top right) and log in. You stay logged in for 7 days on that device.
2. **Upload:** choose an image (jpg, jpeg, png, webp or tif, up to 25 MB), add a title, description
   and *Captured by*, then **Upload**. A progress bar shows the upload.
3. **Edit:** change a card's text and press **Save**. **Delete** removes the photo and its image file.
4. After each change: *"Saved! The live site will update in 1–2 minutes."*

> Most browsers can't display `.tif` files: a TIFF uploads but shows as a broken image.
> Export to JPG or PNG for the web.

## Customising

- Name, email, Instagram, location: `frontend/src/config/profile.js`
- Colors and fonts: `frontend/src/styles/variables.css`
- Worker address: `frontend/src/config/admin.js`
- Repo name and allowed websites for the Worker: `admin-worker/wrangler.toml`

## Commands

| Command | What it does |
| --- | --- |
| `npm run install:all` | Install packages for `frontend/` and `admin-worker/` |
| `npm run dev` | Run the site at <http://localhost:5173> |
| `npm run build` | Build the site into `frontend/dist/` (GitHub Actions does this for you) |
| `npm run worker:deploy` | Deploy the Worker after changing `admin-worker/` |

## Troubleshooting

- **"Set WORKER_URL…"**: step 3.5 above isn't done yet.
- **"Worker secrets not set"**: one of the four `wrangler secret put` commands is missing.
- **"GitHub rejected the token"**: the token expired or was typed wrong. Make a new one and run
  `npx wrangler secret put GITHUB_TOKEN` again.
- **"This website is not allowed"**: you're opening the site from an address not listed in
  `ALLOWED_ORIGINS` (`admin-worker/wrangler.toml`).
- **Live site didn't update**: check the **Actions** tab on GitHub for a failed "Deploy site" run.
- **Port 5173 already in use**: another `npm run dev` is still running; stop it with `Ctrl+C`.
