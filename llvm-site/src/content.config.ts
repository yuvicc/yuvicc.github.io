import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { studyDaySchema } from './content/schema.ts';

const days = defineCollection({
  loader: glob({ pattern: '[0-3][0-9].yaml', base: './src/content/days' }),
  schema: studyDaySchema,
});

export const collections = { days };
