# Google Analytics with opt-out

Restores the existing GA4 measurement ID `G-5J3W5EZLQL`, found in the site's Git
history (commit `3ca23ffe76213fd888c46d5c8386265a7998f568`). The April 2026 site
replacement removed it. This public measurement ID is not an API credential.

The shared footer includes `Analytics.astro` on the homepage and article catalogue.
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

This is a partial delivery of [WEB-11](https://trello.com/c/nJH4sTma). It does not
implement custom article-read/active-time/body-scroll events, contact/project
events, custom dimensions, owner-traffic filters or the WEB-12 monthly report.
Keep WEB-11 open until those acceptance criteria are fulfilled. Existing private
CMS prototypes and publishing workflows remain independent.

References: [Google tag setup](https://developers.google.com/tag-platform/gtagjs),
[consent mode](https://developers.google.com/tag-platform/security/guides/consent),
[privacy settings](https://developers.google.com/tag-platform/security/guides/privacy).
