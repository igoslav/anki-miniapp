// --- Telegram WebApp ---
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// --- State ---
const params = new URLSearchParams(window.location.search);
const userId = params.get('user_id') || (tg.initDataUnsafe.user && tg.initDataUnsafe.user.id);
let userData = null;
let activeCards = [];
let reviewQueue = [];
let currentReviewIndex = 0;
let isFlipped = false;
let sessionStats = { reviewed: 0, again: 0, good: 0 };
let isReversed = false; // true = show translation on front
let parsedCSVCards = [];

// Touch state
let touchStartX = 0;
let isDragging = false;

// --- API Helpers ---
async function apiGet(path) {
  const res = await fetch(`/api/user/${userId}${path}`);
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(`/api/user/${userId}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}

async function apiPut(path, body) {
  const res = await fetch(`/api/user/${userId}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}

async function apiDelete(path) {
  const res = await fetch(`/api/user/${userId}${path}`, { method: 'DELETE' });
  return res.json();
}

// --- Init ---
async function initApp() {
  if (!userId) {
    document.body.innerHTML = '<div style="padding:40px;text-align:center;">Please open from Telegram bot.</div>';
    return;
  }
  await loadUserData();
  initSettings();
  setupEventListeners();
}

async function loadUserData() {
  userData = await apiGet('');
  activeCards = getActiveCards();
  updateHomeScreen();
  updateLangSelector();
}

function getActiveCards() {
  if (!userData || !userData.activeLanguagePairId) return [];
  return userData.cards.filter(c => c.languagePairId === userData.activeLanguagePairId);
}

// --- Navigation ---
const mainScreens = ['homeScreen', 'addCardScreen', 'cardListScreen'];
const allScreens = ['homeScreen', 'reviewScreen', 'addCardScreen', 'cardListScreen', 'importScreen', 'settingsScreen', 'completeScreen'];

function showScreen(screenId) {
  allScreens.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });
  const target = document.getElementById(screenId);
  if (target) target.classList.add('active');

  // Close dropdown
  document.getElementById('lpDropdown').classList.remove('open');

  // Back button
  if (screenId === 'homeScreen') {
    tg.BackButton.hide();
  } else {
    tg.BackButton.show();
  }

  // Bottom nav visibility and active state
  const bottomNav = document.getElementById('bottomNav');
  const appHeader = document.getElementById('appHeader');
  if (screenId === 'reviewScreen' || screenId === 'completeScreen') {
    bottomNav.style.display = 'none';
    appHeader.style.display = 'none';
  } else {
    bottomNav.style.display = 'flex';
    appHeader.style.display = 'flex';
  }

  // Update nav active state
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.screen === screenId);
  });

  // Screen-specific setup
  if (screenId === 'cardListScreen') renderCardList();
  if (screenId === 'homeScreen') loadUserData();
  if (screenId === 'settingsScreen') renderSettings();

  haptic('light');
}

function navTo(screenId) {
  showScreen(screenId);
}

tg.BackButton.onClick(() => showScreen('homeScreen'));

function haptic(type) {
  try { tg.HapticFeedback.impactOccurred(type || 'light'); } catch {}
}

function hapticNotify(type) {
  try { tg.HapticFeedback.notificationOccurred(type || 'success'); } catch {}
}

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
}

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

// --- Find Image ---
async function findImage() {
  const word = document.getElementById('inputWord').value.trim();
  if (!word) {
    tg.showAlert('Enter a word first.');
    return;
  }

  const btn = document.getElementById('findImageBtn');
  const btnText = document.getElementById('findImageText');
  btn.disabled = true;
  btnText.textContent = 'Searching...';

  try {
    const url = await fetchImageUrl(word);
    if (url) {
      setCardImage(url);
      hapticNotify('success');
    } else {
      tg.showAlert('No image found for this word.');
      haptic('light');
    }
  } catch {
    tg.showAlert('Image search failed.');
  } finally {
    btn.disabled = false;
    btnText.textContent = 'Find Image';
  }
}

const LANG_TO_WIKI = {
  'arabic': 'ar', 'chinese': 'zh', 'czech': 'cs', 'danish': 'da',
  'dutch': 'nl', 'english': 'en', 'finnish': 'fi', 'french': 'fr',
  'german': 'de', 'greek': 'el', 'hebrew': 'he', 'hindi': 'hi',
  'hungarian': 'hu', 'indonesian': 'id', 'italian': 'it', 'japanese': 'ja',
  'korean': 'ko', 'norwegian': 'no', 'persian': 'fa', 'polish': 'pl',
  'portuguese': 'pt', 'romanian': 'ro', 'russian': 'ru', 'serbian': 'sr',
  'spanish': 'es', 'swedish': 'sv', 'thai': 'th', 'turkish': 'tr',
  'ukrainian': 'uk', 'vietnamese': 'vi'
};

function getSourceWikiLang() {
  if (!userData || !userData.activeLanguagePairId) return 'en';
  const pair = userData.languagePairs.find(lp => lp.id === userData.activeLanguagePairId);
  if (!pair) return 'en';
  return LANG_TO_WIKI[pair.source.toLowerCase()] || 'en';
}

async function wikiThumbnail(lang, word) {
  const res = await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(word)}`);
  if (res.ok) {
    const data = await res.json();
    if (data.thumbnail && data.thumbnail.source) return data.thumbnail.source;
  }
  return null;
}

async function fetchImageUrl(word) {
  const lang = getSourceWikiLang();

  // 1. Source-language Wikipedia (e.g. it.wikipedia.org for Italian)
  try {
    const url = await wikiThumbnail(lang, word);
    if (url) return url;
  } catch {}

  // 2. English Wikipedia fallback
  if (lang !== 'en') {
    try {
      const url = await wikiThumbnail('en', word);
      if (url) return url;
    } catch {}
  }

  // 3. Wiktionary fallback
  try {
    const res = await fetch(`https://en.wiktionary.org/api/rest_v1/page/summary/${encodeURIComponent(word)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.thumbnail && data.thumbnail.source) return data.thumbnail.source;
    }
  } catch {}

  return null;
}

function setCardImage(url) {
  document.getElementById('inputImageUrl').value = url;
  const preview = document.getElementById('imagePreview');
  const img = document.getElementById('imagePreviewImg');
  img.src = url;
  preview.classList.remove('hidden');
}

function clearCardImage() {
  document.getElementById('inputImageUrl').value = '';
  const preview = document.getElementById('imagePreview');
  preview.classList.add('hidden');
  document.getElementById('imagePreviewImg').src = '';
}

// --- Add Card ---
async function addCard(e) {
  e.preventDefault();
  const word = document.getElementById('inputWord').value.trim();
  const translation = document.getElementById('inputTranslation').value.trim();
  const example = document.getElementById('inputExample').value.trim();
  const pronunciation = document.getElementById('inputPronunciation').value.trim();
  const imageUrl = document.getElementById('inputImageUrl').value;

  if (!word || !translation) return;

  if (!userData.activeLanguagePairId) {
    tg.showAlert('Please add a language pair first.');
    return;
  }

  const card = await apiPost('/card', { word, translation, example, pronunciation, imageUrl });
  userData.cards.push(card);
  activeCards = getActiveCards();

  document.getElementById('addCardForm').reset();
  clearCardImage();
  hapticNotify('success');
  showScreen('homeScreen');
}

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

// --- Review Flow ---
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

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

function formatInterval(days) {
  if (days < 1) return '<1d';
  if (days < 30) return days + 'd';
  if (days < 365) return Math.round(days / 30) + 'mo';
  return (days / 365).toFixed(1) + 'y';
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

// --- Settings ---
function initSettings() {
  // Populate hour/minute dropdowns
  const hourSel = document.getElementById('reminderHour');
  const minSel = document.getElementById('reminderMinute');
  for (let h = 0; h < 24; h++) {
    hourSel.innerHTML += `<option value="${h}">${String(h).padStart(2, '0')}</option>`;
  }
  for (let m = 0; m < 60; m += 5) {
    minSel.innerHTML += `<option value="${m}">${String(m).padStart(2, '0')}</option>`;
  }

  // Populate timezone dropdown with common timezones
  const tzSel = document.getElementById('timezoneSelect');
  const timezones = [
    'UTC', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow',
    'Europe/Istanbul', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Bangkok',
    'Asia/Shanghai', 'Asia/Tokyo', 'Australia/Sydney',
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'America/Sao_Paulo', 'Pacific/Auckland'
  ];
  // Auto-detect user timezone
  let detected = 'UTC';
  try { detected = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch {}

  timezones.forEach(tz => {
    tzSel.innerHTML += `<option value="${tz}">${tz}</option>`;
  });
  // Add detected if not in list
  if (!timezones.includes(detected)) {
    tzSel.innerHTML = `<option value="${detected}">${detected}</option>` + tzSel.innerHTML;
  }
}

function renderSettings() {
  if (!userData) return;
  const s = userData.settings;

  // Toggle
  const toggle = document.getElementById('toggleReminder');
  toggle.classList.toggle('on', s.dailyReminderEnabled);

  // Time
  document.getElementById('reminderHour').value = s.reminderHour;
  document.getElementById('reminderMinute').value = s.reminderMinute;

  // Timezone
  document.getElementById('timezoneSelect').value = s.timezone;

  // Language pairs list
  const listEl = document.getElementById('settingsLpList');
  if (userData.languagePairs.length === 0) {
    listEl.innerHTML = '<div style="color:var(--tg-theme-hint-color);font-size:14px;">No language pairs yet.</div>';
    return;
  }
  listEl.innerHTML = userData.languagePairs.map(lp => {
    const isActive = lp.id === userData.activeLanguagePairId;
    return `
      <div class="lp-list-item ${isActive ? 'active' : ''}" onclick="switchPair('${lp.id}')">
        <span class="lp-list-item-name">${escapeHtml(lp.source)} → ${escapeHtml(lp.target)}</span>
        ${isActive ? '<span class="lp-active-badge">Active</span>' : ''}
      </div>
    `;
  }).join('');
}

function toggleReminder() {
  if (!userData) return;
  userData.settings.dailyReminderEnabled = !userData.settings.dailyReminderEnabled;
  document.getElementById('toggleReminder').classList.toggle('on', userData.settings.dailyReminderEnabled);
  haptic('light');
}

async function saveSettings() {
  const settings = {
    dailyReminderEnabled: userData.settings.dailyReminderEnabled,
    reminderHour: parseInt(document.getElementById('reminderHour').value),
    reminderMinute: parseInt(document.getElementById('reminderMinute').value),
    timezone: document.getElementById('timezoneSelect').value
  };
  await apiPut('/settings', settings);
  userData.settings = settings;
  hapticNotify('success');
  showScreen('homeScreen');
}

// --- Add Language Pair ---
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

// --- Event Listeners ---
function setupEventListeners() {
  document.getElementById('addCardForm').addEventListener('submit', addCard);
  document.getElementById('addPairForm').addEventListener('submit', addLanguagePair);
  document.getElementById('csvFileInput').addEventListener('change', handleCSVFile);
  setupSwipeHandlers();

  // Close dropdown when tapping outside
  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('lpDropdown');
    const selector = document.getElementById('langSelector');
    if (!dropdown.contains(e.target) && !selector.contains(e.target)) {
      dropdown.classList.remove('open');
    }
  });

  // Close modal on overlay click
  document.getElementById('addPairModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeAddPairModal();
  });

  // Auto-detect timezone on first open
  if (userData && userData.settings.timezone === 'UTC') {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && tz !== 'UTC') {
        userData.settings.timezone = tz;
        apiPut('/settings', { timezone: tz });
      }
    } catch {}
  }
}

// --- Utility ---
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// --- Start ---
initApp();
