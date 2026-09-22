// Client behavior for every page: progress, notes, filters, theme, copy and backup.
// Lessons are fully rendered without this script; it only enhances.

import {
  LIMITS,
  THEMES,
  dayStatus,
  emptyEnvelope,
  nextIncompleteDay,
  serializeForExport,
  summarize,
  validateEnvelopeText,
  isValidIsoDate,
  type Envelope,
  type Manifest,
  type Theme,
} from '../lib/progress.ts';
import { formatLocalDate, localDateForDay, toLocalIso } from '../lib/schedule.ts';

const root = document.documentElement;
const STORAGE_KEY = root.dataset.storageKey!;
const BASE = root.dataset.base ?? '/';
const manifest: Manifest = JSON.parse(document.getElementById('curriculum-manifest')!.textContent || '{}');
const $all = <T extends Element = HTMLElement>(sel: string) => Array.from(document.querySelectorAll<T & Element>(sel)) as T[];

// ---------- storage ----------

function probeStorage(): Storage | null {
  try {
    const s = window.localStorage;
    const k = `${STORAGE_KEY}:probe`;
    s.setItem(k, '1');
    s.removeItem(k);
    return s;
  } catch {
    return null;
  }
}

const storage = probeStorage();
let storageProblem: string | null = storage
  ? null
  : 'Browser storage is unavailable here (private browsing or blocked site data), so progress and notes cannot be saved. Every lesson is still readable.';

function load(): Envelope {
  const fresh = emptyEnvelope(manifest.curriculumVersion);
  if (!storage) return fresh;
  let text: string | null = null;
  try {
    text = storage.getItem(STORAGE_KEY);
  } catch {
    return fresh;
  }
  if (!text) return fresh;
  const result = validateEnvelopeText(text, manifest);
  if (result.ok) return result.envelope;
  // Keep the unreadable copy rather than silently discarding it.
  try {
    storage.setItem(`${STORAGE_KEY}:unreadable-${Date.now()}`, text);
  } catch {}
  storageProblem = 'Saved progress could not be read and was set aside. Import a backup from the Notes page if you have one.';
  return fresh;
}

let env = load();

function save(): boolean {
  if (!storage) return false;
  try {
    env.curriculumVersion = manifest.curriculumVersion;
    storage.setItem(STORAGE_KEY, JSON.stringify(env));
    return true;
  } catch {
    storageProblem = 'Saving failed, possibly because browser storage is full. Export a backup from the Notes page.';
    showStorageWarnings();
    return false;
  }
}

function showStorageWarnings() {
  for (const el of $all('[data-storage-warning]')) {
    el.hidden = !storageProblem;
    el.textContent = storageProblem ?? '';
  }
}

// ---------- announcements ----------

const announcer = document.querySelector<HTMLElement>('[data-announcer]');
function announce(msg: string) {
  if (!announcer) return;
  announcer.textContent = '';
  window.setTimeout(() => (announcer.textContent = msg), 50);
}

// ---------- theme ----------

function applyTheme(theme: Theme) {
  if (theme === 'system') delete root.dataset.theme;
  else root.dataset.theme = theme;
  const label = theme[0].toUpperCase() + theme.slice(1);
  for (const btn of $all<HTMLButtonElement>('[data-theme-toggle]')) {
    btn.querySelector('[data-theme-label]')!.textContent = label;
    btn.setAttribute('aria-label', `Theme: ${label}. Change theme`);
  }
}

for (const btn of $all<HTMLButtonElement>('[data-theme-toggle]')) {
  btn.addEventListener('click', () => {
    const next = THEMES[(THEMES.indexOf(env.settings.theme) + 1) % THEMES.length];
    env.settings.theme = next;
    applyTheme(next);
    save();
    announce(`Theme set to ${next}`);
  });
}

// ---------- rendering progress ----------

const dayHref = (slug: string) => `${BASE.replace(/\/$/, '')}/days/${slug}/`;

function renderProgress() {
  const s = summarize(env, manifest);
  for (const el of $all('[data-overall-text]')) {
    el.textContent = `${s.completed} of ${s.total} days complete (${s.percent}%).`;
  }
  for (const el of $all('[data-overall-short]')) el.textContent = `· ${s.completed}/${s.total}`;
  for (const el of $all('[data-overall-bar]')) el.style.width = `${s.percent}%`;
  for (const el of $all('[data-phase-count]')) {
    const p = s.byPhase[el.dataset.phaseCount as keyof typeof s.byPhase];
    if (p) el.textContent = `${p.completed} of ${p.total} complete`;
  }

  for (const day of manifest.days) {
    const st = dayStatus(env, day);
    const state = st.complete ? 'complete' : st.started ? 'started' : 'todo';
    const text = st.complete ? 'Complete' : st.started ? `In progress, ${st.done} of ${st.total} checks` : 'Not started';
    for (const el of $all(`[data-day-status="${day.slug}"]`)) {
      el.dataset.state = state;
      el.textContent = text;
    }
    for (const el of $all(`[data-day-mark="${day.slug}"]`)) {
      el.innerHTML = '';
      if (st.complete) {
        el.append('✓');
        const sr = document.createElement('span');
        sr.className = 'visually-hidden';
        sr.textContent = ', complete';
        el.append(sr);
      } else if (st.started) {
        el.append('◐');
        const sr = document.createElement('span');
        sr.className = 'visually-hidden';
        sr.textContent = ', in progress';
        el.append(sr);
      }
    }
  }

  const next = nextIncompleteDay(env, manifest);
  const anyProgress = Object.keys(env.checks).length > 0;
  for (const a of $all<HTMLAnchorElement>('[data-continue]')) {
    const label = a.querySelector('[data-continue-label]')!;
    if (!next) {
      a.href = `${BASE.replace(/\/$/, '')}/roadmap/`;
      label.textContent = 'All 30 days complete. Review the roadmap';
    } else {
      a.href = dayHref(next.slug);
      label.textContent = anyProgress ? `Continue with day ${next.slug}: ${next.title}` : `Start with day ${next.slug}`;
    }
  }

  for (const el of $all('[data-planned-date]')) {
    const n = Number(el.dataset.plannedDate);
    const date = env.startDate ? localDateForDay(env.startDate, n) : null;
    el.textContent = date ? `Planned: ${formatLocalDate(date)}` : '';
  }
}

// ---------- checkboxes ----------

const checkboxes = $all<HTMLInputElement>('input[data-check-id]');
for (const box of checkboxes) {
  box.addEventListener('change', () => {
    const id = box.dataset.checkId!;
    if (box.checked) env.checks[id] = true;
    else delete env.checks[id];
    const saved = save();
    renderProgress();
    const day = manifest.days.find((d) => id.startsWith(`day-${d.slug}-`));
    if (day && saved) {
      const st = dayStatus(env, day);
      announce(st.complete ? `Day ${day.slug} complete.` : `${st.done} of ${st.total} required checks done for day ${day.slug}.`);
    }
  });
}

// ---------- notes ----------

const noteAreas = $all<HTMLTextAreaElement>('textarea[data-note-key]');
const noteTimers = new Map<string, number>();

function setNoteStatus(key: string, msg: string) {
  for (const el of $all(`[data-note-status="${key}"]`)) el.textContent = msg;
}

function renderNoteSummaries() {
  for (const el of $all('[data-note-summary]')) {
    const text = env.notes[el.dataset.noteSummary!] ?? '';
    el.textContent = text.trim() ? `· ${text.length.toLocaleString()} characters` : '';
  }
}

for (const area of noteAreas) {
  area.maxLength = LIMITS.maxNoteChars;
  area.addEventListener('input', () => {
    const key = area.dataset.noteKey!;
    setNoteStatus(key, 'Saving…');
    window.clearTimeout(noteTimers.get(key));
    noteTimers.set(
      key,
      window.setTimeout(() => {
        if (area.value) env.notes[key] = area.value;
        else delete env.notes[key];
        setNoteStatus(key, save() ? 'Saved in this browser' : 'Not saved');
        // Keep other copies of the same note (none on the same page today) in step.
        for (const other of noteAreas) if (other !== area && other.dataset.noteKey === key) other.value = area.value;
        renderNoteSummaries();
      }, 400),
    );
  });
}

for (const btn of $all<HTMLButtonElement>('[data-insert-template]')) {
  btn.addEventListener('click', () => {
    const area = noteAreas.find((a) => a.dataset.noteKey === btn.dataset.insertTemplate);
    if (!area) return;
    const tpl = area.dataset.noteTemplate ?? '';
    area.value = area.value.trim() ? `${area.value.replace(/\s*$/, '')}\n\n${tpl}` : tpl;
    area.dispatchEvent(new Event('input'));
    area.focus();
  });
}

// ---------- copy ----------

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function flash(btn: HTMLButtonElement, msg: string) {
  const original = btn.dataset.label ?? btn.innerHTML;
  btn.dataset.label = original;
  btn.textContent = msg;
  announce(msg);
  window.setTimeout(() => (btn.innerHTML = original), 1800);
}

for (const btn of $all<HTMLButtonElement>('[data-copy]')) {
  btn.addEventListener('click', async () => {
    const code = btn.closest('.code-block')?.querySelector('code')?.textContent ?? '';
    flash(btn, (await copyText(code)) ? 'Copied' : 'Copy failed. Select the text instead');
  });
}

for (const btn of $all<HTMLButtonElement>('[data-copy-note]')) {
  btn.addEventListener('click', async () => {
    const area = noteAreas.find((a) => a.dataset.noteKey === btn.dataset.copyNote);
    if (!area || !area.value) return flash(btn, 'Nothing to copy');
    flash(btn, (await copyText(area.value)) ? 'Notes copied' : 'Copy failed. Select the text instead');
  });
}

// ---------- roadmap filters ----------

const filterButtons = $all<HTMLButtonElement>('[data-filter]');
for (const btn of filterButtons) {
  btn.addEventListener('click', () => {
    const f = btn.dataset.filter!;
    for (const b of filterButtons) b.setAttribute('aria-pressed', String(b === btn));
    for (const g of $all('[data-phase-group]')) g.hidden = f !== 'all' && g.dataset.phaseGroup !== f;
    const status = document.querySelector('[data-filter-status]');
    const shown = $all('[data-phase-group]:not([hidden]) [data-day-row]').length;
    if (status) status.textContent = `Showing ${shown} days.`;
  });
}

// ---------- start date ----------

const startInput = document.querySelector<HTMLInputElement>('[data-start-date]');
const clearStart = document.querySelector<HTMLButtonElement>('[data-clear-start]');
const startStatus = document.querySelector<HTMLElement>('[data-start-status]');

function describeStart() {
  if (!startStatus) return;
  if (!env.startDate) return void (startStatus.textContent = 'No start date set.');
  const last = localDateForDay(env.startDate, 30)!;
  startStatus.textContent = `Day 30 falls on ${formatLocalDate(last)}.`;
}

startInput?.addEventListener('change', () => {
  const v = startInput.value;
  if (v && !isValidIsoDate(v)) return;
  env.startDate = v || null;
  save();
  describeStart();
  renderProgress();
});
clearStart?.addEventListener('click', () => {
  env.startDate = null;
  if (startInput) startInput.value = '';
  save();
  describeStart();
  renderProgress();
  announce('Start date cleared.');
});

// ---------- export, import, reset ----------

const backupStatus = document.querySelector<HTMLElement>('[data-backup-status]');
function setBackupStatus(msg: string, errors: string[] = []) {
  if (!backupStatus) return;
  backupStatus.textContent = msg;
  if (errors.length) {
    const ul = document.createElement('ul');
    for (const e of errors) {
      const li = document.createElement('li');
      li.textContent = e;
      ul.append(li);
    }
    backupStatus.append(ul);
  }
}

document.querySelector('[data-export]')?.addEventListener('click', () => {
  const blob = new Blob([serializeForExport(env)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `llvm-clang-30-progress-${toLocalIso(new Date())}.json`;
  document.body.append(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  setBackupStatus('Exported. Keep the file somewhere safe.');
});

const importInput = document.querySelector<HTMLInputElement>('[data-import]');
importInput?.addEventListener('change', async () => {
  const file = importInput.files?.[0];
  importInput.value = '';
  if (!file) return;
  if (file.size > LIMITS.maxImportChars * 4) {
    return setBackupStatus('Import rejected. Nothing was changed.', ['File is too large.']);
  }
  const result = validateEnvelopeText(await file.text(), manifest);
  if (!result.ok) return setBackupStatus('Import rejected. Nothing was changed.', result.errors);
  const incoming = result.envelope;
  const checks = Object.keys(incoming.checks).length;
  const notes = Object.keys(incoming.notes).length;
  const ok = window.confirm(
    `Replace everything stored in this browser with "${file.name}"?\n\n` +
      `The file has ${checks} checked items and ${notes} notes. Your current progress and notes will be overwritten. Export first if unsure.`,
  );
  if (!ok) return setBackupStatus('Import cancelled. Nothing was changed.');
  env = incoming;
  if (!save()) return setBackupStatus('The file was valid but could not be saved in this browser.');
  syncControls();
  setBackupStatus(`Imported ${checks} checked items and ${notes} notes.`);
});

document.querySelector('[data-reset]')?.addEventListener('click', () => {
  const ok = window.confirm(
    'Reset all progress, notes, the start date and theme in this browser?\n\nThis cannot be undone. Export a backup first if you might want it.',
  );
  if (!ok) return setBackupStatus('Reset cancelled. Nothing was changed.');
  env = emptyEnvelope(manifest.curriculumVersion);
  save();
  syncControls();
  setBackupStatus('Everything was reset.');
});

// ---------- sync and init ----------

function syncControls() {
  const writable = Boolean(storage);
  for (const box of checkboxes) {
    box.disabled = !writable;
    box.checked = env.checks[box.dataset.checkId!] === true;
  }
  for (const area of noteAreas) {
    area.disabled = !writable;
    if (document.activeElement !== area) area.value = env.notes[area.dataset.noteKey!] ?? '';
  }
  for (const el of $all<HTMLButtonElement | HTMLInputElement>(
    '[data-export], [data-import], [data-reset], [data-start-date], [data-clear-start], [data-insert-template]',
  )) {
    el.disabled = !writable;
  }
  if (startInput) startInput.value = env.startDate ?? '';
  applyTheme(env.settings.theme);
  describeStart();
  renderNoteSummaries();
  renderProgress();
  showStorageWarnings();
}

window.addEventListener('storage', (e) => {
  if (e.key !== STORAGE_KEY) return;
  env = load();
  syncControls();
});

syncControls();
