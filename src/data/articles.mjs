// Shared catalogue: source is 'linkedin' or 'website'; href may be an external URL or a local article route.
// Covers are the author's original LinkedIn article thumbnails.
// Real published articles, linked to LinkedIn; no CMS drafts or fixture posts.
export const articles = [
  {
    title: 'When to Use Redis—and When Not To',
    source: 'linkedin',
    thumbnail: '/assets/img/articles/redis-when-to-use.webp',
    date: '2026-10-01',
    dateLabel: '1 Oct 2026',
    part: '03',
    summary: 'Where caching earns its place, when it adds complexity, and how to plan for a Redis outage.',
    href: 'https://www.linkedin.com/pulse/when-use-redisand-mitko-mitrov-09cxf',
  },
  {
    title: 'Redis in Practice: Cache-Aside, TTL, and Eviction',
    source: 'linkedin',
    thumbnail: '/assets/img/articles/redis-cache-aside.webp',
    date: '2026-09-10',
    dateLabel: '10 Sep 2026',
    part: '02',
    summary: 'The read and write flow, freshness decisions, and race conditions behind a shared cache.',
    href: 'https://www.linkedin.com/pulse/redis-practice-cache-aside-ttl-eviction-mitko-mitrov-ilqlf',
  },
  {
    title: 'Why Redis? What problem does it actually solve?',
    source: 'linkedin',
    thumbnail: '/assets/img/articles/redis-why.webp',
    date: '2026-09-01',
    dateLabel: '1 Sep 2026',
    part: '01',
    summary: 'A practical starting point: repeated work, multiple application instances, and the limits of local memory.',
    href: 'https://www.linkedin.com/pulse/why-redis-what-problem-does-actually-solve-mitko-mitrov-zaepf',
  },
];
