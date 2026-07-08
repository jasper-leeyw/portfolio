// Tiny response helpers that work on a raw Node ServerResponse — so the same
// handler runs under Vercel's Node runtime AND under our local dev server
// (server/dev.mjs) with no adapter.
export function json(res, code, body) {
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(body));
}

export function methodNotAllowed(res) {
  json(res, 405, { error: 'method not allowed' });
}
