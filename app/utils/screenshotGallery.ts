/** Interface themes available in the application screenshot collection. */
export type ScreenshotTheme = 'dark' | 'light'

/** A view shown by the editor preview, with responsive and thumbnail assets. */
export interface EditorScreenshot {
  id: 'editor' | 'curves' | 'home' | 'typography'
  src: string
  srcset: string
  thumbnail: string
  width: number
  height: number
}

/** Selects localized captures, falling back to English for unsupported locales. */
export function screenshotLanguage(locale: string): 'en' | 'fr' | 'es' | 'it' | 'pt' | 'de' {
  const language = locale.split('-')[0]?.toLowerCase()
  switch (language) {
    case 'fr': case 'es': case 'it': case 'pt': case 'de':
      return language
    default:
      return 'en'
  }
}

/** Keeps the same four views available across all six languages and both themes. */
export function editorScreenshots(locale: string, theme: ScreenshotTheme): EditorScreenshot[] {
  const language = screenshotLanguage(locale)
  const views = ['editor', 'curves', 'home', 'typography'] as const

  return views.map((id, index) => {
    const path = `/images/screenshots/${language}/${theme}/${String(index + 1).padStart(2, '0')}-${id}`
    return {
      id,
      src: `${path}.webp`,
      srcset: `${path}.webp 1600w, ${path}@2x.webp 3200w`,
      thumbnail: `${path}-thumb.webp`,
      width: 1600,
      height: 900,
    }
  })
}
