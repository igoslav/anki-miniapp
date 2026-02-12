// --- Export ---
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
