const mongoose = require('mongoose');

const lessonCardSchema = new mongoose.Schema({
  front: {
    word: { type: String, required: true },
    imageUrl: { type: String, default: '' }
  },
  back: {
    translation: { type: String, required: true },
    example: { type: String, default: '' },
    pronunciation: { type: String, default: '' }
  }
}, { _id: true });

const assignmentSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  assignedAt: { type: Date, default: Date.now },
  accepted: { type: Boolean, default: false }
}, { _id: false });

const lessonSchema = new mongoose.Schema({
  tutorId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  languagePairId: { type: mongoose.Schema.Types.ObjectId, ref: 'LanguagePair', default: null },
  cards: [lessonCardSchema],
  assignedTo: [assignmentSchema]
}, { timestamps: true });

lessonSchema.index({ 'assignedTo.studentId': 1 });

module.exports = mongoose.model('Lesson', lessonSchema);
