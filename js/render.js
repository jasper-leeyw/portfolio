import { fetchDashboard } from './api.js?v=1';

const GITHUB_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z"/>
</svg>`;

// Escape user/content strings before injecting into innerHTML.
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function renderHero(data, currently, links) {
  const photo = document.getElementById('hero-photo');
  if (photo) {
    photo.hidden = !data.photo;
    if (data.photo) {
      photo.src = data.photo;
      photo.alt = data.photoAlt || '';
    }
  }

  const name = document.getElementById('hero-name');
  const title = document.getElementById('hero-title');
  const positioning = document.getElementById('hero-positioning');
  const intro = document.getElementById('hero-intro');
  if (name) name.textContent = data.name;
  if (title) title.textContent = data.title;

  const statusEl = document.getElementById('hero-status');
  if (statusEl && currently?.length) {
    statusEl.innerHTML = currently
      .map(item => `<span class="hero__status-item">${esc(item)}</span>`)
      .join('<span class="hero__status-sep" aria-hidden="true">•</span>');
  }

  if (positioning) {
    let html = esc(data.positioning);
    if (data.accent) {
      html = html.replace(esc(data.accent), `<span class="accent">${esc(data.accent)}</span>`);
    }
    positioning.innerHTML = html + '<span class="cursor" aria-hidden="true"></span>';
  }

  if (intro) intro.textContent = data.intro;

  const actions = document.getElementById('hero-actions');
  if (actions) {
    actions.innerHTML = (data.ctas || []).map(c => {
      const cls = `btn ${c.primary ? 'btn--primary' : ''}`;
      if (c.action === 'resume') {
        return `<a class="${cls}" href="${esc((links && links.resume) || 'assets/resume.pdf')}" data-open-resume>${esc(c.label)}</a>`;
      }
      return `<a class="${cls}" href="${esc(c.href)}">${esc(c.label)}</a>`;
    }).join('');
  }

  const linksEl = document.getElementById('hero-links');
  if (linksEl) renderLinkList(linksEl, links || {});
}

// Social icon files (monochrome SVGs, tinted to currentColor via CSS mask).
const ICON_FILES = {
  github:   'assets/logos/github.svg',
  linkedin: 'assets/logos/linkedin.svg',
  leetcode: 'assets/logos/leetcode.svg',
  email:    'assets/logos/mail.svg',
};

// Shared social-icon row (hero + footer). Empty values are hidden.
function renderLinkList(el, links) {
  const items = [
    links.github   && { key: 'github',   label: 'GitHub',   href: links.github },
    links.linkedin && { key: 'linkedin', label: 'LinkedIn', href: links.linkedin },
    links.leetcode && { key: 'leetcode', label: 'LeetCode', href: links.leetcode },
    links.email    && { key: 'email',    label: 'Email',    href: `mailto:${links.email}` },
  ].filter(Boolean);
  el.innerHTML = items.map(item => {
    const ext = !item.href.startsWith('mailto');
    const icon = ICON_FILES[item.key];
    return `<li><a class="icon-link" href="${esc(item.href)}" aria-label="${esc(item.label)}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ''}>` +
      `<span class="icon" style="-webkit-mask-image:url('${icon}');mask-image:url('${icon}')"></span></a></li>`;
  }).join('');
}

// LeetCode board — a custom heatmap of the trailing 45 days (rolling window
// ending today), drawn from the SAME cached data the tracker uses:
// GET /api/practice/data, which reads accumulated solves out of Turso. The
// browser never touches the external LeetCode API — only the scheduled sync job
// does — so this board stays up even when that API is down. Falls back to a
// profile link if our own endpoint is unreachable; hidden with no username.
const HEATMAP_DAYS = 45;           // rolling window length (days)
const MS_DAY = 86400000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function renderLeetCode(links) {
  const section = document.getElementById('leetcode');
  if (!section) return;
  const user = links.leetcodeUser;
  if (!user) { section.hidden = true; return; }
  section.hidden = false;

  const profile = links.leetcode || `https://leetcode.com/u/${user}/`;
  const link = document.getElementById('leetcode-link');
  if (link) { link.href = profile; link.textContent = `@${user} ↗`; }

  const statsEl = document.getElementById('leetcode-stats');
  const heatEl = document.getElementById('leetcode-heatmap');
  const capEl = document.getElementById('leetcode-caption');
  if (capEl) capEl.textContent = 'Loading…';

  fetchDashboard()
    .then(dash => {
      const map = solvesByDay(dash.dailyTimeline);
      const cols = buildHeatmapGrid();
      let windowTotal = 0, activeDays = 0;
      for (const col of cols) {
        for (const cell of col) {
          if (cell.future || cell.before) continue;
          const c = map.get(cell.key) || 0;
          if (c > 0) { windowTotal += c; activeDays++; }
        }
      }
      const streak = dash.treeInput && dash.treeInput.stats ? dash.treeInput.stats.streak : 0;
      renderLeetStats(statsEl, { solved: dash.totalSolved, streak, activeDays });
      renderLeetHeatmap(heatEl, cols, map);
      if (capEl) {
        capEl.textContent = `Last 45 days · ${windowTotal} solved`;
      }
    })
    .catch(() => showLeetFallback(section, profile));
}

// Reduce the dashboard's dailyTimeline to a day→count map (problems solved per
// UTC day), matching the key space buildHeatmapGrid() produces below.
function solvesByDay(dailyTimeline) {
  const map = new Map();
  for (const day of dailyTimeline || []) {
    if (day && day.date) map.set(day.date, day.items ? day.items.length : 0);
  }
  return map;
}

// Week-columns (Sun→Sat rows) spanning the trailing HEATMAP_DAYS window ending
// today. Worked in UTC so day keys match the stored solve dates. The grid snaps
// to whole weeks, but cells past today (`future`) or before the window start
// (`before`) render blank — so exactly the last N days show, with partial
// columns at each edge.
function buildHeatmapGrid() {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const todayT = today.getTime();
  const windowStart = todayT - (HEATMAP_DAYS - 1) * MS_DAY;       // first day in the window
  const gridStart = windowStart - new Date(windowStart).getUTCDay() * MS_DAY; // back to that week's Sunday
  const weeks = Math.floor((todayT - gridStart) / (7 * MS_DAY)) + 1;

  const cols = [];
  for (let c = 0; c < weeks; c++) {
    const col = [];
    for (let r = 0; r < 7; r++) {
      const t = gridStart + (c * 7 + r) * MS_DAY;
      const d = new Date(t);
      col.push({
        date: d,
        key: d.toISOString().slice(0, 10),
        future: t > todayT,
        before: t < windowStart,
      });
    }
    cols.push(col);
  }
  return cols;
}

// Solves-per-day are small numbers, so ramp one problem at a time up to 4+.
function leetLevel(c) {
  return c === 0 ? 0 : c === 1 ? 1 : c === 2 ? 2 : c === 3 ? 3 : 4;
}

function renderLeetStats(el, { solved, streak, activeDays }) {
  if (!el) return;
  const stats = [];
  if (solved != null) stats.push([solved, 'solved']);
  stats.push(streak > 0 ? [streak, 'day streak'] : [activeDays, 'active days']);
  el.innerHTML = stats.map(([num, label]) =>
    `<div class="leetcode__stat"><span class="leetcode__stat-num">${num}</span>` +
    `<span class="leetcode__stat-label">${label}</span></div>`
  ).join('');
}

function renderLeetHeatmap(el, cols, map) {
  if (!el) return;
  const CELL = 13, GAP = 3, STEP = CELL + GAP, TOP = 18;
  const W = cols.length * STEP - GAP;
  const H = TOP + 7 * STEP - GAP;

  // Collect a month label at each month change, but drop labels that would
  // collide — when a new month starts within ~2 columns of the previous label
  // (e.g. a 2-column March stub before April), keep the later, dominant month.
  const MIN_GAP = STEP * 2.5;
  const monthMarks = [];
  let lastMonth = -1;
  cols.forEach((col, ci) => {
    const m = col[0].date.getUTCMonth();
    if (m === lastMonth) return;
    lastMonth = m;
    const x = ci * STEP;
    const prev = monthMarks[monthMarks.length - 1];
    if (prev && x - prev.x < MIN_GAP) prev.x = x, prev.m = m;
    else monthMarks.push({ x, m });
  });
  const labels = monthMarks
    .map(({ x, m }) => `<text x="${x}" y="11" class="lc-month">${MONTHS[m]}</text>`)
    .join('');

  let cells = '';
  cols.forEach((col, ci) => {
    const x = ci * STEP;
    col.forEach((cell, ri) => {
      if (cell.future || cell.before) return;
      const c = map.get(cell.key) || 0;
      const y = TOP + ri * STEP;
      cells += `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2.5" ` +
        `class="lc lc-${leetLevel(c)}"><title>${cell.key}: ${c} solved</title></rect>`;
    });
  });

  el.innerHTML =
    `<svg viewBox="0 0 ${W} ${H}" class="lc-grid" role="img" aria-label="LeetCode problems solved over the last 45 days">` +
    `${labels}${cells}</svg>`;
}

function showLeetFallback(section, profile) {
  const statsEl = section.querySelector('#leetcode-stats');
  const capEl = section.querySelector('#leetcode-caption');
  const heatEl = section.querySelector('#leetcode-heatmap');
  if (statsEl) statsEl.innerHTML = '';
  if (capEl) capEl.textContent = 'Live data unavailable — try reloading';
  if (heatEl) {
    heatEl.innerHTML =
      `<a class="leetcode__fallback" href="${esc(profile)}" target="_blank" rel="noopener noreferrer">View on LeetCode ↗</a>`;
  }
}

export function renderExperience(experience) {
  const el = document.getElementById('exp-list');
  if (!el) return;

  const jobs = [...experience].reverse(); // most recent first

  el.innerHTML = jobs.map(job => `
    <li class="exp__item">
      <div class="exp__compact">
        <div class="exp__heading">
          ${job.logo ? `<span class="exp__logo" style="-webkit-mask-image:url('${esc(job.logo)}');mask-image:url('${esc(job.logo)}')" aria-hidden="true"></span>` : ''}
          <span class="exp__company">${esc(job.company)}</span>
          ${job.type ? `<span class="exp__type">${esc(job.type)}</span>` : ''}
        </div>
        <div class="exp__role">${esc(job.role)}</div>
        <div class="exp__period">${esc(job.period)}</div>
        ${job.mainProject ? `<div class="exp__project">${esc(job.mainProject)}</div>` : ''}
        ${job.skills?.length ? `<ul class="exp__skills">${job.skills.map(s => `<li class="tag tag--ghost">${esc(s)}</li>`).join('')}</ul>` : ''}
      </div>
    </li>
  `).join('');
}

// Ascending career graph (oldest → newest, rising up-and-right), plus a
// trailing dashed "Now" node. Contractor roles use a hollow dot + "contract".
export function renderCareerGraph(experience) {
  const el = document.getElementById('career-graph');
  if (!el) return;

  const nodes = experience.map(e => ({
    label: e.company,
    logo: e.logo || '',
    year: e.year || (e.period.match(/\d{4}/) || [''])[0],
    tag: e.tag || e.domain || '',
    contract: e.type === 'Contractor',
  }));
  nodes.push({ label: 'Now', year: '', tag: 'building · SWE', contract: false, now: true });

  const W = 320, H = 400, padTop = 36, padBottom = 36, leanX = 34, baseX = 36;
  const n = nodes.length;
  const usableH = H - padTop - padBottom;

  const pts = nodes.map((node, i) => {
    const t = n > 1 ? i / (n - 1) : 0;
    return { ...node, x: baseX + t * leanX * (n - 1), y: H - padBottom - t * usableH };
  });

  let segs = '';
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    segs += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="cg-line${b.now ? ' cg-line--now' : ''}" />`;
  }

  const dots = pts.map(p => {
    if (p.now) {
      return `<circle cx="${p.x}" cy="${p.y}" r="5.5" class="cg-dot cg-dot--now" />`;
    }
    const bg = `<circle cx="${p.x}" cy="${p.y}" r="12" class="cg-node-bg${p.contract ? ' cg-node-bg--contract' : ''}" />`;
    const mark = p.logo
      ? `<image href="${esc(p.logo)}" x="${p.x - 9}" y="${p.y - 9}" width="18" height="18" />`
      : `<circle cx="${p.x}" cy="${p.y}" r="5.5" class="cg-dot${p.contract ? ' cg-dot--contract' : ''}" />`;
    return bg + mark;
  }).join('');

  const labels = pts.map(p => {
    const lx = p.x + 18;
    const sub = p.now ? esc(p.tag) : `${esc(p.year)} · ${esc(p.tag)}${p.contract ? ' · contract' : ''}`;
    return `
      <text x="${lx}" y="${p.y - 3}" class="cg-label${p.now ? ' cg-label--now' : ''}">${esc(p.label)}</text>
      <text x="${lx}" y="${p.y + 11}" class="cg-sub">${sub}</text>`;
  }).join('');

  el.innerHTML =
    `<svg viewBox="0 0 ${W} ${H}" class="cg" role="img" aria-label="Career progression: Cisco to Zoom to Apple to Meta, now building toward software engineering">
      ${segs}${dots}${labels}
    </svg>`;
}

export function renderWork(projects) {
  const el = document.getElementById('work-grid');
  if (!el) return;

  el.innerHTML = projects.map(p => `
    <article class="card" data-slug="${esc(p.slug)}" tabindex="0" role="button" aria-label="View case study for ${esc(p.title)}">
      <img class="card__thumb" src="${esc(p.thumbnail)}" alt="${esc(p.title)} thumbnail" loading="lazy" data-logo="${esc(p.logo || '')}" data-fallback="${esc((p.title || '?').trim().charAt(0).toUpperCase())}" />
      <div class="card__body">
        <div class="card__top">
          <h3 class="card__title">${esc(p.title)}</h3>
          ${p.github ? `<a class="card__github" href="${esc(p.github)}" target="_blank" rel="noopener noreferrer"
             aria-label="${esc(p.title)} GitHub repo" onclick="event.stopPropagation()">${GITHUB_ICON}</a>` : ''}
        </div>
        ${p.source ? `<div class="card__source">${esc(p.source)}</div>` : ''}
        <p class="card__desc">${esc(p.desc)}</p>
        ${p.tags?.length ? `<ul class="card__tags">${p.tags.map(t => `<li class="tag">${esc(t)}</li>`).join('')}</ul>` : ''}
        <span class="card__cta" aria-hidden="true">Case study →</span>
      </div>
    </article>
  `).join('');

  el.querySelectorAll('.card').forEach(card => {
    const slug = card.dataset.slug;
    const navigate = () => { location.href = `project.html?id=${encodeURIComponent(slug)}`; };
    card.addEventListener('click', navigate);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(); }
    });

    const img = card.querySelector('.card__thumb');
    img.addEventListener('error', () => {
      const ph = document.createElement('div');
      ph.className = 'card__thumb card__thumb--placeholder';
      ph.setAttribute('aria-hidden', 'true');
      if (img.dataset.logo) {
        const lg = document.createElement('img');
        lg.className = 'card__thumb-logo';
        lg.src = img.dataset.logo;
        lg.alt = '';
        ph.appendChild(lg);
      } else {
        ph.textContent = img.dataset.fallback || '';
      }
      img.replaceWith(ph);
    });
  });

  // Forward: name only the thumbnail — same image at a different size/position
  // gives a clean scale morph vs morphing the whole card (aspect ratio mismatch).
  window.addEventListener('pageswap', e => {
    if (!e.viewTransition) return;
    const dest = e.activation?.entry?.url;
    if (!dest) return;
    const s = new URL(dest).searchParams.get('id');
    if (!s) return;
    const card = el.querySelector(`.card[data-slug="${s}"]`);
    if (!card) return;
    card.style.transform = 'none';      // reset hover lift before snapshot
    card.style.transition = 'none';
    const img = card.querySelector('.card__thumb');
    if (img) img.style.viewTransitionName = `project-${s}`;
  });

  // Return: name the thumbnail on the card we're returning to.
  window.addEventListener('pagereveal', e => {
    if (!e.viewTransition) return;
    const from = navigation?.activation?.from?.url;
    if (!from) return;
    let s;
    try { s = new URL(from).searchParams.get('id'); } catch { return; }
    if (!s) return;
    const card = el.querySelector(`.card[data-slug="${s}"]`);
    if (!card) return;
    const img = card.querySelector('.card__thumb');
    if (img) img.style.viewTransitionName = `project-${s}`;
  });
}

// Extracts a safe embed URL from a YouTube or Vimeo link.
// Only youtube.com/youtu.be and vimeo.com are accepted — any other
// host returns null so no foreign iframe is ever injected.
function videoEmbedSrc(type, url) {
  try {
    const u = new URL(url);
    if (type === 'youtube') {
      const allowed = ['www.youtube.com', 'youtube.com', 'youtu.be', 'www.youtube-nocookie.com'];
      if (!allowed.includes(u.hostname)) return null;
      const id = u.searchParams.get('v') || u.pathname.split('/').filter(Boolean).pop();
      if (!id || !/^[\w-]{11}$/.test(id)) return null;
      return `https://www.youtube-nocookie.com/embed/${id}`;
    }
    if (type === 'vimeo') {
      const allowed = ['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'];
      if (!allowed.includes(u.hostname)) return null;
      const id = u.pathname.split('/').filter(Boolean).pop();
      if (!id || !/^\d+$/.test(id)) return null;
      return `https://player.vimeo.com/video/${id}`;
    }
  } catch { return null; }
  return null;
}

export function renderProject(project) {
  const thumb = document.getElementById('project-thumb');
  const title = document.getElementById('project-title');
  const source = document.getElementById('project-source');
  const tags = document.getElementById('project-tags');
  const body = document.getElementById('project-body');

  if (thumb) {
    thumb.src = esc(project.thumbnail);
    thumb.alt = `${esc(project.title)} thumbnail`;
    thumb.addEventListener('error', () => {
      const ph = document.createElement('div');
      ph.className = 'project-hero__thumb project-hero__thumb--placeholder';
      if (project.logo) {
        const lg = document.createElement('img');
        lg.src = project.logo; lg.alt = ''; lg.className = 'project-hero__thumb-logo';
        ph.appendChild(lg);
      } else {
        ph.textContent = (project.title || '?').trim().charAt(0).toUpperCase();
      }
      thumb.replaceWith(ph);
    });
  }
  if (title) title.textContent = project.title;
  if (source) source.textContent = project.source || '';
  if (tags && project.tags?.length) {
    tags.innerHTML = project.tags.map(t => `<li class="tag">${esc(t)}</li>`).join('');
  }

  if (body) {
    const cs = project.caseStudy;
    const links = (project.github || project.liveDemo) ? `
      <div class="project-links">
        ${project.github ? `<a href="${esc(project.github)}" target="_blank" rel="noopener noreferrer">GitHub ↗</a>` : ''}
        ${project.liveDemo ? `<a href="${esc(project.liveDemo)}" target="_blank" rel="noopener noreferrer">Live demo ↗</a>` : ''}
      </div>` : '';

    const mediaItems = (cs.media || [])
      .map(m => {
        const src = videoEmbedSrc(m.type, m.url);
        if (!src) return '';
        return `
          <div class="project-media">
            <div class="project-media__embed">
              <iframe src="${src}" title="${esc(m.caption || m.type + ' embed')}"
                frameborder="0" allowfullscreen loading="lazy"></iframe>
            </div>
            ${m.caption ? `<p class="project-media__caption">${esc(m.caption)}</p>` : ''}
          </div>`;
      })
      .join('');

    body.innerHTML = `
      <div class="project-section">
        <p class="project-section__label">Problem</p>
        <p class="project-section__text">${esc(cs.problem)}</p>
      </div>
      <div class="project-section">
        <p class="project-section__label">Approach</p>
        <p class="project-section__text">${esc(cs.approach)}</p>
      </div>
      <div class="project-section">
        <p class="project-section__label">Outcome</p>
        <p class="project-section__text">${esc(cs.outcome)}</p>
      </div>
      ${mediaItems}
      ${links}
    `;
  }
}

export function renderAbout(paragraphs) {
  const el = document.getElementById('about-body');
  const section = document.getElementById('about');
  if (!el || !section) return;
  if (!paragraphs?.length) { section.hidden = true; return; }
  el.innerHTML = paragraphs.map(p => `<p>${esc(p)}</p>`).join('');
}

// Résumé is reachable from the hero CTA + nav (any [data-open-resume]); there is
// no longer a dedicated section. Opens the inline PDF.js viewer; Download lives
// inside the modal. Falls back to an "Open PDF" link if the viewer can't load.
export function renderResume(links) {
  const resumeModal = document.getElementById('resume-modal');
  const resumeClose = document.getElementById('resume-modal-close');
  const pagesEl = document.getElementById('resume-pages');
  const download = document.getElementById('resume-download');
  if (download) {
    download.href = links.resume;
    download.setAttribute('download', 'resume.pdf');
  }
  if (!resumeModal) return;

  let rendered = false;
  async function openResume(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    resumeModal.showModal();
    if (resumeClose) resumeClose.focus();
    if (rendered) return;
    rendered = true;

    if (!pagesEl) return;
    pagesEl.innerHTML = '<p class="resume-modal__loading">Loading…</p>';
    try {
      const { getDocument, GlobalWorkerOptions } = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs');
      GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';

      const pdf = await getDocument(links.resume).promise;
      pagesEl.innerHTML = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.8 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.className = 'resume-modal__canvas';
        pagesEl.appendChild(canvas);
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      }
    } catch (err) {
      rendered = false; // allow a retry on reopen
      pagesEl.innerHTML = `<p class="resume-modal__loading">Couldn't load the inline preview here. <a href="${esc(links.resume)}" target="_blank" rel="noopener noreferrer">Open the PDF ↗</a></p>`;
    }
  }

  document.querySelectorAll('[data-open-resume]').forEach(el => el.addEventListener('click', openResume));
  if (resumeClose) resumeClose.addEventListener('click', () => resumeModal.close());
  resumeModal.addEventListener('click', e => { if (e.target === resumeModal) resumeModal.close(); });
}

export function renderFooter(links) {
  const el = document.getElementById('footer-links');
  if (!el) return;
  renderLinkList(el, links);
}

// ── Evergreen growth tree (hero centerpiece) ─────────────────
// An organic bonsai: a flared trunk splits into three boughs; each LeetCode
// topic sprouts a curved branch off a bough, leafed with one dot per solved
// problem (green by difficulty). Untouched canonical topics show as dormant
// buds. Grows in sequence on load (trunk → boughs → branches → leaves), with a
// reduced-motion fallback to the finished tree. Sample data until the tracker
// API (`/api/practice/tree`) is wired in.
const TREE_SAMPLE = {
  stats: { streak: 12, month: 23 },
  topics: [
    { name: 'Arrays & Hashing', e: 9, m: 12, h: 3 },
    { name: 'Dynamic Programming', e: 1, m: 8, h: 4 },
    { name: 'Trees', e: 6, m: 7, h: 2 },
    { name: 'Graphs', e: 2, m: 6, h: 2 },
    { name: 'Binary Search', e: 3, m: 6, h: 2 },
    { name: 'Linked List', e: 4, m: 4, h: 0 },
    { name: 'Two Pointers', e: 3, m: 5, h: 1 },
    { name: 'Backtracking', e: 1, m: 4, h: 1 },
    { name: 'Stack', e: 2, m: 4, h: 0 },
    { name: 'Sliding Window', e: 2, m: 4, h: 1 },
    { name: 'Heap / PQ', e: 1, m: 3, h: 1 },
    { name: 'Tries', e: 0, m: 3, h: 0 },
    { name: 'Greedy', e: 0, m: 0, h: 0 },
    { name: 'Intervals', e: 0, m: 0, h: 0 },
    { name: 'Bit Manipulation', e: 0, m: 0, h: 0 },
    { name: 'Math & Geometry', e: 0, m: 0, h: 0 },
  ],
};

const TW_LEAF = { e: 'var(--leaf-easy)', m: 'var(--leaf-med)', h: 'var(--leaf-hard)' };
const TW_VW = 620, TW_CX = 306, TW_SOIL = 424;

function twRand(n) { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); }
function twNoise(x) { return Math.sin(x * 1.7) * 0.5 + Math.sin(x * 0.9 + 2.3) * 0.3 + Math.sin(x * 2.7 + 1.1) * 0.2; }
function twBez(P, t) {
  const u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
  return { x: a * P[0].x + b * P[1].x + c * P[2].x + d * P[3].x, y: a * P[0].y + b * P[1].y + c * P[2].y + d * P[3].y };
}
function twBezT(P, t) {
  const u = 1 - t;
  const x = 3 * u * u * (P[1].x - P[0].x) + 6 * u * t * (P[2].x - P[1].x) + 3 * t * t * (P[3].x - P[2].x);
  const y = 3 * u * u * (P[1].y - P[0].y) + 6 * u * t * (P[2].y - P[1].y) + 3 * t * t * (P[3].y - P[2].y);
  const m = Math.hypot(x, y) || 1;
  return { x: x / m, y: y / m };
}
function twPoly(P, steps) {
  const pts = []; let len = 0, prev = null;
  for (let s = 0; s <= steps; s++) {
    const pt = twBez(P, s / steps);
    if (prev) len += Math.hypot(pt.x - prev.x, pt.y - prev.y);
    prev = pt; pts.push(pt);
  }
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let k = 1; k < pts.length; k++) d += ` L ${pts[k].x.toFixed(1)} ${pts[k].y.toFixed(1)}`;
  return { d, len: Math.round(len) };
}
function twRot(v, deg) { const r = deg * Math.PI / 180, c = Math.cos(r), s = Math.sin(r); return { x: v.x * c - v.y * s, y: v.x * s + v.y * c }; }

export function renderHeroTree(data) {
  const wrap = document.getElementById('hero-tree');
  const svg = document.getElementById('hero-tree-svg');
  if (!wrap || !svg) return;

  const src = data && data.topics ? data : TREE_SAMPLE;
  const topics = src.topics.map((t, i) => ({ ...t, count: t.e + t.m + t.h, dorm: (t.e + t.m + t.h) === 0, i }));
  const covered = topics.filter(t => !t.dorm);
  const dormant = topics.filter(t => t.dorm);
  const maxC = Math.max(1, ...covered.map(t => t.count));
  const total = topics.reduce((a, t) => a + t.count, 0);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const cx = TW_CX, soilY = TW_SOIL;
  const boughs = [
    { P: [{ x: cx - 7, y: 302 }, { x: cx - 64, y: 288 }, { x: cx - 138, y: 242 }, { x: cx - 158, y: 184 }], topics: [], dorm: [] },
    { P: [{ x: cx + 3, y: 266 }, { x: cx - 16, y: 214 }, { x: cx + 12, y: 162 }, { x: cx - 4, y: 112 }], topics: [], dorm: [] },
    { P: [{ x: cx + 8, y: 290 }, { x: cx + 70, y: 280 }, { x: cx + 150, y: 236 }, { x: cx + 172, y: 178 }], topics: [], dorm: [] },
  ];
  covered.slice().sort((a, b) => b.count - a.count).forEach((t, k) => boughs[k % 3].topics.push(t));
  dormant.forEach((t, k) => boughs[k % 3].dorm.push(t));

  const meta = {};
  let nebari = '<g class="tw-nebari">';
  [[-64, 10], [-40, 7], [-18, 6], [18, 6], [40, 7], [64, 10]].forEach(f => {
    nebari += `<path d="M ${cx} ${soilY - 30} Q ${cx + f[0] * 0.6} ${soilY - 8} ${cx + f[0]} ${soilY + 2}" stroke="var(--bark)" stroke-width="${f[1]}" fill="none" stroke-linecap="round"/>`;
  });
  nebari += '</g>';

  const pot = '<g class="tw-pot">'
    + `<ellipse cx="${cx}" cy="484" rx="128" ry="9" fill="var(--saucer)"/>`
    + `<polygon points="${cx - 96},432 ${cx + 96},432 ${cx + 72},468 ${cx - 72},468" fill="var(--pot-clay)"/>`
    + `<rect x="${cx - 104}" y="420" width="208" height="13" rx="2" fill="var(--pot-rim)"/>`
    + `<ellipse cx="${cx}" cy="426" rx="90" ry="9" fill="var(--soil)"/>`
    + '</g>';

  const trunkInner = `<g class="tw-trunk"><path d="M ${cx - 30} ${soilY} C ${cx - 15} ${soilY - 40} ${cx - 12} ${soilY - 92} ${cx - 8} 300 C ${cx - 7} 280 ${cx - 6} 268 ${cx - 5} 258 L ${cx + 5} 258 C ${cx + 7} 272 ${cx + 9} 300 ${cx + 12} ${soilY - 92} C ${cx + 15} ${soilY - 40} ${cx + 30} ${soilY} ${cx + 30} ${soilY} Z" fill="var(--bark)"/></g>`;
  // The trunk is the sole entry point to the tracker: wrap it in a link when the
  // container declares `data-link` (index.html); the tracker page omits it so the
  // trunk there is inert.
  const linkHref = wrap.dataset.link;
  const trunk = linkHref
    ? `<a class="tw-trunk-link" href="${esc(linkHref)}" aria-label="Open your LeetCode practice tracker">${trunkInner}</a>`
    : trunkInner;

  const wood = [], branches = [], leaves = [], hits = [];
  const bezMid = (P, a, b, f) => twBez(P, a + (b - a) * f);

  boughs.forEach((b, bi) => {
    const bd0 = 0.55 + bi * 0.14;
    [[0, 0.42, 7.5], [0.42, 0.74, 5], [0.74, 1, 3.2]].forEach((tr, ti) => {
      const seg = twPoly([twBez(b.P, tr[0]), bezMid(b.P, tr[0], tr[1], 0.33), bezMid(b.P, tr[0], tr[1], 0.66), twBez(b.P, tr[1])], 8);
      wood.push(`<path class="tw-wood" style="--len:${seg.len};--d:${(bd0 + ti * 0.12).toFixed(2)}s" d="${seg.d}" stroke-width="${tr[2]}"/>`);
    });
    const n = b.topics.length;
    b.topics.forEach((t, k) => {
      const tt = 0.4 + 0.56 * (n <= 1 ? 0.5 : k / (n - 1));
      const O = twBez(b.P, tt), tan = twBezT(b.P, tt);
      const side = k % 2 ? 1 : -1;
      const spread = (24 + Math.abs(twNoise(t.i * 1.7)) * 16) * side;
      let dir = twRot(tan, spread);
      dir = { x: dir.x * 0.72, y: dir.y * 0.72 - 0.28 };
      const dm = Math.hypot(dir.x, dir.y); dir = { x: dir.x / dm, y: dir.y / dm };
      const L = 52 + 50 * Math.sqrt(t.count / maxC);
      const perp = { x: -dir.y, y: dir.x };
      const s1 = twNoise(t.i * 1.3) * 13, s2 = twNoise(t.i * 2.1 + 5) * 17;
      const P = [O,
        { x: O.x + dir.x * L * 0.35 + perp.x * s1, y: O.y + dir.y * L * 0.35 + perp.y * s1 },
        { x: O.x + dir.x * L * 0.7 + perp.x * s2, y: O.y + dir.y * L * 0.7 + perp.y * s2 },
        { x: O.x + dir.x * L, y: O.y + dir.y * L }];
      const pth = twPoly(P, 10);
      const bw = 1.8 + 3.0 * (t.count / maxC);
      const bd = bd0 + 0.5 + k * 0.07;
      branches.push(`<path class="tw-branch" data-i="${t.i}" style="--len:${pth.len};--d:${bd.toFixed(2)}s" d="${pth.d}" stroke-width="${bw.toFixed(1)}"></path>`);
      const tip = P[3];
      const pr = 12 + Math.min(24, t.count * 0.95);
      const bag = [];
      for (let z = 0; z < t.e; z++) bag.push('e');
      for (let z = 0; z < t.m; z++) bag.push('m');
      for (let z = 0; z < t.h; z++) bag.push('h');
      bag.sort((a, c) => twRand(t.i * 13 + a.charCodeAt(0) * 3) - twRand(t.i * 7 + c.charCodeAt(0) * 3));
      for (let j = 0; j < t.count; j++) {
        const aa = twRand(t.i * 97 + j * 13) * Math.PI * 2;
        const radd = Math.sqrt(twRand(t.i * 53 + j * 29)) * pr;
        const lx = tip.x + Math.cos(aa) * radd, ly = tip.y + Math.sin(aa) * radd * 0.78 - 2;
        const rr = (twRand(t.i * 29 + j * 11) * 90 - 45 + aa * 180 / Math.PI).toFixed(0);
        const ld = (reduce ? 0 : (bd + 0.35 + j * 0.012)).toFixed(2);
        leaves.push(`<g class="tw-leaf" data-i="${t.i}" style="--d:${ld}s"><ellipse cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" rx="2.7" ry="5" fill="${TW_LEAF[bag[j]]}" transform="rotate(${rr} ${lx.toFixed(1)} ${ly.toFixed(1)})"/></g>`);
      }
      hits.push(`<circle class="tw-hit" data-i="${t.i}" cx="${tip.x.toFixed(1)}" cy="${tip.y.toFixed(1)}" r="${(pr + 7).toFixed(1)}"/>`);
      meta[t.i] = { x: tip.x, y: tip.y, pr, name: t.name, dorm: false };
    });
    b.dorm.forEach((t, k) => {
      const tt = 0.55 + 0.32 * (k / (Math.max(1, b.dorm.length - 1) || 1));
      const O = twBez(b.P, tt), tan = twBezT(b.P, tt);
      const side = k % 2 ? -1 : 1;
      const dir = twRot(tan, 38 * side);
      const end = { x: O.x + dir.x * 17, y: O.y + dir.y * 17 };
      const pth = twPoly([O, { x: O.x + dir.x * 6, y: O.y + dir.y * 6 }, { x: O.x + dir.x * 12, y: O.y + dir.y * 12 }, end], 4);
      const bd = bd0 + 0.7 + k * 0.06;
      branches.push(`<path class="tw-branch tw-dorm" data-i="${t.i}" style="--len:${pth.len};--d:${bd.toFixed(2)}s" d="${pth.d}" stroke-width="1.5"></path>`);
      leaves.push(`<circle class="tw-bud" data-i="${t.i}" cx="${end.x.toFixed(1)}" cy="${end.y.toFixed(1)}" r="2.8" fill="var(--bud)" stroke="var(--bud-stroke)" stroke-width="0.7" style="--d:${(bd + 0.25).toFixed(2)}s"/>`);
      hits.push(`<circle class="tw-hit" data-i="${t.i}" cx="${end.x.toFixed(1)}" cy="${end.y.toFixed(1)}" r="11"/>`);
      meta[t.i] = { x: end.x, y: end.y, pr: 10, name: t.name, dorm: true };
    });
  });

  const label = '<g class="tw-lbl" id="tw-lbl"><rect rx="4" height="20"/><text></text></g>';
  svg.innerHTML = nebari + pot + trunk + wood.join('') + branches.join('') + leaves.join('') + hits.join('') + label;
  wrap.classList.toggle('no-anim', reduce);

  twSetCounter('tree-total', total, reduce);
  const streakEl = document.getElementById('tree-streak');
  if (streakEl) streakEl.textContent = String((src.stats && src.stats.streak) ?? 0);
  const topEl = document.getElementById('tree-topics');
  if (topEl) topEl.textContent = `${covered.length}/${topics.length}`;

  twWireHover(svg, meta);

  // Trunk = doorway to the tracker: glow (CSS) + a hint label on hover/focus.
  const trunkLink = svg.querySelector('.tw-trunk-link');
  if (trunkLink) {
    const show = () => twShowLabel(svg, cx, 250, 'Open tracker ↗', false, true);
    const hide = () => twHideLabel(svg);
    trunkLink.addEventListener('mouseover', show);
    trunkLink.addEventListener('mouseout', hide);
    trunkLink.addEventListener('focus', show);
    trunkLink.addEventListener('blur', hide);
  }
}

function twSetCounter(id, to, reduce) {
  const el = document.getElementById(id);
  if (!el) return;
  if (reduce) { el.textContent = String(to); return; }
  let start = null;
  const step = ts => {
    if (!start) start = ts;
    const k = Math.min(1, (ts - start) / 2200);
    el.textContent = String(Math.round(k * to));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  // Guarantee the final value even if rAF is throttled (background/hidden tab).
  setTimeout(() => { el.textContent = String(to); }, 2400);
}

function twShowLabel(svg, x, y, text, dorm, cta) {
  const g = svg.querySelector('#tw-lbl');
  if (!g) return;
  const txt = g.querySelector('text'), rc = g.querySelector('rect');
  g.classList.toggle('tw-dorm', !!dorm);
  g.classList.toggle('tw-cta', !!cta);
  txt.textContent = text;
  g.style.display = 'block';
  const w = txt.getComputedTextLength() + 18;
  const lx = Math.max(w / 2 + 4, Math.min(TW_VW - w / 2 - 4, x));
  const ly = Math.max(24, y);
  rc.setAttribute('x', (lx - w / 2).toFixed(1)); rc.setAttribute('y', (ly - 14).toFixed(1)); rc.setAttribute('width', w.toFixed(1));
  txt.setAttribute('x', lx.toFixed(1)); txt.setAttribute('y', ly.toFixed(1)); txt.setAttribute('text-anchor', 'middle');
}
function twHideLabel(svg) { const g = svg.querySelector('#tw-lbl'); if (g) g.style.display = 'none'; }

function fmtDate(s) { const [y, m, d] = s.split('-').map(Number); return `${MONTHS[m - 1]} ${d}, ${y}`; }

// Practice tracker — "By topic": each covered topic collapses to reveal its
// solved questions (title, difficulty, date); dormant topics show a "not
// started" chip. Consumes practiceData().topicBreakdown (or the equivalent API
// shape).
export function renderTopicBreakdown(topics) {
  const el = document.getElementById('topic-breakdown');
  if (!el || !topics) return;
  el.innerHTML = topics.map(t => {
    if (t.dorm) {
      return `<div class="pt-item pt-item--dorm"><span class="pt-name">${esc(t.name)}</span><span class="pt-note">not started</span></div>`;
    }
    const qs = t.questions.map(q =>
      `<li class="pt-q"><span class="pt-q-title">${esc(q.title)}</span>` +
      `<span class="diff diff--${esc(q.difficulty.toLowerCase())}">${esc(q.difficulty)}</span>` +
      `<span class="pt-q-date">${esc(fmtDate(q.date))}</span></li>`).join('');
    const open = t.count <= 6 ? ' open' : '';
    return `<details class="pt-item"${open}><summary class="pt-head"><span class="pt-name">${esc(t.name)}</span>` +
      `<span class="pt-count">${t.count} solved</span></summary><ul class="pt-qlist">${qs}</ul></details>`;
  }).join('');
}

// Practice tracker — "Daily activity": a reverse-chronological timeline of what
// was solved each day. Shows the 3 most recent days, with a toggle to reveal the
// rest. Consumes practiceData().dailyTimeline (or the API shape).
const DAILY_INITIAL = 3;
export function renderDailyTimeline(days) {
  const el = document.getElementById('daily-timeline');
  if (!el || !days) return;
  const rows = days.map((d, i) => `
    <div class="dt-day${i >= DAILY_INITIAL ? ' dt-day--extra' : ''}">
      <div class="dt-date">${esc(fmtDate(d.date))}</div>
      <ul class="dt-list">
        ${d.items.map(it =>
          `<li class="dt-item"><span class="diff diff--${esc(it.difficulty.toLowerCase())} diff--dot" title="${esc(it.difficulty)}">${esc(it.difficulty[0])}</span>` +
          `<span class="dt-title">${esc(it.title)}</span><span class="dt-topic">${esc(it.topic)}</span></li>`).join('')}
      </ul>
    </div>`).join('');
  const toggle = days.length > DAILY_INITIAL
    ? `<button type="button" class="dt-toggle" aria-expanded="false">Show all ${days.length} days ↓</button>`
    : '';
  el.innerHTML = rows + toggle;

  const btn = el.querySelector('.dt-toggle');
  if (btn) {
    btn.addEventListener('click', () => {
      const expanded = el.classList.toggle('dt-timeline--expanded');
      btn.setAttribute('aria-expanded', String(expanded));
      btn.textContent = expanded ? 'Show fewer ↑' : `Show all ${days.length} days ↓`;
    });
  }
}

function twWireHover(svg, meta) {
  const show = i => {
    svg.querySelectorAll(`.tw-branch[data-i="${i}"],.tw-leaf[data-i="${i}"]`).forEach(el => el.classList.add('tw-hl'));
    const m = meta[i];
    if (!m) return;
    twShowLabel(svg, m.x, m.y - m.pr - 12, m.dorm ? `${m.name} · not started` : m.name, m.dorm, false);
  };
  const hide = i => {
    svg.querySelectorAll(`.tw-branch[data-i="${i}"],.tw-leaf[data-i="${i}"]`).forEach(el => el.classList.remove('tw-hl'));
    twHideLabel(svg);
  };
  svg.addEventListener('mouseover', e => { const el = e.target.closest('[data-i]'); if (el) show(el.getAttribute('data-i')); });
  svg.addEventListener('mouseout', e => { const el = e.target.closest('[data-i]'); if (el) hide(el.getAttribute('data-i')); });
}

