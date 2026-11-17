# WEB-01 isolated publishing — connected test sandbox

Status 2026-11-17: the separate public test repository exists, its workflow is
installed, Pages uses Actions, HTTPS is enforced, and WEB01_SOURCE_SHA is pinned
to `2cbf7bc1ad6b2c8d34b0f85af5d4bfa11ef80bd4`. Bootstrap run 44171970044 passed
build, deploy, freshness and live-manifest verification. Steps 1–5 below are done.
The owner privately generated the approved dispatch credential and saved it in
the managed Sanity webhook. The agent has not read or retained its value.
Webhook `6SGLoEOkQON9ifCb` is enabled for `web01` only, with published article
create/update/delete events, draft/version triggers off, and the reviewed
GitHub dispatch projection. Publish run 44180562584, re-publish run 44181042419
and unpublish run 44181349975 all passed build, deploy and live-manifest
confirmation. The temporary article is now unpublished and its live route is 404.

GitHub inherits the user site's custom domain, so the actual test site is
https://mitko.mk/mitko-web01-publishing-test/ rather than a separate origin.
It is a separate repository/deployment under that fixed path. The portfolio
repository's master branch, homepage, DNS and existing articles are untouched.
The first run deployed successfully but failed the old host/HTTPS verification;
the scoped URL guard was corrected and HTTPS enabled before the successful run.

The owner explicitly approved Contents:read/write for only the test repository,
expiring 24 November 2026. The form was verified with that scope, required
Metadata:read-only and no account permissions before private owner generation.
The expiry requires rotation or revocation after the experiment. Never request
the token in chat, inspect the saved Authorization value or capture it in images.

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

The template itself remains inactive in the portfolio repository. The actual
sandbox has independently configured hosting and a managed webhook.

Live publish/re-publish and private edit separation passed with synthetic article
`1cef60d6-05c2-44d0-91ee-4667dcbf5e6a`: revision A stayed public while draft B
persisted after Studio reload; anonymous raw draft reads returned no document,
and the draft save did not create an Actions run. Explicit re-publication then
deployed B, with matching live article/listing/sitemap and revision manifest.
Unpublish then removed the article from the live listing, manifest and sitemap;
the previous article route returns HTTP 404. Duplicate/retried events, failed
build/deploy recovery and rapid revisions remain separate live acceptance gates.

The final Sanity check cannot lock Sanity while Pages deploys. Source changes
after the check and uncertain remote outcomes after deployment timeout remain
ordering/recovery gates. Queueing alone is not proof. Interim feedback is an
Actions run plus a matching live manifest; native Studio deployment-status UI is
still unimplemented. Word/permissions/UI conflict gates remain open.

Official references checked 2026-11-17: GitHub static Pages starter, concurrency
and repository-dispatch permissions; Sanity GROQ webhooks and before() behavior.
