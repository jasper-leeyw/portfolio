// Shared test setup: load the real index.html into a fresh jsdom document so the
// render functions resolve the same mount points the browser uses. Scripts are
// NOT executed (jsdom default), so main.js never runs — we test render.js in
// isolation. The render functions read the bare global `document` at call time,
// so resetting globals per test is enough; no re-import needed.
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');

export function setupDom() {
  const dom = new JSDOM(html, { url: 'http://localhost:8080/' });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.Event = dom.window.Event;
  globalThis.HTMLElement = dom.window.HTMLElement;
  return dom;
}
