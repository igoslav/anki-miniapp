const cron = require('node-cron');
const { User, Card } = require('../models');

function toUserTime(date, timezone) {
  try {
    const str = date.toLocaleString('en-US', { timeZone: timezone });
    return new Date(str);
  } catch {
    return date;
  }
}

function scheduleCronJobs(bot) {
  // Daily reminder cron — runs every minute
  cron.schedule('* * * * *', async () => {
    try {
      const users = await User.find({ 'settings.dailyReminderEnabled': true });
      const now = new Date();

      for (const user of users) {
        const userNow = toUserTime(now, user.settings.timezone);
        if (userNow.getHours() === user.settings.reminderHour &&
            userNow.getMinutes() === user.settings.reminderMinute) {

          const dueCount = user.activeLanguagePairId
            ? await Card.countDocuments({
                userId: user.telegramId,
                languagePairId: user.activeLanguagePairId,
                'srs.nextReview': { $lte: now }
              })
            : 0;

          if (dueCount > 0) {
            bot.sendMessage(user.telegramId, `You have ${dueCount} cards to review!`, {
              reply_markup: {
                inline_keyboard: [[{
                  text: 'Start Review',
                  web_app: { url: `${process.env.MINIAPP_URL}?user_id=${user.telegramId}` }
                }]]
              }
            });
          }
        }
      }
    } catch (err) {
      console.error('Cron reminder error:', err);
    }
  });
}

module.exports = { scheduleCronJobs };
