// Progress envelope, validation and calculations. No DOM or storage access here,
// so the same code runs in the browser and in Node tests.

export const SCHEMA_VERSION = 1;
export const STORAGE_KEY = 'llvm-clang-30:progress:v1';
export const LIMITS = {
  /** Largest import accepted, in characters. */
  maxImportChars: 1_000_000,
  /** Longest single note accepted. */
  maxNoteChars: 20_000,
  maxCurriculumVersionChars: 64,
};

export type Theme = 'system' | 'light' | 'dark';
export const THEMES: readonly Theme[] = ['system', 'light', 'dark'];

export type PhaseId = 'foundations' | 'ir' | 'clang' | 'contribution';

export type Envelope = {
  schemaVersion: typeof SCHEMA_VERSION;
  curriculumVersion: string;
  startDate: string | null;
  settings: { theme: Theme };
  checks: Record<string, boolean>;
  notes: Record<string, string>;
  exportedAt?: string;
};

/** The subset of each lesson the client needs; rendered into every page as JSON. */
export type ManifestDay = {
  day: number;
  slug: string;
  title: string;
  phase: PhaseId;
  required: string[];
  optional: string[];
};

export type Manifest = { curriculumVersion: string; days: ManifestDay[] };

export const GENERAL_NOTE = 'general';
export const noteKeyForDay = (slug: string) => `day-${slug}`;

export function emptyEnvelope(curriculumVersion: string): Envelope {
  return {
    schemaVersion: SCHEMA_VERSION,
    curriculumVersion,
    startDate: null,
    settings: { theme: 'system' },
    checks: {},
    notes: {},
  };
}

export function dayStatus(env: Envelope, day: ManifestDay) {
  const done = day.required.filter((id) => env.checks[id] === true).length;
  const total = day.required.length;
  return { done, total, complete: done === total, started: done > 0 };
}

export const isDayComplete = (env: Envelope, day: ManifestDay) => dayStatus(env, day).complete;

export function summarize(env: Envelope, manifest: Manifest) {
  const byPhase: Record<PhaseId, { completed: number; total: number }> = {
    foundations: { completed: 0, total: 0 },
    ir: { completed: 0, total: 0 },
    clang: { completed: 0, total: 0 },
    contribution: { completed: 0, total: 0 },
  };
  let completed = 0;
  for (const day of manifest.days) {
    const p = byPhase[day.phase];
    p.total += 1;
    if (isDayComplete(env, day)) {
      p.completed += 1;
      completed += 1;
    }
  }
  const total = manifest.days.length;
  return { completed, total, percent: total ? Math.round((completed / total) * 100) : 0, byPhase };
}

/** Lowest-numbered incomplete day, or null when every day is complete. */
export function nextIncompleteDay(env: Envelope, manifest: Manifest): ManifestDay | null {
  const sorted = [...manifest.days].sort((a, b) => a.day - b.day);
  return sorted.find((d) => !isDayComplete(env, d)) ?? null;
}

export function isValidIsoDate(s: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(y, mo - 1, d);
  return date.getFullYear() === y && date.getMonth() === mo - 1 && date.getDate() === d;
}

export type ValidationResult = { ok: true; envelope: Envelope } | { ok: false; errors: string[] };

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const ALLOWED_KEYS = new Set(['schemaVersion', 'curriculumVersion', 'startDate', 'settings', 'checks', 'notes', 'exportedAt']);

/**
 * Validate untrusted JSON text (an import file or the stored value).
 * Returns a fresh envelope; never mutates existing state.
 */
export function validateEnvelopeText(text: string, manifest: Manifest): ValidationResult {
  if (typeof text !== 'string') return { ok: false, errors: ['Input is not text.'] };
  if (text.length > LIMITS.maxImportChars) {
    return { ok: false, errors: [`File is too large (limit ${LIMITS.maxImportChars.toLocaleString('en')} characters).`] };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, errors: ['File is not valid JSON.'] };
  }
  return validateEnvelope(raw, manifest);
}

export function validateEnvelope(raw: unknown, manifest: Manifest): ValidationResult {
  const errors: string[] = [];
  if (!isPlainObject(raw)) return { ok: false, errors: ['Top level must be a JSON object.'] };

  if (raw.schemaVersion !== SCHEMA_VERSION) {
    return { ok: false, errors: [`Unsupported schemaVersion ${JSON.stringify(raw.schemaVersion)}; expected ${SCHEMA_VERSION}.`] };
  }
  for (const key of Object.keys(raw)) {
    if (!ALLOWED_KEYS.has(key)) errors.push(`Unknown field "${key}".`);
  }

  const cv = raw.curriculumVersion;
  if (typeof cv !== 'string' || cv.length === 0 || cv.length > LIMITS.maxCurriculumVersionChars) {
    errors.push('curriculumVersion must be a short non-empty string.');
  }

  let startDate: string | null = null;
  if (raw.startDate !== undefined && raw.startDate !== null) {
    if (typeof raw.startDate !== 'string' || !isValidIsoDate(raw.startDate)) {
      errors.push('startDate must be null or a date in YYYY-MM-DD form.');
    } else startDate = raw.startDate;
  }

  let theme: Theme = 'system';
  if (raw.settings !== undefined) {
    if (!isPlainObject(raw.settings)) errors.push('settings must be an object.');
    else {
      for (const key of Object.keys(raw.settings)) {
        if (key !== 'theme') errors.push(`Unknown setting "${key}".`);
      }
      const t = raw.settings.theme;
      if (t !== undefined) {
        if (typeof t !== 'string' || !THEMES.includes(t as Theme)) errors.push('settings.theme must be system, light or dark.');
        else theme = t as Theme;
      }
    }
  }

  const knownChecks = new Set(manifest.days.flatMap((d) => [...d.required, ...d.optional]));
  const checks: Record<string, boolean> = {};
  if (raw.checks !== undefined) {
    if (!isPlainObject(raw.checks)) errors.push('checks must be an object.');
    else {
      for (const [id, value] of Object.entries(raw.checks)) {
        if (!knownChecks.has(id)) errors.push(`Unknown check ID "${truncate(id)}".`);
        else if (typeof value !== 'boolean') errors.push(`Check "${id}" must be true or false.`);
        else if (value) checks[id] = true;
      }
    }
  }

  const knownNotes = new Set([GENERAL_NOTE, ...manifest.days.map((d) => noteKeyForDay(d.slug))]);
  const notes: Record<string, string> = {};
  if (raw.notes !== undefined) {
    if (!isPlainObject(raw.notes)) errors.push('notes must be an object.');
    else {
      for (const [key, value] of Object.entries(raw.notes)) {
        if (!knownNotes.has(key)) errors.push(`Unknown note ID "${truncate(key)}".`);
        else if (typeof value !== 'string') errors.push(`Note "${key}" must be text.`);
        else if (value.length > LIMITS.maxNoteChars) errors.push(`Note "${key}" exceeds ${LIMITS.maxNoteChars.toLocaleString('en')} characters.`);
        else if (value.length > 0) notes[key] = value;
      }
    }
  }

  if (raw.exportedAt !== undefined && (typeof raw.exportedAt !== 'string' || raw.exportedAt.length > 64)) {
    errors.push('exportedAt must be a short string.');
  }

  if (errors.length) return { ok: false, errors: errors.slice(0, 20) };
  return {
    ok: true,
    envelope: {
      schemaVersion: SCHEMA_VERSION,
      curriculumVersion: cv as string,
      startDate,
      settings: { theme },
      checks,
      notes,
    },
  };
}

export function serializeForExport(env: Envelope, now = new Date()): string {
  const out: Envelope = { ...env, exportedAt: now.toISOString() };
  return JSON.stringify(out, null, 2);
}

function truncate(s: string, n = 40) {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}
