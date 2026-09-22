import test from 'node:test';
import assert from 'node:assert/strict';
import { days } from '../src/data/course.ts';
import { questionsFor } from '../src/data/questions.ts';

test('course has 42 lessons and three buffers', () => {
  assert.equal(days.length, 45);
  assert.equal(days.filter((d) => d.kind === 'buffer').length, 3);
  assert.equal(new Set(days.map((d) => d.id)).size, 45);
});

test('every day has a passing quiz shape', () => {
  for (const day of days) {
    const quiz = questionsFor(day);
    assert.ok(quiz.length >= 8, day.id);
    for (const q of quiz) {
      assert.equal(q.options.filter((o) => o.correct).length, 1, q.id);
      assert.ok(q.options.every((o) => o.why), q.id);
    }
  }
});
