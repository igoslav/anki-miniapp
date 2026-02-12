// --- Card List ---
function renderCardList() {
  const listEl = document.getElementById('cardList');
  const emptyEl = document.getElementById('emptyCardList');

  if (activeCards.length === 0) {
    listEl.style.display = 'none';
    emptyEl.classList.remove('hidden');
    return;
  }

  listEl.style.display = 'block';
  emptyEl.classList.add('hidden');

  listEl.innerHTML = activeCards.map(card => {
    const nextReview = new Date(card.srs.nextReview);
    const isDue = nextReview <= new Date();
    const statusText = isDue ? 'Due' : `${card.srs.interval}d`;
    return `
      <div class="list-item">
        <div class="list-item-content">
          <div class="list-item-word">${escapeHtml(card.front.word)}</div>
          <div class="list-item-translation">${escapeHtml(card.back.translation)}</div>
        </div>
        <div class="list-item-actions">
          <span style="font-size:12px;color:var(--tg-theme-hint-color);min-width:30px;text-align:center;">${statusText}</span>
          <button class="delete-btn" onclick="deleteCard('${card.id}')">&#128465;</button>
        </div>
      </div>
    `;
  }).join('');
}

async function deleteCard(cardId) {
  tg.showConfirm('Delete this card?', async (confirmed) => {
    if (!confirmed) return;
    await apiDelete(`/card/${cardId}`);
    userData.cards = userData.cards.filter(c => c.id !== cardId);
    activeCards = getActiveCards();
    renderCardList();
    hapticNotify('success');
  });
}
