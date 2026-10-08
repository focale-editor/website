import assert from 'node:assert/strict'
import test from 'node:test'
import { downloadTargets, parseDownloadCatalog } from '../app/utils/downloadCatalog.ts'

/** Build a catalog using either current attachments or immutable legacy names. */
function catalog(legacy = false, tag = '0.1.1') {
  return {
    releases: [{
      version: '0.1.1', tag,
      downloads: Object.fromEntries(downloadTargets.map(target => [target, {
        url: `https://github.com/focale-editor/get-focale/releases/download/${tag}/${legacy ? 'Focale-0.1.1+2' : 'focale-0.1.1'}-${target}.zip`, platformSigned: false,
      }])),
    }],
  }
}

test('empty catalogs keep the existing signup', () => {
  assert.equal(parseDownloadCatalog({ releases: [] }), null)
})

test('complete release catalogs expose all CPU-specific download links', () => {
  assert.equal(Object.keys(parseDownloadCatalog(catalog())!.downloads).length, 4)
})

test('current installers and legacy releases remain available for both tag spellings', () => {
  for (const legacy of [false, true]) {
    for (const tag of ['0.1.1', 'v0.1.1']) {
      const value = catalog(legacy, tag)
      for (const target of downloadTargets) {
        const extension = target.startsWith('macos-') ? '.dmg' : target === 'windows-x64' ? '-setup.exe' : '.zip'
        const asset = value.releases[0]!.downloads[target]!
        asset.url = asset.url.replace(/\.zip$/, extension)
      }
      const parsed = parseDownloadCatalog(value)!
      assert.equal(parsed.version, '0.1.1')
      assert.equal(parsed.tag, tag)
      assert.equal(Object.keys(parsed.downloads).length, 4)
      assert.equal(parsed.downloads['windows-x64'].url, value.releases[0]!.downloads['windows-x64']!.url)
    }
  }
})

test('legacy URL-encoded build numbers remain valid', () => {
  const value = catalog(true)
  const asset = value.releases[0]!.downloads['linux-x64']!
  asset.url = asset.url.replace('+', '%2B')
  assert.equal(parseDownloadCatalog(value)!.downloads['linux-x64'].url, asset.url)
})

test('partial releases are hidden', () => {
  const value = catalog()
  delete value.releases[0]!.downloads['macos-x64']
  assert.throws(() => parseDownloadCatalog(value))
})

test('foreign origins, former repositories and URLs for another tag are rejected', () => {
  for (const url of [
    'https://example.com/Focale.zip',
    'https://github.com/focale-editor/releases/releases/download/0.1.1/Focale-0.1.1+2-linux-x64.zip',
    'https://github.com/focale-editor/get-focale/releases/download/0.1.2/Focale.zip',
    'https://github.com/focale-editor/get-focale/releases/download/0.1.1/focale-0.1.2-linux-x64.zip',
    'https://github.com/focale-editor/get-focale/releases/download/0.1.1/focale-0.1.1-windows-x64.zip',
    'https://github.com/focale-editor/get-focale/releases/download/0.1.1/focale-0.1.1-linux-x64.exe',
    'https://github.com/focale-editor/get-focale/releases/download/0.1.1/Focale-0.1.1+2-linux-x64-extra.zip',
    'https://github.com/focale-editor/get-focale/releases/download/0.1.1/extra/focale-0.1.1-linux-x64.zip',
    'https://github.com/focale-editor/get-focale/releases/download/0.1.1/focale-0.1.1-linux-x64.zip?extra=1',
  ]) {
    const value = catalog()
    value.releases[0]!.downloads['linux-x64']!.url = url
    assert.throws(() => parseDownloadCatalog(value))
  }
})
