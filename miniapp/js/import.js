// --- CSV Import ---
function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  return lines.slice(1).map(line => {
    const values = line.match(/(".*?"|[^,]+)/g) || [];
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = (values[i] || '').replace(/^"|"$/g, '').trim();
    });
    return obj;
  }).filter(row => row.word && row.translation);
}

function handleCSVFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    parsedCSVCards = parseCSV(ev.target.result);
    document.getElementById('importCount').textContent = parsedCSVCards.length;
    document.getElementById('importPreview').classList.remove('hidden');
    document.getElementById('importResult').classList.add('hidden');
  };
  reader.readAsText(file);
}

async function confirmImport() {
  if (parsedCSVCards.length === 0) return;

  if (!userData.activeLanguagePairId) {
    tg.showAlert('Please add a language pair first.');
    return;
  }

  const result = await apiPost('/cards/import', { cards: parsedCSVCards });
  document.getElementById('importPreview').classList.add('hidden');

  const resultEl = document.getElementById('importResult');
  resultEl.textContent = `Imported ${result.imported} cards. ${result.skipped} skipped.`;
  resultEl.className = 'import-result success';
  resultEl.classList.remove('hidden');

  parsedCSVCards = [];
  document.getElementById('csvFileInput').value = '';
  await loadUserData();
  hapticNotify('success');
}
