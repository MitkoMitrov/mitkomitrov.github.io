# Remaining tickets — implementation checkpoint

22 November 2026. This is a source checkpoint, not a claim that account integrations or owner acceptance tests have passed.

| Ticket | Implemented in this change | Still required |
| --- | --- | --- |
| WEB-03 | Existing checked Astro/Pages build retained; deployment snapshot/source guards added | Cloud failed-build preservation evidence remains unproven |
| WEB-06 | Production-only native Sanity Studio, native auth boundary, no credentials/GA in client, noindex | Owner deploy and account/role/CORS verification |
| WEB-07 | Rich editor, simple table paste, metadata, named sizes, code, local private preview | Hosted preview review; actual Word fidelity is deferred |
| WEB-08 | Native Sanity drafts, build only anonymous published content, collision/privacy guards | Owner two-PC/offline/non-member cases are deferred |
| WEB-09 | Dispatch pipeline, validated static CMS articles, obsolete-event/source guards, public revision manifest, truthful status panel | Exact production credential approval/owner entry, managed webhook setup and real release evidence |
| WEB-10 | Static About page, working contact links and honest independent interests | Confirm released route |
| WEB-11 | Existing GA implementation retained; project page/contact context added and checked | GA live project event receipt and report-level developer-filter verification |
| WEB-12 | Monthly report specification, reusable blank template and exact event/metric definitions | Save exploration in owner's GA account and complete a review from real data |
| WEB-13 | Work index and four real case studies, status, contribution/decisions/results, verified MarketAgent link | Confirm released routes |
| WEB-14 | Preview command removes CNAME, blocks crawling and disables GA by hostname; setup guide | Cloudflare account/GitHub authorization, real preview URL/check/update evidence |
| To test | Unchanged owner-deferred WEB-01 test list | Remains deferred at owner's request; does not reopen WEB-01 |

See AUTHORING.md, CMS-DEPLOYMENT.md, MONTHLY-REPORT.md and BRANCH-PREVIEWS.md for the concrete operating instructions. Do not mark all cards done merely because source builds successfully. Do not store real analytics exports or credentials in this public repository.
