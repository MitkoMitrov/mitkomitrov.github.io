# Production CMS deployment (WEB-06–09)

Implemented source is separate from the WEB-01 sandbox. Do not merge the architecture-spike PR wholesale or point production at `web01`.

| Setting | Value |
| --- | --- |
| Sanity project | `o3i9jgij` |
| Dataset | `production` |
| Studio source | `cms/` |
| Requested Studio hostname | `mitko-mk-editor` (availability/deployment not yet confirmed) |
| Public site | `https://mitko.mk/` |
| Repository and production branch | `MitkoMitrov/mitkomitrov.github.io`, `master` |

## Owner setup still required

Confirm the intended Sanity plan and owner membership in Manage. Studio uses Sanity's native login/logout and native document save/conflict UI; hiding editor UI is not authorization. Anonymous requests must not read drafts or write. The public website contains no authenticated client or token. Additional members, credentialed CORS origins and paid-plan changes require an explicit owner decision.

From an existing clean checkout updated to the reviewed production commit, run Node/npm versions documented in the root README, then:

```powershell
Set-Location "C:\Users\mitko\OneDrive\Desktop\web_portfolio\web01-sanity-deploy\cms"
npm.cmd ci
npx.cmd sanity login
npm.cmd run deploy
```

Do not paste this until that existing checkout is actually updated to the production implementation: the old detached WEB-01 checkout has no `cms/`. `npx.cmd` avoids the PowerShell execution-policy issue without changing machine policy. Keep the returned Studio URL; if the requested hostname is taken, choose another owner-approved hostname and update `cms/sanity.cli.ts`. Deploy only after reviewing dataset/project selection. Do not publish a test article into production just to validate setup.

## Native production publication hook

The repository's Pages workflow accepts `repository_dispatch` with type `sanity-published`. Its payload is exactly `{id, rev, operation}`; no title, body, email, draft, token or owner ID is sent in the event.

Create a separate Sanity managed webhook for **production** only. Enable create/update/delete. Use the documented `before()`/`after()` GROQ webhook context to ignore draft/release IDs, emit publish for the new published revision, and unpublish for deletion of the old published revision. Native Unpublish removes that published document; deleting a private draft must not trigger a release.

Filter:

```groq
coalesce(after()._type, before()._type) == "article" &&
!(coalesce(after()._id, before()._id) in path("drafts.**")) &&
!(coalesce(after()._id, before()._id) in path("versions.**"))
```

Projection (GitHub repository dispatch request body):

```groq
{
  "event_type": "sanity-published",
  "client_payload": {
    "id": coalesce(after()._id, before()._id),
    "rev": coalesce(after()._rev, before()._rev),
    "operation": select(defined(after()._id) => "publish", "unpublish")
  }
}
```

POST destination: `https://api.github.com/repos/MitkoMitrov/mitkomitrov.github.io/dispatches`; Content-Type application/json and GitHub API version 2022-11-28.

GitHub requires Contents:write for repository_dispatch. The old sandbox token is scoped to another repository and expires 24 November 2026; do not reuse or widen it. A new fine-grained token would grant Sanity's managed webhook Contents:write to **only this portfolio repository**, with an explicit expiry and no workflow/admin/other-repository permissions. This is a real security-sensitive grant and must be approved specifically. The owner generates, privately enters and submits its Authorization header in Sanity. Never put it in source, browser-visible article data, Actions output or chat. If tighter privileges are required, design a validating GitHub App relay as separate work; do not pretend the PAT can have a dispatch-only permission.

The webhook is not configured by adding this source file. Configure its managed authorization privately, inspect an owner-approved real publication and its delivery/Actions result, then confirm the public manifest and page. Handle credential expiry by renewal with the same scope or disabling publication until renewed. Manual current-master workflow dispatch is a temporary recovery path; it is not automatic publishing.

## Build, status and recovery guarantees

Only an anonymous non-CDN published-perspective query is used. The complete validated snapshot becomes generated Markdown; all five legacy articles remain. Unsupported blocks, conflicting slugs/IDs, invalid metadata, future dates and obsolete publish/unpublish requests fail before artifact upload. Metadata and bodies are static HTML. Source/editor/drafts are outside the artifact allowlist.

The public manifest exposes only published identities/revisions/slugs plus source and snapshot hashes. Studio says Live only for an exact published revision in that manifest. Missing manifests, failed workflows, rate limits and live-verification timeouts are unconfirmed, not success. Status polling is anonymous/read-only; it contains no PAT. Test the hosted Studio's CORS/status access once deployed.

Build and deploy jobs use least-privileged short-lived GitHub tokens. Deployment rechecks current master and the Sanity snapshot before replacing the artifact; publication concurrency serializes site releases. This reduces stale releases but is not an atomic transaction across GitHub, Sanity and the CDN: a source/content update can occur between the last check and deployment. Post-deployment verification detects a mismatch; it does not retroactively undo it. The next current build/retry reconciles it. Do not claim exactly-once or guaranteed instantaneous ordering.

A failed build leaves the prior site. A failure after deployment may mean the new artifact is already live: inspect the manifest before retrying. Rebuild current master after source/content changes; an old run is deliberately rejected. Never restore an old unpublish artifact after a newer republish without checking current published content.

For backup, use the authenticated native dataset export to a private destination, not this public repository (`*.tar.gz` ignored under cms). Full dataset/assets restore and owner-only offline/two-device/Word checks stay on the deferred “To test” card. Automated converter/snapshot/build checks do not replace those tests.

References: https://www.sanity.io/docs/webhooks, https://docs.github.com/en/rest/repos/repos#create-a-repository-dispatch-event.
