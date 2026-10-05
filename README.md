# Focale Website

The landing page for Focale, an advanced, local-first raster image editor for
Linux, Windows and macOS.

The site is a statically generated Nuxt application, published to GitHub Pages at
<https://focale-editor.app>. It presents the editor, its downloads and signup,
and provides user guides and technical format references.

## Stack

Nuxt 4 · OpenVue · `@nuxtjs/i18n` · SCSS · TypeScript, built with pnpm.

Six locales ship today — English, French, Spanish, Italian, Portuguese and German —
with English served unprefixed and the rest under `/fr`, `/es`, `/it`, `/pt`, `/de`.

## Development

```bash
pnpm install
pnpm dev             # http://localhost:3000
```

Quality gates, all expected to pass before a push:

```bash
pnpm lint            # ESLint, with @nuxt/eslint's stylistic rules
pnpm typecheck       # vue-tsc against the generated Nuxt types
pnpm generate        # the static build, exactly as CI runs it
```

`pnpm generate` writes `.output/public`, which can be served with any static
server (`pnpm dlx serve .output/public`).

## Configuration

One value is read from the environment at build time. Copy `.env.example` to
`.env` for local work; in CI it comes from a repository secret.

| Variable | Purpose |
| --- | --- |
| `NUXT_PUBLIC_LOOPS_FORM_ID` | Public identifier of the [Loops.so](https://loops.so) form that collects alpha signups. |

The site is generated statically, so the signup form posts straight from the
browser to `https://app.loops.so/api/newsletter-form/<FORM_ID>`. That endpoint
takes a form identifier rather than an API key, which is what makes it usable
without a server to hold a secret — the identifier is public by design. Find it
in Loops under **Forms → your form → Embed**, at the end of the endpoint URL.

Until the variable is set, the form validates the address as usual and then
reports that signups are unavailable, rather than posting into the void.

## Deployment

`.github/workflows/deploy.yml` runs on every push to `main`: it lints, generates
the site and uploads it to GitHub Pages. `NUXT_PUBLIC_LOOPS_FORM_ID` is read from
the `LOOPS_FORM_ID` repository secret.

Two things have to be set once, in the repository settings:

* **Settings → Pages → Source**: *GitHub Actions*.
* **Settings → Secrets and variables → Actions**: a `LOOPS_FORM_ID` secret.

The custom domain lives in `public/CNAME`, so it survives every deployment.

## Layout

```
app/
├── assets/
│   └── styles/   SCSS tokens, mixins and the global stylesheet
├── components/   layout/, home/, docs/ and ui/ (reusable components)
├── composables/  newsletter, navigation, SEO and content sources
├── layouts/      the shell every page renders into
├── pages/        one route per file
└── theme/        the OpenVue preset, aligned with the editor's palette
i18n/locales/     one JSON file per language
public/           favicon.ico, apple-touch-icon, og-image, CNAME
tools/            editor assets, documentation and notice synchronization
```

Adding a page means adding `app/pages/<name>.vue`, its keys to the six locale
files, and — if it belongs in the navigation — an entry in
`app/composables/useSiteNavigation.ts`, which both the header and the footer read.

**Using a new OpenVue component means naming it in `primevue.components.include`
in `nuxt.config.ts`.** Auto-import is deliberately off: it registers all eighty-odd
components and inlines every one's theme CSS into every page, which tripled the
generated HTML. An undeclared component simply will not resolve.

`app/assets/styles/_shared.scss` is injected into every component's style block,
so tokens and mixins are available without importing them.

## Editor branding and screenshots

The logo, favicons, social image and screenshot gallery come from the Focale
checkout. To refresh them (requires Pillow and `rsvg-convert`):

```bash
python3 tools/sync_editor_assets.py
# For another checkout:
python3 tools/sync_editor_assets.py --focale-source /path/to/Focale
```

The script reads `assets/branding` and `artifacts/screenshots/sources`, then writes
the website assets under `public`. Screenshots are exported as responsive WebP
images and thumbnails. The gallery offers four views in both editor themes,
using French captures on `/fr` and English captures for the other locales.
Palette tokens and the OpenVue preset are maintained in `app/assets/styles` and
`app/theme/openvue-preset.ts`.

## Desktop downloads

`useDownloads` loads `https://get.focale-editor.app/downloads.json` in the browser.
The private Focale distribution workflow publishes this catalog only after the
macOS Apple Silicon, macOS Intel, Windows x64 and Linux x64 artifacts are available.
`DownloadsSection` presents their GitHub Release attachments on this main site;
the header and hero switch to download actions once a complete release is present.
An empty or unavailable catalog keeps the existing signup. No website rebuild is
needed for subsequent desktop versions. `NUXT_PUBLIC_DOWNLOAD_CATALOG_URL` can
override the endpoint at build time. The GetFocale repository hosts metadata only.

Catalog checks: `node --experimental-strip-types --test test/download_catalog.test.ts`.
Validation: `pnpm lint`, `pnpm typecheck`, `pnpm generate` (inspect `.output/public`).

## Documentation and third-party notices

`app/pages/docs/` provides getting started, editing, shortcuts, troubleshooting,
platforms, import/export formats, native projects and native preset libraries,
alongside the existing licenses and corresponding-source pages. Each portable
library has its own page: `.fbrush`, `.fpattern`, `.fshape`, `.fstyle`, `.fswatch`,
`.fgradient`, `.fcurve` and `.faction`, with usage, schema, examples, validation
limits and interchange directions. Application architecture is not published.
All pages ship in the six site languages. Desktop navigation sits along the
viewport's left edge without a surrounding card or repeated documentation title;
mobile navigation uses an OpenVue Drawer opened by a labelled button. It closes
on navigation, Escape, backdrop dismissal or a switch to the desktop breakpoint.
Dismissal returns focus to the button; the modal locks scrolling and makes the
background inert. Articles include section anchors,
accessible format tables and localized editor illustrations where relevant.

`DocumentationArticle` renders the structured `docs.articles` content in the
locale JSON files; `DocumentationLayout` also serves the notices pages.
`app/utils/documentation.ts` registers stable routes, groups, code samples and
downloadable references. Add a route under `app/pages/docs/`, its metadata there
and the article in all six locales. Code samples stay outside translated strings
so JSON braces are not parsed as translation placeholders. `useDocumentation`
supplies both the index and navigation. `documentationExamples.ts` holds the
dedicated native-library JSON examples. Navigation back to homepage anchors
works from documentation routes too.

The public guides were checked against the editor source on 5 October 2026.
Keep claims tied to the implementation: configured platform targets are not
necessarily published releases, and interchange support is not complete foreign
feature compatibility. On review, update `docs.developmentNote` in every locale.
The editor's `docs/user-documentation.md` maps public topics to their source of
truth. The full English native-format references are copied without modification:

```bash
python3 tools/sync_documentation.py
python3 tools/sync_documentation.py --check
# Another source checkout:
python3 tools/sync_documentation.py --focale-source /path/to/Focale
```

This explicit seven-file allowlist writes `public/docs/reference/` and a SHA-256
manifest. No application sources or release configuration are exported. Refresh
the copies after changing the editor specifications and review the six-language
summaries against code. Validate with the quality gates above and inspect the
generated documentation routes and sitemap under `.output/public`.

Refresh the public original notices from the reviewed editor catalogue with:

```bash
python3 tools/sync_licenses.py
# Another source checkout:
python3 tools/sync_licenses.py --source /path/to/Focale/assets/legal
python3 -m unittest discover -s test -p '*_test.py'
```

The script validates the complete notice allowlist and hashes before copying
into `public/legal`. It does not copy application sources or private release
configuration. Commit the resulting public files with the documentation changes.
The site's catalogue describes the current review; an installed application's
license dialog and its versioned release source archive describe that version.
