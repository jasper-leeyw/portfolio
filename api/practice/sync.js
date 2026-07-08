// POST /api/practice/sync → pull the user's recent accepted solves from the
// LeetCode API and accumulate them into the store. Meant to be called on a
// schedule (GitHub Actions cron), NOT by page visitors — that's what keeps us
// from overflowing the upstream API. Optionally guarded by SYNC_SECRET.
import { fetchRecentSolves } from '../_lib/leetcode.js';
import { recordSolves } from '../_lib/store.js';
import { json, methodNotAllowed } from '../_lib/http.js';

export default async function handler(req, res) {
  if (req.method && req.method !== 'POST') return methodNotAllowed(res);

  const secret = process.env.SYNC_SECRET;
  if (secret) {
    const auth = req.headers?.authorization || '';
    if (auth !== `Bearer ${secret}`) return json(res, 401, { error: 'unauthorized' });
  }

  const user = process.env.LEET_USER || 'leegatus17';
  try {
    const items = await fetchRecentSolves(user);
    const result = await recordSolves(items);
    json(res, 200, { ok: true, user, fetched: items.length, ...result });
  } catch (err) {
    json(res, 502, { ok: false, error: String(err && err.message || err) });
  }
}
