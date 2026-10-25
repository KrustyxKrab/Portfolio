import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use a lowercase URL slug, e.g. mein-projekt.');
const fields = {
  title: z.string(), slug, description: z.string(), date: z.coerce.date(), parent: slug,
  draft: z.boolean(), icon: z.string(), layout: z.enum(['text', 'list', 'gallery']),
  order: z.number(), nav: z.boolean(), deskIcon: z.boolean(),
  desktopX: z.number().min(0).max(100), desktopY: z.number().min(0).max(100),
  width: z.number().min(280).max(1200), height: z.number().min(200).max(1000),
  x: z.number(), y: z.number(),
  entries: z.array(z.object({
    heading: z.string(), subheading: z.string().optional(), date: z.string().optional(),
    detail: z.string().optional(), body: z.string().optional(),
    icon: z.string().optional(), href: z.string().optional(), note: slug.optional(),
  })),
  items: z.array(z.object({
    label: z.string(), href: z.string().optional(), image: z.string().optional(),
    note: z.string().optional(), target: slug.optional(),
  })),
};
const optionalFields = z.object(fields).partial();
const windows = defineCollection({
  loader: glob({
    pattern: ['**/*.md', '!**/_*/**', '!**/_*.md'], base: './src/content/windows',
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: optionalFields.extend({
    title: fields.title, draft: fields.draft.default(false), icon: fields.icon.default('journal'),
    layout: fields.layout.default('text'), order: fields.order.default(100),
    width: fields.width.default(580), height: fields.height.default(440),
    x: fields.x.default(64), y: fields.y.default(62),
    entries: fields.entries.default([]), items: fields.items.default([]),
  }),
});
// No defaults here: an absent translated field must inherit its base value.
const windowTranslations = defineCollection({
  loader: glob({ pattern: ['**/*.md', '!**/_*/**', '!**/_*.md'], base: './src/content/translations/en', generateId: ({ entry }) => entry.replace(/\.md$/, '') }),
  schema: optionalFields,
});
const careerNotes = defineCollection({
  loader: glob({
    pattern: ['de/*.md', 'en/*.md'], base: './src/content/career',
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: z.object({ draft: z.boolean().default(false) }),
});
export const collections = { windows, windowTranslations, careerNotes };
