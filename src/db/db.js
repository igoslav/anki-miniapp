const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'db.json');

function read() {
  if (!fs.existsSync(DB_PATH)) return { users: {} };
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function write(data) {
  fs.mkdirSync(path.join(__dirname, '..', '..', 'data'), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function getUser(userId) {
  const db = read();
  if (!db.users[userId]) {
    db.users[userId] = {
      languagePairs: [],
      activeLanguagePairId: null,
      cards: [],
      settings: {
        dailyReminderEnabled: true,
        reminderHour: 9,
        reminderMinute: 0,
        timezone: 'UTC'
      }
    };
    write(db);
  }
  return db.users[userId];
}

function saveUser(userId, userData) {
  const db = read();
  db.users[userId] = userData;
  write(db);
}

module.exports = { read, write, getUser, saveUser };
