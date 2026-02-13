const { User, LanguagePair } = require('../models');
const { serializeLanguagePair } = require('../services/serializers');

async function listPairs(req, res) {
  try {
    const userId = req.params.userId;
    const user = await User.findOne({ telegramId: userId });
    const pairs = await LanguagePair.find({ userId });
    res.json({
      languagePairs: pairs.map(serializeLanguagePair),
      activeLanguagePairId: user && user.activeLanguagePairId ? String(user.activeLanguagePairId) : null
    });
  } catch (err) {
    console.error('listPairs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function addPair(req, res) {
  try {
    const { source, target } = req.body;
    if (!source || !target) return res.status(400).json({ error: 'source and target required' });

    const userId = req.params.userId;
    const pair = await LanguagePair.create({ userId, source, target });

    await User.updateOne({ telegramId: userId }, { activeLanguagePairId: pair._id });

    res.json(serializeLanguagePair(pair));
  } catch (err) {
    console.error('addPair error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function switchActivePair(req, res) {
  try {
    const { languagePairId } = req.body;
    const userId = req.params.userId;

    const pair = await LanguagePair.findOne({ _id: languagePairId, userId });
    if (!pair) return res.status(404).json({ error: 'Language pair not found' });

    await User.updateOne({ telegramId: userId }, { activeLanguagePairId: pair._id });
    res.json({ success: true });
  } catch (err) {
    console.error('switchActivePair error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { listPairs, addPair, switchActivePair };
