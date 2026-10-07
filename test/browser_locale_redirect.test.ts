import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import { runInNewContext } from 'node:vm'

const source = stripTypeScriptTypes(readFileSync(new URL('../app/plugins/browser-locale.client.ts', import.meta.url), 'utf8'))
const preferenceSource = stripTypeScriptTypes(readFileSync(new URL('../app/composables/useLocalePreference.ts', import.meta.url), 'utf8'))
const codes = ['en', 'fr', 'es', 'it', 'pt', 'de']

interface PreferenceOptions {
  path?: string
  browser?: string | null
  cookie?: string | null
  query?: string
  hash?: string
}

function fixture({ path = '/', browser = 'fr', cookie = null, query = '', hash = '' }: PreferenceOptions = {}) {
  const readyCallbacks: (() => unknown)[] = []
  const preference = { value: cookie }
  const navigation: { path: string, replace: boolean }[] = []
  const nuxt = {
    isHydrating: true,
    $router: { currentRoute: { value: { path } } },
    $i18n: { locale: { value: 'en' }, localeCodes: { value: codes }, defaultLocale: 'en', getBrowserLocale: () => browser ?? undefined },
    $switchLocalePath: (locale: string) => `${locale === 'en' ? '/' : `/${locale}`}${query}${hash}`,
    runWithContext: (callback: () => unknown) => callback(),
  }
  const context = {
    plugin: undefined as { setup: (nuxt: unknown) => void } | undefined,
    useLocalePreference: undefined as (() => { value: string | null }) | undefined,
    defineNuxtPlugin: (plugin: unknown) => plugin,
    onNuxtReady: (callback: () => unknown) => readyCallbacks.push(callback),
    computed: (options: { get: () => string | null, set: (value: string | null) => void }) => ({
      get value() { return options.get() },
      set value(value: string | null) { options.set(value) },
    }),
    useCookie: (name: string, options: { path: string, sameSite: string, maxAge: number }) => {
      assert.equal(name, 'focale_locale')
      assert.equal(options.path, '/')
      assert.equal(options.sameSite, 'lax')
      assert.equal(options.maxAge, 31536000)
      return preference
    },
    navigateTo: (path: string, options: { replace: boolean }) => navigation.push({ path, replace: options.replace }),
  }
  runInNewContext(preferenceSource.replace('export function', 'function'), context)
  runInNewContext(source.replace('export default', 'plugin ='), context)
  context.plugin!.setup(nuxt)
  const ready = async () => {
    nuxt.isHydrating = false
    for (const callback of readyCallbacks) await callback()
  }
  const remember = (locale: string) => {
    context.useLocalePreference!().value = locale
  }
  return { nuxt, navigation, preference, ready, remember }
}

test('keeps the prerendered locale and cookie intact until hydration finishes', async () => {
  const value = fixture({ cookie: 'manual:de' })
  assert.deepEqual(value.navigation, [])
  assert.equal(value.nuxt.$i18n.locale.value, 'en')
  assert.equal(value.preference.value, 'manual:de')
  await value.ready()
  assert.deepEqual(value.navigation, [{ path: '/de', replace: true }])
})

test('redirects to each supported browser language without saving an automatic choice', async () => {
  for (const browser of codes) {
    const value = fixture({ browser })
    await value.ready()
    assert.equal(value.preference.value, null)
    assert.deepEqual(value.navigation, browser === 'en' ? [] : [{ path: `/${browser}`, replace: true }])
  }
})

test('only a manual choice takes precedence over the browser, including English', async () => {
  for (const cookie of ['manual:de', 'manual:en']) {
    const value = fixture({ browser: 'fr', cookie })
    await value.ready()
    assert.equal(value.preference.value, cookie)
    assert.deepEqual(value.navigation, cookie === 'manual:en' ? [] : [{ path: '/de', replace: true }])
  }
})

test('legacy automatic preferences are cleared so the browser language wins', async () => {
  for (const cookie of ['en', 'de', 'xx']) {
    const value = fixture({ browser: 'fr', cookie })
    await value.ready()
    assert.deepEqual(value.navigation, [{ path: '/fr', replace: true }])
    assert.equal(value.preference.value, null)
  }
})

test('an unsupported manual preference is cleared without saving the detected locale', async () => {
  const value = fixture({ cookie: 'manual:xx', browser: 'fr' })
  await value.ready()
  assert.deepEqual(value.navigation, [{ path: '/fr', replace: true }])
  assert.equal(value.preference.value, null)
})

test('an unmatched browser falls back to English without storing a preference', async () => {
  const value = fixture({ browser: null })
  await value.ready()
  assert.deepEqual(value.navigation, [])
  assert.equal(value.preference.value, null)
})

test('explicit localized pages and documentation paths keep their locale and preference', async () => {
  for (const path of ['/fr', '/fr/', '/docs', '/fr/docs/faction']) {
    const value = fixture({ path, browser: 'de', cookie: 'manual:it' })
    await value.ready()
    assert.deepEqual(value.navigation, [])
    assert.equal(value.preference.value, 'manual:it')
  }
})

test('the redirect preserves query parameters and section anchors', async () => {
  const value = fixture({ query: '?source=community', hash: '#downloads' })
  await value.ready()
  assert.deepEqual(value.navigation, [{ path: '/fr?source=community#downloads', replace: true }])
})

test('an explicit selection persists even if the selected locale was already active', async () => {
  const value = fixture({ browser: 'en' })
  await value.ready()
  value.remember('en')
  assert.equal(value.preference.value, 'manual:en')
})
