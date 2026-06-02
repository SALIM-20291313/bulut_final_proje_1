const { v4: uuidv4 } = require('uuid');
const Video = require('../models/Video');
const path = require('path');
const { spawn } = require('child_process');

exports.createStream = async (req, res) => {
  try {
    const streamKey = uuidv4().replace(/-/g, '').substring(0, 16);
    const stream = await Video.create({
      title: req.body.title || 'Canlı Yayın',
      description: req.body.description || 'RTMP canlı yayın',
      filename: streamKey,
      originalName: `stream_${streamKey}`,
      mimeType: 'application/x-rtmp',
      size: 0,
      streamKey,
      status: 'ready'
    });

    const rtmpUrl = `rtmp://localhost:${process.env.RTMP_PORT || 1935}/live`;
    const watchUrl = `/api/streams/watch/${stream._id}`;

    res.json({
      message: 'Yayın başlatıldı',
      stream: { id: stream._id, title: stream.title, streamKey },
      rtmpPublishUrl: `${rtmpUrl}/${streamKey}`,
      watchUrl
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.startVideoStream = async (req, res) => {
  try {
    const video = await Video.findById(req.params.videoId);
    if (!video) return res.status(404).json({ error: 'Video bulunamadı' });

    const streamKey = uuidv4().replace(/-/g, '').substring(0, 16);
    const stream = await Video.create({
      title: video.title + ' (Canlı)',
      description: video.originalName + ' canlı yayını',
      filename: streamKey,
      originalName: `stream_${streamKey}`,
      mimeType: 'application/x-rtmp',
      size: 0,
      streamKey,
      status: 'ready'
    });

    const videoPath = path.join(__dirname, '..', 'uploads', video.filename);
    const ffmpegPath = path.join(__dirname, '..', 'node_modules', '@ffmpeg-installer', 'win32-x64', 'ffmpeg.exe');
    const rtmpUrl = `rtmp://localhost:${process.env.RTMP_PORT || 1935}/live/${streamKey}`;

    console.log('FFmpeg:', ffmpegPath);
    console.log('Video:', videoPath);
    console.log('RTMP:', rtmpUrl);

    const ffmpeg = spawn(ffmpegPath, [
      '-re', '-i', videoPath, '-c', 'copy', '-f', 'flv', rtmpUrl
    ], { stdio: 'ignore', detached: true });
    ffmpeg.unref();

    res.json({
      message: 'Yayın başlatıldı!',
      stream: { id: stream._id, streamKey },
      watchUrl: `/api/streams/watch/${stream._id}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.watchStream = async (req, res) => {
  try {
    if (req.params.id === 'demo') {
      return res.render('stream', { title: 'Canlı Yayın', stream: null, httpPort: process.env.HTTP_PORT || 8000 });
    }
    const stream = await Video.findById(req.params.id);
    if (!stream || !stream.streamKey) {
      return res.status(404).render('404', { title: 'Yayın bulunamadı' });
    }
    res.render('stream', {
      title: stream.title,
      stream,
      httpPort: process.env.HTTP_PORT || 8000
    });
  } catch (err) {
    res.status(500).render('error', { title: 'Hata', error: err.message });
  }
};

exports.stopStream = async (req, res) => {
  try {
    const stream = await Video.findById(req.params.id);
    if (!stream || !stream.streamKey) {
      return res.status(404).json({ error: 'Yayın bulunamadı' });
    }

    stream.status = 'completed';
    await stream.save();
    res.json({ message: 'Yayın sonlandırıldı', stream });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.listStreams = async (req, res) => {
  try {
    const streams = await Video.find({ streamKey: { $ne: null } }).sort({ createdAt: -1 });
    res.json(streams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
