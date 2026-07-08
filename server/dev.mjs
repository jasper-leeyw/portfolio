// Local dev API server. Runs the Vercel-style handlers under a plain Node HTTP
// server (no Vercel CLI needed) so the frontend at localhost:8080 can fetch
// /api/practice/* during development. Production uses Vercel's own routing.
//
//   node server/dev.mjs        # serves the API on :8787 (override with PORT)
import http from 'node:http';
import dataHandler from '../api/practice/data.js';
import syncHandler from '../api/practice/sync.js';

const routes = {
  '/api/practice/data': dataHandler,
  '/api/practice/sync': syncHandler,
};

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }
  const { pathname } = new URL(req.url, 'http://localhost');
  const handler = routes[pathname];
  if (!handler) {
    res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    return res.end(JSON.stringify({ error: 'not found' }));
  }
  try {
    await handler(req, res);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ error: String(err && err.message || err) }));
  }
});

const PORT = process.env.PORT || 8787;
server.listen(PORT, () => console.log(`dev api listening on http://localhost:${PORT}`));
