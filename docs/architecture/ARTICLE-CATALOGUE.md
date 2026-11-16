# Article catalogue

`/articles/` renders every published entry from `src/data/articles.mjs`, newest
first. The homepage shows the latest three entries and links to the complete
catalogue through “See all articles”.

`src/components/ArticleCard.astro` is shared presentation for external and future
self-hosted articles. Each record supplies `title`, `summary`, `date` (ISO),
`dateLabel`, `href`, `source` and an optional `thumbnail`.

- `source: 'linkedin'` links to the original article and displays “Read on LinkedIn”.
- `source: 'website'` can link to a future local article route and displays “Read article”.
- A missing thumbnail uses a text cover in the same card; it does not produce a broken image.

No self-hosted article routes or CMS are introduced here. Add local article content
and its static route before adding its catalogue record.

The three author-owned covers were retrieved from the public Open Graph metadata
of these original LinkedIn articles on 16 November 2026, then optimized as local
WebP thumbnails. Rendering does not depend on LinkedIn image URLs or embeds:

- https://www.linkedin.com/pulse/when-use-redisand-mitko-mitrov-09cxf
- https://www.linkedin.com/pulse/redis-practice-cache-aside-ttl-eviction-mitko-mitrov-ilqlf
- https://www.linkedin.com/pulse/why-redis-what-problem-does-actually-solve-mitko-mitrov-zaepf
