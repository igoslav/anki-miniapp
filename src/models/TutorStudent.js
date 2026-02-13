const mongoose = require('mongoose');

const tutorStudentSchema = new mongoose.Schema({
  tutorId: { type: String, required: true },
  studentId: { type: String, default: null },
  inviteCode: { type: String, required: true, unique: true },
  status: { type: String, enum: ['pending', 'active', 'revoked'], default: 'pending' }
}, { timestamps: true });

tutorStudentSchema.index({ tutorId: 1, status: 1 });
tutorStudentSchema.index({ studentId: 1, status: 1 });

module.exports = mongoose.model('TutorStudent', tutorStudentSchema);
