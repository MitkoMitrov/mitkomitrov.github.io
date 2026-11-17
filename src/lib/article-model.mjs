import {z} from 'astro/zod';

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const articleSchema = z.object({
  articleId: slug,
  slug,
  title: z.string().min(5).max(160),
  summary: z.string().min(20).max(300),
  topic: z.string().min(1).max(40),
  tags: z.array(z.string().min(1).max(40)).min(1).max(8),
  author: z.literal('Mitko Mitrov'),
  published: z.iso.date(),
  updated: z.iso.date().optional(),
  status: z.enum(['draft', 'published']).default('draft'),
  thumbnail: z.string().regex(/^\/assets\/img\/[a-zA-Z0-9_/-]+\.(?:webp|png|jpg|jpeg|avif)$/).optional(),
  originalUrl: z.url().refine(value => value.startsWith('https://')).optional(),
}).strict().refine(data => !data.updated || data.updated >= data.published, {message: 'Updated date precedes publication'});

export function publishedEntries(entries) {
  const ids = new Set(), slugs = new Set();
  for (const entry of entries) {
    const data = articleSchema.parse(entry.data);
    if (data.status === 'published' && !entry.body?.trim()) throw Error('Published article body is empty');
    if (ids.has(data.articleId) || slugs.has(data.slug)) throw Error('Duplicate article ID or slug');
    ids.add(data.articleId); slugs.add(data.slug);
  }
  return entries.filter(entry => entry.data.status === 'published' && entry.data.published <= new Date().toISOString().slice(0, 10))
    .sort((a, b) => b.data.published.localeCompare(a.data.published));
}

export function mergeCatalogue(entries, external) {
  const published = publishedEntries(entries);
  const originals = new Set(published.map(entry => entry.data.originalUrl).filter(Boolean));
  return [
    ...published.map(({data}) => ({
      id: data.articleId, title: data.title, summary: data.summary, topic: data.topic,
      source: 'website', date: data.published,
      dateLabel: new Intl.DateTimeFormat('en-GB', {day:'numeric', month:'short', year:'numeric', timeZone:'UTC'}).format(new Date(data.published)),
      thumbnail: data.thumbnail, href: `/articles/${data.slug}/`,
    })),
    ...external.filter(article => !originals.has(article.href)),
  ].sort((a, b) => b.date.localeCompare(a.date));
}
