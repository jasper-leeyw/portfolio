// Fetch recent accepted solves from the (unofficial) alfa-leetcode-api and
// normalize them for the store. LeetCode only exposes the ~most-recent accepted
// submissions, which is exactly why the backend accumulates over time instead of
// asking the frontend to fetch on every page view.
import { mapTags } from './topics.js';

const API = process.env.LEET_API || 'https://alfa-leetcode-api.onrender.com';

const RETRYABLE = new Set([429, 500, 502, 503, 504]); // rate limit + transient server errors
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Fetch + parse JSON, retrying transient failures (rate limits, 5xx, timeouts,
// network blips) with a linear backoff — the free upstream API is flaky. A
// permanent HTTP error (e.g. 404) throws immediately. After exhausting retries
// on a transient error, throws an Error flagged `.upstream = true`, so the sync
// runner can skip the cycle instead of failing the whole job.
async function getJson(url, { timeoutMs = 12000, retries = 3, backoffMs = 1500 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) await sleep(backoffMs * attempt); // 1.5s, 3s, 4.5s
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (res.ok) return await res.json();
      if (!RETRYABLE.has(res.status)) {              // permanent — don't retry
        const e = new Error(`${url} → ${res.status}`);
        e.permanent = true;
        throw e;
      }
      lastErr = new Error(`${url} → ${res.status}`); // transient — remember, retry
    } catch (err) {
      if (err.permanent) throw err;
      lastErr = err;                                  // network/timeout — retry
    } finally {
      clearTimeout(timer);
    }
  }
  const e = new Error(`${url} failed after ${retries + 1} attempts — ${lastErr && lastErr.message || lastErr}`);
  e.upstream = true;
  throw e;
}

// Returns [{ slug, title, difficulty, topic, date, ts }], de-duped by slug.
export async function fetchRecentSolves(user, limit = 20) {
  const acJson = await getJson(`${API}/${encodeURIComponent(user)}/acSubmission?limit=${limit}`);
  const subs = acJson.submission || acJson.submissions || [];

  const bySlug = new Map();
  for (const s of subs) {
    const slug = s.titleSlug || s.slug;
    if (slug && !bySlug.has(slug)) bySlug.set(slug, s);
  }

  const out = [];
  for (const [slug, s] of bySlug) {
    let difficulty = 'Unknown', topic = 'Arrays & Hashing';
    try {
      const sel = await getJson(`${API}/select?titleSlug=${encodeURIComponent(slug)}`, { retries: 0 });
      if (sel && sel.difficulty) difficulty = sel.difficulty;
      topic = mapTags(sel && sel.topicTags);
    } catch { /* keep defaults if /select is unavailable */ }
    const ts = Number(s.timestamp) || 0;
    out.push({
      slug,
      title: s.title || slug,
      difficulty,
      topic,
      ts,
      date: new Date(ts * 1000).toISOString().slice(0, 10),
    });
  }
  return out;
}
