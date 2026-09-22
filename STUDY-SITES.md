# Hosting study sites under yuvicc.dev

How to publish study sites such as the LLVM site as their own GitHub repos, each served at
`yuvicc.dev/<repo-name>/`, while this repo stays the blog.

## How it works

- `yuvicc/yuvicc.github.io` is the **user site**. It owns the custom domain `yuvicc.dev` through
  its `CNAME` file and deploys from `master` as before.
- Any other public repo of yours with Pages turned on is a **project site**, published
  automatically at `https://yuvicc.dev/<repo-name>/`. It inherits the domain and HTTPS, so no DNS
  changes are needed.
- Each repo deploys separately, so the study sites and the blog never overwrite each other.
- Don't create a folder in this repo with the same name as a study-site repo (for example
  `llvm/`). The two paths would clash.

## Naming

**The repo name, the URL path and `BASE_PATH` in `site.config.mjs` must all match.**

| Site | Repo | URL | `BASE_PATH` |
| --- | --- | --- | --- |
| LLVM and Clang | `yuvicc/llvm` | https://yuvicc.dev/llvm/ | `/llvm/` (already set) |
| Go (future) | `yuvicc/golang` | https://yuvicc.dev/golang/ | `/golang/` |

Renaming a repo later changes its URL. Progress saved in readers' browsers stays behind at the
old address and has to be exported and re-imported.

## Repo settings

| Setting | Value |
| --- | --- |
| Owner | `yuvicc` |
| Name | `llvm` |
| Description | LLVM and Clang in 30 study days: a curriculum and private progress tracker toward a first Clang contribution. |
| Visibility | **Public** (on a free plan, Pages needs a public repo) |
| Initialize with README, .gitignore or license | **Leave all unchecked**, because an existing folder is pushed |
| Default branch | `main` |
| About → Website | `https://yuvicc.dev/llvm/` |
| About → Topics | `llvm`, `clang`, `compilers`, `learning`, `astro` |
| Settings → Pages → Source | **GitHub Actions** |
| Settings → Pages → Custom domain | **Leave empty** (the domain is inherited; setting one would break it) |
| License | Optional: copy this repo's `LICENSE`, or leave the curriculum unlicensed |

## Step 1: Create the local repo

`llvm-site/` currently exists only as uncommitted files on the `learn_llvm` branch of this repo.
Copy it out before cleaning up (step 5):

```bash
rsync -a --exclude node_modules --exclude dist --exclude .astro \
  ~/yuvicc.github.io/llvm-site/ ~/llvm/
cd ~/llvm
git init -b main
```

## Step 2: Add the deploy workflow

Create `~/llvm/.github/workflows/pages.yml`:

```yaml
name: Deploy site

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
      - run: npm run test:routes
      - uses: actions/upload-pages-artifact@v5
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v5
```

In the new repo's `README.md`, replace the "Deployment (GitHub Pages)" section, which describes
the old combined Jekyll setup. The workflow above now does the whole deploy.

Check that it builds before pushing:

```bash
npm ci
npm run test:all      # unit, build, route and browser tests
npm run dev           # http://localhost:4321/llvm/
```

## Step 3: Commit and push

```bash
cd ~/llvm
git add .
git commit -m "LLVM and Clang 30-day study site"
gh repo create yuvicc/llvm --public --source . --push \
  --description "LLVM and Clang in 30 study days: a curriculum and private progress tracker toward a first Clang contribution." \
  --homepage "https://yuvicc.dev/llvm/"
```

To use the web UI instead, create an empty repo with the settings above. Then:

```bash
git remote add origin git@github.com:yuvicc/llvm.git
git push -u origin main
```

## Step 4: Turn on Pages

1. Go to **yuvicc/llvm → Settings → Pages → Build and deployment → Source** and choose
   **GitHub Actions**.
2. Go to **Actions → Deploy site → Run workflow** on `main`. The first push ran before Pages was
   on, so that run can't deploy.
3. Leave the environment settings alone: `main` is the default branch and may deploy by default.
4. If you prefer the terminal, this does step 1:
   `gh api -X POST repos/yuvicc/llvm/pages -f build_type=workflow`

## Step 5: Clean up this repo

This repo needs nothing new. Keep its Pages source as **Deploy from a branch → `master` / root**.
Once step 1 has copied `llvm-site/`, drop the experiment branch:

```bash
cd ~/yuvicc.github.io
git checkout -- _config.yml Gemfile.lock index.markdown
rm -rf .github llvm-site
git checkout master
git branch -D learn_llvm
```

Move this guide (`STUDY-SITES.md`) somewhere outside the repo, or add it to `exclude:` in
`_config.yml`. Otherwise Jekyll publishes it as a raw file if it is ever committed to `master`.

Optional: link the course from the home page by adding this line to `index.markdown` on `master`:

```markdown
Currently working through [LLVM and Clang in 30 Study Days](/llvm/), a study plan and tracker toward a first Clang contribution.
```

## Step 6: Verify

- https://yuvicc.dev/llvm/ loads. The first deploy can take a minute or two.
- A direct load and a refresh of https://yuvicc.dev/llvm/days/17/ both work.
- https://yuvicc.dev/ and https://yuvicc.dev/about/ still show the blog.
- Ticking a check and refreshing keeps it.
- The workflow run in the Actions tab is green.

## Adding another study site (for example Go)

1. Copy the `llvm` repo as a template: `rsync -a --exclude node_modules --exclude dist --exclude
   .astro --exclude .git ~/llvm/ ~/golang/`
2. In `site.config.mjs`, set `BASE_PATH = '/golang/'`.
3. In `src/lib/progress.ts`, change `STORAGE_KEY`, for example to `golang-30:progress:v1`.
   **This is required.** Every site under `yuvicc.dev` shares one browser storage origin, so
   sites with the same key would overwrite each other's progress.
4. In `src/data/site.ts`, change `SITE_TITLE`, `SITE_DESCRIPTION`, `CURRICULUM_VERSION`, the
   phases and the toolchain notes.
5. Replace the lesson files in `src/content/days/`, the resources in `src/data/resources.ts` and
   `src/data/book.ts`, and the page copy in `src/pages/`.
6. Update the tests that encode LLVM-specific facts, such as the checkpoint days, phase ranges
   and `R1`–`R20`.
7. Repeat steps 3, 4 and 6 above with the repo name `golang`.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| The deploy job fails with "Branch is not allowed to deploy" | The workflow ran from a branch other than `main`. Push to `main`, or allow the branch under Settings → Environments → github-pages |
| 404 at `/llvm/` right after the first deploy | Propagation takes a minute or two. Also check that Pages Source is **GitHub Actions** |
| Pages look unstyled, or links point to the wrong place | `BASE_PATH` doesn't match the repo name |
| Pages settings show no domain for the project repo | Expected. It inherits `yuvicc.dev` from the user site; don't add one |
| Progress is missing after moving the site | Browser storage belongs to the domain, not the path, so a new domain or a changed `STORAGE_KEY` starts empty. Export on the old site and import on the new one from the Notes page |
