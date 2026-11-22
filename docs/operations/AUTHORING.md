# Writing an article

Production editor implementation: `cms/`. Its deployment and production webhook must be connected before this replaces the existing Markdown workflow. The WEB-01 Studio remains a separate test environment.

1. Sign in to the production Studio with the owner account and create an Article.
2. Enter title, slug, summary, topic, tags and publication date. The stable article ID is generated once; keep it unchanged. Choose a lowercase, hyphenated slug and keep it stable after publication.
3. Write or paste into Body. Use headings, bold/italic, links, lists, named sizes, simple rectangular tables and language-labelled code blocks. Merged/nested tables and arbitrary font sizes are unsupported. A failed paste shows an error instead of silently flattening the table.
4. Open Preview. This renders the supported article content inside the authenticated editor without sending draft text to a preview server. Review links, table overflow and code. A preview is not publication.
5. Wait for native Sanity save confirmation. Drafts remain in Sanity; the public compiler requests only published documents. Sign out when finished.
6. Select Publish when ready. With the production webhook connected, GitHub builds and validates a fresh snapshot. The Publication tab confirms Live only when the public manifest matches the exact published revision. Queued/building/unconfirmed are not proof of a live page.
7. Open the live link and review the result. To edit a live article, change its draft and Publish again. Unpublish removes its route and sitemap entry on the next successful deployment. Do not delete a live document as a substitute for Unpublish.

Existing articles remain in `src/content/articles/` and cannot be overwritten by a CMS document with the same ID or slug. Migrating one requires a deliberate source change. Thumbnail paths currently reference checked-in `/assets/img/` files; private draft image uploads are deliberately outside this implementation.

If publication fails, keep the last live page, inspect the Actions failure, fix the metadata/content or dependency, and run the current master workflow again. Do not rerun an old source build after master has changed. Actual Word paste, two-device/offline conflicts and full dataset recovery remain on the owner's deferred “To test” card.
