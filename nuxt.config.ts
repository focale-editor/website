import { fileURLToPath } from 'node:url'
import { focalePreset } from './app/theme/openvue-preset'
import { documentationArticles } from './app/utils/documentation'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/icon',
    '@nuxtjs/google-fonts',
    '@nuxtjs/i18n',
    '@nuxtjs/robots',
    '@nuxtjs/sitemap',
    '@openvue/nuxt-module',
  ],

  // Shared components keep flat names. Homepage sections are imported locally
  // by index.vue rather than being available through component auto-imports.
  components: [{ path: '~/components', pathPrefix: false, ignore: ['home/**'] }],

  devtools: { enabled: true },

  app: {
    head: {
      htmlAttrs: { lang: 'en', class: 'focale-dark' },
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico', sizes: 'any' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      ],
      meta: [
        { name: 'theme-color', content: '#0e1421' },
      ],
    },
  },

  css: ['~/assets/styles/main.scss'],

  site: {
    url: 'https://focale-editor.app',
    name: 'Focale',
  },

  // Values here are overridable at build time through `NUXT_PUBLIC_*` env vars.
  runtimeConfig: {
    public: {
      // Public Loops.so newsletter form identifier. Empty until it is provided,
      // in which case the signup form reports itself as unavailable instead of
      // posting to an endpoint that cannot exist.
      loopsFormId: '',
      repositoryUrl: 'https://github.com/focale-editor/website',
      packagesUrl: 'https://pub.dev/publishers/focale-editor.app',
      downloadCatalogUrl: 'https://get.focale-editor.app/downloads.json',
    },
  },

  future: { compatibilityVersion: 4 },
  compatibilityDate: '2026-08-25',

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          // Design tokens and mixins are pure declarations, so making them
          // ambient keeps every block-scoped stylesheet from repeating them.
          additionalData: '@use "assets/styles/shared" as *;',
          loadPaths: [fileURLToPath(new URL('./app', import.meta.url))],
        },
      },
    },
  },

  typescript: {
    typeCheck: false,
    strict: true,
  },

  eslint: {
    config: {
      stylistic: true,
    },
  },

  googleFonts: {
    families: {
      'Space Grotesk': [500, 600, 700],
      'Inter': [400, 500, 600],
      'JetBrains Mono': [400, 500],
    },
    // Every locale the site ships is Latin-scripted, so the Cyrillic, Greek and
    // Vietnamese subsets would be pure download weight.
    subsets: ['latin', 'latin-ext'],
    display: 'swap',
    download: true,
    preload: true,
  },

  i18n: {
    strategy: 'prefix_except_default',
    defaultLocale: 'en',
    locales: [
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json', dir: 'ltr' },
      { code: 'fr', language: 'fr-FR', name: 'Français', file: 'fr.json', dir: 'ltr' },
      { code: 'es', language: 'es-ES', name: 'Español', file: 'es.json', dir: 'ltr' },
      { code: 'it', language: 'it-IT', name: 'Italiano', file: 'it.json', dir: 'ltr' },
      { code: 'pt', language: 'pt-PT', name: 'Português', file: 'pt.json', dir: 'ltr' },
      { code: 'de', language: 'de-DE', name: 'Deutsch', file: 'de.json', dir: 'ltr' },
    ],
    defaultDirection: 'ltr',
    baseUrl: 'https://focale-editor.app',
    // Static HTML must hydrate in its route's language. The client plugin
    // detects preferences and redirects from `/` once hydration is complete.
    detectBrowserLanguage: false,
  },

  icon: {
    mode: 'svg',
    clientBundle: {
      scan: true,
      sizeLimitKb: 512,
      // Navigation icons come from data, so include them for static client routing.
      icons: ['lucide:book-open', 'lucide:scale', 'lucide:code-xml', ...Object.values(documentationArticles).map(page => page.icon)],
    },
  },

  // The module keeps its PrimeVue-era configuration key.
  primevue: {
    // Auto-import would register all eighty-odd components and inline every
    // component's theme CSS into each page. Naming only the components the site
    // uses cuts the generated HTML by roughly two thirds.
    autoImport: false,
    components: {
      include: ['Button', 'Carousel', 'Drawer', 'InputText', 'Select'],
    },
    directives: {
      include: [],
    },
    options: {
      ripple: false,
      theme: {
        preset: focalePreset,
        options: {
          // The site is a single dark design, so following the visitor's system
          // setting would only ever produce a half-themed page.
          darkModeSelector: '.focale-dark',
          cssLayer: false,
        },
      },
    },
  },

  robots: {
    disallow: [],
  },

  sitemap: {
    // GitHub Pages needs a real file at /sitemap.xml, not the redirect that
    // automatic per-locale sitemaps create for a static build.
    sitemaps: false,
  },
})
