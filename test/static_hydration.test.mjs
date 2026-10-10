import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { webcrypto } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import test from 'node:test'
import vm from 'node:vm'
import { JSDOM, VirtualConsole } from 'jsdom'

const output = resolve(process.env.FOCALE_OUTPUT || fileURLToPath(new URL('../.output/public', import.meta.url)))
const origin = 'https://focale-editor.app'
const locales = ['en', 'fr', 'es', 'it', 'pt', 'de']

async function source(url) {
  const { pathname } = new URL(url)
  const path = /\.[a-z0-9]+$/i.test(pathname) ? pathname : `${pathname.replace(/\/$/, '')}/index.html`
  return await readFile(resolve(output, `.${path}`), 'utf8')
}

test('/issues provides a static redirect to the community issue chooser without JavaScript', async () => {
  const destination = 'https://github.com/focale-editor/community/issues/new/choose'
  const dom = new JSDOM(await source(`${origin}/issues`))
  try {
    const refresh = dom.window.document.querySelector('meta[http-equiv="refresh"]')?.content
    assert.ok(refresh, 'the generated alias redirects without the Nuxt client')
    assert.equal(refresh.match(/^0;\s*url=(.+)$/i)?.[1], destination)
    assert.equal(dom.window.document.querySelector('a')?.href, destination, 'a fallback link remains available')
    assert.equal(dom.window.document.querySelector('link[rel="canonical"]')?.href, destination)
  }
  finally {
    dom.window.close()
  }
})

/** Execute the generated client bundle over its SSR HTML, with browser parsing. */
async function hydrate({ path = '/', language = 'en-US', cookie, expectedLocale = 'en', expectedPath = path, interact, fetchCatalog = () => new Response('{"releases":[]}', { headers: { 'Content-Type': 'application/json' } }) } = {}) {
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
    window.HTMLElement.prototype.scrollIntoView = () => {}
    // Keep the live distribution service out of this deterministic static test.
    window.fetch = async (input) => {
      const target = new URL(typeof input === 'string' ? input : input.url, url)
      if (target.origin !== origin) {
        return await fetchCatalog()
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
    await interact?.({ window, nuxt })
    await new Promise(resolve => setTimeout(resolve, 50))
    assert.deepEqual(messages, [], 'no hydration warnings or runtime errors')
    return {
      search: window.location.search,
      hash: window.location.hash,
      cookie: window.document.cookie,
      path: window.location.pathname,
      locale: nuxt.$i18n.locale.value,
    }
  }
  finally {
    dom.window.close()
  }
}

/** Wait for an async catalog response to become visible in the generated app. */
async function waitFor(check) {
  const deadline = Date.now() + 5000
  while (!check() && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 20))
  assert.ok(check(), 'the download state becomes visible')
}

function assertDownloadActions(document, home) {
  assert.equal(document.querySelector('input[type="email"], .newsletter-form'), null)
  assert.equal(document.querySelector('.header-cta')?.getAttribute('href'), `${home}#downloads`)
  assert.equal(document.querySelector('.hero-actions a')?.getAttribute('href'), '#downloads')
  for (const selector of ['.header-cta', '.hero-actions a']) {
    assert.ok(document.querySelector(`${selector} svg[aria-hidden="true"]`), 'download buttons include a decorative icon')
  }
}

for (const failure of ['unreachable', 'invalid']) {
  test(`an ${failure} catalog shows a warning and a direct release link`, async () => {
    await hydrate({
      path: '/fr/', expectedLocale: 'fr',
      fetchCatalog: () => {
        if (failure === 'unreachable') throw new TypeError('Network unavailable')
        return new Response('{"releases":[{"version":"0.1.1"}]}', { headers: { 'Content-Type': 'application/json' } })
      },
      interact: async ({ window }) => {
        const document = window.document
        await waitFor(() => document.querySelector('.download-fallback-link'))
        assert.equal(document.querySelector('.download-fallback-link').href, 'https://github.com/focale-editor/get-focale/releases')
        assert.equal(document.querySelector('.download-list'), null)
        assertDownloadActions(document, '/fr')
      },
    })
  })
}

test('loading shows an informational status, then a complete release replaces it with downloads', async () => {
  let finishCatalog
  const catalogReady = new Promise(resolve => (finishCatalog = resolve))
  const version = '0.1.1'
  const filenames = {
    'windows-x64': `focale-${version}-windows-x64-setup.exe`,
    'macos-arm64': `focale-${version}-macos-arm64.dmg`,
    'macos-x64': `focale-${version}-macos-x64.dmg`,
    'linux-x64': `focale-${version}-linux-x64.zip`,
  }
  const downloads = Object.fromEntries(Object.entries(filenames).map(([target, filename]) => [target, {
    url: `https://github.com/focale-editor/get-focale/releases/download/${version}/${filename}`, platformSigned: true,
  }]))
  try {
    await hydrate({
      path: '/fr/', expectedLocale: 'fr',
      fetchCatalog: async () => {
        await catalogReady
        return new Response(JSON.stringify({ releases: [{ version, tag: version, downloads }] }), { headers: { 'Content-Type': 'application/json' } })
      },
      interact: async ({ window }) => {
        const document = window.document
        const translations = JSON.parse(await readFile(new URL('../i18n/locales/fr.json', import.meta.url), 'utf8'))
        assert.equal(document.querySelector('.download-notice p')?.textContent, translations.downloads.loading)
        assert.equal(document.querySelector('.download-notice')?.getAttribute('role'), 'status')
        assert.equal(document.querySelector('.download-fallback-link'), null, 'loading must not announce a failure')
        assertDownloadActions(document, '/fr')
        finishCatalog()
        await waitFor(() => document.querySelector('.download-list'))
        assert.equal(document.querySelector('.download-notice'), null)
        assert.equal(document.querySelector('.hero-status')?.textContent.trim(), translations.downloads.available.replace('{version}', version))
        assert.equal(document.querySelectorAll('.download-card').length, 3)
        for (const asset of Object.values(downloads)) {
          assert.ok([...document.querySelectorAll('.download-option[href]')].some(link => link.href === asset.url))
        }
      },
    })
  }
  finally {
    finishCatalog()
  }
})

for (const locale of locales) {
  const path = locale === 'en' ? '/' : `/${locale}/`
  test(`prerenders and hydrates the changelog in ${locale}`, async () => {
    const route = `${path}changelog`
    const translations = JSON.parse(await readFile(new URL(`../i18n/locales/${locale}.json`, import.meta.url), 'utf8'))
    const catalogue = JSON.parse(await source(`${origin}/changelog.json`))
    const dom = new JSDOM(await source(`${origin}${route}`))
    try {
      const document = dom.window.document
      assert.equal(document.querySelector('h1')?.textContent.trim(), translations.changelog.title)
      assert.equal(document.querySelector('link[rel="canonical"]')?.href.replace(/\/$/, ''), `${origin}${route}`)
      assert.equal(document.querySelectorAll('.changelog-release').length, catalogue.releases.length)
      assert.ok(document.querySelector(`footer a[href="${route}"]`))
      if (!catalogue.releases.length) {
        assert.equal(document.querySelector('#changelog-empty-title')?.textContent.trim(), translations.changelog.emptyTitle)
      }
      for (const release of catalogue.releases) {
        const article = document.getElementById(`v${release.version}`)
        assert.equal(article?.querySelector('time')?.dateTime, release.date)
        assert.deepEqual([...article.querySelectorAll('.release-changes li span')].map(item => item.textContent), release.changes.map(change => change.description))
        assert.equal(article.querySelectorAll('script, img').length, 0, 'notes cannot inject HTML')
      }
    }
    finally {
      dom.window.close()
    }
    await hydrate({ path: route, language: 'en-US', expectedLocale: locale })
  })
  test(`hydrates ${path} in ${locale} with JavaScript enabled`, async () => {
    // A different browser preference must not change explicitly localized URLs.
    const translations = JSON.parse(await readFile(new URL(`../i18n/locales/${locale}.json`, import.meta.url), 'utf8'))
    await hydrate({
      path, language: 'en-US', expectedLocale: locale,
      interact: async ({ window }) => {
        const document = window.document
        await waitFor(() => document.querySelector('.download-fallback-link'))
        assertDownloadActions(document, locale === 'en' ? '/' : `/${locale}`)
        assert.equal(document.querySelector('.download-notice p')?.textContent, translations.downloads.unavailable)
        assert.equal(document.querySelector('.download-notice')?.getAttribute('aria-live'), 'polite')
        assert.equal(document.querySelector('.download-fallback-link').textContent.trim(), translations.downloads.browseReleases)
      },
    })
  })
  test(`redirects / to the ${locale} browser locale after hydration`, async () => {
    const result = await hydrate({ language: locale, expectedLocale: locale, expectedPath: locale === 'en' ? '/' : `/${locale}` })
    assert.equal(result.cookie, '', 'automatic detection must not save a manual preference')
  })
  test(`keeps a localized download link without JavaScript (${locale})`, async () => {
    const dom = new JSDOM(await source(`${origin}${path}`))
    try {
      const link = dom.window.document.querySelector('noscript a')
      const messages = JSON.parse(await readFile(new URL(`../i18n/locales/${locale}.json`, import.meta.url), 'utf8'))
      assert.ok(link, 'download fallback is available without JavaScript')
      assert.equal(link.href, 'https://github.com/focale-editor/get-focale/releases')
      assert.equal(link.textContent, messages.downloads.title)
      assertDownloadActions(dom.window.document, locale === 'en' ? '/' : `/${locale}`)
      assert.equal(dom.window.document.querySelector('.download-notice p')?.textContent, messages.downloads.loading)
    }
    finally {
      dom.window.close()
    }
  })
}

test('the saved English choice wins over a French browser', async () => {
  await hydrate({ language: 'fr-FR', cookie: 'manual:en' })
})

for (const cookie of ['en', 'de', 'manual:xx']) {
  test(`ignores the stale preference ${cookie} in an existing French session`, async () => {
    const result = await hydrate({ language: 'fr-FR', cookie, expectedLocale: 'fr', expectedPath: '/fr' })
    assert.equal(result.cookie, '', 'the stale preference is cleared')
  })
}

test('following an explicit localized URL does not save a manual choice', async () => {
  const result = await hydrate({
    path: '/fr/', language: 'fr-FR', expectedLocale: 'fr',
    interact: async ({ nuxt }) => {
      await nuxt.runWithContext(() => nuxt.$router.push('/de/docs/faction/'))
    },
  })
  assert.equal(result.locale, 'de')
  assert.equal(result.cookie, '')
})

test('a selection in the language menu saves an explicit preference', async () => {
  const result = await hydrate({
    path: '/fr/', language: 'fr-FR', expectedLocale: 'fr',
    interact: async ({ window, nuxt }) => {
      const select = window.document.querySelector('.locale-switcher-select')
      select.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
      await new Promise(resolve => setTimeout(resolve, 20))
      const english = [...window.document.querySelectorAll('[role="option"]')].find(option => option.textContent === 'English')
      assert.ok(english, 'the language menu offers English')
      english.dispatchEvent(new window.MouseEvent('mousedown', { bubbles: true }))
      english.dispatchEvent(new window.MouseEvent('mouseup', { bubbles: true }))
      english.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
      const deadline = Date.now() + 5000
      while (Date.now() < deadline && (nuxt.$i18n.locale.value !== 'en' || window.location.pathname !== '/')) {
        await new Promise(resolve => setTimeout(resolve, 20))
      }
    },
  })
  assert.equal(result.locale, 'en')
  assert.equal(result.path, '/')
  assert.match(decodeURIComponent(result.cookie), /focale_locale=manual:en(?:;|$)/)
})

test('automatic redirection retains query parameters and anchors', async () => {
  const result = await hydrate({ path: '/?source=community#downloads', language: 'fr-FR', expectedLocale: 'fr', expectedPath: '/fr' })
  assert.equal(result.search, '?source=community')
  assert.equal(result.hash, '#downloads')
})

test('an explicit documentation route hydrates without browser redirection', async () => {
  await hydrate({ path: '/fr/docs/faction/', language: 'de-DE', expectedLocale: 'fr' })
})

for (const locale of locales) {
  test(`${locale} renders every new native preset page with a downloadable schema`, async () => {
    const prefix = locale === 'en' ? '' : `/${locale}`
    const specifications = [
      ['flevels', 'levels', 'adjustment-presets.md'],
      ['fhuesaturation', 'hueSaturation', 'adjustment-presets.md'],
      ['fselectivecolor', 'selectiveColor', 'adjustment-presets.md'],
      ['fchannelmixer', 'channelMixer', 'adjustment-presets.md'],
      ['fcontour', null, 'contour-presets.md'],
      ['fblackandwhite', 'blackAndWhite', 'adjustment-presets.md'],
      ['fcolorlookup', 'colorLookup', 'adjustment-presets.md'],
      ['fduotone', null, 'duotone-presets.md'],
      ['fcameraraw', null, 'camera-raw-presets.md'],
    ]
    for (const [extension, kind, reference] of specifications) {
      const dom = new JSDOM(await source(`${origin}${prefix}/docs/${extension}/`))
      try {
        const document = dom.window.document
        assert.ok(document.querySelector('h1')?.textContent.includes(`.${extension}`))
        const example = JSON.parse(document.querySelector('#schema pre code')?.textContent || 'null')
        assert.equal(example.version, 1)
        if (kind) {
          assert.equal(example.format, 'focale-adjustment-preset')
          assert.equal(example.kind, kind)
          if (kind === 'colorLookup') {
            assert.deepEqual(example.settings, {})
            assert.equal(example.lookupTable.values.length, example.lookupTable.size ** 3 * 3)
          }
          else assert.ok(Object.keys(example.settings).length >= 3)
        }
        else if (extension === 'fduotone') {
          assert.equal(example.format, 'focale-duotone-preset')
          assert.equal(Buffer.from(example.settings.inks[0].curve, 'base64').length, 256)
        }
        else if (extension === 'fcameraraw') {
          assert.equal(example.format, 'focale-camera-raw-preset')
          assert.equal(example.settings.whiteBalance, 'camera')
          assert.ok(Object.keys(example.settings).length >= 40)
        }
        else {
          assert.equal(example.format, 'focale-contour-presets')
          assert.equal(example.presets[0].curve[1][2], 1)
        }
        const download = document.querySelector(`a[download][href="/docs/reference/${reference}"]`)
        assert.ok(download, 'the full technical contract is downloadable')
        assert.ok((await readFile(resolve(output, `docs/reference/${reference}`), 'utf8')).includes(`.${extension}`))
      }
      finally {
        dom.window.close()
      }
    }
  })
}

test('native adjustment and contour pages hydrate and navigate in French', async () => {
  await hydrate({
    path: '/fr/docs/flevels/', language: 'de-DE', expectedLocale: 'fr',
    interact: async ({ window, nuxt }) => {
      await nuxt.runWithContext(() => nuxt.$router.push('/fr/docs/fcontour/'))
      assert.ok(window.document.querySelector('h1')?.textContent.includes('.fcontour'))
      for (const extension of ['fblackandwhite', 'fduotone', 'fcameraraw', 'fcolorlookup']) {
        await nuxt.runWithContext(() => nuxt.$router.push(`/fr/docs/${extension}/`))
        assert.ok(window.document.querySelector('h1')?.textContent.includes(`.${extension}`))
      }
    },
  })
})

for (const locale of locales) {
  test(`${locale} documents ACB, embedded style patterns and the current bounds`, async () => {
    const prefix = locale === 'en' ? '' : `/${locale}`
    for (const [page, expected] of [
      ['fstyle', ['256', 'patterns']],
      ['fswatch', ['ACB', 'ADO']],
      ['preset-formats', ['BLW', 'ADO', 'XMP', 'CUBE', '.fcameraraw', '.fcolorlookup', '.fduotone']],
    ]) {
      const dom = new JSDOM(await source(`${origin}${prefix}/docs/${page}/`))
      try {
        const text = dom.window.document.querySelector('main')?.textContent || ''
        for (const fragment of expected) assert.ok(text.includes(fragment), `${page} must document ${fragment}`)
      }
      finally { dom.window.close() }
    }
  })
}
