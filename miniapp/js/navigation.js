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

function haptic(type) {
  try { tg.HapticFeedback.impactOccurred(type || 'light'); } catch {}
}

function hapticNotify(type) {
  try { tg.HapticFeedback.notificationOccurred(type || 'success'); } catch {}
}
