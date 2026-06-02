const express = require('express');
const router = express.Router();
const streamController = require('../controllers/streamController');

router.post('/create', streamController.createStream);
router.get('/watch/:id', streamController.watchStream);
router.delete('/:id', streamController.stopStream);
router.get('/', streamController.listStreams);

module.exports = router;
