const mongoose = require('mongoose');

const languagePairSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  source: { type: String, required: true },
  target: { type: String, required: true }
}, { timestamps: true });

languagePairSchema.index({ userId: 1, source: 1, target: 1 }, { unique: true });

module.exports = mongoose.model('LanguagePair', languagePairSchema);
