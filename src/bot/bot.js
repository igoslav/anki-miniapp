const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

bot.on('polling_error', (error) => {
  console.error('Polling error:', error.message);
});

console.log('Bot started');

module.exports = bot;
