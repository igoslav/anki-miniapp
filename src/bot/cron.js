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
      const userHour = userNow.getHours();
      const userMinute = userNow.getMinutes();
      const userDay = userNow.getDay(); // 0=Sun … 6=Sat

      if (userHour !== user.settings.reminderHour ||
          userMinute !== user.settings.reminderMinute) return;

      // Collect pairs that are enabled for today and have due cards
      const pairsWithDue = (user.languagePairs || []).filter(pair => {
        const pairEnabled = pair.reminderEnabled !== false; // default true
        const pairDays = Array.isArray(pair.reminderDays)
          ? pair.reminderDays
          : [0, 1, 2, 3, 4, 5, 6]; // default all days
        if (!pairEnabled || !pairDays.includes(userDay)) return false;

        return user.cards.some(c =>
          c.languagePairId === pair.id &&
          new Date(c.srs.nextReview) <= now
        );
      });

      if (pairsWithDue.length === 0) return;

      const lines = pairsWithDue.map(pair => {
        const count = user.cards.filter(c =>
          c.languagePairId === pair.id &&
          new Date(c.srs.nextReview) <= now
        ).length;
        return `• ${pair.source} → ${pair.target}: ${count} card${count !== 1 ? 's' : ''}`;
      });

      const message = `Cards due for review today:\n${lines.join('\n')}`;

      bot.sendMessage(userId, message, {
        reply_markup: {
          inline_keyboard: [[{
            text: 'Start Review',
            web_app: { url: `${process.env.MINIAPP_URL}?user_id=${userId}` }
          }]]
        }
      });
    });
  });

  // Daily DB backup — runs at 3:00 AM server time
  cron.schedule('0 3 * * *', () => {
    performBackup();
  });
}

module.exports = { scheduleCronJobs };
