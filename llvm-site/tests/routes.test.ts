// Route and link smoke check over the production build (run `npm run build` first).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'yaml';
import { DIST, resolveFile } from './serve.ts';
import { BASE_PATH, SITE_ORIGIN } from '../site.config.mjs';

const days = Array.from({ length: 30 }, (_, i) => String(i + 1).padStart(2, '0'));
const ROUTES = ['', 'roadmap/', 'resources/', 'setup/', 'contributing/', 'notes/', 'about/', ...days.map((d) => `days/${d}/`)];

async function htmlFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await htmlFiles(p)));
    else if (entry.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const decode = (s: string) => s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');

test('every required route exists', async () => {
  for (const route of ROUTES) {
    assert.ok(await resolveFile(BASE_PATH + route), `missing ${route || 'home'}`);
  }
});

test('internal links and fragments resolve', async () => {
  const pages = await htmlFiles(DIST);
  const idsByFile = new Map<string, Set<string>>();
  const idsOf = async (file: string) => {
    if (!idsByFile.has(file)) {
      const html = await readFile(file, 'utf8');
      idsByFile.set(file, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
    }
    return idsByFile.get(file)!;
  };
  const problems: string[] = [];
  for (const page of pages) {
    const html = await readFile(page, 'utf8');
    const pagePath = BASE_PATH + relative(DIST, page).replace(/index\.html$/, '');
    for (const [, raw] of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
      const href = decode(raw);
      if (/^(https?:|mailto:)/.test(href)) continue;
      if (href === '/') continue; // the parent site on the same origin
      const url = new URL(href, `http://x${pagePath}`);
      const file = await resolveFile(url.pathname);
      if (!file) {
        problems.push(`${pagePath} → ${href}`);
        continue;
      }
      if (url.hash && file.endsWith('.html')) {
        const id = decodeURIComponent(url.hash.slice(1));
        if (!(await idsOf(file)).has(id)) problems.push(`${pagePath} → ${href} (no #${id})`);
      }
    }
  }
  assert.deepEqual(problems, []);
});

test('canonical URLs and sitemap use the configured public origin', async () => {
  for (const route of ROUTES) {
    const html = await readFile((await resolveFile(BASE_PATH + route))!, 'utf8');
    const m = /<link rel="canonical" href="([^"]+)"/.exec(html);
    assert.equal(m?.[1], new URL(BASE_PATH + route, SITE_ORIGIN).href);
  }
  const sitemap = await readFile(join(DIST, 'sitemap-0.xml'), 'utf8');
  for (const route of ROUTES) assert.ok(sitemap.includes(`<loc>${new URL(BASE_PATH + route, SITE_ORIGIN).href}</loc>`), route);
});

test('lesson content is in the static HTML, readable without JavaScript', async () => {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  for (const slug of days) {
    const data = parse(readFileSync(new URL(`../src/content/days/${slug}.yaml`, import.meta.url), 'utf8'));
    const html = decode(await readFile(join(DIST, 'days', slug, 'index.html'), 'utf8'));
    const plain = (s: string) => decode(esc(s.replace(/`/g, '')));
    const text = html.replace(/<\/?code>/g, '');
    assert.ok(text.includes(plain(data.title)), `${slug} title`);
    assert.ok(text.includes(plain(data.recallQuestion)), `${slug} recall`);
    for (const step of data.steps) assert.ok(text.includes(plain(step)), `${slug} step: ${step}`);
    assert.ok(text.includes(plain(data.deliverable)), `${slug} deliverable`);
  }
});
