function serializeCard(card) {
  const obj = card.toObject ? card.toObject() : card;
  return {
    id: String(obj._id),
    languagePairId: String(obj.languagePairId),
    front: obj.front,
    back: obj.back,
    srs: {
      interval: obj.srs.interval,
      easeFactor: obj.srs.easeFactor,
      nextReview: obj.srs.nextReview instanceof Date ? obj.srs.nextReview.toISOString() : obj.srs.nextReview,
      repetitions: obj.srs.repetitions
    },
    source: obj.source || 'self',
    sourceTutorId: obj.sourceTutorId || null,
    lessonId: obj.lessonId ? String(obj.lessonId) : null,
    createdAt: obj.createdAt instanceof Date ? obj.createdAt.toISOString() : obj.createdAt
  };
}

function serializeLanguagePair(lp) {
  const obj = lp.toObject ? lp.toObject() : lp;
  return {
    id: String(obj._id),
    source: obj.source,
    target: obj.target,
    createdAt: obj.createdAt instanceof Date ? obj.createdAt.toISOString() : obj.createdAt
  };
}

module.exports = { serializeCard, serializeLanguagePair };
