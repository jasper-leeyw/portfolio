# Portfolio — Functional Requirements

A single-page personal portfolio site. The audience is hiring managers and
engineers evaluating me for **mid-to-senior SWE** roles. The page's one job:
make it easy to understand what I build, see proof, and reach me — fast.

A throughline runs under it all: a deliberate path from **EMC engineer →
Software QA → SWE**. The site should frame that as *compounding range* —
hardware-level systems thinking plus a test-driven quality mindset, now applied
to building — not as a career still catching up.

> **Design north star:** quiet precision. Confidence through whitespace and
> restraint, not volume. If a feature doesn't help a reviewer decide, it's out.

**Page order:** Hero → Currently → The Path → Selected work → About → Résumé → Footer.

---

## 1. Constraints (these drive every decision)

| Constraint | Requirement |
|---|---|
| **Structure** | One scrolling page as the main entry point. `about.html` is a lightweight companion page for the About section; nav links between them. |
| **Stack** | Modular static files — `index.html` + separate CSS and ES-module JS. No framework, no bundler, **no build step** (browsers load ES modules natively). |
| **Content management** | All content lives in `js/data.js`. Adding a project = appending one object there; no other file is touched. |
| **Time budget** | Shippable in 2–3 days of evenings. |
| **Deploy** | Static hosting — Vercel or GitHub Pages. One `git push` to update. |

---

## 2. Architecture & modularity

Modularity here means *appropriate* modularity — separation of concerns at a
scale that fits a static one-pager. A bundler, framework, or build pipeline would
be over-engineering; matching the architecture to the problem is the point.

**Principles**
- **Separation of concerns** — markup, styles, behavior, and content live in
  distinct files, never one blob.
- **Single source of truth for content** — every project and all copy live in
  `js/data.js`. The rest of the code never hardcodes content.
- **Pure render functions** — `render.js` takes data and returns DOM; no business
  logic baked into markup, no content baked into rendering.
- **One documented extension point** — adding a project is a single-object edit in
  one known file. Nothing else changes.
- **Centralized design tokens** — colors, type, spacing as CSS custom properties
  in one place.

**File structure**
```
portfolio/
├── index.html          # main shell: hero, experience sidebar, selected work
├── about.html          # About page
├── projects.html       # full projects grid
├── project.html        # dynamic project detail page (?id=slug)
├── css/
│   └── styles.css      # all styling; design tokens as CSS vars
├── js/
│   ├── data.js         # ← the ONLY file you edit to add content (exports DATA)
│   ├── render.js       # data → DOM functions + event wiring
│   ├── main.js         # entry point for index.html
│   ├── projects.js     # entry point for projects.html
│   ├── project.js      # entry point for project.html (reads ?id= from URL)
│   └── about.js        # entry point for about.html
└── assets/
    ├── resume.pdf
    ├── logos/          # company SVG logos (used by experience + project cards)
    └── thumbnails/     # one image per project (add as you build them)
```

**Adding a project**

1. Drop a thumbnail into `assets/thumbnails/` (e.g. `my-project.jpg`).
2. Append one object to the `projects` array in `js/data.js`:

```js
{
  slug: "my-project",           // ← URL key: project.html?id=my-project (unique, kebab-case)
  title: "My Project",
  source: "Company · Contractor", // or "" if personal
  logo: "assets/logos/company.svg",
  thumbnail: "assets/thumbnails/my-project.jpg",
  github: "",                   // or "https://github.com/..." — leave "" to hide the icon
  liveDemo: "",                 // or "https://..." — leave "" to hide
  tags: ["Python", "..."],
  desc: "One-line card description.",
  caseStudy: {
    problem:  "What was hard or broken.",
    approach: "What you built and how.",
    outcome:  "Measurable result.",
    media: [
      // Add YouTube/Vimeo embeds (optional). Leave empty or omit entirely.
      // { type: "youtube", url: "https://www.youtube.com/watch?v=VIDEO_ID", caption: "Demo" },
      // { type: "vimeo",   url: "https://vimeo.com/VIDEO_ID",               caption: "Walkthrough" },
    ],
  },
}
```

3. Done — the card appears on `projects.html` and `index.html` automatically, and `project.html?id=my-project` works with no other changes.

**Updating an existing project**

All content lives in `js/data.js`. Find the project by its `slug` and edit the fields directly:

- **Text** (`problem`, `approach`, `outcome`, `desc`) — edit in place.
- **Tags** — add/remove strings in the `tags` array.
- **Thumbnail** — swap the file in `assets/thumbnails/` and update the `thumbnail` path.
- **Add a video embed** — uncomment and fill in a `media` entry. `type` is `"youtube"` or `"vimeo"`; `url` is the standard watch/share URL (e.g. `https://www.youtube.com/watch?v=abc123`). The site extracts the video ID and constructs a privacy-friendly embed URL automatically.
- **GitHub / live demo links** — set the `github` or `liveDemo` fields to the full URL, or `""` to hide.

**Tradeoff:** ES modules require the page be served over HTTP, not opened via
`file://`. Use a local server in dev (`python3 -m http.server`) — deployment to
Vercel/Pages is unaffected.

**Escalation path (only if the list grows large):** split into one module per
project under `js/projects/` and import them into a registry in `data.js`. Not
needed at v1 scale — noted so the structure can grow without a rewrite.

---

## 3. Functional requirements

### FR-1 — Navigation
- Sticky top bar with a monospace wordmark (`jasper.dev`) linking to top.
- Anchor links to the in-page sections (Path, Work, About) + a résumé link.
- Collapses cleanly on mobile (no hamburger needed at this scale).

### FR-2 — Hero
- Display headline with one accented phrase and a blinking cursor.
- One human intro sentence (the personal voice — editable).
- **Acceptance:** headline, intro, and accent word all read from `data.js`.

### FR-3 — "Currently" strip
- A short status readout (3–5 items) rendered as monospace chips.
- Purely from `DATA.currently` (array of strings).

### FR-4 — The Path (career arc)
The differentiator. A restrained, typed timeline of three stops:
**EMC Engineer → Software QA → SWE**.
- Each stop shows the role and a single takeaway line — *what it gave me*, not
  just what it was. The framing leads with transferable strength (systems
  thinking, test rigor) so the pivot reads as accumulated range.
- Visual treatment is minimal: the sequence itself carries the meaning, so order
  is the only "decoration" — no heavy numbered badges, no logos required.
- Read from `DATA.experience` (array — see FR-10 content model).
- **Acceptance:** the three stops render in order; removing/adding a stop is a
  one-object edit; reads as an asset, not an apology.

### FR-5 — Selected work (project grid)
Each project card **must** show:
- a **thumbnail image**,
- a **GitHub icon/link** to the repo,
- title, one-line description, and tech tags.

Behavior:
- Tapping the card (anywhere except the GitHub icon) **opens the case study
  inline** (see FR-6). The GitHub icon is a separate click target that opens the
  repo in a new tab.
- An optional **live-demo** link may appear per project (not every card has one).
- Cards are rendered by mapping over `DATA.projects` — never hand-written markup.
- **Acceptance:** clicking GitHub never triggers the case study, and vice versa.

### FR-6 — Case study (inline modal)
- Opens as an overlay **on the same page** — no navigation, URL stays put.
- Contents per project: thumbnail/banner, problem → approach → outcome, tags,
  and the GitHub + live links.
- Dismissable via close button, backdrop click, and the `Esc` key.
- Scroll-locks the page behind it while open; restores scroll position on close.
- **Acceptance:** keyboard users can open, read, and close without a mouse.

### FR-7 — About
- 1–2 short paragraphs of longer-form personal/professional voice.
- A natural home to deepen the pivot narrative if the hero/Path keep it brief.
- Read from `DATA.about` (array of strings). Section auto-hides if empty.

### FR-8 — Résumé
- An **embedded PDF viewer** on the page (inline `<embed>`/`<iframe>`).
- A separate **"Download PDF"** action.
- Both point to a local file (`assets/resume.pdf`) named in `DATA.links`.
- **Acceptance:** viewer renders the PDF; download saves the same file.

### FR-9 — Contact (footer)
- Links only: **email, GitHub, LinkedIn** (email opens `mailto:`).
- Any link with an empty value in `DATA` is hidden, not shown broken.
- No contact form.

### FR-10 — Content model
All content lives in `js/data.js`. Key shapes:

```js
// career arc — drives the ascending graph and accordion; order is the message
experience: [
  {
    company:    "string",           // required
    logo:       "assets/logos/x.svg", // required
    role:       "string",           // required
    type:       "Contractor" | "", // "" = full-time; shown explicitly on cards
    period:     "Mon YYYY – Mon YYYY",
    domain:     "string",           // e.g. "Audio", "Computer Vision / AR"
    year:       "YYYY",             // short label for the graph x-axis
    tag:        "string",           // short domain label for the graph
    highlights: ["string", ...],    // 2–3 bullet achievements
  },
  // …
]

// projects
{
  title:     "string",          // required
  thumbnail: "assets/thumbnails/x.jpg", // required
  github:    "https://...",     // required
  tags:      ["string", ...],   // optional
  desc:      "one-liner",       // required (card)
  liveDemo:  "https://...",     // optional
  caseStudy: {                  // required (inline modal)
    problem:  "string",
    approach: "string",
    outcome:  "string",
  },
}
```

---

## 4. Non-functional requirements

- **Responsive:** legible and usable from 360px mobile up to desktop.
- **Accessibility:** visible keyboard focus, alt text on every thumbnail,
  modal is focus-trapped and `Esc`-dismissable, semantic headings.
- **Reduced motion:** `prefers-reduced-motion` disables cursor blink, reveals,
  and smooth scroll.
- **Performance:** no framework runtime, fonts preconnected, images lazy-loaded;
  target a near-instant first paint.
- **SEO / sharing:** `<title>`, meta description, and Open Graph tags so the link
  preview looks intentional when shared.
- **Maintainability:** new project added with a single-object edit; no content in
  markup; render logic is pure and reusable.

---

## 5. Assumptions & out of scope (v1)

Parked deliberately — revisit only if a real need shows up:

- **Dark mode / theme toggle** — light theme only for v1.
- **Blog / writing section** — not built; structure leaves room to add later.
- **Contact form** — links only; no backend to maintain.
- **Analytics** — none in v1 (can drop in a one-line script later).
- **Build tooling / framework** — intentionally none; native ES modules only.
- **Custom domain** — deploy to the default host URL first; domain is a later
  one-setting change.

---

## 6. Definition of done

- [ ] Concerns separated across files; adding a project touches only `js/data.js`.
- [ ] All content read from `data.js`; no hardcoded copy in markup.
- [ ] Path section renders EMC → QA → SWE, each with a one-line takeaway, in order.
- [ ] Every project card has a thumbnail + working GitHub link.
- [ ] Case study opens inline, closes via button / backdrop / `Esc`.
- [ ] Résumé both embeds and downloads.
- [ ] Footer shows email, GitHub, LinkedIn (empties hidden).
- [ ] Passes a mobile pass at 360px and keyboard-only navigation.
- [ ] Deployed to a live URL via Vercel or GitHub Pages.
