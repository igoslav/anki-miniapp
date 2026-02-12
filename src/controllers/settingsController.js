const db = require('../db/db');

function updateSettings(req, res) {
  const user = db.getUser(req.params.userId);
  const { dailyReminderEnabled, reminderHour, reminderMinute, timezone } = req.body;

  if (dailyReminderEnabled !== undefined) user.settings.dailyReminderEnabled = dailyReminderEnabled;
  if (reminderHour !== undefined) user.settings.reminderHour = reminderHour;
  if (reminderMinute !== undefined) user.settings.reminderMinute = reminderMinute;
  if (timezone !== undefined) user.settings.timezone = timezone;

  db.saveUser(req.params.userId, user);
  res.json(user.settings);
}

module.exports = { updateSettings };
