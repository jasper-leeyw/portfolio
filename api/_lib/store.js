// Persistence for accumulated LeetCode solves. The driver is chosen by env:
//   • TURSO_DATABASE_URL set → Turso/libSQL (production, persists on Vercel)
//   • otherwise             → JSON file in .data/ (local dev, zero deps)
// Both expose the same three methods, so callers never care which is active.
//
// A "solve" is one distinct solved problem (unique by slug), so re-solving the
// same problem never adds a second leaf to the tree.
import { promises as fs } from 'node:fs';
import path from 'node:path';

let driverPromise;
function driver() {
  if (!driverPromise) {
    driverPromise = process.env.TURSO_DATABASE_URL ? tursoDriver() : jsonDriver();
  }
  return driverPromise;
}

export async function recordSolves(items) { return (await driver()).recordSolves(items); }
export async function getSolves() { return (await driver()).getSolves(); }
export async function getMeta() { return (await driver()).getMeta(); }

// ── JSON-file driver (local dev) ─────────────────────────────
async function jsonDriver() {
  const FILE = process.env.STORE_FILE || path.join(process.cwd(), '.data', 'store.json');
  const read = async () => {
    try { return JSON.parse(await fs.readFile(FILE, 'utf8')); }
    catch { return { problems: {}, applications: [], meta: {} }; }
  };
  const write = async (s) => {
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(s, null, 2));
  };
  return {
    async recordSolves(items) {
      const s = await read();
      let added = 0;
      for (const it of items) {
        const prev = s.problems[it.slug];
        if (!prev) { s.problems[it.slug] = it; added++; }
        else if (it.date < prev.date) prev.date = it.date; // earliest first-solve wins
      }
      s.meta.lastSync = new Date().toISOString();
      s.meta.count = Object.keys(s.problems).length;
      await write(s);
      return { added, total: s.meta.count };
    },
    async getSolves() { return Object.values((await read()).problems); },
    async getMeta() { return (await read()).meta || {}; },
  };
}

// ── Turso / libSQL driver (production) ───────────────────────
async function tursoDriver() {
  const { createClient } = await import('@libsql/client');
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  await client.execute(`CREATE TABLE IF NOT EXISTS problems (
    slug TEXT PRIMARY KEY, title TEXT, difficulty TEXT, topic TEXT, date TEXT, ts INTEGER
  )`);
  await client.execute('CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT)');

  const count = async () => Number((await client.execute('SELECT COUNT(*) AS c FROM problems')).rows[0].c);

  return {
    async recordSolves(items) {
      const before = await count();
      for (const it of items) {
        await client.execute({
          sql: `INSERT INTO problems (slug, title, difficulty, topic, date, ts)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(slug) DO UPDATE SET date = MIN(problems.date, excluded.date)`,
          args: [it.slug, it.title, it.difficulty, it.topic, it.date, it.ts ?? 0],
        });
      }
      const total = await count();
      await client.execute({
        sql: "INSERT INTO meta (key, value) VALUES ('lastSync', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        args: [new Date().toISOString()],
      });
      return { added: total - before, total };
    },
    async getSolves() {
      const r = await client.execute('SELECT slug, title, difficulty, topic, date, ts FROM problems');
      return r.rows.map(row => ({
        slug: row.slug, title: row.title, difficulty: row.difficulty,
        topic: row.topic, date: row.date, ts: Number(row.ts),
      }));
    },
    async getMeta() {
      const r = await client.execute('SELECT key, value FROM meta');
      const m = {};
      for (const row of r.rows) m[row.key] = row.value;
      return m;
    },
  };
}
