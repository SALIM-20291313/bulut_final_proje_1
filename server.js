require('dotenv').config();
const connectDB = require('./config/db');
connectDB();

const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');
const { spawn } = require('child_process');
const NodeMediaServer = require('node-media-server');

const uploadsDir = path.join(__dirname, 'uploads');
const mediaDir = path.join(__dirname, 'media');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir);

const videoRoutes = require('./routes/videoRoutes');
const streamRoutes = require('./routes/streamRoutes');
const analysisRoutes = require('./routes/analysisRoutes');
const aiService = require('./services/aiService');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { maxHttpBufferSize: 1e7 });

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/videos', videoRoutes);
app.use('/api/streams', streamRoutes);
app.use('/api/analysis', analysisRoutes);

app.get('/', (req, res) => {
  res.render('index', { title: 'Video Akışı ve İşleme Uygulaması' });
});

io.on('connection', (socket) => {
  console.log('Webcam client baglandi:', socket.id);

  socket.on('live:start', async (data) => {
    const streamKey = data.streamKey;
    console.log('RTMP yayin baslatiliyor, stream key:', streamKey);

    const ffmpegPath = path.join(__dirname, 'node_modules', '@ffmpeg-installer', 'win32-x64', 'ffmpeg.exe');
    const rtmpUrl = `rtmp://localhost:${process.env.RTMP_PORT || 1935}/live/${streamKey}`;

    const ffmpeg = spawn(ffmpegPath, [
      '-f', 'webm',
      '-i', 'pipe:0',
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-tune', 'zerolatency',
      '-c:a', 'aac',
      '-f', 'flv',
      rtmpUrl
    ], { stdio: ['pipe', 'ignore', 'ignore'] });

    socket.ffmpeg = ffmpeg;

    ffmpeg.on('error', (err) => console.error('FFmpeg pipe hatasi:', err.message));
    ffmpeg.stdin.on('error', () => {});

    socket.on('live:data', (chunk) => {
      if (ffmpeg.stdin.writable) {
        ffmpeg.stdin.write(Buffer.from(chunk));
      }
    });

    socket.on('live:stop', () => {
      if (ffmpeg.stdin.writable) ffmpeg.stdin.end();
      ffmpeg.kill();
    });

    socket.on('disconnect', () => {
      if (ffmpeg.stdin.writable) ffmpeg.stdin.end();
      ffmpeg.kill();
    });

    socket.emit('live:ready', { message: 'Stream basladi', streamKey });
  });
});

const nmsConfig = {
  logType: 2,
  rtmp: {
    port: process.env.RTMP_PORT || 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60
  },
  http: {
    port: process.env.HTTP_PORT || 8000,
    mediaroot: './media',
    allow_origin: '*'
  }
};

const nms = new NodeMediaServer(nmsConfig);
nms.run();

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('===========================================');
  console.log('  Video Akisi ve Isleme Uygulamasi');
  console.log('  Bulut Bilisim Final Projesi');
  console.log('===========================================');
  console.log(`  Web arayuz    : http://localhost:${PORT}`);
  console.log(`  RTMP yayin    : rtmp://localhost:${process.env.RTMP_PORT || 1935}/live`);
  console.log(`  HTTP-FLV      : http://localhost:${process.env.HTTP_PORT || 8000}`);
  console.log(`  Canli Kamera  : http://localhost:${PORT}/api/streams/watch/demo`);
  console.log('===========================================');
});

app.post('/api/live/analyze', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: 'Goruntu verisi gerekli' });
    const base64 = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');
    const results = await aiService.analyzeFrame(buffer);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
