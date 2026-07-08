// Practice-data fetch. In production the API is same-origin (/api/*); in local
// dev the static site runs on :8080 (serve.py) while the API runs on :8787
// (server/dev.mjs), so we point there. Callers fall back to sample data when the
// backend is unavailable or has no solves yet.
const API_BASE = (location.hostname === 'localhost' && location.port === '8080')
  ? 'http://localhost:8787'
  : '';

export async function fetchDashboard() {
  const res = await fetch(`${API_BASE}/api/practice/data`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`status ${res.status}`);
  const d = await res.json();
  if (!d || !d.treeInput || !Array.isArray(d.treeInput.topics) || !d.totalSolved) {
    throw new Error('empty dashboard');
  }
  return d;
}
