function buildCardObject({ word, translation, example, pronunciation, imageUrl, languagePairId }) {
  return {
    id: 'card_' + Date.now(),
    languagePairId,
    front: {
      word,
      imageUrl: imageUrl || ''
    },
    back: {
      translation,
      example: example || '',
      pronunciation: pronunciation || ''
    },
    srs: {
      interval: 0,
      easeFactor: 2.5,
      nextReview: new Date().toISOString(),
      repetitions: 0
    },
    createdAt: new Date().toISOString()
  };
}

function bulkImport(cards, defaultPairId) {
  let imported = 0;
  let skipped = 0;
  const newCards = [];

  cards.forEach(c => {
    if (!c.word || !c.translation) { skipped++; return; }
    newCards.push({
      id: 'card_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      languagePairId: c.languagePairId || defaultPairId,
      front: {
        word: c.word,
        imageUrl: c.imageUrl || c.imageurl || ''
      },
      back: {
        translation: c.translation,
        example: c.example || '',
        pronunciation: c.pronunciation || ''
      },
      srs: {
        interval: 0,
        easeFactor: 2.5,
        nextReview: new Date().toISOString(),
        repetitions: 0
      },
      createdAt: new Date().toISOString()
    });
    imported++;
  });

  return { newCards, imported, skipped };
}

module.exports = { buildCardObject, bulkImport };
