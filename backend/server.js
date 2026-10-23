// server.js - Entry point of the backend.
// It creates the Express app, turns on the middleware we need,
// connects the photo routes, serves uploaded images, and starts listening.

const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const photoRoutes = require('./routes/photoRoutes');

const app = express();
const PORT = process.env.PORT || 5001; // 5000 is used by AirPlay on newer Macs

// CORS lets the React dev server (a different port) call this API.
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));

// Lets us read JSON sent in request bodies (used by the "Save" button).
app.use(express.json());

// Anything in backend/uploads is available at http://localhost:5001/uploads/<filename>
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// All photo API endpoints live under /api/photos
app.use('/api/photos', photoRoutes);

// Error handler: turns upload problems (wrong file type, too big) into clear JSON messages.
// Express recognises it as an error handler because it has 4 parameters.
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Image is too large (max 25 MB).' });
  }
  console.error(err.message);
  res.status(400).json({ error: err.message || 'Something went wrong.' });
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
