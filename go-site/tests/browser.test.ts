import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium, type Browser } from 'playwright-core';

const dist = new URL('../dist/', import.meta.url).pathname;
let server: Server, browser: Browser, origin: string;
const executablePath = process.env.CHROME_PATH;
before(async () => {
  if (!executablePath) return;
  server = createServer(async (req,res) => {
    const path = new URL(req.url || '/', 'http://x').pathname.replace(/^\/learn-go\/?/, '');
    let file = join(dist, path); try { if ((await stat(file)).isDirectory()) file = join(file,'index.html'); const body = await readFile(file); const type = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'}[extname(file)] || 'application/octet-stream'; res.writeHead(200,{'content-type':type}).end(body); } catch { res.writeHead(404).end(); }
  });
  await new Promise<void>((ok) => server.listen(0,'127.0.0.1',ok));
  const addr = server.address(); origin = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}/learn-go`;
  browser = await chromium.launch({ executablePath, headless: true });
});
after(async () => { await browser?.close(); server?.close(); });

test('quiz, tasks, persistence, and mobile layout work', { skip: !executablePath && 'no usable Chrome/Chromium found' }, async () => {
  const page = await browser.newPage({ viewport: { width: 360, height: 740 } });
  const errors: string[] = []; page.on('pageerror',(e)=>errors.push(e.message)); page.on('console',(m)=>m.type()==='error'&&errors.push(m.text()));
  await page.goto(`${origin}/day/05/`);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 0);
  const questions = page.locator('[data-question]'); assert.equal(await questions.count(), 10);
  for (let i=0;i<10;i++) await questions.nth(i).locator('input[data-correct=true]').check();
  await page.locator('[data-quiz] button[type=submit]').click();
  assert.match((await page.locator('[data-score]').textContent()) || '', /10\/10 · Passed/);
  await page.locator('[data-task-pass="05:warmup"]').click(); await page.locator('[data-task-pass="05:core"]').click();
  await page.locator('[data-note]').fill('Slices share a backing array.'); await page.waitForTimeout(350); await page.reload();
  assert.equal(await page.locator('[data-note]').inputValue(), 'Slices share a backing array.');
  await page.goto(`${origin}/`); assert.equal(await page.locator('[data-day="05"]').getAttribute('data-state'),'done');
  assert.deepEqual(errors, []); await page.close();
});
