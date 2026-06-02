require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const NodeMediaServer = require('node-media-server');

const uploadsDir = path.join(__dirname, 'uploads');
const mediaDir = path.join(__dirname, 'media');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir);
const videoRoutes = require('./routes/videoRoutes');
const streamRoutes = require('./routes/streamRoutes');
const analysisRoutes = require('./routes/analysisRoutes');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/videos', videoRoutes);
app.use('/api/streams', streamRoutes);
app.use('/api/analysis', analysisRoutes);

app.get('/', (req, res) => {
  res.render('index', { title: 'Video Akışı ve İşleme Uygulaması' });
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
app.listen(PORT, () => {
  console.log('===========================================');
  console.log('  Video Akisi ve Isleme Uygulamasi');
  console.log('  Bulut Bilisim Final Projesi');
  console.log('===========================================');
  console.log(`  Web arayuz  : http://localhost:${PORT}`);
  console.log(`  RTMP yayin  : rtmp://localhost:${process.env.RTMP_PORT || 1935}/live`);
  console.log(`  HTTP-FLV    : http://localhost:${process.env.HTTP_PORT || 8000}`);
  console.log('===========================================');
  console.log('  Veritabani: JSON dosya tabanli (data/ klasoru)');
  console.log('  MongoDB kurulumu GEREKMEZ.');
  console.log('===========================================');
});
