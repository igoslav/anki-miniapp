const cron = require('node-cron');
const db = require('../db/db');
const { performBackup } = require('../db/backup');

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
  cron.schedule('* * * * *', () => {
    const allData = db.read();
    const now = new Date();

    Object.entries(allData.users).forEach(([userId, user]) => {
      if (!user.settings || !user.settings.dailyReminderEnabled) return;

      const userNow = toUserTime(now, user.settings.timezone);
      if (userNow.getHours() === user.settings.reminderHour &&
          userNow.getMinutes() === user.settings.reminderMinute) {

        const dueCards = user.cards.filter(c =>
          c.languagePairId === user.activeLanguagePairId &&
          new Date(c.srs.nextReview) <= now
        );

        if (dueCards.length > 0) {
          bot.sendMessage(userId, `You have ${dueCards.length} cards to review!`, {
            reply_markup: {
              inline_keyboard: [[{
                text: 'Start Review',
                web_app: { url: `${process.env.MINIAPP_URL}?user_id=${userId}` }
              }]]
            }
          });
        }
      }
    });
  });

  // Daily DB backup — runs at 3:00 AM server time
  cron.schedule('0 3 * * *', () => {
    performBackup();
  });
}

module.exports = { scheduleCronJobs };
