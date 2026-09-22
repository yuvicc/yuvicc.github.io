import { z } from 'astro/zod';

export const PHASES = ['foundations', 'ir', 'clang', 'contribution'] as const;
export const TOOLCHAINS = ['host', 'llvm17', 'main', 'both'] as const;

const slugPattern = /^(0[1-9]|[12]\d|30)$/;

export const studyDaySchema = z
  .object({
    day: z.number().int().min(1).max(30),
    slug: z.string().regex(slugPattern),
    title: z.string().min(1),
    phase: z.enum(PHASES),
    // Which compiler the reader should have in hand for the day's lab.
    toolchain: z.enum(TOOLCHAINS),
    checkpoint: z.enum(['A', 'B', 'C', 'D']).optional(),
    prerequisites: z.array(z.number().int().min(1).max(30)),
    minutes: z.object({
      reading: z.number().int().nonnegative(),
      practice: z.number().int().nonnegative(),
      verification: z.number().int().nonnegative(),
      notes: z.number().int().nonnegative(),
    }),
    goals: z.array(z.string().min(1)).min(1),
    reading: z
      .array(
        z.object({
          resourceId: z.string().min(1),
          // Other registry entries covered by the same time budget.
          also: z.array(z.string().min(1)).optional(),
          section: z.string().min(1),
          minutes: z.number().int().positive().optional(),
          upTo: z.boolean().optional(),
        }),
      )
      .min(1),
    steps: z.array(z.string().min(1)).min(1),
    deliverable: z.string().min(1),
    checks: z
      .array(z.object({ id: z.string().regex(/^day-\d\d-[a-z]+$/), label: z.string().min(1), required: z.boolean() }))
      .min(1),
    recallQuestion: z.string().min(1),
    optional: z.array(z.string().min(1)).optional(),
  })
  .strict()
  .superRefine((d, ctx) => {
    if (d.slug !== String(d.day).padStart(2, '0')) {
      ctx.addIssue({ code: 'custom', message: `slug ${d.slug} does not match day ${d.day}` });
    }
    for (const c of d.checks) {
      if (!c.id.startsWith(`day-${d.slug}-`)) {
        ctx.addIssue({ code: 'custom', message: `check ${c.id} does not belong to day ${d.slug}` });
      }
    }
    if (new Set(d.checks.map((c) => c.id)).size !== d.checks.length) {
      ctx.addIssue({ code: 'custom', message: `duplicate check IDs on day ${d.slug}` });
    }
    if (!d.checks.some((c) => c.required)) {
      ctx.addIssue({ code: 'custom', message: `day ${d.slug} has no required checks` });
    }
    if (d.prerequisites.some((p) => p >= d.day)) {
      ctx.addIssue({ code: 'custom', message: `day ${d.slug} has a prerequisite that is not earlier` });
    }
    if (d.optional && !d.checks.some((c) => !c.required)) {
      ctx.addIssue({ code: 'custom', message: `day ${d.slug} lists optional work without an optional check` });
    }
  });

export type StudyDay = z.infer<typeof studyDaySchema>;
export type Phase = (typeof PHASES)[number];
export type Toolchain = (typeof TOOLCHAINS)[number];
