import { DATA } from './data.js?v=3';
import {
  renderHero,
  renderHeroTree,
  renderLeetCode,
  renderExperience,
  renderCareerGraph,
  renderWork,
  renderResume,
  renderFooter,
} from './render.js?v=14';
import { practiceData } from './sample-data.js?v=1';
import { fetchDashboard } from './api.js?v=1';

// ── Render all sections ──────────────────────────────────────
renderHero(DATA.hero, DATA.currently, DATA.links);
renderHeroTree(practiceData().treeInput); // sample first — page always works
fetchDashboard().then(d => renderHeroTree(d.treeInput)).catch(() => {}); // upgrade to real data if the backend has it
renderLeetCode(DATA.links);       // hero heatmap — Turso-backed, reads /api/practice/data
renderCareerGraph(DATA.experience); // now lives in the Experience column
renderExperience(DATA.experience);
renderWork(DATA.projects);
renderResume(DATA.links);
renderFooter(DATA.links);

// ── Theme toggle (sun/moon badge on the avatar) ──────────────
const themeBtn = document.getElementById('theme-toggle');
if (themeBtn) {
  const setLabel = t => themeBtn.setAttribute('aria-label',
    t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  setLabel(document.documentElement.dataset.theme);
  themeBtn.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch { /* private mode */ }
    setLabel(next);
  });
}

// ── Scroll reveal ────────────────────────────────────────────
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
} else {
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
}
