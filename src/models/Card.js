const mongoose = require('mongoose');

const srsSchema = new mongoose.Schema({
  interval: { type: Number, default: 0 },
  easeFactor: { type: Number, default: 2.5 },
  nextReview: { type: Date, default: Date.now },
  repetitions: { type: Number, default: 0 }
}, { _id: false });

const cardSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  languagePairId: { type: mongoose.Schema.Types.ObjectId, ref: 'LanguagePair', required: true },
  front: {
    word: { type: String, required: true },
    imageUrl: { type: String, default: '' }
  },
  back: {
    translation: { type: String, required: true },
    example: { type: String, default: '' },
    pronunciation: { type: String, default: '' }
  },
  srs: { type: srsSchema, default: () => ({}) },
  source: { type: String, enum: ['self', 'tutor'], default: 'self' },
  sourceTutorId: { type: String, default: null },
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', default: null }
}, { timestamps: true });

cardSchema.index({ userId: 1, languagePairId: 1 });
cardSchema.index({ userId: 1, languagePairId: 1, 'srs.nextReview': 1 });

module.exports = mongoose.model('Card', cardSchema);
