# WEB-01 — CMS and publishing architecture

Initial documentation checked **2026-11-04**; live evidence updated **2026-11-15**. [Ticket](https://trello.com/c/VKnVvr9f). **Verdict: partially validated; leave WEB-01 open.**

Recommend **Astro static generation + Sanity Studio/Content Lake Free + a managed publish webhook to GitHub Actions + GitHub Pages**. This avoids owning an editorial database and authentication system. It is a candidate architecture, not an end-to-end validated integration. Owner editor access and anonymous draft API denial now have live evidence. The owner-supplied paste result loses required formatting; authenticated non-member access, complete cross-session persistence, conflicts and deployment remain acceptance gates.

## Repository audit (observed)

Starting checkout: `master` at **`2fce845161e70b4f67472767b96c2be8bd0bc94e`**. GitHub repository metadata, branch API and local clone agree. Public repository; default branch `master`; API reports push permission. Spike branch: `web-01/architecture-spike`, based on that exact commit.

| Area | Finding |
| --- | --- |
| Framework/build | Handwritten HTML, inline CSS and a small inline copyright script in current `index.html`; no Astro or other application framework. No package.json, lockfile, pinned package manager, test runner or CI checks. README suggests global Sass, Python HTTP server and npm but is partly stale. |
| Content/routes | `/` with `#about`, `#experience`, `#skills`, `#work`, `#contact`; separate `/CV/CV.html`. Content lives directly in HTML. No article routes, content collection, shared template/layout or sitemap. Preserve existing anchors and CV URL when planning migration. |
| Assets/dependencies | `assets/css`, `assets/scss`, `assets/js`, photos, logos, PSD. Current home uses inline styles and Google Fonts (Space Grotesk/JetBrains Mono), not the old shared styles/script. CV loads external Font Awesome and an external image. README mentions ScrollReveal/Box Icons; this is not a dependable dependency manifest. |
| Domain | Root `CNAME` contains `mitko.mk`; canonical and Person JSON-LD also use it. `CUSTOM_DOMAIN_SETUP.md` and `SETUP_MITKO_MK.md` are instructions, not proof of current DNS/TLS settings. No domain/DNS changes made. |
| Deployment | No `.github/workflows` files at the starting SHA. Latest visible successful run: [25059201180](https://github.com/MitkoMitrov/mitkomitrov.github.io/actions/runs/25059201180), dynamic `pages build and deployment`, `master`, starting SHA. This supports branch-based Pages deployment, but the source folder, current Pages settings, HTTPS enforcement and environment approvals were not exposed. |
| CMS/auth/tests | No CMS, editor, auth, storage integration or tests found. No AGENTS.md in the tracked tree or workspace ancestors found; user-supplied project instructions apply. |
| Access | GitHub read, branch creation and scoped Git-data/PR operations available; Trello card read/update available. Ticket had no comments and no pagination remainder. GitHub generic fetch rejected `/pages` and `/actions/workflows`; do not interpret repository metadata's admin permission as connector administration capability. Plain git push has no CLI credentials; GitHub connector writes are used instead. No Sanity/Firebase/Cloudflare credentials or connected service tools available. No existing browser tabs/sessions. |

Audit commands: `git rev-parse HEAD`, `git status --short --branch`, `git ls-files`, `rg --files`, `rg -n 'href=|src=|id=' index.html CV/CV.html`, `git ls-remote origin 'refs/heads/*'`. Also read README, CNAME, ignore rules and the complete repository tree through GitHub. No source workflows exist to execute on branch push/PR. No workflow added by this spike. Master, root application files and CNAME remain untouched. External hooks/settings beyond available access are not exhaustively audited.

## Comparison (documented capabilities, not service test results)

Official sources below were checked on 2026-11-04. Free tiers and prices can change. Limits refer to the cited plans, not a promise of unlimited use.

| Requirement | A — Sanity Studio/Free | B — Decap CMS/GitHub backend | C — Firebase Spark + Tiptap OSS |
| --- | --- | --- | --- |
| Cost/card/limits | $0 Free, no card advertised [S1,S2]. 20 seats, two public datasets, 10k documents, 2k attributes/dataset, two webhooks, 250k API and 1m CDN requests/month, 100GB assets and 100GB bandwidth/month. Free has no overages. Private datasets and Editor role require Growth ($15/seat/month); custom roles Enterprise; built-in backups absent; draft review history three days. [S1,S3] | CMS core is MIT, no CMS seat/usage fee or card [D1]. Git hosting, auth proxy and CI retain their own limits. Existing public repo is a privacy mismatch. Separate private content repo is possible at $0, but adds auth, export and public-site delivery setup. No Turbo subscription assumed. [D2,G3] | Spark requires no payment method. Firestore: one free database, 1GiB, 50k reads/20k writes/20k deletes daily, 10GiB outbound/month [F1,F2]. Non-phone Auth included; Identity Platform lists 50k MAU and provider limits. Functions require Blaze/billing [F3]. An external trusted trigger service is needed to retain no-billing Spark. |
| Headings, bold/italic, lists, links | Native Portable Text [S4] | Richtext widget supports these and saves Markdown [D3] | OSS editor extensions; UI wiring required [T1] |
| Table/header, sizes, inline/code blocks | Current Studio has opt-in table editing; official code-input plugin. Named small/normal/large block styles configured; inline code supported [S4]. No paid extension used. | Inline code and code-block component documented; arbitrary font sizes are not standard Markdown. Tables/custom styles require integration; not prototyped [D3]. | Table/header, FontSize/TextStyle, inline code and language-aware code-block extensions available; choose and configure schema/renderer [T1]. |
| Word paste | Current owner-supplied paste result flattens the table, list and code and loses the large size; fails required fidelity. Surrogate importer preserves tested structure with explicit rules but is not connected to Studio paste. See live evidence below. | Word/table/size fidelity unverified; Markdown cannot represent arbitrary Word formatting alone. | Basic HTML paste possible. Vendor's enhanced Word Paste Handler is paid Team; not assumed free [T2]. |
| Owner/security | Sanity sign-in and server-side project membership; owner sole admin, no other members, no shared write tokens [S5]. Public project ID is not a secret. | GitHub OAuth and write access, plus OAuth proxy or hosted auth provider [D2]. UI hiding is not security. | Firebase Auth + owner UID rules enforced in Firestore; server IAM separately [F4]. Must implement/test rules, not just login UI. |
| Private drafts/published edits | `drafts.` namespace is denied to anonymous APIs even in public datasets; edits stay in draft until native Publish. Published data becomes publicly queryable before Pages is live [S6]. **Asset CDN files are public**, even for private datasets; omit private media [S7]. | Draft saves create branches/PRs. In this public repo, bodies and unpublished revisions become public immediately [D4]. A private content repository is essential. | Private draft collection with owner rules; separate immutable published revisions. Every transition is our code to maintain. |
| Cross-PC/save/conflict | Native hosted real-time storage/editor; genuine reload, save/error signals and stale-session behavior still must be exercised. Conditional mutations can reject stale `_rev` with 409 [S8]; this alone does not prove Studio's reconnect behavior. | Git provides cloud persistence on save; explicit commits, not assumed keystroke autosave. Old-session conflict UI unverified; git conflicts still need handling. | Implement saving/error/retry UI, transactions/version preconditions and restore path. Existing editor does not supply a CMS workflow. |
| Astro/Pages/publish/status | Build-time unauthenticated published reads, no runtime content fetch. Native webhook → Actions possible [S9,G1]. Status extension and deployment correlation remain work. | Astro builds Markdown; publishing merges editorial PR [D4]. Private-content export and deployment status must be wired separately. | Build-time Firestore snapshot works with trusted credentials. Publishing, secure trigger and editor status are custom infrastructure. |
| Export/dependence/maintenance | Portable Text JSON/NDJSON export; keep schema and renderers in git. Managed proprietary backend, moderate schema/plugin upkeep [S10,S11]. | Git/Markdown highly portable; private repo backup is straightforward. More glue for private editing plus public Pages. | JSON export portable but UI, rules, revisions, auth and publishing are owned code; greatest maintenance effort. |

**Decision:** A is the smallest plausible fit for this single-owner text/table/code workflow. Public-dataset draft privacy must be proven against the actual project; it is not equivalent to a wholly private dataset. If confidential uploaded files become required, this design has an exact gap: ordinary Sanity asset URLs are publicly accessible. The smallest compromise is keeping confidential files outside this CMS and only uploading approved public assets. Paying for a private dataset alone does not fix asset privacy.

There is no demonstrated all-requirements-at-$0 result yet. Remaining gaps are integration evidence, Word fidelity and ordering/status behavior, rather than a proven requirement for a paid plan. Do not switch to a custom Firebase CMS just because setup needs an owner login. Do not block launching the portfolio/articles on completing the editor.

## Proposed content and trust flow

Owner signs into separately hosted Studio → patches private `drafts.<id>` in Content Lake → native Publish promotes saved content to published `<id>`/`_rev` → managed webhook sends only ID/revision → Actions captures published snapshot → Astro produces full HTML → Pages deploys artifact → editor confirms matching live manifest.

Sanity has no GitHub credential in Studio/browser bundles. Put an expiring, single-repository fine-grained PAT in **Sanity's managed webhook Authorization header**, with Contents:write required by repository_dispatch [G1]. This is broader than a trigger-only permission and entrusts Sanity project administrators with a sensitive integration. Rotate/revoke it. A short-lived GitHub App token broker is an alternative if that trade-off is unacceptable, at the cost of another service. No credential was created, transmitted or committed here.

`examples/webhook.json` is disabled, targets a placeholder test repository, and excludes drafts/versions. Its filter/projection are proposed provider configuration, not live-validated. Native Publish identifies the persisted published `_rev`; the build verifies it rather than silently substituting another revision. A superseded revision aborts and requires a latest-state retry. Public published snapshots only may enter public Actions artifacts/logs; private exports never do. Do not print tokens, source content or webhook headers.

`examples/README.md` specifies the deferred workflow contract, deletion/unpublish extension and status mapping. A 204 means **requested**, not queued/live. Studio should correlate the run and show queued/building/failure, then verify the live manifest before claiming live. Public Actions API polling needs rate-limit/backoff handling or an owner-authenticated status adapter. This spike tests the mapper only; it installs no status UI or workflow.

Deployment must serialize the whole site snapshot/build/deploy and reject obsolete work. **Concurrency settings alone do not prove monotonic publication.** Queue order, final-check races, delayed webhooks, rapid republish and unpublish require tests in WEB-09; a durable generation coordinator may be needed. No ordering guarantee is claimed here. The prototype's loader can fetch per route, so production must first materialize one snapshot and use it consistently across all pages/manifest.

## Prototype and measured evidence

Only `spikes/web-01/` plus this report are added. It uses locked npm dependencies: Astro 7.4.5, Sanity 6.22.0, official code-input 7.3.14 and Portable Text conversion/rendering. Package versions are pinned with an isolated lockfile; the existing site is not migrated. No full portfolio pages, auth replacement or custom CMS implemented.

| Acceptance area | Evidence | Status |
| --- | --- | --- |
| Title/slug/summary/topic and rich data schema | `schema.mjs`; Studio bundle compiled | Pass for configuration/build; editor interaction unverified |
| Headings, sizes, marks/list/link/table/header/inline code/C# block | HTML surrogate → Portable Text → JSON save/reload → renderer; exact code text tested. Owner paste screenshot separately shows formatting loss | Pass offline; fail for required paste fidelity in current editor; see live evidence |
| Full static crawlable body | Astro output `/articles/a-bounded-cache/index.html`, no scripts; browser inspection shows table/header, sizes and code | Pass for fixture |
| Draft exclusion | Actual test build injects a synthetic draft canary; output/manifest exclude it and no draft URL exists | Pass for local build boundary; no cloud ACL proof |
| Unsafe input | Renderer escapes hostile text/code, suppresses javascript links; unknown content fails | Pass for tested payloads, not a complete editor security audit |
| Save/reload/export/restore | Local JSON edit/reload and NDJSON deep-equality round trip | Pass locally; cloud persistence/restore unverified |
| Genuine login; anon/non-owner draft API denial | Owner CLI login/deploy output and authenticated editor screenshots; anonymous direct draft read omitted for permission, export empty, dry-run update 403 | Pass for owner workflow and tested anonymous boundary; authenticated non-member unverified |
| Separate-session resume and old-revision conflict | Owner private-window screenshot restores title/slug/summary of same document | Pass for visible metadata in separate-session surrogate; body, stale-session conflicts and two physical PCs unverified |
| Unpublished revision of a live article stays private | Documented Sanity model only | Unverified on live service |
| Publish/retry/failure adapter | Mock HTTP transport asserts no draft call, stable ID/rev, no body; rejects 401/offline; stale-revision build fails | Pass for mock/build contract; real trigger unverified |
| Queued/failed/live feedback and ordering | Mapper test; proposed workflow contract | Unverified end-to-end |
| $0 recurring setup | Official plan review; no billing enabled/resources created | Plausible, service setup unverified |

At the initial offline run, actual clipboard from Word was **not** tested. The later owner-supplied result after the Word-paste instructions is recorded below; it fails visible required formatting. The agent did not observe the clipboard payload or source app. The checked-in surrogate is simplified semantic HTML, not a captured Word clipboard payload. Default conversion loses custom font-size styles; explicit offline rules map only 14px/24px paragraphs. Word pt sizes, mixed inline sizes, fonts, colors, merged cells, images, complex Word lists and layout are not proven. In Studio, manually choose named sizes, insert/review tables and paste code into the code-input object with language selected until clipboard behavior is validated. These are disclosed manual steps, not proof of satisfying WEB-07. Offline conversion rules are not wired into Studio. No paid paste extension used. Syntax highlighting/copy button belongs to WEB-04, not this recognisable-code spike.

### Reproduce (from repository root)

```sh
cd spikes/web-01
npm ci --ignore-scripts
npm run fixture
npm run build
npm test
npm run backup
npm run studio:build
```

Node **24.22.1**, npm **11.9.0**. `fixture`: success. `build`: success (article, prototype index and static publication manifest). **9 tests passed, 0 failed**: formatting/disk round trip, default size loss, hostile rendering, draft filtering/unique slugs, revision gate, mock request/retry/failure, status mapping, static HTML and actual injected-draft/stale-build cases. `backup`: success, identical restored fixture. `studio:build`: success using inert placeholder project ID; no connection/auth implied. `npx sanity schema extract --path artifacts/schema.json`: success. `git diff --check`: success. Detailed reproducible tests are `test/spike.test.mjs`.

Initial Astro build failed because a relative runtime fixture path moved during bundling; replaced with a JSON module import, then reran successfully. Managed dev-preview launch exited; static preview from a scratch copy of `dist` worked. Desktop browser inspection confirmed readable table, distinct sizes, language label and code indentation/symbols. Mobile viewport/scroll interaction and actual editor interaction were not tested. Generated bundles, local exports and node_modules are ignored. No production or isolated cloud deployment was attempted: no independent destination/workflow/service credential was supplied, and repository_dispatch requires a default-branch workflow.

## Backup, cost controls and remaining owner setup

`npm run backup` demonstrates sample NDJSON export/reload in ignored `artifacts/`; this is not a dataset backup. For the real project, authenticated `npx sanity dataset export web01 <PRIVATE_PATH>/web01.tar.gz` includes drafts by default. Store outside this repository in owner-controlled private storage. To restore, use `npx sanity dataset import <PRIVATE_PATH>/web01.tar.gz web01-restore` in an isolated dataset with matching schema, inspect IDs/formatting and compare rendered output before any production switch. Respect the two-dataset Free limit; do not overwrite production or use `--replace` casually. Cloud export/restore not executed [S10,S11]. Keep encrypted exports plus schema/renderer versions; a three-day review window is not a backup policy.

GitHub Pages supports public GitHub Free repos, max published site 1GB and soft 100GB/month bandwidth, 10-minute deployment timeout; custom Actions builds are exempt from its 10-build/hour soft limit [G2]. Standard public-repo runners are free; keep artifacts small/short-lived and observe the account's 500MB Free artifact allowance and 10GB repository cache allowance [G3]. No paid/larger runner or external trigger service is selected. Domain renewal is an existing separate cost; $0 here refers to recurring infrastructure within cited quotas.

Owner actions to resume the unverified checks:

1. Sign into/create a Sanity Free project in [Manage](https://www.sanity.io/manage), confirm plan (including any trial expiry), and create a disposable **`web01` public dataset**. Do not enable billing. Keep yourself the sole project member. Supply the public project ID/dataset name, not a personal token in chat. Set Studio identifiers in the local environment; add only the exact test Studio origin to credentialed CORS. Deploy the configured Studio to Sanity's included hosting only after setup is agreed.
2. In the genuine Studio, create the synthetic article, observe saved/error states, refresh, then use an independent authenticated browser session. Edit an older revision in both sessions and record conflict/reconnect behavior. Test two physical PCs later if that literal ticket acceptance is retained. Paste the actual representative Word sample and record losses/manual fixes. Do not use confidential writing for first tests.
3. Verify draft query, direct document read, export and mutation using no credentials and a signed-in account **without project membership**. Read denial may be empty/omitted data rather than HTTP 403: assert draft text absence. Confirm owner success, published anonymous readability, and that a new draft of a live article is absent from anonymous output. Never invite the outsider as a Viewer to simulate non-membership.
4. Provide/designate an isolated test destination and install a reviewed build-only workflow on its default branch. Create the restricted expiring GitHub credential yourself and enter it only into Sanity's webhook configuration. Exercise publish, duplicate retry, failure, rapid revision changes and final manifest/status; no production Pages deploy. An actual deploy destination requires a separate explicit setup step. No full personal access token should be pasted into this conversation.
5. Run authenticated dataset export/restore to a disposable target and record results. Reassess the recommendation if conflict or paste requirements fail; do not mark WEB-01 complete until evidence closes these gates.

## Proposed downstream amendments and order

Proposals only; other cards were not edited.

1. **WEB-03**: introduce Astro/locked build deliberately in its own PR; preserve existing root anchors, `/CV/CV.html`, assets and `mitko.mk`; confirm Pages settings before replacing branch-based deployment. Keep spikes/docs out of the artifact. It can proceed with static content while WEB-01's cloud checks remain open.
2. **WEB-02 / WEB-04 / WEB-05 / WEB-13**: launch Home/Work/Articles/About/contact structure and public article fixtures first. Adopt one typed article contract, stable ID/unique slug and shared renderer; add syntax highlighting/copy button, mobile overflow and SEO there. Work remains engineering case studies linking product sites; personal interests secondary in About. No editor dependency for launch.
3. **WEB-06**: use Sanity-native single-owner membership, test anonymous/non-member API boundaries, secret custody and CORS; no Firebase unless this recommendation fails.
4. **WEB-07**: use current native table support + official code-input; agree named font-size styles. Test a real Word clipboard before accepting; add paste customization only for observed loss. Preview must use the public renderer.
5. **WEB-08**: verify actual Studio saved/error/offline/conflict behavior across independent sessions and physical PCs. Native drafts separate from live content; forbid private asset uploads with ordinary CDN storage.
6. **WEB-09**: prove the disabled webhook design in isolation; one snapshot, exact revision binding, stale/duplicate/unpublish handling, serialized deployment and truthful Studio status. Resolve final-check ordering race before promising monotonic updates. Keep WEB-01 open until its integration gates pass.

## Owner setup follow-up — 2026-11-04

The owner supplied project ID `o3i9jgij`, named **mitko.mk**, and created the disposable `web01` dataset. An unauthenticated request to `https://o3i9jgij.api.sanity.io/v2025-02-19/data/query/web01?query=count%28%2A%29&perspective=published` returned **HTTP 200**, result **0**. This proves the dataset endpoint is reachable and empty for this published query. It does not prove draft privacy or membership enforcement.

Studio and CLI configuration now default to these public identifiers. The Astro site still defaults to synthetic offline fixtures; live published reads require explicit opt-in. The configured Studio build succeeded; its browser startup displays “Connect this Studio to your project” and requests the exact CORS origin `http://127.0.0.1:4173`. The real SDK published-article read also returned zero articles without credentials. No token, CORS setting, membership, hosted Studio deployment or cloud content was changed by the agent. Owner login and the remaining acceptance gates above are still unverified.

## Hosted Studio follow-up — 2026-11-15

The owner completed local CLI Google login and ran `npx sanity deploy` from the isolated Windows worktree `C:\Users\mitko\OneDrive\Desktop\web_portfolio\web01-sanity-deploy\spikes\web-01`. The supplied CLI output reports a successful Studio build, schema deployment (1/1) and hosting deployment to **https://mitko-mk-web01.sanity.studio/**. Application ID: `lmcoe9fx7g4l5s3sfbwfn0kl`; recorded in `sanity.cli.ts` so later deploys target this same test Studio.

An independent signed-out browser visit to that hostname reached Sanity's HTTPS login screen with a redirect targeting the same application ID. This verifies a reachable hosted login gate, not owner editor access, draft API denial, persistence, Word paste or site publishing. No cloud content was created by the agent. The owner performed the Studio deployment; no portfolio deployment or merge was performed.

The earlier remote-localhost sign-in route failed with an OAuth-state error and later a browser URL-policy block; it is abandoned. Continue owner testing in the owner's regular browser at the hosted Studio. Remove the temporary `http://127.0.0.1:4173` credentialed CORS origin when it is no longer needed. Do not remove the hosted Studio origin.

Next evidence: create one synthetic unpublished article, wait for the editor's saved indicator, refresh and verify restoration. Then check the exact draft ID via anonymous APIs, test a non-member account and a separate owner session, and exercise published/draft separation. WEB-01 remains partially validated and open.

## Draft privacy API evidence — 2026-11-15

Owner-reported evidence: the synthetic article was saved and survived refresh. Document ID supplied by the owner: `925a90b1-5681-4ca0-be1a-409c010fe4c8`. This is an owner report, not an agent-observed authenticated session. The later private-browser screenshot confirms restoration of visible metadata only; see the next section.

Live checks used `https://o3i9jgij.api.sanity.io/v2025-02-19`, dataset `web01`, with **no Authorization header or cookies**:

| Check | Result |
| --- | --- |
| Query test slug with published perspective | HTTP 200, count 0 |
| Query test slug with raw perspective | HTTP 200, count 0 |
| Query draft namespace with raw perspective | HTTP 200, count 0 |
| Query article-body canary with raw perspective | HTTP 200, count 0 |
| GET `/data/doc/web01/drafts.925a90b1-5681-4ca0-be1a-409c010fe4c8` | HTTP 200, zero documents; exact draft ID omitted with reason **permission** |
| GET corresponding published ID | HTTP 200, zero documents; reason **existence** (not published) |
| GET `/data/export/web01` | HTTP 200, zero exported documents; no target ID, canary or stream error |
| POST `/data/mutate/web01?dryRun=true`, patch exact draft title | HTTP **403**, insufficient permissions; permission **update** required |

The mutation request was validation-only, using Sanity's documented `dryRun=true`; no content was changed. The exact draft read was denied by API permissions, not merely hidden by the UI. These checks verify anonymous read/export exclusion and denial of the tested dry-run update. They do not establish non-member authenticated access, second-session restoration, stale-editor conflicts, editing of published content, Word fidelity or publishing/deployment.

Reproduction: anonymous GET the exact Doc and Export paths above; the query endpoint is `/data/query/web01` with `query=count(*[_type == "article" && slug.current == "web01-draft-test"])` and `perspective=raw` (also test `published`). The dry-run JSON was `{"mutations":[{"patch":{"id":"drafts.925a90b1-5681-4ca0-be1a-409c010fe4c8","set":{"title":"WEB-01 draft test"}}}]}`. Keep the article unpublished until published/draft separation is tested deliberately. WEB-01 remains open.

## Owner browser and paste evidence — 2026-11-15

The owner supplied a private-window screenshot of the same document. It shows authenticated editor access, a Draft badge and restored title, slug and summary. This is separate-session evidence for those visible fields, not two physical PCs or proof that every body field survived reload.

For the Word-paste check, a one-page synthetic DOCX was supplied with headings, 10.5pt/18pt text, bold/italic, a genuine link, a bullet list, a two-column table with header row, inline monospace text and a C#-labelled indented code sample containing `<`, `>`, `&&` and quotes. Its source structure and rendered page were inspected. It contains only synthetic test content. The owner was instructed to open it in Microsoft Word, copy all, paste normally into Body, wait for autosave and refresh.

The subsequent owner screenshot shows the following result. This is an owner-run browser test with screenshot evidence, not an agent-observed Word clipboard capture. The source application, clipboard HTML/MIME types, paste shortcut and completion of refresh are not independently established.

| Element | Visible result | Acceptance |
| --- | --- | --- |
| Table/header | Operation, Cost and cell values appear as separate paragraphs; no table grid/structure | Fail |
| Bullet list | Both items remain as text without visible bullets | Fail |
| Large font size | The 18pt/24px line appears at ordinary paragraph size | Fail |
| Heading 3 | “Read path” appears as ordinary text | Fail for visible styling |
| Inline code | `article:42` appears as ordinary paragraph text | Fail for visible styling |
| Code block/language | Code appears as paragraph text; no code object or language badge; indentation not visibly retained | Fail |
| Special characters | Visible code retains less-than, ampersands, quotes and the Console.WriteLine text | Pass for visible characters only; exact stored text unverified |
| Heading 2, bold/italic, link | Above the supplied viewport | Unverified |
| Save/reload of pasted body | Footer says “Edited just now”; no after-refresh capture supplied | Unverified |

**Decision:** the current Studio configuration does not satisfy the requested Word-paste fidelity. Do not describe the offline surrogate importer as proof of live paste, or silently weaken the requirement. The screenshot alone does not distinguish a plain-text clipboard from rich HTML rejected by the configured editor; one controlled rich-paste check is needed before adding custom paste code.

Smallest proposed compromise: retain Sanity's existing editor, choose named sizes/headings, recreate the table using its native Table control and insert code through the official Code object with language selected. These manual steps still need save/reload/static-render verification and owner acceptance if used instead of preserving Word formatting. No paid extension has been introduced; no claim that payment fixes this result is supported. If faithful one-paste import is mandatory, WEB-07 needs a bounded clipboard/import proof before committing to this stack. Do not build a custom editorial system merely to hide this failed gate.

The owner subsequently reports that bold and italic also failed to survive the short paste check. Record this as a further failed owner-run paste result. The clipboard's actual HTML/MIME types remain unknown. Keep the original failure as evidence and keep the synthetic article unpublished. Non-member permissions, conflicts, live-article draft isolation, real publish/build/status and cloud restore remain unverified.

## Paste diagnosis and deferred owner checklist — 2026-11-15

Repository inspection confirms that the article schema permits `strong`/`em`, and no custom paste handler was stripping formatting. The disabled typography plugin controls character substitutions such as smart quotes; it is not a rich-paste switch. The locked Studio implementation registers its HTML deserializer separately and calls `@portabletext/html` 2.0.2. The same dependency, reached through the existing schema-aware block-tools adapter, retains bold and italic for semantic HTML and a synthetic Word-shaped HTML example without custom rules. These results narrow the problem but do not establish what the owner's browser received.

Added a small diagnostic only to the isolated Studio's Body input: `PasteProbeInput.tsx` and `lib/paste-probe.mjs`. It records three local booleans (HTML/plain text/Portable Text present), renders a status message and falls through synchronously to native paste handling. It does not retain, log, export or transmit the clipboard contents, add credentials, replace the editor, or implement a custom importer. The schema used by the offline renderer remains unchanged. It is built and committed, **not yet deployed to the hosted Studio or verified through an authenticated browser**. It is instrumentation, not a formatting fix.

Validation from `spikes/web-01`: `npm test` **12 passed, 0 failed**, including the existing nine tests and three new paste-diagnostic/conversion tests; `npm run studio:build` and `npm run backup` succeeded. `git diff --check` succeeded. The new tests distinguish HTML/plain-text metadata, assert no content is retained and that the observer returns synchronous `undefined`, and validate the default schema-aware conversion for the two synthetic rich inputs. The suite also reran actual static builds, draft exclusion and obsolete revision rejection; the separate backup command verified fixture NDJSON export/restore. No actual Word clipboard, cloud mutation, live webhook or portfolio deployment is implied.

Schema extraction also passed with `npx sanity schema extract --path artifacts/schema.json --force`. The first attempt without `--force` refused to overwrite the existing ignored generated schema; the retry replaced that local artifact only.

All independent investigation, implementation and available checks are finished for this iteration. At the owner's request, further interactive checks are deferred until the owner is at a PC. Do not keep requesting individual screenshots or repeated login attempts. Resume with one coordinated session using this checklist:

| Deferred check | Exact dependency / remaining evidence |
| --- | --- |
| Diagnose and close Word paste | Owner's authenticated Sanity CLI/browser. Deploy the committed diagnostic to the existing test Studio, paste the synthetic DOCX from Word, and inspect its HTML/plain-text message. Plain-text-only receipt requires source/browser diagnosis; HTML receipt with lost marks requires inspecting a synthetic captured payload and the native conversion. Do not claim either cause in advance. Then preserve all required formatting or explicitly agree a documented manual compromise. |
| Refresh and independent-session body resume | Owner's authenticated sessions; verify the complete body/table/code as well as metadata after save/refresh. This remains a two-session surrogate until tested on two physical PCs. |
| Stale-session edits | Two owner sessions. Edit the same and different fields from an older state, include disconnect/reconnect, and record merge/conflict/lost-update behavior and UI feedback. |
| Authenticated non-member denial | A genuine signed-in account without project membership. Query/direct-read/export/mutation validation must exclude the draft and deny writes; do not invite the account as Viewer. |
| Published revision separation | Owner session and disposable dataset only. Deliberately publish a synthetic revision, create an unpublished changed draft, compare exact anonymous published/draft results and ensure the build reads only the published revision. Studio Publish is not evidence that GitHub Pages deployed. |
| Real secure build/status | An explicitly designated isolated repository/destination, default-branch build-only workflow and owner-entered restricted expiring GitHub credential in the provider's secret header configuration. No browser token. Verify publish/retry/failure/rapid revisions/unpublish and matching deployment manifest/status. Current adapter remains a mock. No safe destination or usable credential is available to the agent. |
| Authenticated backup/restore | Owner Sanity CLI authentication. Export outside the public repository, import into a disposable dataset within Free limits, compare IDs/body/rendering and then decide retention. Never overwrite production. |

When the owner is ready, the existing detached Windows test worktree can receive the diagnostic with the following **CMD** commands (not PowerShell). If Git reports local source changes or a conflict, stop before switching; preserve those changes rather than reset/clean them. No dependency changed, so a fresh install is unnecessary for this update.

```bat
cd /d "C:\Users\mitko\OneDrive\Desktop\web_portfolio\web01-sanity-deploy\spikes\web-01"
git status --short
git fetch origin web-01/architecture-spike
git switch --detach origin/web-01/architecture-spike
npx sanity deploy
```

This targets the already configured test Studio app ID, not the portfolio. Hosting deployment needs the owner's local login; it has not been performed by the agent. Continue to leave WEB-01 open and the implementation available for review.

Additional official sources checked 2026-11-15: [Sanity Portable Text configuration](https://www.sanity.io/docs/studio/portable-text-editor-configuration), [custom paste handler contract](https://www.sanity.io/docs/studio/customizing-block-content), [Studio HTML-paste ownership](https://www.sanity.io/docs/changelog/studio-Ni4xMC4x), and the installed MIT-licensed `@portabletext/html` package's [upstream source](https://github.com/portabletext/editor/tree/main/packages/html). Existing quota/pricing claims retain their original 2026-11-04 check date.

## Controlled editor checks and bounded table-paste fix — 2026-11-17

The owner copied a rendered ChatGPT sample into the hosted Studio. Bold and italic visibly survived, and the owner explicitly confirmed these marks remained after refresh. Later screenshots show headings, bullets, numbering and a link preserved, while the simple two-column table became separate paragraphs. Native Table insertion and cell text entry work. A subsequent screenshot shows the table plus an inserted C# code block with highlighting and indentation. These screenshots establish visible editing/rendering; refresh persistence of the complete table/code body was not separately confirmed in words. No actual Word clipboard payload or MIME result was supplied. Named text-size and cross-session checks remain unverified. Further individual screenshot requests were stopped after the owner flagged the burden.

Added a browser-safe HTML table converter to the existing Body paste handler. It uses the already locked `@portabletext/block-tools` dependency and the compiled field schema, inserts structured table blocks at the editor selection, and retains surrounding headings, marks, links and lists. Paste without an HTML table and native Portable Text copy return synchronous `undefined` to preserve native behavior. The offline surrogate importer is still separate. There is no new dependency, network request, credential, draft export or production integration.

Only simple tables supported by the current schema are accepted. Nested/merged cells and row headers are explicitly refused with a local error, rather than silently flattened. Failure rejects the custom paste promise, which the locked editor catches without insertion; an empty `insert` is deliberately avoided because the editor may insert a trailing selection fragment even for an empty array. Clipboard contents are not logged or retained by the diagnostic; no real draft contents enter this repository.

Validation: all **16 tests pass**, including a regression that reproduces native table flattening and verifies the new clipboard conversion through serialization/static rendering, surrounding rich content, headers/cells, Word-shaped synthetic HTML, multiple tables, empty cells, unique nested keys, native fallthrough and unsupported structures. `npm run build`, `npm run studio:build`, the Body input TypeScript check and `git diff --check` pass. Synthetic Word-shaped HTML is not an actual Word paste test. These checks do not establish authenticated Studio insertion, selection/undo behavior or hosted persistence.

This fix is prepared on `web-01/architecture-spike` for draft PR #1. **Not deployed to the hosted Studio; no merge or portfolio deployment.** Sanity deployment still requires the owner's authenticated CLI, which is unavailable to this agent. WEB-01 remains open. Resume with one combined acceptance check after deployment instead of repeated small formatting tests. Outstanding private-draft, conflict, publication and backup gates above remain in scope.

Implementation follows the official [custom paste handler contract](https://www.sanity.io/docs/studio/customizing-block-content), checked 2026-11-17, and the installed Studio/editor source for the locked versions.

## Hosted acceptance progress and consolidated private API runner — 2026-11-17

The owner checked out `68751e4f60d51d18b511ef3701881ca8259b7ada` in the existing Windows test worktree and successfully deployed the test Studio (build/manifest, 1/1 schemas, hosting). PowerShell blocked `npx.ps1`; `npx.cmd` worked without any execution-policy change. The owner then supplied a correct pasted two-column table, followed by the same table in an explicitly identified incognito session. This proves the visible table's cloud persistence/separate-session restoration and hosted conversion. It does not prove two physical PCs, an actual Word clipboard or restoration of earlier body content not shown.

Independent anonymous non-CDN API checks returned zero published articles, zero raw drafts, zero raw matches for the test title, and exact draft omission for permission. No credentials, mutations or draft contents were used in those checks. Genuine authenticated non-member access remains unverified.

To stop repeated small manual checks, added `npm run check:private` (`npm.cmd run check:private` in Windows PowerShell), implemented using the supported `sanity exec scripts/check-private-drafts.mjs --with-user-token`. It reuses the owner's local CLI login. It refuses targets other than `o3i9jgij/web01`, creates only two randomly named synthetic private drafts, checks full-body round trip through a fresh authenticated SDK client, anonymous read/raw-query/dry-run-write denial, explicit stale API revision rejection, and an actual synthetic NDJSON-to-cloud-draft restore with matching data/render output. Cleanup is ownership- and revision-guarded; failed cleanup fails the overall result and reports only synthetic IDs. No publication, existing owner article read/export, GitHub trigger or production change is performed. This is not full dataset/asset backup recovery.

Local validation: **23 tests pass**, including seven new real-SDK/local-HTTP-transport tests covering success, anonymous leakage, a transport failure distinguished from revision conflict, a response lost after creation, pre-existing ID collision, cleanup failure, and preflight target/auth/ID refusal. Syntax and diff checks pass; the suite reruns static build boundaries. No dependency changes. The runner was invoked in the agent environment and the CLI stopped before script execution because no auth token was available. **The cloud runner has not yet run under owner authentication; no new live acceptance pass is claimed.** Studio redeployment is unnecessary because this change adds a CLI check only.

Remaining distinctions: guarded API writes do not prove native Studio stale/offline UI behavior; fresh SDK clients do not prove separate browser sessions (the owner incognito check is the evidence for that); synthetic Word-shaped HTML is not an actual Word paste. These limits must not be used to silently close WEB-01 or downstream WEB-06–09. Next: run the one consolidated check from the already authenticated owner worktree, then use its result to proceed without repeating completed format checks. Publishing remains unconnected and the owner's draft stays unpublished.

Official references rechecked: [CLI exec authentication](https://www.sanity.io/docs/cli-reference/exec) and [conditional revision patches](https://www.sanity.io/docs/apis-and-sdks/js-client-mutations).

## Owner cloud check passed; published snapshot preparation — 2026-11-17

Owner supplied terminal output at `4f604f9408578d0fbfaf671b3f5d0c57b482ace8`: all four private checks passed (cloud save/fresh-client read, anonymous exact/raw-read and validation-only-write denial, explicit stale API revision rejection, synthetic NDJSON/cloud restore), with `cleanupPending: []`. This is live owner-run evidence. It does not establish native Studio stale/offline UI behavior, a second physical PC or full dataset/asset restore. Existing owner drafts were untouched and nothing was published.

Prepared the next isolated publishing proof: capture the anonymous published set once, validate/fingerprint it, use the same snapshot for every route/index/manifest/sitemap, then reject source changes before deployment. Webhook payload validation rejects malformed IDs/revisions/operations and extra source/ref fields. A publish must match its exact revision; an unpublish must still be absent. Actual synthetic snapshot builds verify matching listing/article/manifest, sandbox base paths, and removal from routes/listing/sitemap after unpublish.

The Pages workflow template is under `spikes/web-01/examples/`, outside the portfolio's active workflows. Its repository guard only permits `MitkoMitrov/mitko-web01-publishing-test`. It requires a reviewed source-SHA variable, separates read-only build from Pages/id-token deployment permissions, uploads dist only, checks current public revisions before deploy and verifies the resulting live sandbox manifest afterward. The disabled webhook design now handles published create/update/delete and contains no token. No webhook/credential or test destination is established by this preparation.

The live anonymous build against web01 succeeded with zero published articles, as expected while the owner's test article stays unpublished. The dependency-free deployment guard also matched its manifest against current anonymous API metadata. This is a real cloud read/local static build, not live Pages/publishing success. All 30 local tests pass, covering malformed/private/duplicate input, snapshot integrity, obsolete events, late source changes, manifest mismatch and unpublish route/listing/sitemap removal. Workflow YAML parses and repository/permission boundaries were inspected. Direct per-route cloud mode is now disabled in favor of the snapshot builder.

The final Sanity check and Pages deploy are not atomic. Source changes in that interval and uncertain remote outcomes after timeout still require end-to-end tests; queueing is not proof of ordering/recovery. Native Studio status UI remains absent. WEB-01/downstream tickets stay open. No production migration, merge, deployment or domain change.

Current setup: [isolated publishing runbook](../../spikes/web-01/examples/PUBLISHING-SETUP.md). Sources checked: [Pages starter](https://github.com/actions/starter-workflows/blob/main/pages/static.yml), [repository dispatch](https://docs.github.com/en/rest/repos/repos), [concurrency](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency), [Sanity webhooks](https://www.sanity.io/docs/content-lake/webhooks).

## Pages bootstrap completed; dispatch authorization pending — 2026-11-17

After the owner completed GitHub sign-in, created `MitkoMitrov/mitko-web01-publishing-test` (public; repository ID 1461936803, initial commit dab4e92c8d9778b7a0de2b0614afef8f06424625). The connector returned 403 for a workflow-file write, so the signed-in browser installed the reviewed template on its main branch, workflow commit 2079a085393f9204ac0f657cb0ac92fe6cb9b9ae. Its non-comment content was independently compared with the reviewed template and matched. Pages source is Actions; the reviewed source variable is pinned to 2cbf7bc1ad6b2c8d34b0f85af5d4bfa11ef80bd4.

First run 44170968477 built/deployed successfully, but final verification failed because the account's user-site custom domain is inherited by project sites: Pages reported http://mitko.mk/mitko-web01-publishing-test/. Enabled Enforce HTTPS for the test repository. The scoped verifier now accepts only the exact test path at the known HTTPS origins and refuses HTTP, the portfolio root, arbitrary hosts, embedded credentials and query/fragment additions. Sandbox sitemap origin matches the inherited domain. All 31 local tests passed after this correction.

Second run [44171970044](https://github.com/MitkoMitrov/mitko-web01-publishing-test/actions/runs/44171970044) completed successfully: build job 134353184305 and deploy job 134353494520. Logs explicitly confirm current published metadata and matching live snapshot. Browser independently opens [the HTTPS sandbox](https://mitko.mk/mitko-web01-publishing-test/) and shows no published articles. The empty publication-manifest proof is now real GitHub Pages evidence; it is not yet a Sanity-triggered publication. The actual site shares the existing domain under a separate project path, not a separate origin. Portfolio source/master/homepage, DNS and existing articles are unchanged; no owner test article was published.

Prepared the next authorization form in GitHub: owner MitkoMitrov, expiry seven days/24 November 2026, Only select repositories → mitko-web01-publishing-test. Added Contents (currently read-only) and required Metadata (read-only); account permissions remain zero. Automatic approval review rejected attempting to change Contents to read/write because this exact privilege grant was not explicitly authorized by the general publishing request. No workaround or credential creation followed. Await explicit authorization for Contents:read/write on this test repository only, then hand generation to the owner. This permission can trigger dispatches and modify test-repository contents; the intended destination is the Sanity managed webhook. No token value is known, generated, stored or committed by the agent.

The managed webhook, actual publish/re-publish/unpublish, failure/retry/rapid ordering and Studio status remain pending. Existing Word/non-member/native conflict/full-recovery gates remain open. Evidence images show only public CI state and an ungenerated token form; no credential screenshot is retained. Official custom-domain behavior was verified in [GitHub's documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages).

## Official references (checked 2026-11-04)

- **S1** [Sanity pricing](https://www.sanity.io/pricing)
- **S2** [Sanity official GitHub organization — free hosting/no card](https://github.com/sanity-io)
- **S3** [Plans and payments](https://www.sanity.io/docs/platform-management/plans-and-payments)
- **S4** [Portable Text editor configuration](https://www.sanity.io/docs/studio/portable-text-editor-configuration)
- **S5** [Authentication and tokens](https://www.sanity.io/docs/content-lake/http-auth)
- **S6** [Drafts and versions](https://www.sanity.io/docs/content-lake/drafts-and-versions)
- **S7** [Keeping your data safe](https://www.sanity.io/docs/content-lake/keeping-your-data-safe)
- **S8** [Transactions and revision preconditions](https://www.sanity.io/docs/content-lake/transactions)
- **S9** [Webhooks API — headers/projections](https://www.sanity.io/docs/http-reference/webhooks), [draft/version filtering](https://www.sanity.io/docs/content-lake/webhooks)
- **S10** [Dataset export](https://www.sanity.io/docs/content-lake/exporting-data)
- **S11** [Dataset import](https://www.sanity.io/docs/content-lake/importing-data)
- **D1** [Decap CMS](https://decapcms.org/)
- **D2** [GitHub backend/authentication](https://decapcms.org/docs/github-backend/)
- **D3** [Richtext widget](https://decapcms.org/docs/widgets/richtext/)
- **D4** [Editorial workflow](https://decapcms.org/docs/editorial-workflows/)
- **F1** [Firebase pricing](https://firebase.google.com/pricing)
- **F2** [Firestore quota](https://firebase.google.com/docs/firestore/quotas)
- **F3** [Spark/Blaze and Functions](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans)
- **F4** [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- **T1** [Tiptap FontSize and extension reference](https://tiptap.dev/docs/editor/extensions/functionality/fontsize)
- **T2** [Paid enhanced Paste Handler](https://tiptap.dev/docs/editor/extensions/functionality/paste-handler)
- **G1** [GitHub repository dispatch](https://docs.github.com/en/rest/repos/repos#create-a-repository-dispatch-event)
- **G2** [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
- **G3** [Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)
- **A1** [Astro static GitHub Pages deployment](https://docs.astro.build/en/guides/deploy/github/)
