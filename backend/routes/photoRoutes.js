// photoRoutes.js - Maps each API URL + HTTP method to a controller function.
// (Mounted at /api/photos in server.js, so '/' here means /api/photos.)

const express = require('express');
const upload = require('../middleware/upload');
const controller = require('../controllers/photoController');

const router = express.Router();

router.get('/', controller.getPhotos);                          // list all photos
router.post('/', upload.single('image'), controller.createPhoto); // upload (form field name: "image")
router.put('/:id', controller.updatePhoto);                     // update title/description
router.delete('/:id', controller.deletePhoto);                  // delete photo + file

module.exports = router;
