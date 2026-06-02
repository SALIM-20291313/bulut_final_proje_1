const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');

router.get('/', analysisController.allAnalysesPage);
router.get('/:videoId', analysisController.analyzePage);
router.post('/:videoId/start', analysisController.startAnalysis);
router.get('/:videoId/results', analysisController.getResults);
router.get('/:videoId/status', analysisController.getAnalysisStatus);
router.delete('/delete/:id', analysisController.deleteAnalysis);

module.exports = router;
