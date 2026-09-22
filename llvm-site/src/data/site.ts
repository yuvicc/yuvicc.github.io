import type { Phase, Toolchain } from '../content/schema.ts';

export const SITE_TITLE = 'LLVM and Clang in 30 Study Days';
export const SITE_DESCRIPTION =
  'A 30-session curriculum and private progress tracker for a C++ developer working toward a first Clang contribution.';
/** Bump when lesson IDs or required checks change; stored with progress and exports. */
export const CURRICULUM_VERSION = '2026-09-22';

export type PhaseInfo = {
  id: Phase;
  label: string;
  range: [number, number];
  summary: string;
};

export const PHASE_INFO: PhaseInfo[] = [
  {
    id: 'foundations',
    label: 'Compiler foundations',
    range: [1, 7],
    summary: 'Compiler concepts and a small expression frontend written in C++.',
  },
  {
    id: 'ir',
    label: 'LLVM IR',
    range: [8, 12],
    summary: 'Basic LLVM IR and an end-to-end compiled toy program.',
  },
  {
    id: 'clang',
    label: 'Clang frontend',
    range: [13, 21],
    summary: 'Clang source navigation, C++ diagnostics and regression tests.',
  },
  {
    id: 'contribution',
    label: 'First contribution',
    range: [22, 30],
    summary: 'Select, investigate, test and submit a small contribution.',
  },
];

export const phaseInfo = (id: Phase): PhaseInfo => PHASE_INFO.find((p) => p.id === id)!;

export const TOOLCHAIN_NOTES: Record<Toolchain, { label: string; text: string }> = {
  host: {
    label: 'Toolchain: your host C++ compiler',
    text: 'Today’s lab is the toy expression frontend. Any working C++ compiler builds it; no LLVM libraries are needed yet.',
  },
  llvm17: {
    label: 'Toolchain: LLVM 17',
    text: 'Use your LLVM 17 clang++, llvm-as and opt for book exercises, by explicit path. Use the matching archived documentation. Do not mix headers, libraries or plugins with your current-main build.',
  },
  main: {
    label: 'Toolchain: current-main build',
    text: 'Use build/bin/clang++ and build/bin/llvm-lit from your llvm-main checkout, not whichever clang++ is first on PATH. Reproduce upstream behavior on current main and record the commit SHA.',
  },
  both: {
    label: 'Toolchain: LLVM 17 and current main',
    text: 'Today touches both toolchains. Keep separate build directories and explicit executable paths: LLVM 17 for book exercises, build/bin/clang++ from current main for Clang work.',
  },
};

/** Build a site-relative URL that respects the configured base path. */
export function url(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
}

export const dayUrl = (slug: string) => url(`days/${slug}/`);
