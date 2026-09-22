import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LIMITS,
  SCHEMA_VERSION,
  emptyEnvelope,
  dayStatus,
  nextIncompleteDay,
  serializeForExport,
  summarize,
  validateEnvelopeText,
  type Manifest,
  type PhaseId,
} from '../../src/lib/progress.ts';
import { localDateForDay, toLocalIso } from '../../src/lib/schedule.ts';

const phaseFor = (n: number): PhaseId => (n <= 7 ? 'foundations' : n <= 12 ? 'ir' : n <= 21 ? 'clang' : 'contribution');
const manifest: Manifest = {
  curriculumVersion: 'test',
  days: Array.from({ length: 30 }, (_, i) => {
    const slug = String(i + 1).padStart(2, '0');
    return {
      day: i + 1,
      slug,
      title: `Day ${slug}`,
      phase: phaseFor(i + 1),
      required: ['read', 'lab', 'done', 'recall'].map((k) => `day-${slug}-${k}`),
      optional: i % 5 === 0 ? [`day-${slug}-optional`] : [],
    };
  }),
};

const completeDay = (checks: Record<string, boolean>, slug: string) => {
  for (const k of ['read', 'lab', 'done', 'recall']) checks[`day-${slug}-${k}`] = true;
};

test('a day is complete only when every required check passes', () => {
  const env = emptyEnvelope('test');
  const day = manifest.days[0];
  env.checks['day-01-read'] = true;
  env.checks['day-01-lab'] = true;
  env.checks['day-01-recall'] = true;
  assert.deepEqual(dayStatus(env, day), { done: 3, total: 4, complete: false, started: true });
  env.checks['day-01-done'] = true;
  assert.equal(dayStatus(env, day).complete, true);
});

test('optional checks never count toward completion or percentages', () => {
  const env = emptyEnvelope('test');
  env.checks['day-01-optional'] = true;
  env.checks['day-06-optional'] = true;
  assert.equal(dayStatus(env, manifest.days[0]).started, false);
  assert.equal(summarize(env, manifest).completed, 0);
});

test('summary counts completed days, percent and per-phase totals', () => {
  const env = emptyEnvelope('test');
  for (const s of ['01', '02', '08', '30']) completeDay(env.checks, s);
  const s = summarize(env, manifest);
  assert.equal(s.completed, 4);
  assert.equal(s.total, 30);
  assert.equal(s.percent, 13);
  assert.deepEqual(s.byPhase, {
    foundations: { completed: 2, total: 7 },
    ir: { completed: 1, total: 5 },
    clang: { completed: 0, total: 9 },
    contribution: { completed: 1, total: 9 },
  });
});

test('continue opens the lowest incomplete day, even with later days done', () => {
  const env = emptyEnvelope('test');
  assert.equal(nextIncompleteDay(env, manifest)?.slug, '01');
  completeDay(env.checks, '01');
  completeDay(env.checks, '03');
  assert.equal(nextIncompleteDay(env, manifest)?.slug, '02');
  for (const d of manifest.days) completeDay(env.checks, d.slug);
  assert.equal(nextIncompleteDay(env, manifest), null);
});

test('export and import round-trip without losing data', () => {
  const env = emptyEnvelope('test');
  completeDay(env.checks, '05');
  env.checks['day-06-optional'] = true;
  env.notes['day-05'] = 'Parser <b>handles</b> "quotes"\nand newlines';
  env.notes.general = 'SHA abc123';
  env.startDate = '2026-10-01';
  env.settings.theme = 'dark';
  const text = serializeForExport(env, new Date('2026-09-22T10:00:00Z'));
  assert.equal(JSON.parse(text).exportedAt, '2026-09-22T10:00:00.000Z');
  const result = validateEnvelopeText(text, manifest);
  assert.ok(result.ok);
  assert.deepEqual(result.envelope, env);
});

test('invalid imports are rejected with reasons', () => {
  const good = JSON.parse(serializeForExport(emptyEnvelope('test')));
  const cases: [string, unknown][] = [
    ['not JSON', '{nope'],
    ['array top level', []],
    ['unsupported schema', { ...good, schemaVersion: 2 }],
    ['missing schema', { ...good, schemaVersion: undefined }],
    ['unknown day ID', { ...good, checks: { 'day-31-read': true } }],
    ['non-boolean check', { ...good, checks: { 'day-01-read': 'yes' } }],
    ['unknown note', { ...good, notes: { 'day-99': 'x' } }],
    ['non-string note', { ...good, notes: { 'day-01': 5 } }],
    ['bad start date', { ...good, startDate: '2026-02-30' }],
    ['bad theme', { ...good, settings: { theme: 'neon' } }],
    ['unknown field', { ...good, extra: 1 }],
    ['long note', { ...good, notes: { general: 'x'.repeat(LIMITS.maxNoteChars + 1) } }],
  ];
  for (const [name, value] of cases) {
    const text = typeof value === 'string' ? value : JSON.stringify(value);
    const result = validateEnvelopeText(text, manifest);
    assert.equal(result.ok, false, name);
    if (!result.ok) assert.ok(result.errors.length > 0, name);
  }
});

test('oversized input is rejected before parsing', () => {
  const result = validateEnvelopeText(' '.repeat(LIMITS.maxImportChars + 1), manifest);
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.errors[0], /too large/);
});

test('a minimal valid envelope fills defaults', () => {
  const result = validateEnvelopeText(JSON.stringify({ schemaVersion: SCHEMA_VERSION, curriculumVersion: 'old' }), manifest);
  assert.ok(result.ok);
  assert.deepEqual(result.envelope.checks, {});
  assert.equal(result.envelope.settings.theme, 'system');
  assert.equal(result.envelope.startDate, null);
});

test('start dates map to local calendar dates without UTC shifts', () => {
  assert.equal(toLocalIso(localDateForDay('2026-09-22', 1)!), '2026-09-22');
  assert.equal(toLocalIso(localDateForDay('2026-09-22', 30)!), '2026-10-21');
  // Across a month end, a leap day and a typical DST change.
  assert.equal(toLocalIso(localDateForDay('2028-02-20', 10)!), '2028-02-29');
  assert.equal(toLocalIso(localDateForDay('2026-10-20', 14)!), '2026-11-02');
  assert.equal(localDateForDay('2026-13-01', 1), null);
});
