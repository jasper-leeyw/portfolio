// Render-layer tests — exercise the real render.js functions against the real
// index.html mount points (via jsdom). These replace most of the manual
// screenshot checks: wiring, conditional rendering, fallbacks, and escaping.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { setupDom } from './helpers.js';
import { DATA } from '../../js/data.js';
import {
  renderHero,
  renderCurrently,
  renderLeetCode,
  renderExperience,
  renderCareerGraph,
  renderWork,
  renderAbout,
  renderResume,
  renderFooter,
  renderModal,
} from '../../js/render.js';

beforeEach(() => setupDom());

test('renderHero fills name/title/intro and accents the positioning with a cursor', () => {
  renderHero(DATA.hero, DATA.links);
  assert.equal(document.getElementById('hero-name').textContent, DATA.hero.name);
  assert.equal(document.getElementById('hero-title').textContent, DATA.hero.title);
  assert.equal(document.getElementById('hero-intro').textContent, DATA.hero.intro);
  const pos = document.getElementById('hero-positioning');
  assert.ok(pos.querySelector('.accent'), 'positioning should have an accent span');
  assert.ok(pos.querySelector('.cursor'), 'positioning should end with a cursor');
});

test('renderHero résumé CTA is a resume trigger pointing at the PDF', () => {
  renderHero(DATA.hero, DATA.links);
  const trigger = document.querySelector('#hero-actions [data-open-resume]');
  assert.ok(trigger, 'résumé CTA should carry data-open-resume');
  assert.equal(trigger.getAttribute('href'), DATA.links.resume);
});

test('renderHero renders one social icon per non-empty link, in order', () => {
  renderHero(DATA.hero, DATA.links);
  const links = document.querySelectorAll('#hero-links .icon-link');
  assert.equal(links.length, 4);
  assert.deepEqual(
    [...links].map(a => a.getAttribute('aria-label')),
    ['GitHub', 'LinkedIn', 'LeetCode', 'Email'],
  );
  // external links open in a new tab; mailto does not
  const email = [...links].find(a => a.getAttribute('aria-label') === 'Email');
  assert.equal(email.getAttribute('target'), null);
  assert.match(email.getAttribute('href'), /^mailto:/);
});

test('renderHero hides links that are empty', () => {
  renderHero(DATA.hero, { ...DATA.links, linkedin: '', leetcode: '' });
  assert.equal(document.querySelectorAll('#hero-links .icon-link').length, 2);
});

test('renderExperience: a row per job, a logo each, contractor tag only for contractors', () => {
  renderExperience(DATA.experience);
  assert.equal(document.querySelectorAll('#exp-list .exp__item').length, DATA.experience.length);
  assert.equal(document.querySelectorAll('.exp__logo').length, DATA.experience.length);
  assert.equal(
    document.querySelectorAll('.exp__type').length,
    DATA.experience.filter(e => e.type === 'Contractor').length,
  );
});

test('renderCareerGraph: a logo per company + a trailing "Now" node, contract labels kept', () => {
  renderCareerGraph(DATA.experience);
  const svg = document.querySelector('#hero-graph svg');
  assert.ok(svg, 'graph svg should render');
  assert.equal(svg.querySelectorAll('image').length, DATA.experience.length);
  assert.match(svg.textContent, /Now/);
  const contractors = DATA.experience.filter(e => e.type === 'Contractor').length;
  assert.equal((svg.textContent.match(/contract/g) || []).length, contractors);
});

test('renderWork: a card per project; the card click fires the callback with its index', () => {
  let clicked = -1;
  renderWork(DATA.projects, i => { clicked = i; });
  const cards = document.querySelectorAll('#work-grid .card');
  assert.equal(cards.length, DATA.projects.length);
  cards[1].click();
  assert.equal(clicked, 1);
});

test('renderWork: work cards without a repo show no GitHub link', () => {
  renderWork(DATA.projects, () => {});
  assert.equal(
    document.querySelectorAll('.card__github').length,
    DATA.projects.filter(p => p.github).length,
  );
});

test('renderWork: a failed thumbnail falls back to the company logo', () => {
  renderWork(DATA.projects, () => {});
  const img = document.querySelector('.card__thumb');
  img.dispatchEvent(new window.Event('error'));
  const placeholder = document.querySelector('.card__thumb--placeholder');
  assert.ok(placeholder, 'placeholder should replace the broken image');
  assert.ok(placeholder.querySelector('img.card__thumb-logo'), 'logo should be used');
});

test('renderModal: shows source + problem/approach/outcome, hides links for work case studies', () => {
  renderModal(DATA.projects[0]);
  const content = document.getElementById('modal-content');
  assert.ok(content.querySelector('.modal__source'));
  for (const label of ['Problem', 'Approach', 'Outcome']) {
    assert.match(content.textContent, new RegExp(label));
  }
  assert.equal(content.querySelector('.modal__links'), null, 'no links when no github/liveDemo');
});

test('renderModal: shows a GitHub link when the project has a repo', () => {
  renderModal({ ...DATA.projects[0], github: 'https://github.com/x/y' });
  assert.ok(document.querySelector('#modal-content .modal__links a[href="https://github.com/x/y"]'));
});

test('renderLeetCode: sets the LeetCard src + profile link from the username', () => {
  renderLeetCode(DATA.links);
  assert.equal(document.getElementById('leetcode').hidden, false);
  assert.match(document.getElementById('leetcode-card').getAttribute('src'),
    new RegExp(DATA.links.leetcodeUser));
  assert.equal(document.getElementById('leetcode-link').getAttribute('href'), DATA.links.leetcode);
});

test('renderLeetCode: hides the board when there is no username', () => {
  renderLeetCode({ ...DATA.links, leetcodeUser: '' });
  assert.equal(document.getElementById('leetcode').hidden, true);
});

test('renderResume: wires the download link and opens the modal from a trigger', () => {
  renderResume(DATA.links);
  const dl = document.getElementById('resume-download');
  assert.equal(dl.getAttribute('href'), DATA.links.resume);
  assert.equal(dl.getAttribute('download'), 'resume.pdf');

  // stub showModal (jsdom doesn't implement it) and confirm a trigger calls it
  const modal = document.getElementById('resume-modal');
  let opened = 0;
  modal.showModal = () => { opened++; };
  document.querySelector('.nav__links [data-open-resume]').click();
  assert.equal(opened, 1);
});

test('renderFooter renders the same social icon row', () => {
  renderFooter(DATA.links);
  assert.equal(document.querySelectorAll('#footer-links .icon-link').length, 4);
});

test('renderAbout renders one paragraph per entry', () => {
  renderAbout(DATA.about);
  assert.equal(document.querySelectorAll('#about-body p').length, DATA.about.length);
});

test('content is HTML-escaped (no injection via data)', () => {
  renderCurrently(['<script>alert(1)</script>']);
  const html = document.getElementById('currently-chips').innerHTML;
  assert.ok(!html.includes('<script>alert'), 'raw script tag must not appear');
  assert.match(html, /&lt;script&gt;/);
});
