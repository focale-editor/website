# Focale Website

The landing page for Focale, an advanced, local-first raster image editor for
Linux, Windows and macOS.

The site is a statically generated Nuxt application, published to GitHub Pages at
<https://focale-editor.app>. It exists to say what Focale is, what it will do, and
to collect addresses for the first alpha.

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
├── components/   layout/ (header, footer), home/ (page sections), ui/ (reusable)
├── composables/  newsletter, navigation, SEO and content sources
├── layouts/      the shell every page renders into
├── pages/        one route per file
└── theme/        the OpenVue preset, aligned with the editor's palette
i18n/locales/     one JSON file per language
public/           favicon.ico, apple-touch-icon, og-image, CNAME
tools/            icon generation
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

## Design

The visual language is borrowed from the mark itself — a lens. `ApertureRings.vue`
draws the focus barrel behind the logo: concentric rings, a graduated scale and
eight shutter blades, with one lit arc travelling around it. The same barrel
reappears, quieter, behind the closing call to action.

Elsewhere the page borrows the editor's own chrome rather than the usual landing
page furniture: monospace labels where a panel would put them, hairline-divided
grids instead of floating cards, tight corners, and a status-bar footer. The
palette is the near-neutral grey of the application, with `#007cf9` — the blue of
the logo's ring — as the only accent.

Everything is defined once as custom properties in `app/assets/styles/_root.scss`.
The design is dark-only, matching the editor's default shell.

## Notes

* The editor's own source is not public. What is open — and what the footer links
  to — is this site, the [focale-editor](https://github.com/focale-editor)
  organisation and the Dart packages at
  [pub.dev/publishers/focale-editor.app](https://pub.dev/publishers/focale-editor.app).
* Browser-language detection sends a French visitor from `/` to `/fr`. Because the
  site is static, that redirect can only happen after hydration, so `/` shows
  English for a moment and Vue logs a hydration mismatch in the console. Setting
  `i18n.detectBrowserLanguage` to `false` in `nuxt.config.ts` trades the
  convenience for a root page that always stays English.
* OpenVue is at `1.0.0-rc.0`. It is a community continuation of PrimeVue 4 and
  keeps its `primevue` configuration key, so PrimeVue's documentation still
  applies — but it is a release candidate, and worth pinning until it settles.
