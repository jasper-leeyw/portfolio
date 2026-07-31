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
  // Transient upstream (LeetCode API) failures — rate limits, cold starts,
  // timeouts — are out of our control and self-heal on the next run. Skip the
  // cycle (the store keeps its last-good data) rather than failing the job, so a
  // flaky free API doesn't spam red X's / failure emails. Genuine errors (e.g.
  // bad Turso credentials) still exit non-zero and surface loudly.
  if (err && err.upstream) {
    console.warn(`sync skipped — upstream API unavailable after retries: ${err.message}`);
    process.exit(0);
  }
  console.error('sync failed:', err && err.message || err);
  process.exit(1);
}
