function registerHandlers(bot) {
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
            text: 'Open Pepe App',
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
}

module.exports = { registerHandlers };
