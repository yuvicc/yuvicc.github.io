// One end-to-end browser flow over the production build, using an installed Chrome/Chromium.
// Set CHROME_PATH to override the browser location. Run `npm run build` first.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { chromium, type Browser, type Page } from 'playwright-core';
import { startServer } from './serve.ts';
import { BASE_PATH } from '../site.config.mjs';

const candidates = [process.env.CHROME_PATH, '/usr/bin/google-chrome', '/usr/bin/chromium-browser', '/usr/bin/chromium'];
const executablePath = candidates.find((p) => p && existsSync(p));

let browser: Browser;
let origin: string;
let close: () => void;
const errors: string[] = [];

before(async () => {
  const s = await startServer();
  origin = s.origin + BASE_PATH.replace(/\/$/, '');
  close = () => s.server.close();
  browser = await chromium.launch({ executablePath, headless: true });
});

after(async () => {
  await browser?.close();
  close?.();
});

async function newPage(opts: Parameters<Browser['newContext']>[0] = {}): Promise<Page> {
  const context = await browser.newContext({ acceptDownloads: true, ...opts });
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`));
  return page;
}

test('completion, refresh, continue, notes and export/import round-trip', { skip: !executablePath && 'no Chrome found' }, async () => {
  const page = await newPage();
  await page.goto(`${origin}/days/01/`);

  const required = page.locator('fieldset').first().locator('input[type=checkbox]');
  assert.equal(await required.count(), 4);
  // The optional check must not complete the day.
  await page.locator('input[data-check-id="day-01-optional"]').check();
  for (let i = 0; i < 3; i++) await required.nth(i).check();
  assert.match((await page.locator('[data-day-status="01"]').first().textContent()) ?? '', /In progress, 3 of 4/);
  await required.nth(3).check();
  assert.equal(await page.locator('[data-day-status="01"]').first().textContent(), 'Complete');

  await page.locator('textarea[data-note-key="day-01"]').fill('Pipeline note: <script>alert(1)</script>');
  await page.waitForFunction(() => document.querySelector('[data-note-status="day-01"]')?.textContent === 'Saved in this browser');

  await page.reload();
  for (let i = 0; i < 4; i++) assert.ok(await required.nth(i).isChecked());
  assert.equal(await page.locator('textarea[data-note-key="day-01"]').inputValue(), 'Pipeline note: <script>alert(1)</script>');

  await page.goto(`${origin}/`);
  assert.equal(await page.locator('[data-continue]').getAttribute('href'), `${BASE_PATH}days/02/`);
  assert.match((await page.locator('[data-overall-text]').first().textContent()) ?? '', /^1 of 30 days complete/);

  // Export
  await page.goto(`${origin}/notes/`);
  const [download] = await Promise.all([page.waitForEvent('download'), page.locator('[data-export]').click()]);
  const exported = readFileSync((await download.path())!, 'utf8');
  const data = JSON.parse(exported);
  assert.equal(data.schemaVersion, 1);
  assert.equal(data.checks['day-01-done'], true);
  assert.equal(data.notes['day-01'], 'Pipeline note: <script>alert(1)</script>');

  // Reset (confirmed), then import the export back.
  page.on('dialog', (d) => d.accept());
  await page.locator('[data-reset]').click();
  await page.goto(`${origin}/days/01/`);
  assert.equal(await required.nth(0).isChecked(), false);

  await page.goto(`${origin}/notes/`);
  await page.locator('[data-import]').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(exported) });
  await page.waitForFunction(() => /Imported/.test(document.querySelector('[data-backup-status]')?.textContent ?? ''));

  // A malformed import leaves the current state alone.
  const bad = JSON.stringify({ ...data, checks: { 'day-99-read': true } });
  await page.locator('[data-import]').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from(bad) });
  await page.waitForFunction(() => /rejected/.test(document.querySelector('[data-backup-status]')?.textContent ?? ''));

  await page.goto(`${origin}/days/01/`);
  for (let i = 0; i < 4; i++) assert.ok(await required.nth(i).isChecked());
  assert.equal(await page.locator('textarea[data-note-key="day-01"]').inputValue(), 'Pipeline note: <script>alert(1)</script>');
  await page.context().close();
});

test('start date shows local planned dates', { skip: !executablePath && 'no Chrome found' }, async () => {
  const page = await newPage({ timezoneId: 'Pacific/Auckland' });
  await page.goto(`${origin}/notes/`);
  await page.locator('[data-start-date]').fill('2026-09-22');
  await page.goto(`${origin}/days/30/`);
  assert.equal(await page.locator('[data-planned-date="30"]').textContent(), 'Planned: Wed, Oct 21, 2026');
  await page.context().close();
});

test('roadmap phase filters', { skip: !executablePath && 'no Chrome found' }, async () => {
  const page = await newPage();
  await page.goto(`${origin}/roadmap/`);
  await page.locator('[data-filter="ir"]').click();
  assert.equal(await page.locator('[data-phase-group]:visible [data-day-row]').count(), 5);
  assert.equal(await page.locator('[data-filter="ir"]').getAttribute('aria-pressed'), 'true');
  await page.locator('[data-filter="all"]').click();
  assert.equal(await page.locator('[data-phase-group]:visible [data-day-row]').count(), 30);
  await page.context().close();
});

test('lessons read without JavaScript and without storage', { skip: !executablePath && 'no Chrome found' }, async () => {
  const noJs = await newPage({ javaScriptEnabled: false });
  await noJs.goto(`${origin}/days/15/`);
  assert.ok(await noJs.getByRole('heading', { name: 'Done when' }).isVisible());
  assert.ok(await noJs.getByText('Progress tracking needs JavaScript').isVisible());
  await noJs.context().close();

  const noStorage = await newPage();
  await noStorage.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('blocked', 'SecurityError');
      },
    });
  });
  await noStorage.goto(`${origin}/days/15/`);
  assert.ok(await noStorage.getByRole('heading', { name: 'Recall question' }).isVisible());
  assert.ok(await noStorage.locator('input[data-check-id="day-15-read"]').isDisabled());
  assert.match((await noStorage.locator('[data-storage-warning]').textContent()) ?? '', /unavailable/);
  await noStorage.context().close();
});

test('no horizontal overflow at 360px and keyboard access', { skip: !executablePath && 'no Chrome found' }, async () => {
  const page = await newPage({ viewport: { width: 360, height: 740 } });
  for (const route of ['/', '/roadmap/', '/days/05/', '/days/27/', '/resources/', '/setup/', '/contributing/', '/notes/', '/about/']) {
    await page.goto(origin + route);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(overflow <= 0, `${route} overflows by ${overflow}px`);
  }
  await page.goto(`${origin}/days/05/`);
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement?.textContent), 'Skip to content');
  await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'main');
  await page.locator('input[data-check-id="day-05-read"]').focus();
  await page.keyboard.press('Space');
  assert.ok(await page.locator('input[data-check-id="day-05-read"]').isChecked());
  await page.context().close();
});

test('no console or page errors', () => {
  assert.deepEqual(errors, []);
});
