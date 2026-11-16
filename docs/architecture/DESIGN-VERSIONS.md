# Portfolio design versions

## INITAL_VERSION_1

The Lovable editorial design approved on 16 November 2026 is preserved on the
remote branch `INITAL_VERSION_1` at commit
`401881cc5a7ebf2245a38f6d03621dc29124207b`.
The spelling matches the requested rollback name.

To restore that homepage while keeping subsequent repository history:

```sh
git fetch origin
git switch -c restore/initial-version-1 origin/master
git restore --source=origin/INITAL_VERSION_1 -- src/styles/global.css src/pages/index.astro src/layouts/Document.astro src/components/Hero.astro
npm ci
npm run check
git add src
git commit -m "style: restore INITAL_VERSION_1 portfolio"
```

Open and merge the restoration pull request into `master`; the existing Pages
workflow publishes the restored design. Do not force-reset `master`.

## Stacked bento template

Adapted from the user-provided `stacked_bento_portfolio.zip`: warm sand canvas,
peach bio card, pastel article and project cards, rounded nested rows, and a
pink contact area. The existing real articles, projects, timeline and links are
retained. The experience timeline receives its own full-width card. On narrow
screens all cards follow the original content order in one column.

The existing Astro build and GitHub Pages hosting remain in use. The template's
placeholder content and JavaScript entrance effect are not carried over; all
portfolio content renders as static HTML.
