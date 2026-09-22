import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { parse } from 'yaml';
import { studyDaySchema, type StudyDay } from '../../src/content/schema.ts';
import { hasResource, RESOURCES } from '../../src/data/resources.ts';
import { PHASE_INFO } from '../../src/data/site.ts';
import { BOOK_MAP } from '../../src/data/book.ts';

const dir = new URL('../../src/content/days/', import.meta.url);
const files = readdirSync(dir).filter((f) => f.endsWith('.yaml')).sort();
const days: StudyDay[] = files.map((f) => {
  const result = studyDaySchema.safeParse(parse(readFileSync(new URL(f, dir), 'utf8')));
  if (!result.success) throw new Error(`${f}: ${result.error.message}`);
  assert.equal(`${result.data.slug}.yaml`, f, `${f} file name must match its slug`);
  return result.data;
});

test('there are exactly 30 days numbered 1 to 30', () => {
  assert.equal(days.length, 30);
  assert.deepEqual(
    days.map((d) => d.day),
    Array.from({ length: 30 }, (_, i) => i + 1),
  );
});

test('check IDs are unique across the curriculum and follow day-NN-kind', () => {
  const ids = days.flatMap((d) => d.checks.map((c) => c.id));
  assert.equal(new Set(ids).size, ids.length);
  for (const d of days) {
    for (const kind of ['read', 'lab', 'done', 'recall']) {
      const c = d.checks.find((x) => x.id === `day-${d.slug}-${kind}`);
      assert.ok(c?.required, `day ${d.slug} needs required check ${kind}`);
    }
  }
});

test('the written completion criterion is preserved in a required check', () => {
  for (const d of days) {
    const done = d.checks.find((c) => c.id === `day-${d.slug}-done`)!;
    assert.equal(done.label, `Done when: ${d.deliverable}`);
  }
});

test('optional work has only non-required checks', () => {
  for (const d of days) {
    const optionalChecks = d.checks.filter((c) => !c.required);
    assert.equal(optionalChecks.length > 0, Boolean(d.optional?.length), `day ${d.slug}`);
  }
});

test('every reading assignment resolves in the resource registry', () => {
  for (const d of days) {
    for (const r of d.reading) {
      assert.ok(hasResource(r.resourceId), `day ${d.slug}: ${r.resourceId}`);
      for (const id of r.also ?? []) assert.ok(hasResource(id), `day ${d.slug}: ${id}`);
    }
  }
});

test('R1 through R20 are all registered with links', () => {
  for (let i = 1; i <= 20; i++) {
    const res = RESOURCES.find((r) => r.id === `R${i}`);
    assert.ok(res, `R${i}`);
    assert.ok(res.links.length > 0 && res.links.every((l) => l.url.startsWith('https://')), `R${i} links`);
  }
});

test('phases match the plan ranges and prerequisites point backwards', () => {
  for (const d of days) {
    const phase = PHASE_INFO.find((p) => d.day >= p.range[0] && d.day <= p.range[1])!;
    assert.equal(d.phase, phase.id, `day ${d.slug}`);
    for (const p of d.prerequisites) assert.ok(p < d.day);
  }
});

test('each session totals 150 minutes', () => {
  for (const d of days) {
    const m = d.minutes;
    assert.equal(m.reading + m.practice + m.verification + m.notes, 150, `day ${d.slug}`);
  }
});

test('checkpoints fall on days 7, 12, 21 and 30', () => {
  assert.deepEqual(
    days.filter((d) => d.checkpoint).map((d) => [d.day, d.checkpoint]),
    [
      [7, 'A'],
      [12, 'B'],
      [21, 'C'],
      [30, 'D'],
    ],
  );
});

test('book map refers to real days', () => {
  for (const b of BOOK_MAP) for (const n of b.days) assert.ok(n >= 1 && n <= 30);
});
