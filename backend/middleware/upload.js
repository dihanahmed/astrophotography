// upload.js - Multer configuration for image uploads.
// Multer reads the uploaded file from the request and saves it to backend/uploads.
// We choose: where to save, what to name it, which types are allowed, and the size limit.

const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff'];
const MAX_SIZE = 25 * 1024 * 1024; // 25 MB

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  // Random file name avoids clashes and unsafe characters; we keep the original extension.
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`);
  },
});

// Reject anything that is not an allowed image type.
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXTENSIONS.includes(ext) && file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only jpg, jpeg, png, webp and tif images are allowed.'));
  }
};

module.exports = multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE } });
