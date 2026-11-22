# Monthly portfolio review

This is a reusable reporting specification and blank review template. It contains no fabricated analytics. The saved GA4 exploration and Search Console views still require access to the owner's Google account. No scheduled delivery is configured.

## Windows and sources

Use the last complete calendar month versus the preceding month. Record the GA4 property timezone and Search Console date window; Search Console daily dates use Pacific Time and need not align with GA4. Note new publication dates, days live, missing tracking, opt-outs and low samples. Attribution describes available referrals/campaign tags, not every visitor's actual journey. Direct traffic does not prove someone typed the URL. Chatbot referrals measure clicks where a referrer survives, not crawler activity or inclusion in model answers.

## GA4 exploration setup

Create a Free-form exploration named **Portfolio monthly review**. Import Page path and screen class, Session source / medium, Event name and the existing event-scoped custom dimensions Article ID, Article topic, Project ID, Contact method, Scroll percentage, Estimated read and Read definition. Import Event count, Total users, Sessions and the custom metric Active reading seconds (`active_seconds`, seconds). New custom definitions can take 24–48 hours to become usable.

Use separate tabs/exports; mixing all event names makes the active-time metric wrong:

| Tab | Rows | Filter | Values |
| --- | --- | --- | --- |
| Acquisition | Session source / medium | Public site traffic | Sessions, Total users |
| Article views | Article ID, Article topic | Event name = page_view; Article ID set | Event count, Total users |
| Estimated reads | Article ID | Event name = article_read | Event count, Total users |
| Active time | Article ID | Event name = article_engagement | Active reading seconds |
| Body completion | Article ID | Event name = article_scroll; Scroll percentage = 100 | Event count |
| Professional pages | Page path and screen class | Event name = page_view; paths /about/ or /work/ and descendants | Event count, Total users |
| Project interest | Project ID | Event name = project_outbound | Event count, Total users |
| Contact intent | Contact method, Project ID | Event name = contact_click | Event count, Total users |

Read estimation requires 60 active foreground seconds and at least 75% of the article body, once per page visit. It is an estimate, not evidence someone understood the article. `article_engagement.active_seconds` carries deltas. `article_read` also includes active seconds as context: **never sum it into reading time**. Unique users are not additive across articles or topics.

Export each tab as CSV, join by stable Article ID, and calculate:

- Estimated read rate = article_read event count / article page_view event count.
- Average active seconds per view = article_engagement active-second sum / article page_view event count.
- Body completion rate = article_scroll 100% event count / article page_view event count.
- Zero denominators stay blank; display numerator and denominator alongside percentages. These metrics describe observed tracking only, not all visitors. Repeated/reloaded visits may count again.

Review the previous month side by side. Avoid ranking a newly published article against one exposed for the whole month without showing days live and sample size. Do not classify contact clicks as received messages or project clicks as customers.

## Search Console

Use Search results → Web → compare the same two complete months. Export Pages and Queries with clicks, impressions, CTR and average position. Inspect individual article URLs as needed. Keep Google Search performance separate from all-source GA4 visits; query totals can omit anonymized queries. Record indexing issues and sitemap status without treating a submitted sitemap as an indexing guarantee.

## Blank monthly review

Period: ______  Comparison: ______  GA4 timezone: ______  Exported on: ______

| Article / topic | Published / days live | Views | Estimated reads / rate | Active seconds / view | Body completion | Previous-month change |
| --- | --- | --- | --- | --- | --- | --- |
| | | | | | | |

Acquisition highlights and sample sizes: ______

Search clicks / impressions / CTR / position; strongest pages and queries: ______

About / Work visits, project outbound clicks and contact intent: ______

Relevant enquiries, conversations, interviews or opportunities, recorded privately and manually: ______

Choose two or three decisions with evidence, a concrete change and a date/metric to review. If the sample is too small, say so and choose an observation period instead of inventing a conclusion.

1. Evidence: ______ Change: ______ Success measure/date: ______
2. Evidence: ______ Change: ______ Success measure/date: ______
3. Optional: ______

Keep actual exports and personal enquiries private; do not commit them to this public repository.

References checked 22 November 2026: [GA4 free-form](https://support.google.com/analytics/answer/9327972), [custom definitions](https://support.google.com/analytics/answer/14240153), [Search Console performance](https://support.google.com/webmasters/answer/7576553).
