const { Card, LanguagePair } = require('../models');
const { serializeCard } = require('../services/serializers');

async function addCard(req, res) {
  try {
    const { word, translation, example, pronunciation, imageUrl, languagePairId } = req.body;
    if (!word || !translation) return res.status(400).json({ error: 'word and translation required' });

    const userId = req.params.userId;
    const pairId = languagePairId || null;

    if (pairId) {
      const pair = await LanguagePair.findOne({ _id: pairId, userId });
      if (!pair) return res.status(400).json({ error: 'languagePairId not found' });
    }

    const card = await Card.create({
      userId,
      languagePairId: pairId,
      front: { word, imageUrl: imageUrl || '' },
      back: { translation, example: example || '', pronunciation: pronunciation || '' }
    });

    res.json(serializeCard(card));
  } catch (err) {
    console.error('addCard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function importCards(req, res) {
  try {
    const { cards, languagePairId } = req.body;
    if (!Array.isArray(cards)) return res.status(400).json({ error: 'cards array required' });

    const userId = req.params.userId;
    const pairId = languagePairId || null;

    if (pairId) {
      const pair = await LanguagePair.findOne({ _id: pairId, userId });
      if (!pair) return res.status(400).json({ error: 'languagePairId not found' });
    }

    let imported = 0;
    let skipped = 0;
    const docs = [];

    for (const c of cards) {
      if (!c.word || !c.translation) { skipped++; continue; }
      docs.push({
        userId,
        languagePairId: c.languagePairId || pairId,
        front: { word: c.word, imageUrl: c.imageUrl || c.imageurl || '' },
        back: { translation: c.translation, example: c.example || '', pronunciation: c.pronunciation || '' }
      });
      imported++;
    }

    if (docs.length > 0) await Card.insertMany(docs);
    res.json({ imported, skipped });
  } catch (err) {
    console.error('importCards error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function updateCard(req, res) {
  try {
    const userId = req.params.userId;
    const card = await Card.findOne({ _id: req.params.cardId, userId });
    if (!card) return res.status(404).json({ error: 'Card not found' });

    const { word, translation, example, pronunciation, imageUrl } = req.body;
    if (word !== undefined) card.front.word = word;
    if (imageUrl !== undefined) card.front.imageUrl = imageUrl;
    if (translation !== undefined) card.back.translation = translation;
    if (example !== undefined) card.back.example = example;
    if (pronunciation !== undefined) card.back.pronunciation = pronunciation;

    await card.save();
    res.json(serializeCard(card));
  } catch (err) {
    console.error('updateCard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function deleteCard(req, res) {
  try {
    const userId = req.params.userId;
    const result = await Card.deleteOne({ _id: req.params.cardId, userId });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Card not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('deleteCard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { addCard, importCards, updateCard, deleteCard };
