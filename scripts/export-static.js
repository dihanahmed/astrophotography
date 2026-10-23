// export-static.js - Copies your photos from the backend into the frontend so the
// site can be published as plain static files (e.g. on GitHub Pages).
//   backend/data/photos.json  ->  frontend/public/photos.json
//   backend/uploads/*         ->  frontend/public/photos/*
// Run it with: npm run export   (build:static runs it for you)

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dataFile = path.join(root, 'backend', 'data', 'photos.json');
const uploadsDir = path.join(root, 'backend', 'uploads');
const publicDir = path.join(root, 'frontend', 'public');
const photosOut = path.join(publicDir, 'photos');

const photos = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

// Start clean so deleted photos don't linger in the published site.
fs.rmSync(photosOut, { recursive: true, force: true });
fs.mkdirSync(photosOut, { recursive: true });

// Newest first, and only keep photos whose image file really exists.
const exported = photos
  .filter((p) => fs.existsSync(path.join(uploadsDir, p.filename)))
  .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

exported.forEach((p) => fs.copyFileSync(path.join(uploadsDir, p.filename), path.join(photosOut, p.filename)));
fs.writeFileSync(path.join(publicDir, 'photos.json'), JSON.stringify(exported, null, 2));

console.log(`Exported ${exported.length} photo(s) to frontend/public`);
