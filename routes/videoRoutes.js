const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const videoController = require('../controllers/videoController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/x-msvideo', 'video/quicktime', 'video/x-flv'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Sadece video dosyaları yüklenebilir (mp4, webm, avi, mov)'));
    }
  }
});

router.get('/upload', videoController.uploadPage);
router.get('/dashboard', videoController.dashboard);
router.get('/watch/:id', videoController.watchPage);
router.post('/upload', upload.single('video'), videoController.upload);
router.post('/youtube', videoController.youtubeUpload);
router.get('/', videoController.getAll);
router.get('/:id', videoController.getOne);
router.delete('/:id', videoController.delete);
router.post('/', upload.single('video'), videoController.apiUpload);

module.exports = router;
