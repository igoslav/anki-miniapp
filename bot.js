require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const bodyParser = require('body-parser');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const app = express();

// In-memory storage (use database in production)
const userCards = new Map();

function getUserCards(userId) {
  if (!userCards.has(userId)) {
    userCards.set(userId, []);
  }
  return userCards.get(userId);
}

console.log('🤖 Anki Mini App Bot started!');

// Single entry point - just launches the Mini App
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const firstName = msg.from.first_name;
  
  bot.sendMessage(
    chatId,
    `Welcome ${firstName}! 🎴\n\nYour personal flashcard app.`,
    {
      reply_markup: {
        inline_keyboard: [[{
          text: '🚀 Open Anki Cards',
          web_app: { url: `${process.env.MINIAPP_URL}?user_id=${userId}` }
        }]]
      }
    }
  );
});

// Handle notifications from Mini App
bot.on('web_app_data', (msg) => {
  const chatId = msg.chat.id;
  const data = JSON.parse(msg.web_app_data.data);
  
  if (data.action === 'card_added') {
    bot.sendMessage(chatId, `✅ Added: "${data.word}" → "${data.translation}"`);
  } else if (data.action === 'session_complete') {
    bot.sendMessage(
      chatId,
      `🎉 Session Complete!\n\n` +
      `Reviewed: ${data.stats.reviewed}\n` +
      `✅ Learned: ${data.stats.learned}\n` +
      `🔄 To repeat: ${data.stats.repeat}`
    );
  }
});

// API for Mini App
app.use(bodyParser.json());
app.use(express.static('miniapp'));

// Get user's cards
app.get('/api/cards/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  const cards = getUserCards(userId);
  res.json(cards);
});

// Add new card
app.post('/api/cards/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  const { word, translation } = req.body;
  
  const cards = getUserCards(userId);
  const newCard = {
    id: Date.now(),
    word,
    translation,
    status: 'learning',
    addedAt: new Date().toISOString(),
    reviewCount: 0
  };
  
  cards.push(newCard);
  res.json({ success: true, card: newCard });
});

// Update card status
app.post('/api/cards/:userId/:cardId', (req, res) => {
  const userId = parseInt(req.params.userId);
  const cardId = parseInt(req.params.cardId);
  const { status } = req.body;
  
  const cards = getUserCards(userId);
  const card = cards.find(c => c.id === cardId);
  
  if (card) {
    card.status = status;
    card.reviewCount = (card.reviewCount || 0) + 1;
    res.json({ success: true, card });
  } else {
    res.status(404).json({ error: 'Card not found' });
  }
});

// Delete card
app.delete('/api/cards/:userId/:cardId', (req, res) => {
  const userId = parseInt(req.params.userId);
  const cardId = parseInt(req.params.cardId);
  
  const cards = getUserCards(userId);
  const index = cards.findIndex(c => c.id === cardId);
  
  if (index !== -1) {
    cards.splice(index, 1);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Card not found' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Mini App server on port ${PORT}`);
});

bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});
