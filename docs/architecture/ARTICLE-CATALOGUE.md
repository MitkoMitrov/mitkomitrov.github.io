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

All five published Redis articles are self-hosted. Parts 2 and 3 use the owner's
saved Markdown sources; the other three preserve the complete text retrieved
from the owner's public LinkedIn articles. All five have local covers. The
LinkedIn records remain as provenance/fallback metadata and are suppressed by
the matching published `originalUrl`. No CMS connection is introduced.

The cache-miss article's three original animations are hosted locally as
MP4 files with native playback controls and local poster images. They do not
autoplay or require LinkedIn embeds. See `REDIS-MIGRATION-SOURCES.json` for the
source URLs, retrieval date and original article-text fingerprints.

The three author-owned covers were retrieved from the public Open Graph metadata
of these original LinkedIn articles on 16 November 2026, then optimized as local
WebP thumbnails. Rendering does not depend on LinkedIn image URLs or embeds:

- https://www.linkedin.com/pulse/when-use-redisand-mitko-mitrov-09cxf
- https://www.linkedin.com/pulse/redis-practice-cache-aside-ttl-eviction-mitko-mitrov-ilqlf
- https://www.linkedin.com/pulse/why-redis-what-problem-does-actually-solve-mitko-mitrov-zaepf

The two newer covers were retrieved on 17 November 2026 and optimized as local
WebP thumbnails. The cost article uses its original cover; the cache-miss
article uses the original video's high-resolution poster without a play overlay,
since the card opens an article rather than playing a video:

- https://www.linkedin.com/pulse/redis-practice-cost-adding-when-worth-mitko-mitrov-r8r8f
- https://www.linkedin.com/pulse/why-redis-cache-miss-can-overload-your-database-mitko-mitrov-riksf
