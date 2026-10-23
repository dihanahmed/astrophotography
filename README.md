# Astrophotography Portfolio

A dark, space-themed portfolio site for your astrophotos.
**Frontend:** React + Vite. **Backend:** Node.js + Express. Photos are stored on disk and their info in a simple JSON file (no database).

## 1. Install Node.js

1. Go to <https://nodejs.org> and download the **LTS** version.
2. Run the installer with the default options.
3. Check it worked: open a terminal and run `node -v` and `npm -v`. Both should print a version number (Node 18 or newer).

## 2. Install the project's dependencies

In a terminal, inside the `astrophotography-portfolio` folder:

```bash
npm run install:all
```

This installs packages for the root, `backend/` and `frontend/` in one go.

## 3. Run it in VS Code

1. Open VS Code → **File → Open Folder…** → choose `astrophotography-portfolio`.
2. Open the built-in terminal: **Terminal → New Terminal**.
3. Run:

   ```bash
   npm run dev
   ```

4. Open <http://localhost:5173> in your browser.

Both servers start together: the backend at `http://localhost:5001` and the frontend at `http://localhost:5173`. Press `Ctrl+C` in the terminal to stop them.

## 4. Edit your name and contact info

Open `frontend/src/config/profile.js` and change the placeholder values (name, email, Instagram, location). Save the file and the page updates automatically.

## 5. Change the colors

All theme colors are in `frontend/src/styles/variables.css`.

## 6. Upload photos

1. Click **Choose File** in the *Upload Astrophoto* box and pick an image (jpg, jpeg, png, webp or tif, up to 25 MB).
2. Type a title and press **Upload**. A new card appears in the gallery.
3. Write your notes (what it is, equipment, exposure, date, location) in the card's text box and press **Save**.
4. Click a photo to view it full-size; press `Esc` or click outside to close.
5. **Delete** removes the card and the image file (it asks you to confirm first).

> Note: most browsers can't display `.tif` files, so a TIFF will upload but may show as a broken image. Export to JPG or PNG for the web.

## 7. Publish as a read-only website (GitHub Pages)

The published site has **no upload, save or delete buttons**. It only shows the photos you exported from your computer.

1. Add photos locally: run `npm run dev`, upload them, and write the descriptions.
2. Export and build the static site:

   ```bash
   npm run build:static
   ```

   This copies your photos into `frontend/public/` and builds the site into `frontend/dist/`.
3. Publish the contents of `frontend/dist/` to GitHub Pages (for example with the `gh-pages` branch or a GitHub Actions workflow).
4. To add more photos later, repeat steps 1-3.

Tip: `npm run preview:static` (after building) lets you check the read-only site locally before publishing.

## Project structure

```
backend/   Express API (server.js, routes/, controllers/, middleware/upload.js)
           data/photos.json  -> photo info      uploads/ -> image files
frontend/  React app (src/App.jsx, components/, services/api.js, config/profile.js, styles/)
```

## API

| Method | URL | What it does |
| ------ | --- | ------------ |
| GET | `/api/photos` | List all photos |
| POST | `/api/photos` | Upload a photo (form fields: `image`, `title`) |
| PUT | `/api/photos/:id` | Update `title` / `description` |
| DELETE | `/api/photos/:id` | Delete the photo and its image file |

## Troubleshooting

- **"Cannot reach the server"** – the backend isn't running. Use `npm run dev` from the root folder.
- **Port already in use** – change `PORT` in `backend/server.js` (and `API_URL` in `frontend/src/services/api.js`).
