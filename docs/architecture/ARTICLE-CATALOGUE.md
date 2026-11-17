# Article catalogue

`/articles/` merges published Markdown entries with external articles from
`src/data/articles.mjs`, newest first. A published local copy replaces its original
LinkedIn card by matching `originalUrl`; it does not create duplicate entries.
The homepage shows the latest three entries and links to the complete
catalogue through “See all articles”.

`src/components/ArticleCard.astro` is shared presentation for external and
self-hosted articles. Each record supplies `title`, `summary`, `date` (ISO),
`dateLabel`, `href`, `source` and an optional `thumbnail`.

- `source: 'linkedin'` links to the original article and displays “Read on LinkedIn”.
- `source: 'website'` links to the published local article and displays “Read article”.
- A missing thumbnail uses a text cover in the same card; it does not produce a broken image.

Redis Parts 2 and 3 are self-hosted using the owner's saved Markdown sources.
The other three known published Redis posts link to LinkedIn. Two newer LinkedIn
posts (29 October and 10 November 2026) use the text-cover fallback until local
covers are available. No CMS connection is introduced by this release.

The three author-owned covers were retrieved from the public Open Graph metadata
of these original LinkedIn articles on 16 November 2026, then optimized as local
WebP thumbnails. Rendering does not depend on LinkedIn image URLs or embeds:

- https://www.linkedin.com/pulse/when-use-redisand-mitko-mitrov-09cxf
- https://www.linkedin.com/pulse/redis-practice-cache-aside-ttl-eviction-mitko-mitrov-ilqlf
- https://www.linkedin.com/pulse/why-redis-what-problem-does-actually-solve-mitko-mitrov-zaepf
