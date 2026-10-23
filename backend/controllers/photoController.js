// photoController.js - The logic behind each API route.
// "Database" = the JSON file backend/data/photos.json (an array of photo objects).
// Each photo: { id, title, description, filename, uploadDate }

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_FILE = path.join(__dirname, '..', 'data', 'photos.json');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Read all photos from the JSON file (empty list if the file is missing/broken).
function readPhotos() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}

// Write the full list back to the JSON file.
function writePhotos(photos) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(photos, null, 2));
}

// Delete an image file from disk, ignoring errors if it's already gone.
function removeImage(filename) {
  fs.unlink(path.join(UPLOADS_DIR, path.basename(filename)), () => {});
}

// GET /api/photos - newest first
exports.getPhotos = (req, res) => {
  const photos = readPhotos().sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
  res.json(photos);
};

// POST /api/photos - multer has already saved the file and put it in req.file
exports.createPhoto = (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Please choose an image.' });

  const title = (req.body.title || '').trim();
  if (!title) {
    removeImage(req.file.filename); // don't keep an orphan file
    return res.status(400).json({ error: 'Please enter a title.' });
  }

  const photo = {
    id: crypto.randomUUID(),
    title,
    description: '',
    filename: req.file.filename,
    uploadDate: new Date().toISOString(),
  };

  const photos = readPhotos();
  photos.push(photo);
  writePhotos(photos);
  res.status(201).json(photo);
};

// PUT /api/photos/:id - update title and/or description
exports.updatePhoto = (req, res) => {
  const photos = readPhotos();
  const photo = photos.find((p) => p.id === req.params.id);
  if (!photo) return res.status(404).json({ error: 'Photo not found.' });

  const { title, description } = req.body;
  if (typeof title === 'string' && title.trim()) photo.title = title.trim();
  if (typeof description === 'string') photo.description = description;

  writePhotos(photos);
  res.json(photo);
};

// DELETE /api/photos/:id - remove the data and the image file
exports.deletePhoto = (req, res) => {
  const photos = readPhotos();
  const photo = photos.find((p) => p.id === req.params.id);
  if (!photo) return res.status(404).json({ error: 'Photo not found.' });

  writePhotos(photos.filter((p) => p.id !== photo.id));
  removeImage(photo.filename);
  res.json({ message: 'Deleted.' });
};
