const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  dailyReminderEnabled: { type: Boolean, default: true },
  reminderHour: { type: Number, default: 9 },
  reminderMinute: { type: Number, default: 0 },
  timezone: { type: String, default: 'UTC' }
}, { _id: false });

const userSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true },
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  username: { type: String, default: '' },
  role: { type: String, enum: ['student', 'tutor'], default: 'student' },
  activeLanguagePairId: { type: mongoose.Schema.Types.ObjectId, ref: 'LanguagePair', default: null },
  settings: { type: settingsSchema, default: () => ({}) }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
