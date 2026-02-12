// --- Review Flow ---
function startReview() {
  const now = new Date();
  reviewQueue = activeCards.filter(c => new Date(c.srs.nextReview) <= now);

  if (reviewQueue.length === 0) {
    tg.showAlert('No cards due for review!');
    return;
  }

  shuffle(reviewQueue);
  currentReviewIndex = 0;
  sessionStats = { reviewed: 0, again: 0, good: 0 };
  isFlipped = false;

  showScreen('reviewScreen');
  document.getElementById('reviewTotal').textContent = reviewQueue.length;
  showCurrentCard();
}

// Preview what interval each rating would produce (mirrors srs.js logic)
function previewIntervals(card) {
  const intervals = {};
  for (let quality = 0; quality <= 3; quality++) {
    const q = quality + 2;
    let interval;
    if (q < 3) {
      interval = 1;
    } else if (card.srs.repetitions === 0) {
      if (q === 3) interval = 1;
      else if (q === 4) interval = 3;
      else interval = 7;
    } else if (card.srs.repetitions === 1) {
      if (q === 3) interval = 3;
      else if (q === 4) interval = 6;
      else interval = 8;
    } else {
      if (q === 3) interval = Math.max(1, Math.round(card.srs.interval * 1.2));
      else if (q === 4) interval = Math.round(card.srs.interval * card.srs.easeFactor);
      else interval = Math.round(card.srs.interval * card.srs.easeFactor * 1.3);
    }
    intervals[quality] = interval;
  }
  return intervals;
}

function updateRatingLabels(card) {
  const intervals = previewIntervals(card);
  document.querySelector('.rate-btn.again .rate-btn-label').textContent = formatInterval(intervals[0]);
  document.querySelector('.rate-btn.hard .rate-btn-label').textContent = formatInterval(intervals[1]);
  document.querySelector('.rate-btn.good .rate-btn-label').textContent = formatInterval(intervals[2]);
  document.querySelector('.rate-btn.easy .rate-btn-label').textContent = formatInterval(intervals[3]);
}

function showCurrentCard() {
  if (currentReviewIndex >= reviewQueue.length) {
    showCompleteScreen();
    return;
  }

  const card = reviewQueue[currentReviewIndex];
  isReversed = Math.random() < 0.5;
  updateRatingLabels(card);

  // Front side
  document.getElementById('cardWord').textContent = isReversed ? card.back.translation : card.front.word;
  const imgEl = document.getElementById('cardImage');
  if (!isReversed && card.front.imageUrl) {
    imgEl.src = card.front.imageUrl;
    imgEl.classList.remove('hidden');
  } else {
    imgEl.classList.add('hidden');
    imgEl.src = '';
  }

  // Back side
  document.getElementById('cardTranslation').textContent = isReversed ? card.front.word : card.back.translation;
  const exEl = document.getElementById('cardExample');
  if (card.back.example) {
    exEl.textContent = card.back.example;
    exEl.classList.remove('hidden');
  } else {
    exEl.classList.add('hidden');
  }
  const prEl = document.getElementById('cardPronunciation');
  if (card.back.pronunciation) {
    prEl.textContent = card.back.pronunciation;
    prEl.classList.remove('hidden');
  } else {
    prEl.classList.add('hidden');
  }

  // Progress
  document.getElementById('reviewCurrent').textContent = currentReviewIndex + 1;
  const pct = (currentReviewIndex / reviewQueue.length) * 100;
  document.getElementById('progressFill').style.width = pct + '%';

  // Reset flip
  const flashcard = document.getElementById('flashcard');
  flashcard.classList.remove('flipped', 'swipe-left', 'swipe-right');
  isFlipped = false;

  document.getElementById('tapHint').textContent = 'Tap card to flip';
  document.getElementById('ratingButtons').classList.remove('visible');

  haptic('light');
}

function flipCard() {
  if (isDragging) return;
  const flashcard = document.getElementById('flashcard');
  flashcard.classList.toggle('flipped');
  isFlipped = !isFlipped;

  if (isFlipped) {
    document.getElementById('tapHint').textContent = 'Rate your recall';
    document.getElementById('ratingButtons').classList.add('visible');
  } else {
    document.getElementById('tapHint').textContent = 'Tap card to flip';
    document.getElementById('ratingButtons').classList.remove('visible');
  }

  haptic('medium');
}

async function rateCard(quality) {
  if (!isFlipped) return;

  const card = reviewQueue[currentReviewIndex];
  const flashcard = document.getElementById('flashcard');

  await apiPut(`/card/${card.id}/review`, { quality });

  sessionStats.reviewed++;
  if (quality < 2) sessionStats.again++;
  else sessionStats.good++;

  flashcard.classList.add(quality >= 2 ? 'swipe-right' : 'swipe-left');
  hapticNotify(quality >= 2 ? 'success' : 'warning');

  setTimeout(() => {
    currentReviewIndex++;
    showCurrentCard();
  }, 400);
}

function showCompleteScreen() {
  document.getElementById('statsReviewed').textContent = sessionStats.reviewed;
  document.getElementById('statsAgain').textContent = sessionStats.again;
  document.getElementById('statsGood').textContent = sessionStats.good;
  showScreen('completeScreen');

  // Reload data to get updated SRS
  loadUserData();
}
