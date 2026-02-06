/**
 * SM-2 variant spaced repetition algorithm.
 * @param {object} card - Card object with card.srs fields
 * @param {number} quality - 0=Again, 1=Hard, 2=Good, 3=Easy
 * @returns {object} Updated card
 */
function updateSRS(card, quality) {
  const q = quality + 2; // map to SM-2 scale (2-5)

  if (q < 3) {
    card.srs.repetitions = 0;
    card.srs.interval = 1;
  } else {
    if (card.srs.repetitions === 0) card.srs.interval = 1;
    else if (card.srs.repetitions === 1) card.srs.interval = 6;
    else card.srs.interval = Math.round(card.srs.interval * card.srs.easeFactor);

    card.srs.repetitions++;
  }

  card.srs.easeFactor = Math.max(1.3,
    card.srs.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  );

  card.srs.nextReview = new Date(Date.now() + card.srs.interval * 86400000).toISOString();
  return card;
}

module.exports = { updateSRS };
