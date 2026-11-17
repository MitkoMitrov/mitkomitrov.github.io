# WEB-01 isolated Sanity/Astro spike

Architecture and evidence: [WEB-01 report](../../docs/architecture/WEB-01-cms-publishing.md).

This directory is independent of the existing portfolio. It contains only synthetic public content. Studio targets the owner-provided Sanity project `o3i9jgij` (mitko.mk), dataset `web01`. It has no production workflow, embedded credentials or deployment command; the static site still uses offline fixtures by default. Do not copy its source tree into a Pages artifact. Keep actual drafts and dataset exports outside this public repository.

Requirements: Node 24.22.1 and npm 11.9.0 were used. From this directory:

```sh
npm ci --ignore-scripts
npm run fixture
npm run build
npm test
npm run backup
npm run studio:build
```

`npm test` requires the initial build and performs additional positive/negative builds itself. `npm run fixture` uses representative HTML, not Word or the actual Studio clipboard. `backup` writes ignored `artifacts/sample.ndjson` and `artifacts/restored.json`. The Studio bundle defaults to project `o3i9jgij`, dataset `web01`; environment variables can override those public identifiers. A successful bundle build proves no authentication or cloud persistence.

For local viewing, serve `dist/` with any static server or run `npm run dev`. The managed preview CLI's development launch failed in this environment; browser QA instead used a scratch copy of the built static directory with the supported static preview mode.

To resume real integration testing, use the owner runbook in the report. `SANITY_STUDIO_PROJECT_ID` and `SANITY_STUDIO_DATASET` are public identifiers. The optional static loader uses `WEB01_CONTENT_SOURCE=sanity`, `WEB01_PROJECT_ID`, `WEB01_DATASET=web01`; it never accepts a Sanity token and intentionally requires the isolated dataset name. `WEB01_EXPECTED_ID`/`WEB01_EXPECTED_REV` abort a build if the requested published revision is missing or obsolete.

The surrogate importer, publication request helper and status mapper are small offline experiments. The Studio Body input now separately converts simple HTML tables through `lib/table-paste.mjs`; this bounded handler was deployed and its table result restored in an owner incognito session on 2026-11-17. The managed webhook configuration and future workflow contract are in `examples/`. The workflow contract is deliberately documentation, not an executable workflow.

## One owner-run private-draft API check

After updating this test checkout, run from this directory in Windows PowerShell:

```powershell
npm.cmd run check:private
```

This reuses the existing local Sanity CLI login through the supported `sanity exec --with-user-token` command. If the CLI reports no login, run `npx.cmd sanity login`, complete the browser login, then rerun. No token is pasted into chat, written to a script or committed. There is no dependency change and no Studio redeployment is needed for this command.

The runner refuses other project/dataset targets and operates only on generated `drafts.web01-check-<random>` IDs in `o3i9jgij/web01`. It checks a complete synthetic rich body (including table/code) through a fresh authenticated API client, anonymous exact/raw reads and validation-only mutation denial, an explicit API revision guard, and a synthetic NDJSON backup restored to a second temporary cloud draft. It checks data/render equality. It never reads or exports the owner's existing article, publishes a document, or triggers a site build.

Temporary drafts are deleted with matching ownership markers and revision guards, including after a failed check or lost response. Cleanup failure makes the result fail and reports the exact synthetic IDs. Abruptly killing the process can leave those synthetic drafts behind; they are recognizably named disposable checks. The temporary synthetic backup is outside the repository and removed afterward. This is a small recovery proof, not a retained full dataset/asset backup.

Output ends with one JSON result. `state: passed`, four checks and an empty `cleanupPending` indicate success. A failed stage or cleanup is a failure even if earlier lines passed. The runner does not print SDK error/configuration objects, credentials or article contents.

Limits: this API check does not prove actual Word clipboard behavior, Studio selection/undo, stale/offline browser UI/conflict handling, another signed-in non-member's permissions, two physical PCs, full dataset/asset restore or secure publication/deployment. Keep WEB-01 open for those remaining gates. Local HTTP-transport tests exercise the real SDK and runner failure/cleanup boundaries; their success does not imply a live cloud run.

Cloud setup observation (2026-11-04): the unauthenticated published-count query for `o3i9jgij/web01` returned HTTP 200 and zero documents. This verifies connectivity to the empty dataset, not owner login, write permissions or draft privacy.

Current browser prerequisite: in the project’s API → CORS origins, allow the exact temporary preview origin `http://127.0.0.1:4173` with credentials for owner sign-in. This is the agent’s remote preview, not a URL to open on your own PC. Remove this temporary origin after testing. No CORS setting has been changed by the agent.
