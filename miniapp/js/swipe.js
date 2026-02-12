// --- Swipe Gestures ---
function setupSwipeHandlers() {
  const container = document.getElementById('cardContainer');
  const leftInd = container.querySelector('.swipe-indicators.left');
  const rightInd = container.querySelector('.swipe-indicators.right');

  container.addEventListener('touchstart', (e) => {
    if (!isFlipped) return;
    touchStartX = e.touches[0].clientX;
    isDragging = false;
  });

  container.addEventListener('touchmove', (e) => {
    if (!isFlipped) return;
    const diff = e.touches[0].clientX - touchStartX;
    if (Math.abs(diff) > 10) isDragging = true;

    if (diff < -50) {
      leftInd.classList.add('visible');
      rightInd.classList.remove('visible');
    } else if (diff > 50) {
      rightInd.classList.add('visible');
      leftInd.classList.remove('visible');
    } else {
      leftInd.classList.remove('visible');
      rightInd.classList.remove('visible');
    }
  });

  container.addEventListener('touchend', (e) => {
    if (!isFlipped || !isDragging) return;
    const diff = e.changedTouches[0].clientX - touchStartX;
    leftInd.classList.remove('visible');
    rightInd.classList.remove('visible');

    if (diff < -100) rateCard(0);      // swipe left = Again
    else if (diff > 100) rateCard(2);  // swipe right = Good

    isDragging = false;
  });
}
