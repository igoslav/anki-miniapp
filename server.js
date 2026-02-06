require('dotenv').config();
const express = require('express');
const path = require('path');
const db = require('./db');
const { updateSRS } = require('./srs');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'miniapp')));

// --- API Endpoints ---

// Get full user data
app.get('/api/user/:userId', (req, res) => {
  const user = db.getUser(req.params.userId);
  res.json(user);
});

// Add language pair
app.post('/api/user/:userId/language-pair', (req, res) => {
  const { source, target } = req.body;
  if (!source || !target) return res.status(400).json({ error: 'source and target required' });

  const user = db.getUser(req.params.userId);
  const pair = {
    id: 'lp_' + Date.now(),
    source,
    target,
    createdAt: new Date().toISOString()
  };
  user.languagePairs.push(pair);
  user.activeLanguagePairId = pair.id;
  db.saveUser(req.params.userId, user);
  res.json(pair);
});

// Switch active language pair
app.put('/api/user/:userId/active-pair', (req, res) => {
  const { languagePairId } = req.body;
  const user = db.getUser(req.params.userId);
  const exists = user.languagePairs.some(lp => lp.id === languagePairId);
  if (!exists) return res.status(404).json({ error: 'Language pair not found' });

  user.activeLanguagePairId = languagePairId;
  db.saveUser(req.params.userId, user);
  res.json({ success: true });
});

// Add single card
app.post('/api/user/:userId/card', (req, res) => {
  const { word, translation, example, pronunciation, imageUrl } = req.body;
  if (!word || !translation) return res.status(400).json({ error: 'word and translation required' });

  const user = db.getUser(req.params.userId);
  const card = {
    id: 'card_' + Date.now(),
    languagePairId: user.activeLanguagePairId,
    front: {
      word,
      imageUrl: imageUrl || ''
    },
    back: {
      translation,
      example: example || '',
      pronunciation: pronunciation || ''
    },
    srs: {
      interval: 0,
      easeFactor: 2.5,
      nextReview: new Date().toISOString(),
      repetitions: 0
    },
    createdAt: new Date().toISOString()
  };
  user.cards.push(card);
  db.saveUser(req.params.userId, user);
  res.json(card);
});

// Bulk import cards
app.post('/api/user/:userId/cards/import', (req, res) => {
  const { cards } = req.body;
  if (!Array.isArray(cards)) return res.status(400).json({ error: 'cards array required' });

  const user = db.getUser(req.params.userId);
  let imported = 0;
  let skipped = 0;

  cards.forEach(c => {
    if (!c.word || !c.translation) { skipped++; return; }
    user.cards.push({
      id: 'card_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      languagePairId: user.activeLanguagePairId,
      front: {
        word: c.word,
        imageUrl: c.imageUrl || c.imageurl || ''
      },
      back: {
        translation: c.translation,
        example: c.example || '',
        pronunciation: c.pronunciation || ''
      },
      srs: {
        interval: 0,
        easeFactor: 2.5,
        nextReview: new Date().toISOString(),
        repetitions: 0
      },
      createdAt: new Date().toISOString()
    });
    imported++;
  });

  db.saveUser(req.params.userId, user);
  res.json({ imported, skipped });
});

// Update card
app.put('/api/user/:userId/card/:cardId', (req, res) => {
  const user = db.getUser(req.params.userId);
  const card = user.cards.find(c => c.id === req.params.cardId);
  if (!card) return res.status(404).json({ error: 'Card not found' });

  const { word, translation, example, pronunciation, imageUrl } = req.body;
  if (word !== undefined) card.front.word = word;
  if (imageUrl !== undefined) card.front.imageUrl = imageUrl;
  if (translation !== undefined) card.back.translation = translation;
  if (example !== undefined) card.back.example = example;
  if (pronunciation !== undefined) card.back.pronunciation = pronunciation;

  db.saveUser(req.params.userId, user);
  res.json(card);
});

// Delete card
app.delete('/api/user/:userId/card/:cardId', (req, res) => {
  const user = db.getUser(req.params.userId);
  const index = user.cards.findIndex(c => c.id === req.params.cardId);
  if (index === -1) return res.status(404).json({ error: 'Card not found' });

  user.cards.splice(index, 1);
  db.saveUser(req.params.userId, user);
  res.json({ success: true });
});

// Submit review result (SRS update)
app.put('/api/user/:userId/card/:cardId/review', (req, res) => {
  const { quality } = req.body;
  if (quality === undefined || quality < 0 || quality > 3) {
    return res.status(400).json({ error: 'quality 0-3 required' });
  }

  const user = db.getUser(req.params.userId);
  const card = user.cards.find(c => c.id === req.params.cardId);
  if (!card) return res.status(404).json({ error: 'Card not found' });

  updateSRS(card, quality);
  db.saveUser(req.params.userId, user);
  res.json(card);
});

// Export all data as JSON
app.get('/api/user/:userId/export', (req, res) => {
  const user = db.getUser(req.params.userId);
  const exportData = {
    exportVersion: 1,
    exportedAt: new Date().toISOString(),
    languagePairs: user.languagePairs,
    cards: user.cards,
    settings: user.settings
  };
  res.setHeader('Content-Disposition', `attachment; filename=ankicards_backup_${Date.now()}.json`);
  res.json(exportData);
});

// Export to chat (send via bot)
app.post('/api/user/:userId/export-to-chat', async (req, res) => {
  try {
    const bot = require('./bot');
    const user = db.getUser(req.params.userId);
    const exportData = {
      exportVersion: 1,
      exportedAt: new Date().toISOString(),
      languagePairs: user.languagePairs,
      cards: user.cards,
      settings: user.settings
    };
    const buffer = Buffer.from(JSON.stringify(exportData, null, 2));
    await bot.sendDocument(req.params.userId, buffer, {
      caption: 'Your AnkiCards backup'
    }, {
      filename: `ankicards_backup_${Date.now()}.json`,
      contentType: 'application/json'
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Export to chat failed:', error);
    res.status(500).json({ error: 'Failed to send to chat' });
  }
});

// Update settings
app.put('/api/user/:userId/settings', (req, res) => {
  const user = db.getUser(req.params.userId);
  const { dailyReminderEnabled, reminderHour, reminderMinute, timezone } = req.body;

  if (dailyReminderEnabled !== undefined) user.settings.dailyReminderEnabled = dailyReminderEnabled;
  if (reminderHour !== undefined) user.settings.reminderHour = reminderHour;
  if (reminderMinute !== undefined) user.settings.reminderMinute = reminderMinute;
  if (timezone !== undefined) user.settings.timezone = timezone;

  db.saveUser(req.params.userId, user);
  res.json(user.settings);
});

// --- Start ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Start bot after server is ready
  require('./bot');
});
