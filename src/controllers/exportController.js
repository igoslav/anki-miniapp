const db = require('../db/db');

function exportData(req, res) {
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
}

async function exportToChat(req, res) {
  try {
    // Lazy require to avoid circular dependency
    const bot = require('../bot/bot');
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
}

module.exports = { exportData, exportToChat };
