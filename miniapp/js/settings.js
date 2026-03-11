// --- Settings ---
function initSettings() {
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

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function renderSettings() {
  if (!userData) return;
  const s = userData.settings;

  // Toggle
  const toggle = document.getElementById('toggleReminder');
  toggle.classList.toggle('on', s.dailyReminderEnabled);

  // Time input
  const timeInput = document.getElementById('reminderTime');
  const hh = String(s.reminderHour || 0).padStart(2, '0');
  const mm = String(s.reminderMinute || 0).padStart(2, '0');
  timeInput.value = `${hh}:${mm}`;

  // Timezone
  document.getElementById('timezoneSelect').value = s.timezone;

  // Language pairs list with per-pair reminder day pickers
  const listEl = document.getElementById('settingsLpList');
  if (userData.languagePairs.length === 0) {
    listEl.innerHTML = '<div style="color:var(--tg-theme-hint-color);font-size:14px;">No language pairs yet.</div>';
    return;
  }
  listEl.innerHTML = userData.languagePairs.map(lp => {
    const isActive = lp.id === userData.activeLanguagePairId;
    const enabled = lp.reminderEnabled !== false;
    const days = Array.isArray(lp.reminderDays) ? lp.reminderDays : [0,1,2,3,4,5,6];
    const dayBtns = DAY_LABELS.map((label, i) =>
      `<button type="button" class="day-btn ${days.includes(i) ? 'selected' : ''}"
        onclick="togglePairDay('${lp.id}', ${i}, this)">${label}</button>`
    ).join('');
    return `
      <div class="settings-lp-item ${isActive ? 'active' : ''}" onclick="settingsSwitchPair('${lp.id}')">
        <span class="lp-list-item-name">${escapeHtml(lp.source)} → ${escapeHtml(lp.target)}</span>
        ${isActive ? '<span class="lp-active-badge">Active</span>' : ''}
      </div>
      <div class="lp-reminder-section ${enabled ? '' : 'lp-reminder-disabled'}" id="lpReminder_${lp.id}">
        <div class="lp-reminder-header">
          <span class="lp-reminder-name">${escapeHtml(lp.source)} → ${escapeHtml(lp.target)}</span>
          <div class="lp-reminder-toggle-row">
            <span>Notify</span>
            <button class="toggle ${enabled ? 'on' : ''}" onclick="togglePairReminder('${lp.id}', this); event.stopPropagation();"></button>
          </div>
        </div>
        <div class="day-picker">${dayBtns}</div>
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

function togglePairReminder(pairId, btn) {
  const pair = userData.languagePairs.find(lp => lp.id === pairId);
  if (!pair) return;
  pair.reminderEnabled = pair.reminderEnabled === false; // toggle
  btn.classList.toggle('on', pair.reminderEnabled);
  const section = document.getElementById('lpReminder_' + pairId);
  if (section) section.classList.toggle('lp-reminder-disabled', !pair.reminderEnabled);
  haptic('light');
}

function togglePairDay(pairId, day, btn) {
  const pair = userData.languagePairs.find(lp => lp.id === pairId);
  if (!pair) return;
  if (!Array.isArray(pair.reminderDays)) pair.reminderDays = [0,1,2,3,4,5,6];
  const idx = pair.reminderDays.indexOf(day);
  if (idx === -1) {
    pair.reminderDays.push(day);
    btn.classList.add('selected');
  } else {
    pair.reminderDays.splice(idx, 1);
    btn.classList.remove('selected');
  }
  haptic('light');
}

async function settingsSwitchPair(pairId) {
  if (userData.activeLanguagePairId === pairId) return;
  await apiPut('/active-pair', { languagePairId: pairId });
  userData.activeLanguagePairId = pairId;
  activeCards = getActiveCards();
  updateLangSelector();
  updateHomeScreen();
  renderSettings();
  haptic('medium');
}

async function saveSettings() {
  const saveBtn = document.querySelector('#settingsScreen .btn-primary.mt-16');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
  }

  try {
    // Parse time from input
    const timeVal = document.getElementById('reminderTime').value;
    const [hours, minutes] = timeVal.split(':').map(Number);

    const settings = {
      dailyReminderEnabled: userData.settings.dailyReminderEnabled,
      reminderHour: hours,
      reminderMinute: minutes,
      timezone: document.getElementById('timezoneSelect').value
    };
    const savedSettings = await apiPut('/settings', settings);
    userData.settings = { ...userData.settings, ...savedSettings };

    // Save per-pair reminder settings
    await Promise.all(userData.languagePairs.map(lp =>
      apiPut(`/language-pair/${lp.id}/reminder`, {
        reminderEnabled: lp.reminderEnabled !== false,
        reminderDays: Array.isArray(lp.reminderDays) ? lp.reminderDays : [0,1,2,3,4,5,6]
      })
    ));

    hapticNotify('success');
    showScreen('homeScreen');
  } catch (err) {
    hapticNotify('error');
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Settings';
    }
  }
}
