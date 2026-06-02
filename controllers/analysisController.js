const Analysis = require('../models/Analysis');
const Video = require('../models/Video');
const aiService = require('../services/aiService');

exports.analyzePage = async (req, res) => {
  try {
    const video = await Video.findById(req.params.videoId);
    if (!video) return res.status(404).render('404', { title: 'Bulunamadı' });
    const analyses = await Analysis.find({ videoId: req.params.videoId }).sort({ createdAt: -1 });
    res.render('analysis', { title: 'Video Analizi', video, analyses });
  } catch (err) {
    res.status(500).render('error', { title: 'Hata', error: err.message });
  }
};

exports.startAnalysis = async (req, res) => {
  let analysisId = null;
  try {
    const video = await Video.findById(req.params.videoId);
    if (!video) return res.status(404).json({ error: 'Video bulunamadı' });

    const provider = 'aws';
    const analysis = await Analysis.create({
      videoId: video._id,
      provider,
      status: 'processing'
    });
    analysisId = analysis._id;
    await Video.updateOne({ _id: video._id }, { $set: { status: 'processing' } });

    res.json({ message: 'Analiz başlatıldı, işleniyor...', analysisId: analysis._id });

    const videoPath = `uploads/${video.filename}`;
    const results = await aiService.analyzeVideo(videoPath, provider);

    analysis.labels = results.labels || [];
    analysis.faces = results.faces || [];
    analysis.persons = results.persons || [];
    analysis.textDetections = results.textDetections || [];
    analysis.moderation = results.moderation || [];
    analysis.segments = results.segments || [];
    analysis.summary = results.summary || {};
    analysis.status = 'completed';
    analysis.processingTimeMs = results.processingTimeMs || 0;
    await analysis.save();

    await Video.updateOne({ _id: video._id }, { $set: { status: 'completed' } });
  } catch (err) {
    console.error('Analiz hatasi:', err.message);
    console.error('Stack:', err.stack);
    if (analysisId) {
      const failed = await Analysis.findById(analysisId);
      if (failed) {
        failed.status = 'failed';
        failed.error = err.message || JSON.stringify(err);
        await failed.save();
      }
    }

    await Video.updateOne({ _id: req.params.videoId }, { $set: { status: 'failed' } });
  }
};

exports.getResults = async (req, res) => {
  try {
    const analyses = await Analysis.find({ videoId: req.params.videoId }).sort({ createdAt: -1 });
    res.json(analyses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAnalysisStatus = async (req, res) => {
  try {
    const analysis = await Analysis.find({ videoId: req.params.videoId }).sort({ createdAt: -1 }).limit(1);
    if (!analysis.length) return res.json({ status: 'not_started' });
    res.json({ status: analysis[0].status, updatedAt: analysis[0].updatedAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteAnalysis = async (req, res) => {
  try {
    await Analysis.findByIdAndDelete(req.params.id);
    res.json({ message: 'Analiz silindi' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.allAnalysesPage = async (req, res) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });
    const uploadedVideos = videos.filter(v => !v.streamKey);
    const analyses = await Analysis.find().sort({ createdAt: -1 });

    const videoAnalysisMap = {};
    for (const a of analyses) {
      if (!videoAnalysisMap[a.videoId]) {
        videoAnalysisMap[a.videoId] = [];
      }
      videoAnalysisMap[a.videoId].push(a);
    }

    const videoList = [];
    for (const v of uploadedVideos) {
      const vAnalyses = videoAnalysisMap[v._id] || [];
      videoList.push({
        video: v,
        analysisCount: vAnalyses.length,
        latestStatus: vAnalyses.length > 0 ? vAnalyses[0].status : 'none',
        latestDate: vAnalyses.length > 0 ? vAnalyses[0].createdAt : null,
        hasCompleted: vAnalyses.some(a => a.status === 'completed')
      });
    }

    const search = req.query.search || '';
    const filtered = search
      ? videoList.filter(v => v.video.title.toLowerCase().includes(search.toLowerCase()))
      : videoList;

    res.render('analyses', { title: 'Analizler', videoList: filtered, search });
  } catch (err) {
    res.status(500).render('error', { title: 'Hata', error: err.message });
  }
};
