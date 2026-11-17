# WEB-01 isolated publishing — prepared, not connected

Status 2026-11-17: the separate public test repository exists, its workflow is
installed, Pages uses Actions, HTTPS is enforced, and WEB01_SOURCE_SHA is pinned
to `2cbf7bc1ad6b2c8d34b0f85af5d4bfa11ef80bd4`. Bootstrap run 44171970044 passed
build, deploy, freshness and live-manifest verification. Steps 1–3 below are done.
The managed Sanity webhook and dispatch credential remain unconfigured.

GitHub inherits the user site's custom domain, so the actual test site is
https://mitko.mk/mitko-web01-publishing-test/ rather than a separate origin.
It is a separate repository/deployment under that fixed path. The portfolio
repository's master branch, homepage, DNS and existing articles are untouched.
The first run deployed successfully but failed the old host/HTTPS verification;
the scoped URL guard was corrected and HTTPS enabled before the successful run.

The token form is prepared, not generated: owner MitkoMitrov, only the test
repository selected, expiry 24 November 2026, Contents currently read-only and
Metadata read-only. Automatic approval review blocked changing Contents to
read/write pending explicit owner approval of that exact grant. Token generation
must be completed privately by the owner; never request its value in chat.

`sandbox-pages.yml.template` is deliberately outside `.github/workflows` in the
portfolio. No workflow or webhook is installed by these files.

The template refuses to run except in **MitkoMitrov/mitko-web01-publishing-test**.
This separate repository must be created/initialized first. For Pages on GitHub
Free it should be public and contain only this synthetic test setup.

1. Put the template at `.github/workflows/pages.yml` on that test repository's
   default branch. Do not install it in the portfolio repository.
2. Set repository Actions variable `WEB01_SOURCE_SHA` to the exact reviewed
   40-character commit containing these snapshot scripts. The workflow validates
   it and checks out that fixed source. Webhook input cannot select code/ref.
3. Set test-repository Settings → Pages to GitHub Actions. Manually run the
   workflow once to verify the empty published dataset builds/deploys. No Sanity
   write token belongs in GitHub.
4. After bootstrap succeeds, configure the disabled `webhook.json` design in
   Sanity Manage. Remove its NOTE if submitting through the API. Enable
   create/update/delete for published articles; keep draft/version triggers off.
   Deletion uses `before()` identity.
5. Sanity needs an expiring fine-grained GitHub token restricted to this test
   repository, with Contents:write, to POST dispatches. Enter the Authorization
   Bearer header directly in the managed webhook. Never put the token in chat,
   Studio, source, screenshots or CI output. Revoke/rotate it after the experiment.
   Pages deploy uses its own per-job GITHUB_TOKEN, not this webhook PAT.

## Receiver behavior

- Captures one anonymous published snapshot for every article, listing, manifest
  and sitemap. Fingerprint/schema checks reject modified or private input.
- Rejects malformed requests, obsolete publish revisions and obsolete unpublish
  requests when the article has been republished.
- Builds and rechecks current content. Build permissions are Contents:read only;
  only the separate deploy job has Pages/id-token write permission.
- Uploads dist only. The separate guard artifact contains public article
  IDs/revisions/slugs/digest. A dependency-free public API check runs before deploy.
- Uses one concurrency group across build/deploy with queue:max and no in-progress
  cancellation. Delayed obsolete events fail instead of claiming another revision.
- Verifies the live sandbox publication.json before reporting a confirmed live
  snapshot. Dispatch 204 alone is not queued/building/live evidence.

## Remaining acceptance

Committing the template does not create a repository, configure Pages, install a
webhook/credential or deploy anything. Live publish/re-publish, private edit
separation, unpublish, duplicate/retried events, failed build/deploy recovery and
rapid revisions must be tested against the actual sandbox.

The final Sanity check cannot lock Sanity while Pages deploys. Source changes
after the check and uncertain remote outcomes after deployment timeout remain
ordering/recovery gates. Queueing alone is not proof. Interim feedback is an
Actions run plus a matching live manifest; native Studio deployment-status UI is
still unimplemented. Word/permissions/UI conflict gates remain open.

Official references checked 2026-11-17: GitHub static Pages starter, concurrency
and repository-dispatch permissions; Sanity GROQ webhooks and before() behavior.
