import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {webcrypto} from 'node:crypto'
import {fileURLToPath} from 'node:url'
import {resolve} from 'node:path'
import test from 'node:test'
import vm from 'node:vm'
import {JSDOM, VirtualConsole} from 'jsdom'

const output = resolve(process.env.FOCALE_OUTPUT || fileURLToPath(new URL('../.output/public', import.meta.url)))
const origin = 'https://focale-editor.app'
const locales = ['en', 'fr', 'es', 'it', 'pt', 'de']

async function source(url) {
  const { pathname } = new URL(url)
  const path = /\.[a-z0-9]+$/i.test(pathname) ? pathname : `${pathname.replace(/\/$/, '')}/index.html`
  return await readFile(resolve(output, `.${path}`), 'utf8')
}

/** Execute the generated client bundle over its SSR HTML, with browser parsing. */
async function hydrate({ path = '/', language = 'en-US', cookie, expectedLocale = 'en', expectedPath = path } = {}) {
  const url = `${origin}${path}`
  const messages = []
  const virtualConsole = new VirtualConsole()
  for (const level of ['warn', 'error', 'jsdomError']) {
    virtualConsole.on(level, (...values) => messages.push(values.map(String).join(' ')))
  }
  // "outside-only" disables the HTML parser's scripting flag and falsely parses
  // noscript contents as elements. Enable scripting to reproduce browser DOMs.
  // jsdom does not load external scripts here; module execution is handled below.
  const dom = new JSDOM(await source(url), { url, runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole })
  const { window } = dom
  try {
    Object.defineProperty(window.navigator, 'languages', { value: [language] })
    Object.defineProperty(window.navigator, 'language', { value: language })
    Object.defineProperty(window, 'crypto', { value: webcrypto })
    if (cookie) window.document.cookie = `focale_locale=${cookie};path=/`
    for (const name of ['Request', 'Response', 'Headers', 'AbortController', 'AbortSignal', 'TextEncoder', 'TextDecoder', 'structuredClone']) {
      window[name] = globalThis[name]
    }
    window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
    window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} }
    window.matchMedia = media => ({ matches: false, media, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })
    window.scrollTo = () => {}
    // Keep the live distribution service out of this deterministic static test.
    window.fetch = async (input) => {
      const target = new URL(typeof input === 'string' ? input : input.url, url)
      if (target.origin !== origin) {
        return new Response('{"releases":[]}', { headers: { 'Content-Type': 'application/json' } })
      }
      return new Response(await source(target.href), { headers: { 'Content-Type': target.pathname.endsWith('.json') ? 'application/json' : 'text/javascript' } })
    }
    // CSS layout is outside this DOM test; unblock Vite's stylesheet preloads.
    new window.MutationObserver((records) => {
      for (const record of records) {
        for (const element of record.addedNodes) {
          if (element.tagName === 'LINK' && element.rel === 'stylesheet') element.dispatchEvent(new window.Event('load'))
        }
      }
    }).observe(window.document.head, { childList: true })

    const context = dom.getInternalVMContext()
    const imports = JSON.parse(window.document.querySelector('script[type="importmap"]')?.textContent || '{}').imports || {}
    const resolveModule = (specifier, parent) => new URL(imports[specifier] || specifier, parent).href
    const modules = new Map()
    async function moduleAt(url) {
      if (!modules.has(url)) {
        modules.set(url, source(url).then(code => new vm.SourceTextModule(code, {
          context,
          identifier: url,
          initializeImportMeta(meta) { meta.url = url },
          async importModuleDynamically(specifier, parent) {
            const child = await moduleAt(resolveModule(specifier, parent.identifier))
            if (child.status === 'unlinked') await child.link(linker)
            if (child.status === 'linked') await child.evaluate()
            return child
          },
        })))
      }
      return await modules.get(url)
    }
    async function linker(specifier, parent) {
      return await moduleAt(resolveModule(specifier, parent.identifier))
    }
    const entry = await moduleAt(window.document.querySelector('script[type="module"][src]').src)
    await entry.link(linker)
    await entry.evaluate()

    let nuxt
    const deadline = Date.now() + 5000
    while (Date.now() < deadline) {
      nuxt = window.document.getElementById('__nuxt').__vue_app__?.config.globalProperties.$nuxt
      if (nuxt && !nuxt.isHydrating && nuxt.$i18n.locale.value === expectedLocale && window.location.pathname === expectedPath) break
      await new Promise(resolve => setTimeout(resolve, 20))
    }
    // Let pending page effects run so late hydration warnings are also captured.
    await new Promise(resolve => setTimeout(resolve, 50))
    assert.ok(nuxt, 'the generated Nuxt app mounts')
    assert.equal(nuxt.isHydrating, false, 'hydration completes')
    assert.equal(nuxt.$i18n.locale.value, expectedLocale)
    assert.equal(window.location.pathname, expectedPath)
    assert.deepEqual(messages, [], 'no hydration warnings or runtime errors')
    return {
      search: window.location.search,
      hash: window.location.hash,
      cookie: window.document.cookie,
    }
  }
  finally {
    dom.window.close()
  }
}

for (const locale of locales) {
  const path = locale === 'en' ? '/' : `/${locale}/`
  test(`hydrates ${path} in ${locale} with JavaScript enabled`, async () => {
    // A different browser preference must not change explicitly localized URLs.
    await hydrate({ path, language: 'en-US', expectedLocale: locale })
  })
  test(`redirects / to the ${locale} browser locale after hydration`, async () => {
    const result = await hydrate({ language: locale, expectedLocale: locale, expectedPath: locale === 'en' ? '/' : `/${locale}` })
    assert.match(result.cookie, new RegExp(`focale_locale=${locale}(?:;|$)`))
  })
  test(`keeps a localized download link without JavaScript (${locale})`, async () => {
    const dom = new JSDOM(await source(`${origin}${path}`))
    try {
      const link = dom.window.document.querySelector('noscript a')
      const messages = JSON.parse(await readFile(new URL(`../i18n/locales/${locale}.json`, import.meta.url), 'utf8'))
      assert.ok(link, 'download fallback is available without JavaScript')
      assert.equal(link.href, 'https://github.com/focale-editor/get-focale/releases')
      assert.equal(link.textContent, messages.downloads.title)
    }
    finally {
      dom.window.close()
    }
  })
}

test('the saved English choice wins over a French browser', async () => {
  await hydrate({ language: 'fr-FR', cookie: 'en' })
})

test('automatic redirection retains query parameters and anchors', async () => {
  const result = await hydrate({ path: '/?source=community#downloads', language: 'fr-FR', expectedLocale: 'fr', expectedPath: '/fr' })
  assert.equal(result.search, '?source=community')
  assert.equal(result.hash, '#downloads')
})

test('an explicit documentation route hydrates without browser redirection', async () => {
  await hydrate({ path: '/fr/docs/faction/', language: 'de-DE', expectedLocale: 'fr' })
})
