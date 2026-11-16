# mitko.mk — Web Portfolio

Astro static portfolio for Mitko Mitrov. WEB-03 provides the build foundation; WEB-02 adds the minimal light homepage, experience timeline and article-first navigation. CMS integration is separate.

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
| `index.html` | Historical homepage retained unchanged for the current branch-based deployment until the separately reviewed Pages cutover. It is not used by Astro. |
| `src/pages/index.astro` | Homepage: short introduction → LinkedIn articles → experience timeline → selected projects → contact. All content is rendered at build time. |
| `src/layouts/Document.astro`, `src/components/` | Shared metadata, accessible header, footer and icons for future pages. |
| `src/data/portfolio.mjs`, `src/styles/global.css` | CV-backed experience/projects, verified LinkedIn article links and responsive light styles. |
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

See [WEB-02 implementation evidence](docs/architecture/WEB-02-homepage-navigation.md), [WEB-03 evidence and release runbook](docs/architecture/WEB-03-astro-ssg.md) and [the Trello requirements](https://trello.com/c/m9MenNfi). Existing domain setup documents are historical references, not proof of current DNS/Pages settings.
