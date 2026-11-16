# Basic Google Analytics

Restores the existing GA4 measurement ID `G-5J3W5EZLQL`, found in the site's Git
history (commit `3ca23ffe76213fd888c46d5c8386265a7998f568`). The April 2026 site
replacement removed it. This public measurement ID is not an API credential.

The shared footer includes `Analytics.astro` on the homepage and article catalogue.
Its small inline initializer loads Google's asynchronous `gtag.js` only on HTTPS
`mitko.mk`, after the visitor accepts optional analytics. Local development and
alternate/preview hosts never load the tag. No new runtime dependency is needed.

The choice is saved under `mitko.analytics.v1` in browser local storage. With
unavailable storage it lasts only for the current page. Decline sends no Google
requests. The footer's **Analytics preferences** button lets visitors change the
choice. Withdrawal disables the measurement ID, deletes this site's `_ga*`
cookies and reloads to unload Google's listeners. Advertising storage, advertising
user data, personalization and Google signals are disabled. This uses basic
consent mode; it does not send cookieless Google pings before consent.

One `config` call sends the normal initial page view per document load. There is
no extra manual page-view event or client router. Enhanced measurement depends
on the existing web stream settings, which this source change does not alter.

## Validation and remaining scope

Run `npm run check`. Tests cover both generated pages, opt-in/decline, remembered
choices, withdrawal, blocked storage, duplicate initialization and preview hosts.
Browser validation should check the notice at narrow widths and the footer control.

To confirm receipt in the existing property, open Google Analytics **Realtime**,
visit `https://mitko.mk/`, accept analytics and open `/articles/`. An ad blocker or
declined consent can prevent collection. Source installation and a successful
network request do not prove that the property dashboard has received an event.
Property access/Realtime receipt must be checked separately.

This is a partial delivery of [WEB-11](https://trello.com/c/nJH4sTma). It does not
implement custom article-read/active-time/body-scroll events, contact/project
events, custom dimensions, owner-traffic filters or the WEB-12 monthly report.
Keep WEB-11 open until those acceptance criteria are fulfilled. Existing private
CMS prototypes and publishing workflows remain independent.

References: [Google tag setup](https://developers.google.com/tag-platform/gtagjs),
[basic consent mode](https://developers.google.com/tag-platform/security/guides/consent?consentmode=basic),
[privacy settings](https://developers.google.com/tag-platform/security/guides/privacy).
