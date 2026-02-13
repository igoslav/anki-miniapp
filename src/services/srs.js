/**
 * SM-2 variant spaced repetition algorithm.
 * @param {object} card - Card object with card.srs fields
 * @param {number} quality - 0=Again, 1=Hard, 2=Good, 3=Easy
 * @returns {object} Updated card
 */
function updateSRS(card, quality) {
  const q = quality + 2; // map to SM-2 scale (2-5)

  if (q < 3) {
    // Again: reset
    card.srs.repetitions = 0;
    card.srs.interval = 1;
  } else {
    if (card.srs.repetitions === 0) {
      if (q === 3) card.srs.interval = 1;       // Hard
      else if (q === 4) card.srs.interval = 3;   // Good
      else card.srs.interval = 7;                // Easy
    } else if (card.srs.repetitions === 1) {
      if (q === 3) card.srs.interval = 3;        // Hard
      else if (q === 4) card.srs.interval = 6;   // Good
      else card.srs.interval = 8;                // Easy
    } else {
      // Mature cards
      if (q === 3) card.srs.interval = Math.max(1, Math.round(card.srs.interval * 1.2));
      else if (q === 4) card.srs.interval = Math.round(card.srs.interval * card.srs.easeFactor);
      else card.srs.interval = Math.round(card.srs.interval * card.srs.easeFactor * 1.3);
    }
    card.srs.repetitions++;
  }

  card.srs.easeFactor = Math.max(1.3,
    card.srs.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  );

  card.srs.nextReview = new Date(Date.now() + card.srs.interval * 86400000);
  return card;
}

module.exports = { updateSRS };
