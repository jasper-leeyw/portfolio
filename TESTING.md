# Testing

The site is still evolving, so the active test suite is intentionally minimal:
**data-integrity tests** over `js/data.js`. They catch the mistakes that actually
happen while editing content — a project missing a case-study field, a logo path
that 404s, a dropped `Contractor` label, experience listed out of order — and
they don't break when you restyle or rearrange markup. No browser, no jsdom.

## Run

```bash
npm test            # run the data-integrity suite
npm run test:watch  # re-run on file changes
```

`npm test` prints readable per-test output (`spec` reporter) and also writes a
TAP log to `test-results/unit.tap` (gitignored). It needs only Node 18+ — there
are no dependencies to install.

## What's covered (`tests/data.test.js`)
- Hero has all required fields; a Résumé CTA exists.
- Every experience entry is complete (company, role, period, logo, 4-digit year, highlights).
- **Apple & Meta are labeled `Contractor`; Cisco & Zoom are not** (integrity rule).
- Experience is ordered oldest → newest (drives the ascending career graph).
- Every project has a complete case study (problem/approach/outcome) + logo.
- Contractor case studies keep "Contractor" in their source label.
- Links present (email, github, linkedin, leetcode, resume) + leetcode username.
- **Every referenced logo and the résumé PDF actually exist on disk.**

## Parked: render + browser tests (reactivate near launch)
DOM-level render tests live in `tests/parked/` (`render.jsdom.js`, `helpers.js`).
They're disabled (renamed out of the `*.test.js` pattern) because DOM/layout
assertions churn while the markup is still changing. To bring them back:

```bash
npm i -D jsdom
mv tests/parked/helpers.js tests/helpers.js
mv tests/parked/render.jsdom.js tests/render.test.js
# then fix the relative import paths back from ../../ to ../
```

Before launch, also consider a thin Playwright layer for the things jsdom can't
check — modal centering and mobile-nav overflow (real layout) — using geometry
assertions, not pixel snapshots.
