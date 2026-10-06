# Focale Website

The landing page for Focale, an advanced, local-first raster image editor for
Linux, Windows and macOS.

The site is a statically generated Nuxt application, published to GitHub Pages at
<https://focale-editor.app>. It presents the editor, its downloads and signup,
and provides user guides and technical format references.

## Feedback and help

[Focale Community](https://github.com/focale-editor/community) centralizes bug
reports, feature requests, improvements and questions about the editor, website,
documentation and downloads. Include the page URL for website reports.

## Stack

Nuxt 4 · OpenVue · `@nuxtjs/i18n` · SCSS · TypeScript, built with pnpm.

Six locales ship today — English, French, Spanish, Italian, Portuguese and German —
with English served unprefixed and the rest under `/fr`, `/es`, `/it`, `/pt`, `/de`.

The static page hydrates in its URL's language. On arrival at `/`,
`app/plugins/browser-locale.client.ts` redirects through `onNuxtReady`, after
hydration (including async pages), to the saved
`focale_locale` preference, or the supported browser language (English fallback).
The redirect preserves query parameters and anchors, replaces the history entry
and leaves explicit localized or documentation links alone. Manual language
changes update the same one-year cookie. Keep module-level browser detection
disabled so it cannot change translations before hydration.

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
node --experimental-strip-types --test test/browser_locale_redirect.test.ts
pnpm test:hydration  # run after generate, against the actual static HTML and JS
```

`pnpm generate` writes `.output/public`, which can be served with any static
server (`pnpm dlx serve .output/public`).

The hydration test executes the generated client bundle in jsdom with HTML
scripting enabled. It covers the six locales, browser-language redirection,
saved preferences, explicit routes, query parameters and anchors, and the
download fallback without JavaScript. This is a DOM regression check, not a
browser layout test. Keep `NoScriptDownloads`' contents as escaped, opaque HTML:
with scripting enabled the HTML parser treats `<noscript>` contents as text,
so Vue must not try to hydrate nested components there.

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

`.github/workflows/deploy.yml` runs on every push to `main`: it tests language
redirection, generates the site, checks hydration and uploads it to GitHub Pages.
`NUXT_PUBLIC_LOOPS_FORM_ID` is read from
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

The private Focale application's **Publish Focale** workflow produces the logo,
favicons, social image, reviewed notices and downloadable format references. It
commits only selected public resources to this repository; the resulting push
runs the Pages deployment. Building or developing this website requires neither
private source access nor an editor checkout.

Maintainers with access to Focale can run **Publish Focale → website** on a chosen
source ref to refresh resources without a desktop release. Enable `screenshots`
only when regenerating the gallery. Release publication updates other resources
automatically from its source tag. The workflow and its `FOCALE_WEBSITE_TOKEN`
are configured in Focale, not here; no local directory conventions are required.

The gallery uses four scenes, both themes and French/English captures, encoded
as 1600/3200-pixel WebP images plus 320-pixel thumbnails. French routes use French
captures; other locales use English. Changes to scene IDs or image dimensions
require coordinating this public contract with the editor.
Palette tokens and the OpenVue preset are maintained in `app/assets/styles` and
`app/theme/openvue-preset.ts`.

## Desktop downloads

`useDownloads` loads `https://get.focale-editor.app/downloads.json` in the browser.
The Focale distribution workflow publishes this catalog only after the
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
limits and interchange directions.
All pages ship in the six site languages.

`DocumentationArticle` renders the structured `docs.articles` content in the
locale JSON files; `DocumentationLayout` also serves the notices pages.
`app/utils/documentation.ts` registers stable routes, groups, code samples and
downloadable references. Add a route under `app/pages/docs/`, its metadata there
and the article in all six locales. Code samples stay outside translated strings
so JSON braces are not parsed as translation placeholders. `useDocumentation`
supplies both the index and navigation. `documentationExamples.ts` holds the
dedicated native-library JSON examples. Navigation back to homepage anchors
works from documentation routes too.
