require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { User, LanguagePair, Card } = require('../src/models');

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

async function migrate() {
  if (!fs.existsSync(DB_PATH)) {
    console.log('No db.json found, nothing to migrate.');
    return;
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  if (!data.users) {
    console.log('No users in db.json');
    await mongoose.disconnect();
    return;
  }

  let usersCount = 0;
  let pairsCount = 0;
  let cardsCount = 0;

  for (const [telegramId, userData] of Object.entries(data.users)) {
    // Map old lp IDs to new ObjectIds
    const lpIdMap = {};

    // Create user
    let user = await User.findOne({ telegramId });
    if (!user) {
      user = await User.create({
        telegramId,
        settings: userData.settings || {}
      });
      usersCount++;
    }

    // Create language pairs
    for (const lp of (userData.languagePairs || [])) {
      let existingLp = await LanguagePair.findOne({ userId: telegramId, source: lp.source, target: lp.target });
      if (!existingLp) {
        existingLp = await LanguagePair.create({
          userId: telegramId,
          source: lp.source,
          target: lp.target
        });
        pairsCount++;
      }
      lpIdMap[lp.id] = existingLp._id;
    }

    // Set active language pair
    if (userData.activeLanguagePairId && lpIdMap[userData.activeLanguagePairId]) {
      user.activeLanguagePairId = lpIdMap[userData.activeLanguagePairId];
      await user.save();
    }

    // Create cards
    for (const card of (userData.cards || [])) {
      const lpObjectId = lpIdMap[card.languagePairId];
      if (!lpObjectId) {
        console.warn(`  Skipping card "${card.front.word}" — no matching language pair`);
        continue;
      }

      const exists = await Card.findOne({
        userId: telegramId,
        languagePairId: lpObjectId,
        'front.word': card.front.word,
        'back.translation': card.back.translation
      });

      if (!exists) {
        await Card.create({
          userId: telegramId,
          languagePairId: lpObjectId,
          front: card.front,
          back: card.back,
          srs: {
            interval: card.srs.interval,
            easeFactor: card.srs.easeFactor,
            nextReview: new Date(card.srs.nextReview),
            repetitions: card.srs.repetitions
          }
        });
        cardsCount++;
      }
    }

    console.log(`Migrated user ${telegramId}`);
  }

  console.log(`\nMigration complete: ${usersCount} users, ${pairsCount} language pairs, ${cardsCount} cards`);
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
