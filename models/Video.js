const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  duration: { type: Number, default: 0 },
  resolution: { type: String, default: '' },
  thumbnailPath: { type: String, default: '' },
  streamKey: { type: String, default: null },
  status: { type: String, default: 'uploading' },
  cloudProvider: { type: String, default: 'local' }
}, { timestamps: true });

module.exports = mongoose.model('Video', videoSchema);
