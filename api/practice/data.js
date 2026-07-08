// GET /api/practice/data → the full dashboard (tree input + per-topic + daily),
// built from accumulated solves. Read-only and cached, so every visitor hits
// this instead of the LeetCode API.
import { getSolves, getMeta } from '../_lib/store.js';
import { buildDashboard } from '../_lib/dashboard.js';
import { json, methodNotAllowed } from '../_lib/http.js';

export default async function handler(req, res) {
  if (req.method && req.method !== 'GET') return methodNotAllowed(res);
  const solves = await getSolves();
  const meta = await getMeta();
  const dash = buildDashboard(solves);
  json(res, 200, { ...dash, lastSync: meta.lastSync || null });
}
