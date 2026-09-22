import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { days } from '../src/data/course.ts';
const dist = new URL('../dist/', import.meta.url).pathname;
const exists = async (route: string) => { try { await access(join(dist, route, 'index.html')); return true; } catch { return false; } };

test('all public routes were generated', async () => {
  for (const route of ['', 'roadmap', 'resources', 'progress']) assert.ok(await exists(route), route);
  for (const day of days) {
    assert.ok(await exists(`day/${day.id}`), day.id);
    assert.ok(await exists(`day/${day.id}/quiz`), `${day.id} quiz`);
    for (const task of ['1','2','3']) assert.ok(await exists(`day/${day.id}/task/${task}`), `${day.id}/${task}`);
  }
  for (let w=1; w<=6; w++) assert.ok(await exists(`week/${w}/project`), `week ${w}`);
});

test('built pages use the /learn-go base', async () => {
  const html = await readFile(join(dist, 'index.html'), 'utf8');
  assert.match(html, /\/learn-go\/roadmap\//);
  assert.doesNotMatch(html, /(?:href|src)="\/(?!learn-go\/|$)/);
});
