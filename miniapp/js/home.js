// --- Home Screen ---
function updateHomeScreen() {
  const now = new Date();
  const dueCards = activeCards.filter(c => new Date(c.srs.nextReview) <= now);
  const mastered = activeCards.filter(c => c.srs.repetitions >= 3);

  document.getElementById('statTotal').textContent = activeCards.length;
  document.getElementById('statDue').textContent = dueCards.length;
  document.getElementById('statMastered').textContent = mastered.length;

  const dueBadge = document.getElementById('dueBadge');
  if (dueCards.length > 0) {
    document.getElementById('dueCount').textContent = dueCards.length;
    dueBadge.classList.remove('hidden');
  } else {
    dueBadge.classList.add('hidden');
  }

  // Update review button: "Start Again" when no due cards but cards exist
  const reviewBtn = document.getElementById('startReviewBtn');
  if (reviewBtn) {
    if (dueCards.length === 0 && activeCards.length > 0) {
      reviewBtn.querySelector('span').textContent = 'Start Again';
    } else {
      reviewBtn.querySelector('span').textContent = 'Start Review';
    }
  }
}

function getActiveCards() {
  if (!userData || !userData.activeLanguagePairId) return [];
  return userData.cards.filter(c => c.languagePairId === userData.activeLanguagePairId);
}
