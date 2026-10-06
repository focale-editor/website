import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import { runInNewContext } from 'node:vm'

const source = stripTypeScriptTypes(readFileSync(new URL('../app/plugins/browser-locale.client.ts', import.meta.url), 'utf8'))
const codes = ['en', 'fr', 'es', 'it', 'pt', 'de']

interface PreferenceOptions {
  path?: string
  browser?: string | null
  cookie?: string | null
  query?: string
  hash?: string
}

function fixture({ path = '/', browser = 'fr', cookie = null, query = '', hash = '' }: PreferenceOptions = {}) {
  const hooks = new Map<string, (data?: { newLocale: string }) => unknown>()
  const readyCallbacks: (() => unknown)[] = []
  const preference = { value: cookie }
  const navigation: { path: string, replace: boolean }[] = []
  const nuxt = {
    isHydrating: true,
    $router: { currentRoute: { value: { path } } },
    $i18n: { locale: { value: 'en' }, localeCodes: { value: codes }, defaultLocale: 'en', getBrowserLocale: () => browser ?? undefined },
    $switchLocalePath: (locale: string) => `${locale === 'en' ? '/' : `/${locale}`}${query}${hash}`,
    runWithContext: (callback: () => unknown) => callback(),
    hook: (name: string, callback: (data?: { newLocale: string }) => unknown) => hooks.set(name, callback),
  }
  const context = {
    plugin: undefined as { setup: (nuxt: unknown) => void } | undefined,
    defineNuxtPlugin: (plugin: unknown) => plugin,
    onNuxtReady: (callback: () => unknown) => readyCallbacks.push(callback),
    useCookie: (name: string, options: { path: string, sameSite: string, maxAge: number }) => {
      assert.equal(name, 'focale_locale')
      assert.equal(options.path, '/')
      assert.equal(options.sameSite, 'lax')
      assert.equal(options.maxAge, 31536000)
      return preference
    },
    navigateTo: (path: string, options: { replace: boolean }) => navigation.push({ path, replace: options.replace }),
  }
  runInNewContext(source.replace('export default', 'plugin ='), context)
  context.plugin!.setup(nuxt)
  const ready = async () => {
    nuxt.isHydrating = false
    for (const callback of readyCallbacks) await callback()
  }
  return { nuxt, hooks, navigation, preference, ready }
}

test('keeps the prerendered locale and cookie intact until hydration finishes', async () => {
  const value = fixture({ cookie: 'de' })
  assert.deepEqual(value.navigation, [])
  assert.equal(value.nuxt.$i18n.locale.value, 'en')
  value.hooks.get('i18n:localeSwitched')!({ newLocale: 'en' })
  assert.equal(value.preference.value, 'de')
  await value.hooks.get('app:mounted')?.()
  assert.deepEqual(value.navigation, [])
  await value.ready()
  assert.deepEqual(value.navigation, [{ path: '/de', replace: true }])
})

test('redirects to each supported browser language after hydration is ready', async () => {
  for (const browser of codes) {
    const value = fixture({ browser })
    await value.ready()
    assert.equal(value.preference.value, browser)
    assert.deepEqual(value.navigation, browser === 'en' ? [] : [{ path: `/${browser}`, replace: true }])
  }
})

test('the saved choice takes precedence over the browser, including English', async () => {
  for (const cookie of ['de', 'en']) {
    const value = fixture({ browser: 'fr', cookie })
    await value.ready()
    assert.equal(value.preference.value, cookie)
    assert.deepEqual(value.navigation, cookie === 'en' ? [] : [{ path: '/de', replace: true }])
  }
})

test('an invalid preference is replaced by the detected supported language', async () => {
  const value = fixture({ cookie: 'xx', browser: 'fr' })
  await value.ready()
  assert.deepEqual(value.navigation, [{ path: '/fr', replace: true }])
  assert.equal(value.preference.value, 'fr')
})

test('an unmatched browser falls back to English without redirecting', async () => {
  const value = fixture({ browser: null })
  await value.ready()
  assert.deepEqual(value.navigation, [])
  assert.equal(value.preference.value, 'en')
})

test('explicit localized pages and documentation paths are not redirected', async () => {
  for (const path of ['/fr', '/fr/', '/docs', '/fr/docs/faction']) {
    const value = fixture({ path, browser: 'de', cookie: 'it' })
    await value.ready()
    assert.deepEqual(value.navigation, [])
    assert.equal(value.preference.value, 'it')
  }
})

test('the redirect preserves query parameters and section anchors', async () => {
  const value = fixture({ query: '?source=community', hash: '#downloads' })
  await value.ready()
  assert.deepEqual(value.navigation, [{ path: '/fr?source=community#downloads', replace: true }])
})

test('subsequent language changes persist the new manual choice', async () => {
  const value = fixture()
  await value.ready()
  value.hooks.get('i18n:localeSwitched')!({ newLocale: 'en' })
  assert.equal(value.preference.value, 'en')
})
