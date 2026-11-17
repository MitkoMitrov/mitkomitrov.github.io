# Static article pages — WEB-04

Articles live at `/articles/<slug>/` and render completely during the Astro build.
There is no browser content fetch, database or CMS dependency. The existing warm
portfolio styling, navigation and contact links are retained.

## Content contract

Place trusted, owner-authored Markdown directly in `src/content/articles/`.
The Astro collection validates frontmatter using `src/lib/article-model.mjs`.
Required fields: `articleId` (stable), `slug` (stable public URL), `title`,
`summary`, `topic`, `tags`, `author`, `published` (ISO date), `status` (`draft`
or `published`). Optional: `thumbnail`, `originalUrl`, `updated`. The author is
currently Mitko Mitrov only. Duplicate IDs/slugs and invalid metadata fail builds.

Only published, non-future entries generate routes, cards and sitemap URLs.
Publication requires a successful build/deployment; future dates are not a
scheduling service. The artifact verifier derives allowed article routes from
the same metadata and rejects unexpected output.

The draft flag prevents deployment, **not access to the public Git repository**.
The committed draft is a synthetic formatting fixture. Do not save real private
drafts here; private cloud drafts belong to WEB-06–09. Raw HTML is trusted author
input; CMS/Word sanitization must be verified before those inputs connect.

## Formatting

The pinned official `@astrojs/markdown-remark` processor supplies GFM tables and
Shiki highlighting. Build-time markup adds language captions, copy controls,
keyboard-focusable code regions and scrollable table containers. Supported:
headings, lists, bold/italic, links and inline/fenced code. Named sizes are
`<p class="text-small">…</p>` and `<p class="text-large">…</p>`; arbitrary Word
font sizes are separate. Copy controls enhance static code independently of GA.
Reading-minute labels estimate 220 words/minute, separate from measured engagement.
Tables/code scroll inside their containers. The contents links use heading IDs.

## Published content and SEO

Redis Part 2 (`redis-cache-aside-ttl-eviction`) and Part 3
(`when-to-use-redis-and-when-not-to`) use the owner's saved Markdown. The title is
rendered once; the Markdown body is otherwise preserved, including sources.
Original publication dates and LinkedIn links remain. No synthetic article is
listed as published. The catalogue has five verified Redis posts, all local.
A local article replaces the matching external card.

The remaining three articles were migrated from the owner's complete public
LinkedIn bodies on 17 November 2026. Text, emphasis, lists and order are preserved;
LinkedIn's body headings are promoted one level under the page's single H1.
Recommendations, comments and sign-in interfaces are excluded. Source text
fingerprints in `REDIS-MIGRATION-SOURCES.json` verify the complete text against
the initial static HTML, normalizing whitespace and straight/curly apostrophes
used by the existing typography processor. Original dates, article IDs and attribution are
preserved. The cache-miss article retains its original three animations,
locally served with controls, posters and download fallback links; no autoplay,
external player or new client script is introduced.

Titles/descriptions, self-canonicals, Article JSON-LD, social metadata, sitemap and
robots render statically. The owner verified the Search Console Domain property,
submitted the sitemap (Success), and passed an example live URL test on
17 November 2026. New published routes enter the same sitemap automatically;
indexing or preference over LinkedIn is not guaranteed.

## Verification

`npm run check` builds routes and checks full-body rendering, formatting, unique
metadata, draft/future exclusion and sitemap. The synthetic draft exercises every
format through the same renderer and never enters deployment. Browser QA covers
navigation, copying, 337px reflow and contained table/code scrolling. Analytics
definitions and pending property setup are in `ANALYTICS.md`.
