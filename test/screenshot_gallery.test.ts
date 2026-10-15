import assert from 'node:assert/strict'
import { access } from 'node:fs/promises'
import test from 'node:test'
import { editorScreenshots, screenshotLanguage } from '../app/utils/screenshotGallery.ts'

test('regional locale tags select their translated interface captures', () => {
  for (const [locale, language] of [
    ['en-US', 'en'], ['FR-ca', 'fr'], ['es-MX', 'es'],
    ['it-IT', 'it'], ['pt-BR', 'pt'], ['de-AT', 'de'],
  ] as const) {
    assert.equal(screenshotLanguage(locale), language)
    for (const theme of ['dark', 'light'] as const) {
      const screenshots = editorScreenshots(locale, theme)
      assert.equal(screenshots.length, 6)
      for (const screenshot of screenshots) {
        const prefix = `/images/screenshots/${language}/${theme}/`
        assert.ok(screenshot.src.startsWith(prefix))
        assert.ok(screenshot.thumbnail.startsWith(prefix))
        assert.ok(screenshot.srcset.split(', ').every(source => source.startsWith(prefix)))
      }
    }
  }
})

test('unsupported or empty locales retain the English fallback', () => {
  for (const locale of ['', 'ja-JP', 'nl', 'french']) {
    assert.equal(screenshotLanguage(locale), 'en')
  }
})

test('every gallery image, thumbnail and responsive variant exists for all locales and themes', async () => {
  for (const locale of ['en', 'fr', 'es', 'it', 'pt', 'de']) {
    for (const theme of ['dark', 'light'] as const) {
      for (const screenshot of editorScreenshots(locale, theme)) {
        const paths = new Set([
          screenshot.src,
          screenshot.thumbnail,
          ...screenshot.srcset.split(', ').map(source => source.split(' ')[0]),
        ])
        for (const path of paths) {
          await assert.doesNotReject(
            () => access(new URL(`../public${path}`, import.meta.url)),
            `Missing screenshot asset: ${path}`,
          )
        }
      }
    }
  }
})
