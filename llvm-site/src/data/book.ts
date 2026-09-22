// Book chapter assignments for Learn LLVM 17 (R1), kept separate from lesson copy.
// Chapters only; the plan deliberately gives no page numbers.

export type BookAssignment = { chapter: string; when: string; purpose: string; days: number[] };

export const BOOK_MAP: BookAssignment[] = [
  { chapter: 'Chapter 1', when: 'Day 2', purpose: 'Toolchain setup and build choices', days: [2] },
  { chapter: 'Chapter 2', when: 'Days 1 and 3–6', purpose: 'Core compiler stages and expression language', days: [1, 3, 4, 5, 6] },
  { chapter: 'Chapter 3', when: 'Days 4–7', purpose: 'Selected parser, AST and semantic-checking sections', days: [4, 5, 6, 7] },
  { chapter: 'Chapter 4', when: 'Days 8–10', purpose: 'Core IR generation and driver material', days: [8, 9, 10] },
  { chapter: 'Chapter 5', when: 'Day 12', purpose: 'Overview of aggregates and ABI; deeper work later', days: [12] },
  { chapter: 'Chapter 7', when: 'Day 11', purpose: 'Pass-manager overview; implementing a pass is optional later', days: [11] },
  { chapter: 'Chapter 8', when: 'Day 17', purpose: 'TableGen basics to read diagnostic definitions', days: [17] },
  { chapter: 'Chapter 6 and remaining advanced chapters', when: 'After day 30', purpose: 'Read when required by a chosen project', days: [] },
];
