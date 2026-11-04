# WEB-01 — CMS and publishing architecture

Checked **2026-11-04**. [Ticket](https://trello.com/c/VKnVvr9f). **Verdict: partially validated; leave WEB-01 open.**

Recommend **Astro static generation + Sanity Studio/Content Lake Free + a managed publish webhook to GitHub Actions + GitHub Pages**. This avoids owning an editorial database and authentication system. It is a candidate architecture, not an end-to-end validated integration. Actual Word paste, cloud permissions, cross-session persistence, conflicts and deployment remain acceptance gates.

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
| Word paste | Semantic conversion plausible, exact fidelity unproven. Surrogate importer preserves tested structure with explicit rules; not connected to Studio paste. | Word/table/size fidelity unverified; Markdown cannot represent arbitrary Word formatting alone. | Basic HTML paste possible. Vendor's enhanced Word Paste Handler is paid Team; not assumed free [T2]. |
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
| Headings, sizes, marks/list/link/table/header/inline code/C# block | HTML surrogate → Portable Text → JSON save/reload → renderer; test verifies exact code text, indentation and symbols | Pass for offline surrogate, not Word/Studio clipboard |
| Full static crawlable body | Astro output `/articles/a-bounded-cache/index.html`, no scripts; browser inspection shows table/header, sizes and code | Pass for fixture |
| Draft exclusion | Actual test build injects a synthetic draft canary; output/manifest exclude it and no draft URL exists | Pass for local build boundary; no cloud ACL proof |
| Unsafe input | Renderer escapes hostile text/code, suppresses javascript links; unknown content fails | Pass for tested payloads, not a complete editor security audit |
| Save/reload/export/restore | Local JSON edit/reload and NDJSON deep-equality round trip | Pass locally; cloud persistence/restore unverified |
| Genuine login; anon/non-owner draft API denial | No project/session/credentials available | Unverified |
| Separate-session resume and old-revision conflict | No authenticated browser sessions available | Unverified; two physical PCs not tested |
| Unpublished revision of a live article stays private | Documented Sanity model only | Unverified on live service |
| Publish/retry/failure adapter | Mock HTTP transport asserts no draft call, stable ID/rev, no body; rejects 401/offline; stale-revision build fails | Pass for mock/build contract; real trigger unverified |
| Queued/failed/live feedback and ordering | Mapper test; proposed workflow contract | Unverified end-to-end |
| $0 recurring setup | Official plan review; no billing enabled/resources created | Plausible, service setup unverified |

Actual clipboard from Word was **not** tested: no Word app/document/session is available. The checked-in surrogate is simplified semantic HTML, not a captured Word clipboard payload. Default conversion loses custom font-size styles; explicit offline rules map only 14px/24px paragraphs. Word pt sizes, mixed inline sizes, fonts, colors, merged cells, images, complex Word lists and layout are not proven. In Studio, manually choose named sizes, insert/review tables and paste code into the code-input object with language selected until clipboard behavior is validated. These are disclosed manual steps, not proof of satisfying WEB-07. Offline conversion rules are not wired into Studio. No paid paste extension used. Syntax highlighting/copy button belongs to WEB-04, not this recognisable-code spike.

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
