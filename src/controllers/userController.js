const { User, LanguagePair, Card } = require('../models');
const { serializeCard, serializeLanguagePair } = require('../services/serializers');

async function getUser(req, res) {
  try {
    const telegramId = req.params.userId;

    // Auto-create user if missing
    let user = await User.findOne({ telegramId });
    if (!user) {
      user = await User.create({
        telegramId,
        firstName: req.telegramUser.firstName,
        lastName: req.telegramUser.lastName,
        username: req.telegramUser.username
      });
    }

    const languagePairs = await LanguagePair.find({ userId: telegramId });
    const cards = await Card.find({ userId: telegramId });

    res.json({
      languagePairs: languagePairs.map(serializeLanguagePair),
      activeLanguagePairId: user.activeLanguagePairId ? String(user.activeLanguagePairId) : null,
      cards: cards.map(serializeCard),
      settings: user.settings,
      role: user.role
    });
  } catch (err) {
    console.error('getUser error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { getUser };
