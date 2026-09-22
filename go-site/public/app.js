(() => {
  const KEY = 'go45.progress.v1';
  const fresh = () => ({ version: 1, learnerName: '', startedAt: '', days: {}, settings: { theme: 'dark' } });
  const load = () => { try { const x = JSON.parse(localStorage.getItem(KEY) || 'null'); return x?.version === 1 ? x : fresh(); } catch { return fresh(); } };
  let state = load();
  const save = () => localStorage.setItem(KEY, JSON.stringify(state));
  const complete = (d) => d?.quiz?.best >= .7 && d?.tasks?.warmup === 'pass' && d?.tasks?.core === 'pass';
  const finalize = (id) => { const day = state.days[id]; if (complete(day) && !day.completedAt) day.completedAt = new Date().toISOString(); };
  const announce = (s) => { const el = document.querySelector('[data-announcer]'); if (el) el.textContent = s; };

  document.querySelector('[data-theme-toggle]')?.addEventListener('click', () => {
    state.settings ||= { theme: 'dark' };
    state.settings.theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = state.settings.theme; save();
  });
  const dayCards = [...document.querySelectorAll('[data-day]')];
  for (const card of dayCards) {
    const d = state.days[card.dataset.day];
    card.dataset.state = complete(d) ? 'done' : d ? 'partial' : 'new';
  }
  const numbered = dayCards.filter((x) => /^\d+$/.test(x.dataset.day));
  const next = numbered.find((x) => x.dataset.state !== 'done');
  for (const link of document.querySelectorAll('[data-continue]')) {
    if (next) { link.href = next.href; link.querySelector('[data-continue-text]').textContent = `${Object.keys(state.days).length ? 'Continue' : 'Start'} Day ${Number(next.dataset.day)}`; }
  }
  const completed = Object.values(state.days).filter(complete).length;
  document.querySelectorAll('[data-completed-count]').forEach((x) => x.textContent = completed);
  const scores = Object.values(state.days).flatMap((d) => d.quiz ? [d.quiz.best] : []);
  document.querySelectorAll('[data-average]').forEach((x) => x.textContent = scores.length ? `${Math.round(scores.reduce((a,b)=>a+b,0)/scores.length*100)}%` : '—');

  const name = document.querySelector('[data-name]');
  if (name) { name.value = state.learnerName || ''; name.addEventListener('change', () => { state.learnerName = name.value.trim().slice(0, 40); save(); }); }
  document.querySelectorAll('[data-greeting-name]').forEach((x) => x.textContent = state.learnerName ? `, ${state.learnerName}` : '');

  const note = document.querySelector('[data-note]');
  if (note) { const id = note.dataset.note; note.value = state.days[id]?.note || ''; let t; note.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { state.days[id] ||= {}; state.days[id].note = note.value.slice(0, 2000); save(); announce('Reflection saved'); }, 250); }); }

  document.querySelector('[data-export]')?.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({...state, exportedAt: new Date().toISOString()}, null, 2)], {type:'application/json'});
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'go45-progress.json' }); a.click(); URL.revokeObjectURL(a.href);
  });
  document.querySelector('[data-import]')?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0]; if (!file || file.size > 1_000_000) return announce('That backup cannot be imported.');
    try { const x = JSON.parse(await file.text()); if (x.version !== 1 || typeof x.days !== 'object') throw Error(); state = x; save(); location.reload(); } catch { announce('That file is not a valid Go in 45 Days backup.'); }
  });
  document.querySelector('[data-reset]')?.addEventListener('click', () => {
    if (confirm('Reset all saved course progress on this browser?')) { state = fresh(); save(); location.reload(); }
  });

  const quiz = document.querySelector('[data-quiz]');
  if (quiz) {
    const id = quiz.dataset.quiz; const questions = [...quiz.querySelectorAll('[data-question]')];
    quiz.addEventListener('submit', (e) => {
      e.preventDefault(); let right = 0; const wrong = [];
      questions.forEach((q) => { const chosen = q.querySelector('input:checked'); const ok = chosen?.dataset.correct === 'true'; q.dataset.result = ok ? 'right' : 'wrong'; const feedback = q.querySelector('[data-feedback]'); feedback.textContent = chosen?.dataset.why || 'Choose an answer first.'; feedback.hidden = false; if (ok) right++; else wrong.push(q.dataset.question); });
      const score = right / questions.length; const day = state.days[id] ||= {}; const old = day.quiz;
      day.quiz = { first: old?.first ?? score, best: Math.max(old?.best ?? 0, score), attempts: (old?.attempts ?? 0) + 1, wrong }; finalize(id); save();
      const out = quiz.querySelector('[data-score]'); out.hidden = false; out.textContent = `${right}/${questions.length} · ${score >= .7 ? 'Passed' : 'Keep going — 70% passes'}`; out.focus();
    });
  }
  document.querySelectorAll('[data-task-pass]').forEach((button) => button.addEventListener('click', () => {
    const [id, task] = button.dataset.taskPass.split(':'); const day = state.days[id] ||= {}; day.tasks ||= {}; day.tasks[task] = 'pass'; finalize(id); save(); button.textContent = 'Passed ✓'; button.disabled = true; announce(`${task} task marked passed`);
  }));
  document.querySelectorAll('[data-task-pass]').forEach((button) => {
    const [id, task] = button.dataset.taskPass.split(':');
    if (state.days[id]?.tasks?.[task] === 'pass') { button.textContent = 'Passed ✓'; button.disabled = true; }
  });

  const search = document.querySelector('[data-roadmap-search]');
  if (search) {
    const rows = [...document.querySelectorAll('.roadmap-day')];
    const apply = () => { const q = search.value.trim().toLowerCase(); rows.forEach((row) => row.hidden = q && !row.textContent.toLowerCase().includes(q)); };
    search.addEventListener('input', apply);
    document.addEventListener('keydown', (e) => { if (e.key === '/' && document.activeElement !== search) { e.preventDefault(); search.focus(); } });
  }
})();
