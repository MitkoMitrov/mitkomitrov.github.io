# Cloudflare branch previews (WEB-14)

The preview build is implemented. A Cloudflare Pages project and its GitHub authorization are not yet connected. GitHub Pages and mitko.mk remain production.

In the owner's Cloudflare account, create a Pages project from the portfolio repository only. GitHub integration authorization must be approved by the owner. Do not add a custom domain, alter DNS/nameservers, or replace the production Pages deployment.

Set root directory to the repository root, build command `npm ci && npm run build:preview`, and output directory `dist`. Match `.nvmrc` (Node 24.19+ within 24.x) and npm 11.x. Allow the desired preview branches; use master as the comparison branch in this separate preview project. No Sanity token, production webhook credential, Google Analytics secret or GitHub PAT is needed. It fetches only anonymously readable published CMS content.

Every build from this command has a noindex/nofollow HTML meta tag, `_headers` with X-Robots-Tag, and robots Disallow: /. It removes CNAME. GA is hostname-gated to mitko.mk, so pages.dev previews send no analytics. Noindex is not authentication: never put draft material or secrets into a branch or preview artifact.

After account connection, verify one feature-branch commit produces a successful Cloudflare GitHub check and a unique preview URL. Push a small approved update, confirm the new URL contains that commit, and check mobile navigation, nested article/work routes, assets and headers. Keep a failed build to verify a previous preview remains usable; do not mark the live integration done merely because a local build passed. The pipeline rejects malformed or conflicting CMS publications rather than leaking a draft.

Retry from the Cloudflare deployment screen after fixing a failing build. Inspect logs without publishing credentials. Use the current branch commit. The editor preview itself is local to the authenticated Studio and needs no pages.dev draft-preview origin or additional credentialed CORS setting.

Free-plan limits must be checked against the account at setup; Cloudflare currently documents 500 builds/month and 20,000 files/site on Free. Existing repository output is far below the file limit. Review service terms and any paid-plan prompt before accepting. References checked 22 November 2026: [GitHub integration](https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/), [previews](https://developers.cloudflare.com/pages/configuration/preview-deployments/), [limits](https://developers.cloudflare.com/pages/platform/limits/).
