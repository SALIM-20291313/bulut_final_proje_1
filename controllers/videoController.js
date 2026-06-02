const Video = require('../models/Video');
const fs = require('fs');
const path = require('path');

exports.uploadPage = (req, res) => {
  res.render('upload', { title: 'Video Yükle' });
};

exports.watchPage = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).render('404', { title: 'Bulunamadı' });
    res.render('watch', { title: video.title, video });
  } catch (err) {
    res.status(500).render('error', { title: 'Hata', error: err.message });
  }
};

exports.dashboard = async (req, res) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });
    res.render('dashboard', { title: 'Video Listesi', videos });
  } catch (err) {
    res.status(500).render('error', { title: 'Hata', error: err.message });
  }
};

exports.upload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Video dosyası gerekli' });
    }

    const video = await Video.create({
      title: req.body.title || req.file.originalname,
      description: req.body.description || '',
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      status: 'ready'
    });

    res.redirect(`/api/videos/watch/${video._id}`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });
    res.json(videos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: 'Video bulunamadı' });
    res.json(video);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: 'Video bulunamadı' });

    const filePath = path.join(__dirname, '..', 'uploads', video.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    if (video.thumbnailPath) {
      const thumbPath = path.join(__dirname, '..', video.thumbnailPath);
      if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
    }

    await Video.findByIdAndDelete(req.params.id);
    res.json({ message: 'Video başarıyla silindi' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.apiUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Video dosyası gerekli' });
    }

    const video = await Video.create({
      title: req.body.title || req.file.originalname,
      description: req.body.description || '',
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      status: 'ready'
    });

    res.status(201).json({ message: 'Video başarıyla yüklendi', video });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
