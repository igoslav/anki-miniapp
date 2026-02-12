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
