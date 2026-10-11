import assert from 'node:assert/strict'
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
      assert.equal(screenshots.length, 4)
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
