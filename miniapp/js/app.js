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

tg.BackButton.onClick(() => showScreen('homeScreen'));

// --- Start ---
initApp();
