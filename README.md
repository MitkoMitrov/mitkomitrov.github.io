# mitko.mk — Web Portfolio

Astro static build for Mitko Mitrov's existing portfolio. **WEB-03 introduces the build foundation without redesigning the site or connecting a CMS.**

## Run locally

Use Node **24.22.1** (`.nvmrc`) and npm **11.x**. The root lockfile was generated/tested with npm 11.9.0. Node 24.19+ within the 24.x line is accepted for the owner's existing Windows setup.

```sh
npm ci
npm run dev
```

For a production build and focused checks:

```sh
npm run check
npm run preview
```

The preview command serves **built `dist/`**; rebuild before checking source changes. No global Sass install, database, credentials or environment file is needed. Run commands from the repository root, not the isolated WEB-01 spike directory.

## Source and generated output

| Path | Role |
| --- | --- |
| `index.html` | Transitional, single source of truth for the existing homepage; remains usable by the current branch-based deployment until cutover. |
| `src/pages/index.astro` | Generates `/` at build time from that repository-owned HTML. No browser content fetching. |
| `src/layouts/Document.astro` | Shared document shell; WEB-02 can replace the transitional raw-HTML bridge with components. |
| `assets/`, `CV/`, `CNAME` | Existing public files, copied unchanged into the build. `/CV/CV.html`, home anchors and custom domain remain valid. |
| `scripts/prepare-public.mjs` | Stages only those public sources into ignored `.generated/public/`; removes stale staged files. |
| `scripts/verify-build.mjs` | Checks the exact public output allowlist and byte equality of preserved assets/CV/CNAME. |
| `dist/`, `.astro/`, `.generated/` | Generated and ignored; never edit or commit. |
| `.github/workflows/pages.yml` | Read-only PR build/check; Pages deployment only from this repository's `master` after a successful build. |

The production artifact is **`dist/`**, never the repository root. Documentation, tests, dependency files and isolated prototypes are not published by this build. Do not place confidential material in the explicitly public `assets/` or `CV/` directories.

Add future pages under `src/pages/`. When adding a public route, update the artifact allowlist deliberately in `scripts/verify-build.mjs` and extend the route checks. Article models/templates belong to WEB-04; the CMS/editor remains independent.

## GitHub Pages release boundary

This branch is for review; it does not switch production hosting or change DNS. Existing `master` HTML remains the live source while the PR is unmerged.

After review and explicit release approval, the owner must confirm Pages settings, retain **`mitko.mk`**, select **GitHub Actions** as the publishing source and restrict the `github-pages` environment to `master`. Then a reviewed merge/push to `master` builds, tests, uploads `dist/` and deploys that checked artifact. PR and feature-branch runs cannot enter the deploy job. No PAT, CMS token or browser credential is required; deployment uses GitHub's short-lived job token/OIDC.

A failed build/check prevents artifact upload and the dependent deploy job. This path is configured and locally checked; actual GitHub Pages cutover, failed-run behavior against a live destination and deployed route verification remain unverified until release. Do not mark WEB-03 complete solely from a local build.

See [WEB-03 evidence and release runbook](docs/architecture/WEB-03-astro-ssg.md) and [the Trello requirements](https://trello.com/c/m9MenNfi). Existing domain setup documents are historical references, not proof of current DNS/Pages settings.
