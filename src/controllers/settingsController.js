const { User } = require('../models');

async function updateSettings(req, res) {
  try {
    const userId = req.params.userId;
    const { dailyReminderEnabled, reminderHour, reminderMinute, timezone } = req.body;

    const update = {};
    if (dailyReminderEnabled !== undefined) update['settings.dailyReminderEnabled'] = dailyReminderEnabled;
    if (reminderHour !== undefined) update['settings.reminderHour'] = reminderHour;
    if (reminderMinute !== undefined) update['settings.reminderMinute'] = reminderMinute;
    if (timezone !== undefined) update['settings.timezone'] = timezone;

    const user = await User.findOneAndUpdate(
      { telegramId: userId },
      { $set: update },
      { new: true }
    );

    res.json(user.settings);
  } catch (err) {
    console.error('updateSettings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { updateSettings };
