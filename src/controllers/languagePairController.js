const db = require('../db/db');

function listPairs(req, res) {
  const user = db.getUser(req.params.userId);
  res.json({ languagePairs: user.languagePairs, activeLanguagePairId: user.activeLanguagePairId });
}

function addPair(req, res) {
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
}

function switchActivePair(req, res) {
  const { languagePairId } = req.body;
  const user = db.getUser(req.params.userId);
  const exists = user.languagePairs.some(lp => lp.id === languagePairId);
  if (!exists) return res.status(404).json({ error: 'Language pair not found' });

  user.activeLanguagePairId = languagePairId;
  db.saveUser(req.params.userId, user);
  res.json({ success: true });
}

function updatePairReminder(req, res) {
  const { pairId } = req.params;
  const user = db.getUser(req.params.userId);
  const pair = user.languagePairs.find(lp => lp.id === pairId);
  if (!pair) return res.status(404).json({ error: 'Language pair not found' });

  const { reminderEnabled, reminderDays, cardOrder } = req.body;
  if (reminderEnabled !== undefined) pair.reminderEnabled = reminderEnabled;
  if (Array.isArray(reminderDays)) pair.reminderDays = reminderDays;
  if (cardOrder !== undefined) pair.cardOrder = cardOrder;

  db.saveUser(req.params.userId, user);
  res.json(pair);
}

module.exports = { listPairs, addPair, switchActivePair, updatePairReminder };
