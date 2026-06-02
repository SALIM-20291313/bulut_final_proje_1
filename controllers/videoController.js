const Video = require('../models/Video');
const fs = require('fs');
const path = require('path');
const ytdl = require('@distube/ytdl-core');
const youtubedl = require('youtube-dl-exec');
const { v4: uuidv4 } = require('uuid');

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
    const uploadedOnly = videos.filter(v => !v.streamKey);
    res.render('dashboard', { title: 'Video Listesi', videos: uploadedOnly });
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

exports.youtubeUpload = async (req, res) => {
  try {
    const { youtubeUrl } = req.body;
    if (!youtubeUrl) {
      return res.status(400).json({ error: 'Geçerli bir YouTube URL si giriniz.' });
    }

    const filename = `${uuidv4()}.mp4`;
    const filePath = path.join(__dirname, '..', 'uploads', filename);

    // Get info
    const info = await youtubedl(youtubeUrl, {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true
    });

    const title = info.title || 'YouTube Video';
    const description = req.body.description || (info.description ? info.description.substring(0, 500) : '');

    // Download video
    await youtubedl(youtubeUrl, {
      output: `uploads/${filename}`, // Use relative path to avoid spaces in absolute path breaking cmd.exe
      format: 'best[ext=mp4]', // Muxed format (video+audio) so ffmpeg is not required on host
      noCheckCertificates: true,
      noWarnings: true
    });

    const stats = fs.statSync(filePath);
    const video = await Video.create({
      title: title,
      description: description,
      filename: filename,
      originalName: title + '.mp4',
      mimeType: 'video/mp4',
      size: stats.size,
      status: 'ready'
    });
    
    res.redirect(`/api/videos/watch/${video._id}`);

  } catch (err) {
    console.error('Video indirme hatasi:', err);
    res.status(500).json({ error: 'Video indirilirken hata oluştu. YouTube kısıtlamalarına takılmış olabilirsiniz.' });
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
