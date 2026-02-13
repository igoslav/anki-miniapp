// --- API Helpers ---
function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-Telegram-Init-Data': tg.initData || ''
  };
}

async function apiGet(path) {
  const res = await fetch(`/api/user/${userId}${path}`, {
    headers: getAuthHeaders()
  });
  if (res.status === 401) {
    tg.showAlert('Session expired. Please reopen the app.');
    return null;
  }
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(`/api/user/${userId}${path}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body)
  });
  if (res.status === 401) {
    tg.showAlert('Session expired. Please reopen the app.');
    return null;
  }
  return res.json();
}

async function apiPut(path, body) {
  const res = await fetch(`/api/user/${userId}${path}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(body)
  });
  if (res.status === 401) {
    tg.showAlert('Session expired. Please reopen the app.');
    return null;
  }
  return res.json();
}

async function apiDelete(path) {
  const res = await fetch(`/api/user/${userId}${path}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (res.status === 401) {
    tg.showAlert('Session expired. Please reopen the app.');
    return null;
  }
  return res.json();
}
