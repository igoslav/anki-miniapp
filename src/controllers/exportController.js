const { User, LanguagePair, Card } = require('../models');
const { serializeCard, serializeLanguagePair } = require('../services/serializers');

async function exportData(req, res) {
  try {
    const userId = req.params.userId;
    const user = await User.findOne({ telegramId: userId });
    const languagePairs = await LanguagePair.find({ userId });
    const cards = await Card.find({ userId });

    const data = {
      exportVersion: 1,
      exportedAt: new Date().toISOString(),
      languagePairs: languagePairs.map(serializeLanguagePair),
      cards: cards.map(serializeCard),
      settings: user ? user.settings : {}
    };

    res.setHeader('Content-Disposition', `attachment; filename=ankicards_backup_${Date.now()}.json`);
    res.json(data);
  } catch (err) {
    console.error('exportData error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function exportToChat(req, res) {
  try {
    // Lazy require to avoid circular dependency
    const bot = require('../bot/bot');
    const userId = req.params.userId;
    const user = await User.findOne({ telegramId: userId });
    const languagePairs = await LanguagePair.find({ userId });
    const cards = await Card.find({ userId });

    const data = {
      exportVersion: 1,
      exportedAt: new Date().toISOString(),
      languagePairs: languagePairs.map(serializeLanguagePair),
      cards: cards.map(serializeCard),
      settings: user ? user.settings : {}
    };

    const buffer = Buffer.from(JSON.stringify(data, null, 2));
    await bot.sendDocument(userId, buffer, {
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
}

module.exports = { exportData, exportToChat };
