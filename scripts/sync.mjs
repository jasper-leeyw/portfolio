// Standalone sync runner for the scheduled job. Runs in GitHub Actions (not on
// Vercel), so the slow/cold-startable LeetCode fetches have no function timeout.
// Writes straight into the store (Turso in CI via env; JSON file locally).
//
//   node scripts/sync.mjs   # needs LEET_USER + TURSO_* in the environment
import { fetchRecentSolves } from '../api/_lib/leetcode.js';
import { recordSolves } from '../api/_lib/store.js';

const user = process.env.LEET_USER || 'leegatus17';

try {
  const items = await fetchRecentSolves(user);
  const res = await recordSolves(items);
  console.log(`synced ${user}: fetched ${items.length}, added ${res.added}, total ${res.total}`);
} catch (err) {
  console.error('sync failed:', err && err.message || err);
  process.exit(1);
}
