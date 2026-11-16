# WEB-03 — Astro static build foundation

Checked **2026-11-16**. [Ticket](https://trello.com/c/m9MenNfi). **Implementation ready for review; deployment acceptance remains open.**

## Starting point and scope

Default branch verified again through GitHub metadata and Git: **`master`**, starting commit **`2fce845161e70b4f67472767b96c2be8bd0bc94e`**. Dedicated branch: `web-03/astro-ssg`, based directly on that commit, not on the unmerged WEB-01 spike. Clean separate worktree; WEB-01 files are not included.

The current website is handwritten HTML with inline styles/scripts, public assets and a separate `CV/CV.html`. There was no package manifest, lockfile, build system or tracked workflow. `CNAME` and the home canonical URL identify `mitko.mk`. No applicable tracked/workspace `AGENTS.md` was found; the user's supplied instructions apply. The current WEB-03 description and all available comments were read; no comments or pagination remainder were present.

WEB-03 explicitly excludes redesign/editor implementation. The user authorized proceeding with this CMS-independent foundation while WEB-01's authenticated tests remain deferred. This change does not implement WEB-02 navigation, article templates, new Work/About pages or Sanity integration.

## Implementation and maintainability

- Root Astro **7.4.12**, static output, `site: https://mitko.mk`, no repository-name `base` and no server adapter. Exact direct dependencies and npm lockfile; Node 24.22.1 in `.nvmrc`, Node 24.19+ within 24.x accepted, npm 11.x. No global Sass dependency or credentials.
- `src/pages/index.astro` renders the existing repository-owned homepage at build time through `Document.astro`. A strict transitional document bridge extracts the reviewed head/body; unsupported document-shell changes fail rather than silently losing attributes. It is not a general HTML parser or a CMS sanitizer.
- The existing root `index.html` remains the single homepage source during this transition. It is neither redesigned nor duplicated into a second maintained HTML copy, and remains usable by current branch-based hosting before cutover. WEB-02 can deliberately replace this bridge with components in a separate reviewed change.
- Only `assets/`, `CV/` and `CNAME` are staged into ignored `.generated/public/`. All inputs are validated first; stale staged files are cleared. Symbolic links and unexpected public output fail checks. Public assets retain all existing files, including older styles, SCSS and PSD, because changing their existing URLs is outside this ticket.
- Production output is **`dist/`**, never the repository checkout. An explicit output allowlist excludes docs, source, dependency files, credentials, tests and isolated spikes. Adding future generated routes requires a deliberate allowlist update.
- The current five home fragments (`#about`, `#experience`, `#skills`, `#work`, `#contact`), `/`, `/CV/CV.html` and every existing asset URL are preserved. No redirects, DNS changes, new domain or content fetch at runtime.

The initial known WEB-01 dependency version (Astro 7.4.5) was audited. It matched [GHSA-r3h5-4585-7x3w](https://github.com/advisories/GHSA-r3h5-4585-7x3w), published November 9 and updated November 13, 2026. That advisory concerns the Node adapter's on-demand image endpoint; this site has no adapter/server endpoint. The new foundation nevertheless pins patched 7.4.12. This does not change the separate WEB-01 lockfile.

## Workflow and release boundary

`.github/workflows/pages.yml` builds on pull requests to `master`, pushes to `master` and manual dispatch. All build jobs receive only `contents: read`; checkout does not persist credentials. Node is pinned, install uses `npm ci`, and **`npm run check` must succeed before the Pages artifact is uploaded**. Artifact retention is one day. Repository action references are pinned to official commit SHAs resolved on the check date.

The dependent `deploy` job requires build success and all of: repository `MitkoMitrov/mitkomitrov.github.io`, branch `refs/heads/master`, event push or manual dispatch. Pull-request builds and feature-branch pushes cannot deploy. Only the deploy job receives `pages: write` and `id-token: write`, using GitHub's job token/OIDC and the `github-pages` environment. No PAT, Sanity token or other long-lived secret is introduced. No setting-enablement action is included.

A failed install/build/test stops artifact upload and the dependent deploy job. This is the configured and structurally tested failure gate, **not an observed production failure/rollback test**. Production protection also depends on Pages source/environment settings that the connector cannot administer. Concurrency serializes each ref without cancelling an active run; do not treat GitHub queue order as proof of monotonic content publishing. CMS revision ordering/status belongs to WEB-09.

There were no source workflows on the verified base. Before publishing this branch, the new triggers were inspected: a feature-branch push cannot deploy; opening the draft PR can run only the read-only build. This PR is not a production release. Do not merge, dispatch a production deployment, change Pages settings or mark the ticket complete as part of this implementation session.

## Evidence and acceptance

| Requirement | Evidence | Status |
| --- | --- | --- |
| Reproducible clean checkout build | Fresh clone of the published feature branch, `npm ci`, `npm run check`; 19 verified files and five passing tests | Pass on Linux |
| Generated HTML | Astro generated `/index.html`; DOM checks compare the entire head/body, including CSS, metadata and scripts, with the source | Pass locally |
| Domain, assets and important URLs | Artifact verifier checks 19 exact public paths and byte equality for CNAME/CV/assets; all fragment targets present | Pass locally |
| Failed builds preserve last live deployment | Upload follows successful checks; deploy depends on build and is restricted to master; YAML policy checks pass. Actual PR run builds/uploads successfully and skips deploy | Configured/tested structurally; live failure behavior unverified |
| Document local commands | Root README and this runbook | Pass |
| Direct deployed-route verification | Browser inspected built homepage, Work hash navigation and direct `/CV/CV.html` in an internal static preview | Pass for local preview; new GitHub Pages deployment unverified |
| No production changes | Default branch/domain/source HTML/assets untouched; review branch only | Pass for this change |

Commands run from the repository root, Node **24.22.1**, npm **11.9.0**:

```sh
npm ci --no-audit --no-fund
npm run check
npm audit --omit=dev --json
git diff --check
```

`npm run check` runs public staging, Astro static build, the output verifier and `node --test test/*.test.mjs`. **Five tests pass**: complete HTML preservation/fragment targets, exact public artifact, strict bridge rejection, stale-file cleanup/domain/missing-input/symlink rejection, and workflow privilege/dependency policy. All failures injected by tests are local synthetic temp-directory cases, not cloud data or live deployment tests.

Fresh remote-clone verification used the published branch at implementation commit `0587c9c0673ffec6d9eeb535ff6402a2316d0b20`, in a new empty directory with no dependency/generated files: `git clone --branch web-03/astro-ssg --single-branch https://github.com/MitkoMitrov/mitkomitrov.github.io.git <EMPTY_DIRECTORY>`, then `npm ci --no-audit --no-fund` and `npm run check`. All passed. A later test-only portability adjustment uses a directory junction on Windows instead of a privileged file symlink; its five tests pass again on Linux. Windows execution itself is not claimed. The production dependency audit on patched Astro reports **zero vulnerabilities** as of the check date.

The published workflow was also exercised by [draft PR #2](https://github.com/MitkoMitrov/mitkomitrov.github.io/pull/2). [GitHub run 43818405829](https://github.com/MitkoMitrov/mitkomitrov.github.io/actions/runs/43818405829) succeeded: checkout, pinned Node, locked install, build/check and checked artifact upload all passed; the **deploy job was skipped**. This verifies the PR build/permission boundary in the real service, not an actual Pages deployment. The connector successfully created the branch, workflow-containing commit and draft PR; no assumption of write capability was required.

The built homepage and CV were opened in the supported browser against an internal static `dist/` preview. The page rendered, existing Work navigation reached `/#work`, and a direct CV URL displayed the existing CV. Desktop screenshot inspected. The homepage SHA-256 remained `ad31d3accc81d784b5e02634db3ad22a4d3231ea491b735f1c558acb4d1409f8` after the Astro patch update, matching the inspected preview bytes. This does not verify a public deployment or add a branch-preview hosting service. Mobile viewport, remote third-party services and full visual/accessibility auditing are outside this build-only change; existing HTML/CSS is preserved.

## Owner steps after review, deferred until release

No owner interaction is needed to review this implementation or run the local build. The remaining steps are production release actions and must wait for explicit approval:

1. Inspect Settings → Pages: record current publishing source, custom domain and HTTPS status. The GitHub connector's repository metadata does not grant usable Pages-administration access. Confirm `mitko.mk` and existing DNS remain unchanged.
2. Choose GitHub Actions as the Pages source and restrict the `github-pages` environment to `master`. Confirm environment approvals/action policy. Retain the old working deployment information and existing source commit for recovery; source-switch behavior itself has not been tested here.
3. Merge the reviewed WEB-03 PR only when approved. Inspect the actual build/upload/deploy run. The only intended public artifact is `dist/`. No Sanity or WEB-01 secret/setup is necessary.
4. Open `https://mitko.mk/`, each preserved home fragment, the direct CV route and representative assets. Verify canonical/domain/TLS and inspect the deployed artifact. Record the run URL and deployed commit.
5. Validate a failed build against an explicitly designated isolated destination before claiming live failure preservation proven. Never break production simply to demonstrate this criterion. A failed production build can be retried through GitHub's normal run controls after its cause is fixed; keep deployment status separate from successful local builds.

WEB-03 remains open until its deployed-route and deployment behavior requirements have evidence. WEB-01's Word paste, draft conflicts/privacy and real CMS publishing checks remain open independently. WEB-02 can build the shared professional navigation and homepage after this foundation is reviewed; WEB-04/WEB-10/WEB-13 supply articles/About/Work without waiting for the editor.

## Official references (checked 2026-11-16)

- [Astro: GitHub Pages and custom domains](https://docs.astro.build/en/guides/deploy/github/)
- [GitHub: custom Pages workflows, build dependencies and permissions](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [GitHub: publishing source selection](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- Official action sources pinned in the workflow: [checkout](https://github.com/actions/checkout), [setup-node](https://github.com/actions/setup-node), [upload-pages-artifact](https://github.com/actions/upload-pages-artifact), [deploy-pages](https://github.com/actions/deploy-pages).
