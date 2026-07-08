// Data-integrity tests — no DOM needed. These catch the kind of regressions
// screenshots miss: a project missing a case-study field, a logo path that
// points at a file that doesn't exist, a contractor role losing its label, etc.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { DATA } from '../js/data.js';

test('hero has all required fields', () => {
  for (const key of ['name', 'title', 'positioning', 'intro', 'photo']) {
    assert.ok(DATA.hero[key], `hero.${key} is missing`);
  }
  assert.ok(Array.isArray(DATA.hero.ctas) && DATA.hero.ctas.length, 'hero.ctas');
  // The Résumé CTA opens the inline viewer (action), it is not an anchor.
  assert.ok(DATA.hero.ctas.some(c => c.action === 'resume'), 'a résumé CTA');
});

test('every experience entry is complete', () => {
  for (const e of DATA.experience) {
    assert.ok(e.company, 'company');
    assert.ok(e.role, 'role');
    assert.ok(e.period, 'period');
    assert.ok(e.logo, `logo missing for ${e.company}`);
    assert.match(e.year, /^\d{4}$/, `year for ${e.company}`);
    assert.ok(Array.isArray(e.highlights) && e.highlights.length, `highlights for ${e.company}`);
  }
});

test('Apple and Meta are labeled Contractor; Cisco and Zoom are not (integrity)', () => {
  const byCompany = Object.fromEntries(DATA.experience.map(e => [e.company, e]));
  assert.equal(byCompany['Apple'].type, 'Contractor');
  assert.equal(byCompany['Meta'].type, 'Contractor');
  assert.equal(byCompany['Cisco Systems'].type, '');
  assert.equal(byCompany['Zoom'].type, '');
});

test('experience is ordered oldest → newest (drives the ascending graph)', () => {
  const years = DATA.experience.map(e => Number(e.year));
  assert.deepEqual(years, [...years].sort((a, b) => a - b));
});

test('every project has a complete case study + logo', () => {
  for (const p of DATA.projects) {
    assert.ok(p.title, 'title');
    assert.ok(p.desc, 'desc');
    assert.ok(p.logo, `logo for ${p.title}`);
    assert.ok(Array.isArray(p.tags), `tags for ${p.title}`);
    for (const k of ['problem', 'approach', 'outcome']) {
      assert.ok(p.caseStudy?.[k], `caseStudy.${k} for ${p.title}`);
    }
  }
});

test('contractor case studies keep "Contractor" in their source label', () => {
  for (const p of DATA.projects) {
    if (/Meta|Apple/.test(p.source)) {
      assert.match(p.source, /Contractor/, `${p.title} source should mark Contractor`);
    }
  }
});

test('links: email + leetcode username present, all urls populated', () => {
  assert.match(DATA.links.email, /@/);
  assert.ok(DATA.links.leetcodeUser, 'leetcodeUser');
  for (const k of ['github', 'linkedin', 'leetcode', 'resume']) {
    assert.ok(DATA.links[k], `links.${k}`);
  }
});

test('all referenced logo paths look right AND exist on disk', () => {
  const paths = new Set([
    ...DATA.experience.map(e => e.logo),
    ...DATA.projects.map(p => p.logo),
  ]);
  for (const rel of paths) {
    assert.match(rel, /^assets\/logos\/.+\.svg$/, `${rel} shape`);
    assert.ok(existsSync(new URL('../' + rel, import.meta.url)), `${rel} missing on disk`);
  }
});

test('the résumé file referenced by links exists on disk', () => {
  assert.ok(existsSync(new URL('../' + DATA.links.resume, import.meta.url)), 'resume.pdf missing');
});
