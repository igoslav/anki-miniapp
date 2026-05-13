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

  const itemsHtml = activeCards.map(card => {
    const nextReview = new Date(card.srs.nextReview);
    const isDue = nextReview <= new Date();
    const statusText = isDue ? 'Due' : `${card.srs.interval}d`;
    const hasProgress = card.srs.repetitions > 0 || card.srs.interval > 0;
    return `
      <div class="list-item">
        <div class="list-item-content">
          <div class="list-item-word">${escapeHtml(card.front.word)}</div>
          <div class="list-item-translation">${escapeHtml(card.back.translation)}</div>
        </div>
        <div class="list-item-actions">
          <span style="font-size:12px;color:var(--tg-theme-hint-color);min-width:30px;text-align:center;">${statusText}</span>
          <button class="edit-btn" onclick="openEditCard('${card.id}')" title="Edit card">&#9998;</button>
          ${hasProgress ? `<button class="reset-btn" onclick="resetCardProgress('${card.id}')" title="Reset progress">&#8635;</button>` : ''}
          <button class="delete-btn" onclick="deleteCard('${card.id}')">&#128465;</button>
        </div>
      </div>
    `;
  }).join('');

  const footerHtml = `
    <div class="card-list-footer">
      <button class="btn btn-danger btn-small" onclick="deleteAllCards()">Delete All Cards</button>
    </div>
  `;
  listEl.innerHTML = itemsHtml + footerHtml;
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

async function deleteAllCards() {
  if (activeCards.length === 0) return;
  const pairId = userData.activeLanguagePairId;
  const pair = userData.languagePairs.find(p => p.id === pairId);
  const pairLabel = pair ? `${pair.source} → ${pair.target}` : 'this language pair';
  tg.showConfirm(`Delete ALL ${activeCards.length} cards from ${pairLabel}? This cannot be undone.`, async (confirmed) => {
    if (!confirmed) return;
    await apiDelete('/cards');
    userData.cards = userData.cards.filter(c => c.languagePairId !== pairId);
    activeCards = getActiveCards();
    renderCardList();
    hapticNotify('success');
  });
}

async function resetCardProgress(cardId) {
  tg.showConfirm('Reset progress for this card? It will be due for review immediately.', async (confirmed) => {
    if (!confirmed) return;
    const updated = await apiPut(`/card/${cardId}/reset`, {});
    const idx = userData.cards.findIndex(c => c.id === cardId);
    if (idx !== -1) userData.cards[idx] = updated;
    activeCards = getActiveCards();
    renderCardList();
    hapticNotify('success');
  });
}
