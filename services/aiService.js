const path = require('path');
const fs = require('fs');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const AWS = require('aws-sdk');
const MIN_CONFIDENCE = 75;
const FRAMES_TO_EXTRACT = 6;

function getRekognition() {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1'
  });
  return new AWS.Rekognition();
}

function getVideoDuration(videoPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration || 10);
    });
  });
}

function extractFrames(videoPath, outputDir, duration) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const timestamps = [];
    const step = duration / (FRAMES_TO_EXTRACT + 1);
    for (let i = 1; i <= FRAMES_TO_EXTRACT; i++) {
      timestamps.push(Math.floor(i * step));
    }

    const frames = [];
    let completed = 0;

    timestamps.forEach((seekSec, i) => {
      const outputFile = path.join(outputDir, `frame_${i}_${Date.now()}.jpg`);
      ffmpeg(videoPath)
        .seekInput(seekSec)
        .frames(1)
        .size('1280x720')
        .output(outputFile)
        .on('end', () => {
          frames.push({ path: outputFile, timestamp: seekSec });
          completed++;
          if (completed === timestamps.length) resolve(frames);
        })
        .on('error', () => {
          completed++;
          if (completed === timestamps.length) resolve(frames);
        })
        .run();
    });
  });
}

function cleanFrames(frames) {
  frames.forEach(f => { try { fs.unlinkSync(f.path); } catch (e) { /* ignore */ } });
}

async function analyzeVideo(videoPath, provider = 'aws') {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('AWS kimlik bilgileri .env dosyasinda tanimli degil');
  }

  const rekognition = getRekognition();
  const duration = await getVideoDuration(videoPath);
  const frameDir = path.join(__dirname, '..', 'uploads', 'frames');
  const frames = await extractFrames(videoPath, frameDir, duration);

  if (frames.length === 0) throw new Error('Video kareleri cikarilamadi');

  const allLabels = [];
  const allFaces = [];
  const allTexts = [];
  const allModeration = [];
  const labelMap = new Map();

  for (const frame of frames) {
    const imageBytes = fs.readFileSync(frame.path);
    const sec = frame.timestamp;

    try {
      const labelResult = await rekognition.detectLabels({
        Image: { Bytes: imageBytes }, MaxLabels: 30, MinConfidence: MIN_CONFIDENCE
      }).promise();

      for (const l of (labelResult.Labels || [])) {
        if (l.Confidence < MIN_CONFIDENCE) continue;
        const key = l.Name + '_' + sec;
        if (!labelMap.has(key)) {
          labelMap.set(key, true);
          allLabels.push({
            name: l.Name,
            confidence: l.Confidence,
            timestamp: sec,
            parents: (l.Parents || []).map(p => p.Name),
            boundingBox: l.Instances?.[0]?.BoundingBox ? {
              left: l.Instances[0].BoundingBox.Left,
              top: l.Instances[0].BoundingBox.Top,
              width: l.Instances[0].BoundingBox.Width,
              height: l.Instances[0].BoundingBox.Height
            } : null,
            instances: (l.Instances || []).map(i => ({
              confidence: i.Confidence,
              boundingBox: i.BoundingBox || null
            }))
          });
        }
      }
    } catch (e) { console.error('Label hatasi:', e.message); }

    try {
      const faceResult = await rekognition.detectFaces({
        Image: { Bytes: imageBytes }, Attributes: ['ALL']
      }).promise();

      for (const f of (faceResult.FaceDetails || [])) {
        if (f.Confidence < MIN_CONFIDENCE) continue;
        allFaces.push({
          confidence: f.Confidence,
          timestamp: sec,
          ageRange: { low: f.AgeRange?.Low || 0, high: f.AgeRange?.High || 0 },
          gender: { value: f.Gender?.Value || 'Bilinmiyor', confidence: f.Gender?.Confidence || 0 },
          emotions: (f.Emotions || []).filter(e => e.Confidence >= MIN_CONFIDENCE).slice(0, 5).map(e => ({
            type: e.Type, confidence: e.Confidence
          })),
          boundingBox: f.BoundingBox ? {
            left: f.BoundingBox.Left, top: f.BoundingBox.Top,
            width: f.BoundingBox.Width, height: f.BoundingBox.Height
          } : null,
          landmarks: (f.Landmarks || []).slice(0, 10).map(l => ({
            type: l.Type, x: l.X, y: l.Y
          })),
          pose: f.Pose ? { roll: f.Pose.Roll, yaw: f.Pose.Yaw, pitch: f.Pose.Pitch } : null,
          quality: f.Quality ? { brightness: f.Quality.Brightness, sharpness: f.Quality.Sharpness } : null
        });
      }
    } catch (e) { console.error('Face hatasi:', e.message); }

    try {
      const textResult = await rekognition.detectText({
        Image: { Bytes: imageBytes }
      }).promise();

      for (const t of (textResult.TextDetections || [])) {
        if (t.Type !== 'LINE' || t.Confidence < MIN_CONFIDENCE) continue;
        allTexts.push({
          text: t.DetectedText,
          confidence: t.Confidence,
          timestamp: sec,
          boundingBox: t.Geometry?.BoundingBox ? {
            left: t.Geometry.BoundingBox.Left,
            top: t.Geometry.BoundingBox.Top,
            width: t.Geometry.BoundingBox.Width,
            height: t.Geometry.BoundingBox.Height
          } : null
        });
      }
    } catch (e) { console.error('Text hatasi:', e.message); }

    try {
      const modResult = await rekognition.detectModerationLabels({
        Image: { Bytes: imageBytes }, MinConfidence: MIN_CONFIDENCE
      }).promise();

      for (const m of (modResult.ModerationLabels || [])) {
        allModeration.push({
          category: m.Name, confidence: m.Confidence, timestamp: sec
        });
      }
    } catch (e) { console.error('Moderation hatasi:', e.message); }
  }

  cleanFrames(frames);

  const uniqueLabels = [...new Set(allLabels.map(l => l.name))];
  const sortedLabels = allLabels.sort((a, b) => b.confidence - a.confidence);

  return {
    labels: sortedLabels,
    faces: allFaces.sort((a, b) => a.timestamp - b.timestamp),
    persons: [],
    textDetections: allTexts.sort((a, b) => a.timestamp - b.timestamp),
    moderation: allModeration,
    segments: generateSegments(duration, FRAMES_TO_EXTRACT),
    summary: {
      totalLabels: allLabels.length,
      totalFaces: allFaces.length,
      totalPersons: 0,
      totalTexts: allTexts.length,
      totalSegments: FRAMES_TO_EXTRACT,
      shotCount: FRAMES_TO_EXTRACT,
      dominantLabels: uniqueLabels.slice(0, 10),
      videoDuration: Math.round(duration)
    },
    processingTimeMs: 0
  };
}

async function analyzeFrame(imageBuffer) {
  const rekognition = getRekognition();

  const labels = [];
  const faces = [];
  const texts = [];
  const moderation = [];

  try {
    const labelResult = await rekognition.detectLabels({
      Image: { Bytes: imageBuffer }, MaxLabels: 20, MinConfidence: MIN_CONFIDENCE
    }).promise();
    for (const l of (labelResult.Labels || [])) {
      labels.push({ name: l.Name, confidence: l.Confidence });
    }
  } catch (e) { console.error('Label:', e.message); }

  try {
    const faceResult = await rekognition.detectFaces({
      Image: { Bytes: imageBuffer }, Attributes: ['ALL']
    }).promise();
    for (const f of (faceResult.FaceDetails || [])) {
      if (f.Confidence < MIN_CONFIDENCE) continue;
      faces.push({
        confidence: f.Confidence,
        ageRange: { low: f.AgeRange?.Low || 0, high: f.AgeRange?.High || 0 },
        gender: f.Gender?.Value || '?',
        emotions: (f.Emotions || []).filter(e => e.Confidence >= MIN_CONFIDENCE).slice(0, 3).map(e => e.Type)
      });
    }
  } catch (e) { console.error('Face:', e.message); }

  try {
    const textResult = await rekognition.detectText({
      Image: { Bytes: imageBuffer }
    }).promise();
    for (const t of (textResult.TextDetections || [])) {
      if (t.Type === 'LINE' && t.Confidence >= MIN_CONFIDENCE) {
        texts.push({ text: t.DetectedText, confidence: t.Confidence });
      }
    }
  } catch (e) { console.error('Text:', e.message); }

  try {
    const modResult = await rekognition.detectModerationLabels({
      Image: { Bytes: imageBuffer }, MinConfidence: MIN_CONFIDENCE
    }).promise();
    for (const m of (modResult.ModerationLabels || [])) {
      moderation.push({ category: m.Name, confidence: m.Confidence });
    }
  } catch (e) { console.error('Moderation:', e.message); }

  return { labels, faces, texts, moderation, timestamp: Date.now() };
}

function generateSegments(duration, count) {
  const segments = [];
  const step = duration / (count + 1);
  for (let i = 1; i <= count; i++) {
    const start = Math.floor((i - 1) * step);
    const end = Math.floor(i * step);
    segments.push({
      type: 'analiz_araligi',
      startTimestamp: start,
      endTimestamp: end,
      duration: end - start,
      shotSegment: { index: i, confidence: 100 },
      technicalCue: null
    });
  }
  return segments;
}

module.exports = { analyzeVideo, analyzeFrame };
