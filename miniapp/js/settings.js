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
