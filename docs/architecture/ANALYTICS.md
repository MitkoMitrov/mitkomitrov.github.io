# Google Analytics with opt-out

Restores the existing GA4 measurement ID `G-5J3W5EZLQL`, found in the site's Git
history (commit `3ca23ffe76213fd888c46d5c8386265a7998f568`). The April 2026 site
replacement removed it. This public measurement ID is not an API credential.

The shared footer includes `Analytics.astro` on the homepage, catalogue and articles.
Its small inline initializer loads Google's asynchronous `gtag.js` only on HTTPS
`mitko.mk`, automatically unless the visitor previously declined. Local development and
alternate/preview hosts never load the tag. No new runtime dependency is needed.

## Owner-requested policy change

The owner explicitly requested automatic GA collection with a Decline control on
16 November 2026, after being informed that opt-out does not meet prior-consent
requirements where those apply. This replaces the initial opt-in behavior. It is
not a consent-exempt or compliance-certified configuration. The Google storage
state `granted` enables analytics storage by default; it is not proof of freely
given consent. No saved consent choice is fabricated for a new visitor.

The floating notice is replaced by a compact inline footer panel that explicitly
states analytics starts automatically and offers **Keep analytics on** / **Decline**.
The footer's **Analytics preferences** control reopens it. Choices use the existing
`mitko.analytics.v1` local-storage key, so all previous declines stay effective.

Decline immediately disables collection for the measurement ID, deletes this
site's `_ga*` cookies and reloads to unload Google listeners. Future pages load no
Google tag while the decline is saved. Other open tabs also stop on the storage
event. Data already transmitted or requests already in flight cannot be recalled;
declining is not a deletion request for previously collected data. No consent-update
ping is sent after declining. Advertising storage, advertising user data,
personalization and Google signals remain disabled.

If browser storage is unavailable, the disable flag applies to the current page
and the notice explains that the choice could not be saved. Do not reload in this
case, because a new page would otherwise re-enable the default policy. A future
full navigation cannot remember an opt-out without working preference storage.

One `config` call sends the normal initial page view per document load. There is
no extra manual page-view event or client router. Enhanced measurement depends
on the existing web stream settings, which this source change does not alter.

## Validation and remaining scope

Run `npm run check`. Tests cover both generated pages, automatic initialization,
existing opt-outs, new declines, cross-tab opt-out, unavailable storage, duplicate
initialization and preview hosts.
Browser validation should check the notice at narrow widths and the footer control.

To confirm receipt in the existing property, open Google Analytics **Realtime**,
visit `https://mitko.mk/` with no saved opt-out and open `/articles/`. An ad blocker or
declined consent can prevent collection. Source installation and a successful
network request do not prove that the property dashboard has received an event.
Property access/Realtime receipt must be checked separately.

## Article and contact events — WEB-11

The initializer adds `article_id` and `article_topic` to article page-view
configuration. A gated API sends no custom events while opted out or on previews.
No manual page-view event is added.

| Event | Definition / parameters |
| --- | --- |
| `article_scroll` | Once at 25/50/75/100% of the article body; `percent_scrolled`. |
| `article_engagement` | Active-time deltas, every 30 active seconds or lifecycle flush; `active_seconds`, `active_seconds_total`. |
| `article_read` | Once per page visit after 60 active seconds AND 75% body reach; `is_estimate=1`, `read_definition=60s_active_75pct_body`. |
| `contact_click` | `contact_method=email` or `linkedin`, `page_path`; no contact details. |
| `article_outbound` | External LinkedIn article click; article ID and destination category. A click is not a read. |
| `project_outbound` | Only actual links marked `data-project-site` inside `data-project-id`; project ID, not a customer conversion. No unverified product links are added. |

Article events carry `article_id` / `article_topic`. Timing requires enabled GA,
a visible, focused page and article body in the viewport. It stops after 30 seconds
without pointer, keyboard, touch or scroll activity. Background, idle and footer
time is excluded. Opted-out time is never backfilled. A read estimates engagement,
not comprehension. Lifecycle delivery is best-effort: closing a browser can lose
the final partial interval. Scroll measures viewport reach, not proof of reading.

## Required property-side setup (not yet verified)

In GA4 Admin → Custom definitions, register event-scoped dimensions for
`article_id`, `article_topic`, `percent_scrolled`, `read_definition`, `is_estimate`,
`contact_method` and `project_id`. Register the custom metric `active_seconds`
(unit: seconds). Sum `active_seconds` on `article_engagement` only; do not sum
`active_seconds_total` or include duration from `article_read`.

Inspect events in Realtime/DebugView. Append `?analytics_debug=1` for a dedicated
test session; ordinary visits do not enable debug mode. Property access is needed
to verify receipt, create definitions and configure developer/internal-traffic
filters. Use **Decline** to exclude the owner's everyday browser. Verify a separate
debug session before enabling any property filter. No automatic owner detection
or remote property/filter change is claimed.

The later report should compare article page views, estimated reads, read rate and
active seconds by session source/medium or tagged campaign. Missing referrers may
appear Direct/Unknown. Search Console supplies separate queries and impressions.
These events cannot measure reading on LinkedIn itself.

WEB-11 remains partial until property definitions, receipt and owner/developer
exclusion are verified. The WEB-12 monthly report and private CMS work are separate.

References: [Google tag setup](https://developers.google.com/tag-platform/gtagjs),
[consent mode](https://developers.google.com/tag-platform/security/guides/consent),
[privacy settings](https://developers.google.com/tag-platform/security/guides/privacy).
Custom parameters: https://developers.google.com/analytics/devguides/collection/ga4/event-parameters
DebugView: https://support.google.com/analytics/answer/7201382
