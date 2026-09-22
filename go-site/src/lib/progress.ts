export const STORAGE_KEY = 'go45.progress.v1';
export type TaskState = 'attempted' | 'pass';
export type DayProgress = {
  quiz?: { best: number; first: number; attempts: number; wrong: string[] };
  tasks?: Record<string, TaskState>;
  note?: string;
  completedAt?: string;
  minutes?: number;
};
export type Progress = {
  version: 1;
  learnerName: string;
  startedAt: string;
  days: Record<string, DayProgress>;
  settings: { theme: 'dark' | 'light' };
};
export const emptyProgress = (): Progress => ({ version: 1, learnerName: '', startedAt: '', days: {}, settings: { theme: 'dark' } });
export function isComplete(day?: DayProgress) {
  return Boolean(day?.quiz && day.quiz.best >= 0.7 && day.tasks?.warmup === 'pass' && day.tasks?.core === 'pass');
}
export function validateProgress(value: unknown): value is Progress {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  return v.version === 1 && typeof v.learnerName === 'string' && typeof v.startedAt === 'string' && Boolean(v.days && typeof v.days === 'object');
}
