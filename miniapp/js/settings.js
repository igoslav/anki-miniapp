// --- Settings ---
var DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function initSettings() {
  // Populate hour/minute dropdowns
  var hourSel = document.getElementById('reminderHour');
  var minSel = document.getElementById('reminderMinute');
  for (var h = 0; h < 24; h++) {
    hourSel.innerHTML += '<option value="' + h + '">' + String(h).padStart(2, '0') + '</option>';
  }
  for (var m = 0; m < 60; m += 5) {
    minSel.innerHTML += '<option value="' + m + '">' + String(m).padStart(2, '0') + '</option>';
  }

  // Populate timezone dropdown with common timezones
  var tzSel = document.getElementById('timezoneSelect');
  var timezones = [
    'UTC', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow',
    'Europe/Istanbul', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Bangkok',
    'Asia/Shanghai', 'Asia/Tokyo', 'Australia/Sydney',
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'America/Sao_Paulo', 'Pacific/Auckland'
  ];
  // Auto-detect user timezone
  var detected = 'UTC';
  try { detected = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) {}

  timezones.forEach(function(tz) {
    tzSel.innerHTML += '<option value="' + tz + '">' + tz + '</option>';
  });
  // Add detected if not in list
  if (timezones.indexOf(detected) === -1) {
    tzSel.innerHTML = '<option value="' + detected + '">' + detected + '</option>' + tzSel.innerHTML;
  }
}

function renderSettings() {
  if (!userData) return;
  var s = userData.settings;

  // Global toggle
  var toggle = document.getElementById('toggleReminder');
  toggle.classList.toggle('on', s.dailyReminderEnabled);

  // Time
  document.getElementById('reminderHour').value = s.reminderHour;
  document.getElementById('reminderMinute').value = s.reminderMinute;

  // Timezone
  document.getElementById('timezoneSelect').value = s.timezone;

  // Notification schedule section visibility
  var scheduleSection = document.getElementById('scheduleSection');
  scheduleSection.classList.toggle('settings-section-disabled', !s.dailyReminderEnabled);

  renderPairSchedules();
  renderLanguagePairList();
}

function renderPairSchedules() {
  var container = document.getElementById('pairScheduleList');
  if (!userData || userData.languagePairs.length === 0) {
    container.innerHTML = '<div class="settings-hint">Add a language pair first.</div>';
    return;
  }

  container.innerHTML = userData.languagePairs.map(function(lp) {
    var enabled = lp.reminderEnabled !== false;
    var days = Array.isArray(lp.reminderDays) ? lp.reminderDays : [0, 1, 2, 3, 4, 5, 6];
    var dayBtns = DAY_LABELS.map(function(label, i) {
      return '<button type="button" class="day-btn ' + (days.indexOf(i) !== -1 ? 'selected' : '') + '"'
        + ' onclick="togglePairDay(\'' + lp.id + '\', ' + i + ', this)">' + label + '</button>';
    }).join('');

    return '<div class="pair-schedule' + (enabled ? '' : ' pair-schedule-disabled') + '" id="pairSchedule_' + lp.id + '">'
      + '<div class="pair-schedule-header">'
      + '<span class="pair-schedule-name">' + escapeHtml(lp.source) + ' \u2192 ' + escapeHtml(lp.target) + '</span>'
      + '<button class="toggle' + (enabled ? ' on' : '') + '" onclick="togglePairReminder(\'' + lp.id + '\', this)"></button>'
      + '</div>'
      + '<div class="day-picker">' + dayBtns + '</div>'
      + '</div>';
  }).join('');
}

function renderLanguagePairList() {
  var listEl = document.getElementById('settingsLpList');
  if (!userData || userData.languagePairs.length === 0) {
    listEl.innerHTML = '<div class="settings-hint">No language pairs yet.</div>';
    return;
  }
  listEl.innerHTML = userData.languagePairs.map(function(lp) {
    var isActive = lp.id === userData.activeLanguagePairId;
    return '<div class="lp-list-item' + (isActive ? ' active' : '') + '" onclick="switchPair(\'' + lp.id + '\')">'
      + '<span class="lp-list-item-name">' + escapeHtml(lp.source) + ' \u2192 ' + escapeHtml(lp.target) + '</span>'
      + (isActive ? '<span class="lp-active-badge">Active</span>' : '')
      + '</div>';
  }).join('');
}

function toggleReminder() {
  if (!userData) return;
  userData.settings.dailyReminderEnabled = !userData.settings.dailyReminderEnabled;
  document.getElementById('toggleReminder').classList.toggle('on', userData.settings.dailyReminderEnabled);
  document.getElementById('scheduleSection').classList.toggle('settings-section-disabled', !userData.settings.dailyReminderEnabled);
  haptic('light');
}

function togglePairReminder(pairId, btn) {
  var pair = userData.languagePairs.find(function(lp) { return lp.id === pairId; });
  if (!pair) return;
  var wasEnabled = pair.reminderEnabled !== false;
  pair.reminderEnabled = !wasEnabled;
  btn.classList.toggle('on', pair.reminderEnabled);
  var section = document.getElementById('pairSchedule_' + pairId);
  if (section) section.classList.toggle('pair-schedule-disabled', !pair.reminderEnabled);
  haptic('light');
}

function togglePairDay(pairId, day, btn) {
  var pair = userData.languagePairs.find(function(lp) { return lp.id === pairId; });
  if (!pair) return;
  if (!Array.isArray(pair.reminderDays)) pair.reminderDays = [0, 1, 2, 3, 4, 5, 6];
  var idx = pair.reminderDays.indexOf(day);
  if (idx === -1) {
    pair.reminderDays.push(day);
    btn.classList.add('selected');
  } else {
    pair.reminderDays.splice(idx, 1);
    btn.classList.remove('selected');
  }
  haptic('light');
}

async function saveSettings() {
  var settings = {
    dailyReminderEnabled: userData.settings.dailyReminderEnabled,
    reminderHour: parseInt(document.getElementById('reminderHour').value),
    reminderMinute: parseInt(document.getElementById('reminderMinute').value),
    timezone: document.getElementById('timezoneSelect').value
  };
  await apiPut('/settings', settings);
  userData.settings = settings;

  // Save per-pair reminder settings
  await Promise.all(userData.languagePairs.map(function(lp) {
    return apiPut('/language-pair/' + lp.id + '/reminder', {
      reminderEnabled: lp.reminderEnabled !== false,
      reminderDays: Array.isArray(lp.reminderDays) ? lp.reminderDays : [0, 1, 2, 3, 4, 5, 6]
    });
  }));

  hapticNotify('success');
  showScreen('homeScreen');
}
