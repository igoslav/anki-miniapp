const { Card } = require('../models');
const { updateSRS } = require('../services/srs');
const { serializeCard } = require('../services/serializers');

async function submitReview(req, res) {
  try {
    const { quality } = req.body;
    if (quality === undefined || quality < 0 || quality > 3) {
      return res.status(400).json({ error: 'quality 0-3 required' });
    }

    const userId = req.params.userId;
    const card = await Card.findOne({ _id: req.params.cardId, userId });
    if (!card) return res.status(404).json({ error: 'Card not found' });

    updateSRS(card, quality);
    card.markModified('srs');
    await card.save();
    res.json(serializeCard(card));
  } catch (err) {
    console.error('submitReview error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { submitReview };
