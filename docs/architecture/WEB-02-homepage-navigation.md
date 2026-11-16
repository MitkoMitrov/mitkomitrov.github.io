# WEB-02 — Homepage and professional navigation

**Implementation ready for review; not released.** Checked 16 November 2026.

[Trello requirements](https://trello.com/c/ZsBFpdax) · [Astro foundation / draft PR #2](https://github.com/MitkoMitrov/mitkomitrov.github.io/pull/2)

## Decisions and scope

The owner requested a simplified dark appearance, featured work sourced from the supplied CV, and existing LinkedIn Redis articles. The homepage now follows introduction → selected work → latest articles → contact. A compact About section follows that primary flow; its experience and working-approach summaries retain useful existing content without the previous long timeline, stack catalog, ticker or decorative animation.

Shared Astro components provide the header, footer, metadata and icons. Home, Work, Articles and About are available without JavaScript, with a direct email action in the sticky header and professional links in the footer. Work, Articles and About currently link to real homepage sections. Dedicated listings, case studies, article bodies and the full About page remain WEB-13, WEB-04 and WEB-10. No empty destination pages or fictitious article fixtures were added.

The checked-in historical `index.html` has a light palette. The implementation follows the owner's explicit dark-theme choice and retains the existing Space Grotesk / JetBrains Mono typography and warm accent direction. The historical HTML remains untouched for the existing branch-based Pages source. Astro now renders `src/pages/index.astro` directly; the transitional raw-HTML bridge is removed. Future copy changes belong in Astro/data files, not the historical root HTML.

## Repository and release boundary

- Repository: `MitkoMitrov/mitkomitrov.github.io`; no repository `AGENTS.md` found. Conversation-provided instructions apply.
- Default branch reverified as `master` at `2fce845161e70b4f67472767b96c2be8bd0bc94e`.
- Starting branch: `web-03/astro-ssg` at `d5f0d6cfa8d6c3dab676787f1067c3b842959c63`; PR #2 is open and draft.
- Implementation branch: `web-02/homepage-navigation`, stacked on that foundation. Review this change against `web-03/astro-ssg`; merge WEB-03 first, then retarget WEB-02 to `master` and rerun CI before release.
- Existing PRs, production HTML, CV, public assets, CNAME, dependency versions and workflow are unchanged. No merge, production deployment, DNS, billing, CMS or Pages-settings change.
- The workflow only triggers pull-request checks for base `master`. The stacked PR targets `web-03/astro-ssg`, so automated GitHub CI is **not expected yet**. Local checks are evidence; they are not a claim of GitHub CI success. No feature-branch push can enter the existing production deploy job.

## Public content provenance

Source: the owner's supplied **CV — Mitko Mitrov.pdf**, pages 2–4. The PDF itself is not committed or published. Figures are owner-reported CV facts, not independently audited product analytics.

| Featured work | CV basis | Public presentation |
| --- | --- | --- |
| Connected retail kiosks | Page 2: .NET MAUI, thermal printers / bill acceptors, 50+ kiosks at 25+ locations, three logging channels | Production work at Meta5Team; no private source or internal URLs |
| WhoWinSelections.com | Page 4: Feb–Nov 2024, 100+ sources, about 1,000 daily users, Nginx caching, end-to-end ownership | Explicitly a past project; usage described during operation |
| Imenologija.mk | Page 3: in development, Next.js / Payload / PostgreSQL / Docker, editorial states, 42 categories, Linux VPS | Explicitly in development; no invented launch or usage claims |

No unverified product domain is linked as a live service. WEB-13 can add verified product links and full case studies. ConvertAmountApp and the stock-report bot were omitted to keep the homepage to three examples. The existing `/CV/CV.html` is byte-preserved, but it predates the newly supplied PDF and still has older metrics; synchronizing the full CV is a separate content update.

Article author, title, publication date and direct URL were verified on the public LinkedIn pages on 16 November 2026:

| Date | Article |
| --- | --- |
| 1 Oct 2026 | [When to Use Redis—and When Not To](https://www.linkedin.com/pulse/when-use-redisand-mitko-mitrov-09cxf) |
| 10 Sep 2026 | [Redis in Practice: Cache-Aside, TTL, and Eviction](https://www.linkedin.com/pulse/redis-practice-cache-aside-ttl-eviction-mitko-mitrov-ilqlf) |
| 1 Sep 2026 | [Why Redis? What problem does it actually solve?](https://www.linkedin.com/pulse/why-redis-what-problem-does-actually-solve-mitko-mitrov-zaepf) |

The cards contain short original summaries and clearly identify LinkedIn as the reading destination. No full article was copied or embedded. These are the three verified articles; this does not assert that an unpublished or unindexed later installment exists.

## Verification

From the repository root, Node 24.22.1 / npm 11.9.0:

```sh
npm ci --ignore-scripts
npm run check
git diff --check
```

Locked installation succeeded. Astro built one fully static homepage and the output verifier accepted **20 files**: homepage, generated CSS and the unchanged public allowlist. All **8 focused tests passed**, covering layout/navigation, CV-derived states and figures, chronological LinkedIn links, first-party URLs / assets / preserved bookmarks, keyboard semantics / contrast, public-file staging and the deployment guard. The old exact-legacy-HTML tests were replaced because a deliberate homepage change invalidates that contract.

The output allowlist permits generated `_astro/*.css` files but still rejects unexpected routes, executable chunks and source files. No browser-side content fetch, CMS call, account, form backend, analytics or hydration is introduced. Google Fonts remains an external stylesheet request with system-font fallbacks.

Manual inspection used the **built output**, served through the managed static preview. The managed launcher could not run Astro's development command, so a temporary preview directory containing `dist/` and a static manifest was used instead. Application code was not changed to accommodate that preview issue.

| Acceptance requirement | Evidence | Result |
| --- | --- | --- |
| Home / Work / Articles / About; easy contact | DOM checks, visible header, working section navigation, header/footer `mailto:` targets | Pass locally |
| Introduction, 2–3 work examples, up to 3 articles, contact | Static HTML checks, three CV-based work items and three LinkedIn links | Pass |
| Clear hierarchy, consistent typography, minimal decoration | Desktop visual inspection; no ticker, canvas, animation or client runtime | Pass locally; owner review pending |
| Narrow / desktop layout | 1363px CSS desktop and 340px CSS browser-zoom reflow; narrow navigation remains visible, article column becomes 297px, no horizontal overflow | Pass for checked widths; physical phone not tested |
| Keyboard navigation and visible focus | Tab reveals the skip link with an outline; Enter focuses `main`; nav links have 44px height; semantic landmarks / labels checked | Pass locally; screen-reader session not tested |
| Readable text contrast | Calculated foreground, muted and accent contrast against actual dark background each exceeds 4.5:1 | Pass |
| Products under Work; no empty panels | Explicit production / past / development labels; no top-level Products or Personal area | Pass |
| Existing content / URLs retained where useful | CV/assets/CNAME byte checks, browser navigation to `/CV/CV.html`, preserved `#about`, `#experience`, `#skills`, `#work`, `#contact` | Pass locally |
| Publish / deployed behavior | No production release authorized; stacked PR does not match the master-only PR check trigger | Unverified / deferred to release |

Contact testing verifies the email URL; no email was sent. LinkedIn destinations were verified through public retrieval, not a signed-in reading session. Viewport reflow is a browser surrogate, not a claim of physical-device testing. SVG arrows replaced font-dependent glyphs after browser inspection exposed missing glyphs.

[Desktop viewport evidence](images/WEB-02-preview.jpg) · [Narrow header evidence at 400% browser zoom](images/WEB-02-narrow.jpg)

![WEB-02 dark homepage](images/WEB-02-preview.jpg)

## Review and follow-up

Leave WEB-02 open for visual/content review and the later release checks. No PC session is needed for the submitted implementation.

- WEB-13: expand the selected work into case studies; verify product destination/status before adding links.
- WEB-04: add real static article pages and transition appropriate cards from LinkedIn to canonical local URLs; no empty `/articles` route in this ticket.
- WEB-10: expand the concise About content and add personal interests only when actual content is supplied.
- WEB-03 release: merge/review the foundation first; retarget this stacked PR, require its CI, and use the existing guarded Pages cutover checklist. Do not publish the repository root as the Astro artifact.
- WEB-01: its editor/paste/publishing checks remain independent and deferred; this homepage has no Sanity dependency.
