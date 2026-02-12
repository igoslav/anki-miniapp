const db = require('../db/db');
const { updateSRS } = require('../services/srs');

function submitReview(req, res) {
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
}

module.exports = { submitReview };
