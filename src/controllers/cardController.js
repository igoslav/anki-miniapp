const db = require('../db/db');
const { buildCardObject, bulkImport } = require('../services/cardService');

function addCard(req, res) {
  const { word, translation, example, pronunciation, imageUrl, languagePairId } = req.body;
  if (!word || !translation) return res.status(400).json({ error: 'word and translation required' });

  const user = db.getUser(req.params.userId);
  const pairId = languagePairId || user.activeLanguagePairId;
  if (languagePairId && !user.languagePairs.find(p => p.id === languagePairId)) {
    return res.status(400).json({ error: 'languagePairId not found' });
  }

  const card = buildCardObject({ word, translation, example, pronunciation, imageUrl, languagePairId: pairId });
  user.cards.push(card);
  db.saveUser(req.params.userId, user);
  res.json(card);
}

function importCards(req, res) {
  const { cards, languagePairId } = req.body;
  if (!Array.isArray(cards)) return res.status(400).json({ error: 'cards array required' });

  const user = db.getUser(req.params.userId);
  const pairId = languagePairId || user.activeLanguagePairId;
  if (languagePairId && !user.languagePairs.find(p => p.id === languagePairId)) {
    return res.status(400).json({ error: 'languagePairId not found' });
  }

  const { newCards, imported, skipped } = bulkImport(cards, pairId);
  user.cards.push(...newCards);
  db.saveUser(req.params.userId, user);
  res.json({ imported, skipped });
}

function updateCard(req, res) {
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
}

function deleteCard(req, res) {
  const user = db.getUser(req.params.userId);
  const index = user.cards.findIndex(c => c.id === req.params.cardId);
  if (index === -1) return res.status(404).json({ error: 'Card not found' });

  user.cards.splice(index, 1);
  db.saveUser(req.params.userId, user);
  res.json({ success: true });
}

module.exports = { addCard, importCards, updateCard, deleteCard };
