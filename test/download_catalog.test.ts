import assert from 'node:assert/strict'
import test from 'node:test'
import { downloadTargets, parseDownloadCatalog } from '../app/utils/downloadCatalog.ts'

function catalog() {
  return {
    releases: [{
      version: '0.1.1', tag: '0.1.1',
      downloads: Object.fromEntries(downloadTargets.map(target => [target, {
        url: `https://github.com/focale-editor/releases/releases/download/0.1.1/Focale-0.1.1+2-${target}.zip`, platformSigned: false,
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

test('partial releases are hidden', () => {
  const value = catalog()
  delete value.releases[0]!.downloads['macos-x64']
  assert.throws(() => parseDownloadCatalog(value))
})

test('foreign origins and URLs for another tag are rejected', () => {
  for (const url of ['https://example.com/Focale.zip', 'https://github.com/focale-editor/releases/releases/download/0.1.2/Focale.zip']) {
    const value = catalog()
    value.releases[0]!.downloads['linux-x64']!.url = url
    assert.throws(() => parseDownloadCatalog(value))
  }
})
