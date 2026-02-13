const { User, TutorStudent } = require('../models');

function registerHandlers(bot) {
  // /start command — handle deep links and open MiniApp
  bot.onText(/\/start(.*)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = String(msg.from.id);
    const firstName = msg.from.first_name;
    const payload = (match[1] || '').trim();

    // Handle invite deep link: /start invite_CODE
    if (payload.startsWith('invite_')) {
      const inviteCode = payload.replace('invite_', '');
      try {
        const link = await TutorStudent.findOne({ inviteCode, status: 'pending', studentId: null });
        if (!link) {
          bot.sendMessage(chatId, 'This invite link is invalid or has already been used.');
          return;
        }

        if (link.tutorId === userId) {
          bot.sendMessage(chatId, 'You cannot accept your own invite.');
          return;
        }

        // Ensure student user exists
        let student = await User.findOne({ telegramId: userId });
        if (!student) {
          student = await User.create({
            telegramId: userId,
            firstName: msg.from.first_name || '',
            lastName: msg.from.last_name || '',
            username: msg.from.username || ''
          });
        }

        link.studentId = userId;
        link.status = 'active';
        await link.save();

        // Notify student
        const tutor = await User.findOne({ telegramId: link.tutorId });
        const tutorName = tutor ? (tutor.firstName || tutor.username || 'A tutor') : 'A tutor';
        bot.sendMessage(chatId, `You are now connected with ${tutorName}! They can send you lessons with flashcards.`, {
          reply_markup: {
            inline_keyboard: [[{
              text: 'Open Pepe App',
              web_app: { url: `${process.env.MINIAPP_URL}?user_id=${userId}` }
            }]]
          }
        });

        // Notify tutor
        const studentName = student.firstName || student.username || 'A student';
        bot.sendMessage(link.tutorId, `${studentName} accepted your invite and is now your student!`);
        return;
      } catch (err) {
        console.error('Invite handling error:', err);
        bot.sendMessage(chatId, 'Something went wrong processing the invite. Please try again.');
        return;
      }
    }

    // Default: open MiniApp
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
