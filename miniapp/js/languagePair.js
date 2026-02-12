// --- Language Pair ---
function updateLangSelector() {
  const text = document.getElementById('langSelectorText');
  if (!userData || userData.languagePairs.length === 0) {
    text.textContent = 'Add Language Pair';
    return;
  }
  const active = userData.languagePairs.find(lp => lp.id === userData.activeLanguagePairId);
  text.textContent = active ? `${active.source} → ${active.target}` : 'Select Language';
}

function toggleLangDropdown() {
  const dropdown = document.getElementById('lpDropdown');
  dropdown.classList.toggle('open');

  if (!dropdown.classList.contains('open')) return;

  let html = '';
  if (userData && userData.languagePairs.length > 0) {
    userData.languagePairs.forEach(lp => {
      const isActive = lp.id === userData.activeLanguagePairId;
      html += `<div class="lp-dropdown-item ${isActive ? 'active' : ''}" onclick="switchPair('${lp.id}')">${lp.source} → ${lp.target}</div>`;
    });
  }
  html += `<div class="lp-dropdown-item add-new" onclick="openAddPairModal()">+ Add new pair</div>`;
  dropdown.innerHTML = html;
  haptic('light');
}

async function switchPair(pairId) {
  await apiPut('/active-pair', { languagePairId: pairId });
  userData.activeLanguagePairId = pairId;
  activeCards = getActiveCards();
  updateLangSelector();
  updateHomeScreen();
  document.getElementById('lpDropdown').classList.remove('open');
  haptic('medium');
}

function openAddPairModal() {
  document.getElementById('lpDropdown').classList.remove('open');
  document.getElementById('addPairModal').classList.add('active');
  haptic('light');
}

function closeAddPairModal() {
  document.getElementById('addPairModal').classList.remove('active');
}

async function addLanguagePair(e) {
  e.preventDefault();
  const source = document.getElementById('inputSourceLang').value.trim();
  const target = document.getElementById('inputTargetLang').value.trim();
  if (!source || !target) return;

  const pair = await apiPost('/language-pair', { source, target });
  userData.languagePairs.push(pair);
  userData.activeLanguagePairId = pair.id;
  activeCards = getActiveCards();

  document.getElementById('addPairForm').reset();
  closeAddPairModal();
  updateLangSelector();
  updateHomeScreen();
  hapticNotify('success');
}
