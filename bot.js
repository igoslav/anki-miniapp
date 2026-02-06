require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const db = require('./db');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

console.log('Bot started');

// /start command — open MiniApp
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const firstName = msg.from.first_name;

  bot.sendMessage(
    chatId,
    `Welcome ${firstName}!\n\nYour personal flashcard app with spaced repetition.`,
    {
      reply_markup: {
        inline_keyboard: [[{
          text: 'Open Anki Cards',
          web_app: { url: `${process.env.MINIAPP_URL}?user_id=${userId}` }
        }]]
      }
    }
  );
});

// Handle web_app_data from MiniApp
bot.on('web_app_data', (msg) => {
  const chatId = msg.chat.id;
  try {
    const data = JSON.parse(msg.web_app_data.data);
    if (data.action === 'card_added') {
      bot.sendMessage(chatId, `Added: "${data.word}" -> "${data.translation}"`);
    } else if (data.action === 'session_complete') {
      bot.sendMessage(
        chatId,
        `Session Complete!\n\n` +
        `Reviewed: ${data.stats.reviewed}\n` +
        `Learned: ${data.stats.learned}\n` +
        `To repeat: ${data.stats.repeat}`
      );
    }
  } catch (e) {
    console.error('web_app_data parse error:', e);
  }
});

// Convert time to user's timezone
function toUserTime(date, timezone) {
  try {
    const str = date.toLocaleString('en-US', { timeZone: timezone });
    return new Date(str);
  } catch {
    return date;
  }
}

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
  const dbPath = path.join(__dirname, 'data', 'db.json');
  if (!fs.existsSync(dbPath)) return;

  const backupDir = path.join(__dirname, 'data', 'backups');
  fs.mkdirSync(backupDir, { recursive: true });

  const date = new Date().toISOString().slice(0, 10);
  const dest = path.join(backupDir, `db_${date}.json`);
  fs.copyFileSync(dbPath, dest);

  // Keep last 7 backups
  const files = fs.readdirSync(backupDir).filter(f => f.startsWith('db_')).sort();
  while (files.length > 7) {
    fs.unlinkSync(path.join(backupDir, files.shift()));
  }

  console.log(`Backup saved: ${dest}`);
});

bot.on('polling_error', (error) => {
  console.error('Polling error:', error.message);
});

module.exports = bot;
