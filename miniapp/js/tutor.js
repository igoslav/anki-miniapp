// --- Tutor/Student UI ---

// Tutor state
let tutorStudents = [];
let tutorLessons = [];
let lessonFormCards = [];
let studentInvitations = [];
let studentLessons = [];

// === TUTOR FUNCTIONS ===

async function loadTutorDashboard() {
  const [studentsData, lessonsData] = await Promise.all([
    apiGet('/tutor/students'),
    apiGet('/tutor/lessons')
  ]);
  if (!studentsData || !lessonsData) return;

  tutorStudents = studentsData.students || [];
  tutorLessons = lessonsData.lessons || [];
  renderTutorStudents();
  renderTutorLessons();
}

function renderTutorStudents() {
  const container = document.getElementById('tutorStudentList');
  if (!container) return;

  if (tutorStudents.length === 0) {
    container.innerHTML = '<div style="color:var(--tg-theme-hint-color);font-size:14px;">No students yet. Generate an invite link below.</div>';
    return;
  }

  container.innerHTML = tutorStudents.map(s => {
    const name = s.profile ? (s.profile.firstName || s.profile.username || 'Unknown') : 'Pending...';
    const statusLabel = s.status === 'pending' ? 'Invite sent' : 'Active';
    return `
      <div class="student-item">
        <div class="student-info">
          <span class="student-name">${escapeHtml(name)}</span>
          <span class="student-status">${statusLabel}${s.status === 'pending' ? ' — code: ' + s.inviteCode : ''}</span>
        </div>
        ${s.status === 'active' ? `<button class="student-remove-btn" onclick="removeTutorStudent('${s.id}')">&times;</button>` : ''}
      </div>
    `;
  }).join('');
}

async function generateTutorInvite() {
  const data = await apiPost('/tutor/invite', {});
  if (!data || !data.inviteCode) return;

  const botUsername = tg.initDataUnsafe.user ? '' : '';
  const inviteBox = document.getElementById('tutorInviteResult');
  inviteBox.innerHTML = `
    <div class="invite-code">${data.inviteCode}</div>
    <div class="invite-link">Share this link with your student: t.me/${escapeHtml(getBotUsername())}?start=invite_${data.inviteCode}</div>
    <button class="btn btn-secondary btn-small" onclick="copyInviteLink('${data.inviteCode}')">Copy Link</button>
  `;
  inviteBox.classList.remove('hidden');

  await loadTutorDashboard();
  hapticNotify('success');
}

function getBotUsername() {
  // Try to get bot username from initData
  return tg.initDataUnsafe.user ? (tg.initDataUnsafe.user.username || 'YourBot') : 'YourBot';
}

function copyInviteLink(code) {
  const link = `https://t.me/${getBotUsername()}?start=invite_${code}`;
  navigator.clipboard.writeText(link).then(() => {
    tg.showAlert('Invite link copied!');
  }).catch(() => {
    tg.showAlert('Copy this link: ' + link);
  });
}

async function removeTutorStudent(linkId) {
  if (!confirm('Remove this student?')) return;
  const data = await apiDelete('/tutor/student/' + linkId);
  if (data && data.success) {
    await loadTutorDashboard();
    hapticNotify('success');
  }
}

// Lessons

function renderTutorLessons() {
  const container = document.getElementById('tutorLessonList');
  if (!container) return;

  if (tutorLessons.length === 0) {
    container.innerHTML = '<div style="color:var(--tg-theme-hint-color);font-size:14px;">No lessons yet.</div>';
    return;
  }

  container.innerHTML = tutorLessons.map(l => `
    <div class="lesson-item">
      <div class="lesson-title">${escapeHtml(l.title)}</div>
      <div class="lesson-meta">${l.cardCount} cards &middot; Sent to ${l.assignedCount} students</div>
      <div class="lesson-actions">
        <button class="btn btn-secondary btn-small" onclick="openSendLessonModal('${l.id}')">Send</button>
      </div>
    </div>
  `).join('');
}

function showCreateLessonForm() {
  lessonFormCards = [];
  document.getElementById('lessonFormTitle').value = '';
  document.getElementById('lessonFormDesc').value = '';
  document.getElementById('lessonFormCardsPreview').innerHTML = '';
  document.getElementById('createLessonSection').classList.remove('hidden');
}

function hideCreateLessonForm() {
  document.getElementById('createLessonSection').classList.add('hidden');
}

function addLessonCard() {
  const word = document.getElementById('lessonCardWord').value.trim();
  const translation = document.getElementById('lessonCardTranslation').value.trim();
  if (!word || !translation) return;

  const example = document.getElementById('lessonCardExample') ? document.getElementById('lessonCardExample').value.trim() : '';

  lessonFormCards.push({
    front: { word, imageUrl: '' },
    back: { translation, example, pronunciation: '' }
  });

  document.getElementById('lessonCardWord').value = '';
  document.getElementById('lessonCardTranslation').value = '';
  if (document.getElementById('lessonCardExample')) document.getElementById('lessonCardExample').value = '';

  renderLessonFormCards();
  haptic('light');
}

function renderLessonFormCards() {
  const container = document.getElementById('lessonFormCardsPreview');
  container.innerHTML = lessonFormCards.map((c, i) => `
    <div class="lesson-card-preview">
      <span>${escapeHtml(c.front.word)} → ${escapeHtml(c.back.translation)}</span>
      <button style="background:none;border:none;color:#e74c3c;cursor:pointer;" onclick="removeLessonFormCard(${i})">&times;</button>
    </div>
  `).join('');
}

function removeLessonFormCard(index) {
  lessonFormCards.splice(index, 1);
  renderLessonFormCards();
}

async function submitCreateLesson() {
  const title = document.getElementById('lessonFormTitle').value.trim();
  if (!title) { tg.showAlert('Please enter a lesson title.'); return; }
  if (lessonFormCards.length === 0) { tg.showAlert('Please add at least one card.'); return; }

  const data = await apiPost('/tutor/lesson', {
    title,
    description: document.getElementById('lessonFormDesc').value.trim(),
    cards: lessonFormCards
  });

  if (data && data.id) {
    hideCreateLessonForm();
    await loadTutorDashboard();
    hapticNotify('success');
  }
}

function openSendLessonModal(lessonId) {
  const activeStudents = tutorStudents.filter(s => s.status === 'active');
  if (activeStudents.length === 0) {
    tg.showAlert('No active students to send to.');
    return;
  }

  const modal = document.getElementById('sendLessonModal');
  modal.dataset.lessonId = lessonId;

  const list = document.getElementById('sendStudentList');
  list.innerHTML = activeStudents.map(s => {
    const name = s.profile ? (s.profile.firstName || s.profile.username || 'Student') : 'Student';
    return `
      <label class="send-student-row">
        <input type="checkbox" value="${s.studentId}">
        <span>${escapeHtml(name)}</span>
      </label>
    `;
  }).join('');

  modal.style.display = 'flex';
}

function closeSendLessonModal() {
  document.getElementById('sendLessonModal').style.display = 'none';
}

async function confirmSendLesson() {
  const modal = document.getElementById('sendLessonModal');
  const lessonId = modal.dataset.lessonId;
  const checkboxes = modal.querySelectorAll('input[type="checkbox"]:checked');
  const studentIds = Array.from(checkboxes).map(cb => cb.value);

  if (studentIds.length === 0) { tg.showAlert('Select at least one student.'); return; }

  const data = await apiPost('/tutor/lesson/' + lessonId + '/send', { studentIds });
  if (data && data.success) {
    closeSendLessonModal();
    tg.showAlert('Lesson sent!');
    hapticNotify('success');
  }
}

// === STUDENT FUNCTIONS ===

async function loadStudentInvitations() {
  const data = await apiGet('/student/invitations');
  if (!data) return;
  studentInvitations = data.invitations || [];
  renderInvitationBanner();
}

function renderInvitationBanner() {
  const banner = document.getElementById('invitationBanner');
  if (!banner) return;

  if (studentInvitations.length > 0) {
    banner.classList.remove('hidden');
    banner.querySelector('.invitation-banner-text').textContent =
      `You have ${studentInvitations.length} tutor invitation${studentInvitations.length > 1 ? 's' : ''}`;
  } else {
    banner.classList.add('hidden');
  }
}

async function loadStudentLessonsScreen() {
  const data = await apiGet('/student/lessons');
  if (!data) return;
  studentLessons = data.lessons || [];
  renderStudentLessons();
}

function renderStudentLessons() {
  const container = document.getElementById('studentLessonsList');
  if (!container) return;

  if (studentLessons.length === 0) {
    container.innerHTML = '<div style="color:var(--tg-theme-hint-color);text-align:center;padding:40px;">No lessons from tutors yet.</div>';
    return;
  }

  container.innerHTML = studentLessons.map(l => `
    <div class="student-lesson-item ${l.accepted ? 'accepted' : ''}">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
        <span class="lesson-title">${escapeHtml(l.title)}</span>
        <span class="lesson-badge ${l.accepted ? 'done' : 'new'}">${l.accepted ? 'Added' : 'New'}</span>
      </div>
      <div class="lesson-meta">${l.cardCount} cards</div>
      ${!l.accepted ? `<button class="btn btn-primary btn-small" style="margin-top:10px;" onclick="acceptStudentLesson('${l.id}')">Accept &amp; Add Cards</button>` : ''}
    </div>
  `).join('');
}

async function acceptStudentLesson(lessonId) {
  // Use current active language pair
  const lpId = userData ? userData.activeLanguagePairId : null;
  if (!lpId) {
    tg.showAlert('Please create a language pair first.');
    return;
  }

  const data = await apiPost('/student/lesson/' + lessonId + '/accept', { languagePairId: lpId });
  if (data && data.success) {
    tg.showAlert(`${data.cardsCreated} cards added to your deck!`);
    await loadStudentLessonsScreen();
    await loadUserData();
    hapticNotify('success');
  }
}

async function showStudentInvitations() {
  showScreen('studentLessonsScreen');
  // Render invitations at top
  const invContainer = document.getElementById('studentInvitationsList');
  if (!invContainer) return;

  if (studentInvitations.length === 0) {
    invContainer.innerHTML = '';
    return;
  }

  invContainer.innerHTML = '<div class="tutor-section-title">Tutor Invitations</div>' +
    studentInvitations.map(inv => {
      const name = inv.tutorProfile ? (inv.tutorProfile.firstName || inv.tutorProfile.username || 'A tutor') : 'A tutor';
      return `
        <div class="student-item" style="margin-bottom:8px;">
          <div class="student-info">
            <span class="student-name">${escapeHtml(name)}</span>
            <span class="student-status">Wants to be your tutor</span>
          </div>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-primary btn-small" onclick="respondInvitation('${inv.id}', true)">Accept</button>
            <button class="btn btn-secondary btn-small" onclick="respondInvitation('${inv.id}', false)">Decline</button>
          </div>
        </div>
      `;
    }).join('');
}

async function respondInvitation(linkId, accept) {
  const data = await apiPut('/student/invitation/' + linkId, { accept });
  if (data && data.success) {
    await loadStudentInvitations();
    await showStudentInvitations();
    hapticNotify('success');
  }
}
