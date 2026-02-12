const fs = require('fs');
const path = require('path');

function performBackup() {
  const dbPath = path.join(__dirname, '..', '..', 'data', 'db.json');
  if (!fs.existsSync(dbPath)) return;

  const backupDir = path.join(__dirname, '..', '..', 'data', 'backups');
  fs.mkdirSync(backupDir, { recursive: true });

  const date = new Date().toISOString().slice(0, 10);
  const dest = path.join(backupDir, `db_${date}.json`);
  fs.copyFileSync(dbPath, dest);

  // Keep last 7 backups
  const files = fs.readdirSync(backupDir).filter(f => f.startsWith('db_')).sort();
  while (files.length > 7) {
    fs.unlinkSync(path.join(backupDir, files.shift()));
  }

  console.log(`Backup saved: ${dest}`);
}

module.exports = { performBackup };
