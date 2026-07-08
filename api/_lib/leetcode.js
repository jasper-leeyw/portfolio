// Fetch recent accepted solves from the (unofficial) alfa-leetcode-api and
// normalize them for the store. LeetCode only exposes the ~most-recent accepted
// submissions, which is exactly why the backend accumulates over time instead of
// asking the frontend to fetch on every page view.
import { mapTags } from './topics.js';

const API = process.env.LEET_API || 'https://alfa-leetcode-api.onrender.com';

async function getJson(url, timeoutMs = 12000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`${url} → ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
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
      const sel = await getJson(`${API}/select?titleSlug=${encodeURIComponent(slug)}`);
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
