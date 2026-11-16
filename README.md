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

## GitHub Pages deployment

The live site is **https://mitko.mk/**. GitHub Pages uses **GitHub Actions**, with **Enforce HTTPS** enabled. HTTP redirects to HTTPS. DNS/custom domain and existing public URLs are preserved.

Merge reviewed changes to `master` to run the checked build, artifact upload and Pages deployment. Feature-branch pushes cannot deploy; PRs targeting `master` run read-only build checks. Deploy uses the short-lived GitHub job token/OIDC, with Pages permissions confined to the deploy job. Build/check failures prevent upload and deployment.

Publish **`dist/`**, never the repository root. The root `index.html` is historical and is not the Astro page source. No Sanity setup is required for the current static portfolio.

See [verified release evidence](docs/architecture/WEB-02-release.md), [WEB-02 implementation](docs/architecture/WEB-02-homepage-navigation.md) and [WEB-03 investigation](docs/architecture/WEB-03-astro-ssg.md). Historical domain setup guides do not describe the current Pages publishing source.
