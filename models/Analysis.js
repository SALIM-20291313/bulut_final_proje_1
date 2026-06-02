const db = require('../lib/db');

const analysisSchema = {
  videoId: { type: String, required: true },
  provider: { type: String, default: 'aws' },
  status: { type: String, default: 'pending' },

  labels: [{
    name: String,
    confidence: Number,
    timestamp: Number,
    boundingBox: {
      left: Number,
      top: Number,
      width: Number,
      height: Number
    },
    parents: [String],
    instances: [{
      confidence: Number,
      boundingBox: { left: Number, top: Number, width: Number, height: Number }
    }]
  }],

  faces: [{
    confidence: Number,
    timestamp: Number,
    ageRange: { low: Number, high: Number },
    gender: { value: String, confidence: Number },
    emotions: [{ type: String, confidence: Number }],
    boundingBox: { left: Number, top: Number, width: Number, height: Number },
    landmarks: [{ type: String, x: Number, y: Number }],
    pose: { roll: Number, yaw: Number, pitch: Number },
    quality: { brightness: Number, sharpness: Number }
  }],

  persons: [{
    index: Number,
    timestamp: Number,
    boundingBox: { left: Number, top: Number, width: Number, height: Number },
    face: {
      confidence: Number,
      ageRange: { low: Number, high: Number },
      gender: { value: String, confidence: Number },
      emotions: [{ type: String, confidence: Number }]
    }
  }],

  textDetections: [{
    text: String,
    confidence: Number,
    timestamp: Number,
    boundingBox: { left: Number, top: Number, width: Number, height: Number }
  }],

  moderation: [{
    category: String,
    confidence: Number,
    timestamp: Number
  }],

  segments: [{
    type: String,
    startTimestamp: Number,
    endTimestamp: Number,
    duration: Number,
    technicalCue: { type: String, confidence: Number },
    shotSegment: { index: Number, confidence: Number }
  }],

  summary: {
    totalLabels: Number,
    totalFaces: Number,
    totalPersons: Number,
    totalTexts: Number,
    totalSegments: Number,
    shotCount: Number,
    dominantLabels: [String],
    videoDuration: Number
  },

  processingTimeMs: { type: Number, default: 0 },
  error: { type: String, default: '' }
};

module.exports = db.createModel('Analysis', analysisSchema);
