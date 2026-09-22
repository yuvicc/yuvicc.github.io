# LLVM and Clang in 30 Study Days

A static curriculum and private progress tracker, published at <https://yuvicc.dev/llvm/>.
It is built with Astro 7 and TypeScript and outputs static files only. There is no server,
database, account or paid service.

The curriculum comes from `LLVM-Clang-30-Day-Plan.md` (source review date 2026-09-22).

## Requirements

- Node.js 22.18 or newer (Node 24 is used in CI). Tests rely on Node’s built-in TypeScript
  type stripping.
- For the browser test only: an installed Chrome or Chromium. The test looks in
  `/usr/bin/google-chrome`, `/usr/bin/chromium-browser` and `/usr/bin/chromium`; set
  `CHROME_PATH` to use a different browser.

## Commands

Run all of these from `llvm-site/`.

| Command | What it does |
| --- | --- |
| `npm ci` | Clean install from `package-lock.json` |
| `npm run dev` | Dev server at <http://localhost:4321/llvm/> |
| `npm run build` | Type-check (`astro check`), then build static output into `dist/` |
| `npm run preview` | Serve the production build locally at `/llvm/` |
| `npm test` | Unit tests: content schema, progress calculations, import validation, dates |
| `npm run test:routes` | After a build: every route exists, internal links and `#fragments` resolve, canonical URLs and sitemap are correct, and lesson text is in the static HTML |
| `npm run test:browser` | After a build: completion, refresh, continue, notes, export/reset/import round trip, malformed import, start date, filters, no-JS and no-storage modes, 360 px overflow, keyboard use, console errors |
| `npm run test:all` | All of the above in order |

The build output directory is `dist/`. The site is served under the base path `/llvm/`.

## Project layout

```
llvm-site/
  site.config.mjs          public origin and base path (the one place to change them)
  astro.config.mjs
  src/
    content/days/NN.yaml   the 30 lessons: the curriculum source of truth
    content/schema.ts      Zod schema for a lesson, used by the build and by the tests
    content.config.ts      the content collection
    data/resources.ts      resource registry R1–R20, plus local entries (checkout, notes, checklist)
    data/book.ts           book chapter assignments, kept apart from lesson copy
    data/site.ts           title, phases, toolchain reminders, curriculum version
    lib/progress.ts        progress envelope, validation and calculations (no DOM)
    lib/schedule.ts        local-date helpers for the optional start date
    scripts/app.ts         client-side progress, notes, filters, theme, copy, backup
    layouts/, components/, pages/, styles/
  tests/                   unit, route and browser tests, plus a tiny static server
```

## Editing content

Each lesson is one YAML file in `src/content/days/`. Its fields follow the plan’s `StudyDay` type,
plus `toolchain` (`host`, `llvm17`, `main` or `both`, which picks the reminder shown on the page) and
an optional `checkpoint` letter.

- **Reading** entries point to registry IDs such as `R1` or `checkout`, never raw URLs. `also`
  lists other resources covered by the same time budget, and `upTo: true` renders the time as
  “up to N min”.
- **Inline code**: wrap it in backticks in `steps`, `deliverable`, `goals` or `optional`. Text is
  always rendered as text, never as HTML.
- **Check IDs** (`day-NN-read`, `day-NN-lab`, `day-NN-done`, `day-NN-recall`, `day-NN-optional`)
  are stored in readers’ browsers, so treat them as stable. Removing or renaming one makes old
  backups fail import validation. If you have to change them, also bump `CURRICULUM_VERSION` in
  `src/data/site.ts`.
- The `day-NN-done` label must stay `Done when: <deliverable>`. The tests enforce this so the
  written completion criterion is preserved.
- Links and descriptions for references live in `src/data/resources.ts`. Update `SOURCE_REVIEW_DATE`
  there after re-checking them.

`npm test` validates every lesson file. `npm run build` fails on any schema error.

## Progress, notes and backups

Progress, settings (theme, start date) and notes are stored under one versioned localStorage key,
`llvm-clang-30:progress:v1`:

```json
{
  "schemaVersion": 1,
  "curriculumVersion": "2026-09-22",
  "startDate": "2026-09-22",
  "settings": { "theme": "system" },
  "checks": { "day-01-read": true },
  "notes": { "day-01": "…", "general": "…" },
  "exportedAt": "2026-09-22T10:00:00.000Z"
}
```

- A day is complete when all of its required checks are ticked. Optional checks never count.
- **Continue** opens the lowest-numbered incomplete day.
- The data is specific to one browser and one origin. It can be cleared and does not sync. Use
  **Notes → Export JSON** to make a backup.
- On import, the file is checked first: size cap, schema version, known check and note IDs,
  value types and note length. A file that fails any check changes nothing. A valid file replaces
  the current data only after you confirm.
- **Reset everything** also asks for confirmation.
- If browser storage is blocked, lessons still render and the controls stay disabled, with a
  notice explaining why.

**Changing domains:** browser data does not follow the site to a new origin. Export on the old
address and import on the new one.

## Deployment (GitHub Pages)

This site lives on the `learn_llvm` branch and is **not merged into `master`**. That branch also
carries the Jekyll site from the repository root. `.github/workflows/pages.yml` builds Jekyll into
`_site/` and this project into `_site/llvm/`, then deploys both as one Pages artifact. The workflow
runs on every push to `learn_llvm` and can also be run by hand. Jekyll ignores this directory
through `exclude:` in the root `_config.yml`.

Because Pages serves one artifact per repository, whatever `learn_llvm` deploys replaces the whole
of yuvicc.dev, not only `/llvm/`. Changes made to the Jekyll site on `master` appear only after they
are merged or rebased into `learn_llvm` and pushed.

One-time setup, done by the repository owner:

1. Record the current Pages settings: custom domain `yuvicc.dev`, HTTPS enforced, source `master`
   at `/`.
2. Go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
3. Go to **Settings → Environments → github-pages → Deployment branches and tags** and add
   `learn_llvm`. By default only the default branch may deploy, so without this step the deploy
   job is rejected.
4. Push `learn_llvm`, or run **Deploy site** from the Actions tab, and wait for it to finish.
5. Check that the custom domain and **Enforce HTTPS** are still set. The DNS records do not need to
   change.
6. Verify:
   - <https://yuvicc.dev/> and <https://yuvicc.dev/about/> still work.
   - <https://yuvicc.dev/llvm/> loads.
   - A direct load and a refresh of <https://yuvicc.dev/llvm/days/17/> both work.
   - Ticking a check on the live site and refreshing keeps it.

**Moving the site:** edit `SITE_ORIGIN` and `BASE_PATH` in `site.config.mjs`. Canonical URLs, the
sitemap and every internal link follow those two values. To use a different static host, upload
the contents of `dist/` so they are served under `BASE_PATH`.
