// --- Export ---
function exportCSV() {
  if (!activeCards || activeCards.length === 0) {
    hapticNotify('error');
    return;
  }
  function escapeCSVField(value) {
    const str = value || '';
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }
  const header = 'word,translation,example,pronunciation,imageUrl';
  const rows = activeCards.map(card => [
    escapeCSVField(card.front.word),
    escapeCSVField(card.back.translation),
    escapeCSVField(card.back.example),
    escapeCSVField(card.back.pronunciation),
    escapeCSVField(card.front.imageUrl)
  ].join(','));
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ankicards_export_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  hapticNotify('success');
}


function exportDownload() {
  if (!userData) return;
  const exportData = {
    exportVersion: 1,
    exportedAt: new Date().toISOString(),
    languagePairs: userData.languagePairs,
    cards: userData.cards,
    settings: userData.settings
  };
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ankicards_backup_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);

  const statusEl = document.getElementById('exportStatus');
  statusEl.textContent = 'Download started!';
  statusEl.className = 'import-result success';
  statusEl.classList.remove('hidden');
  hapticNotify('success');
}

async function exportToChat() {
  const statusEl = document.getElementById('exportStatus');
  statusEl.textContent = 'Sending...';
  statusEl.className = 'import-result';
  statusEl.classList.remove('hidden');

  try {
    const res = await apiPost('/export-to-chat', {});
    if (res.success) {
      statusEl.textContent = 'Backup sent to chat!';
      statusEl.className = 'import-result success';
      hapticNotify('success');
    } else {
      throw new Error();
    }
  } catch {
    statusEl.textContent = 'Failed to send. Try download instead.';
    statusEl.className = 'import-result error';
    hapticNotify('error');
  }
}
