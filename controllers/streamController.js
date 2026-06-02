const { v4: uuidv4 } = require('uuid');
const Video = require('../models/Video');

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

exports.watchStream = async (req, res) => {
  try {
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
