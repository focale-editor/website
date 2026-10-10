import type { EditorScreenshot } from './screenshotGallery'
import { nativeFormatExamples } from './documentationExamples'

/** Public article identifiers and routes remain stable across languages. */
export const documentationArticles = {
  gettingStarted: { slug: 'getting-started', icon: 'lucide:rocket', group: 'guides' },
  userGuide: { slug: 'user-guide', icon: 'lucide:panels-top-left', group: 'guides' },
  shortcuts: { slug: 'shortcuts', icon: 'lucide:keyboard', group: 'guides' },
  troubleshooting: { slug: 'troubleshooting', icon: 'lucide:life-buoy', group: 'guides' },
  platforms: { slug: 'platforms', icon: 'lucide:monitor', group: 'reference' },
  formats: { slug: 'formats', icon: 'lucide:files', group: 'reference' },
  presetFormats: { slug: 'preset-formats', icon: 'lucide:brush', group: 'reference' },
  projectFormat: { slug: 'project-format', icon: 'lucide:archive', group: 'nativeFormats' },
  brushFormat: { slug: 'fbrush', icon: 'lucide:brush', group: 'nativeFormats' },
  patternFormat: { slug: 'fpattern', icon: 'lucide:grid-2x2', group: 'nativeFormats' },
  shapeFormat: { slug: 'fshape', icon: 'lucide:shapes', group: 'nativeFormats' },
  styleFormat: { slug: 'fstyle', icon: 'lucide:sparkles', group: 'nativeFormats' },
  swatchFormat: { slug: 'fswatch', icon: 'lucide:palette', group: 'nativeFormats' },
  gradientFormat: { slug: 'fgradient', icon: 'lucide:blend', group: 'nativeFormats' },
  curveFormat: { slug: 'fcurve', icon: 'lucide:chart-spline', group: 'nativeFormats' },
  levelsFormat: { slug: 'flevels', icon: 'lucide:sliders-horizontal', group: 'nativeFormats' },
  hueSaturationFormat: { slug: 'fhuesaturation', icon: 'lucide:sliders-horizontal', group: 'nativeFormats' },
  selectiveColorFormat: { slug: 'fselectivecolor', icon: 'lucide:sliders-horizontal', group: 'nativeFormats' },
  channelMixerFormat: { slug: 'fchannelmixer', icon: 'lucide:sliders-horizontal', group: 'nativeFormats' },
  blackAndWhiteFormat: { slug: 'fblackandwhite', icon: 'lucide:sliders-horizontal', group: 'nativeFormats' },
  duotoneFormat: { slug: 'fduotone', icon: 'lucide:sliders-horizontal', group: 'nativeFormats' },
  cameraRawFormat: { slug: 'fcameraraw', icon: 'lucide:sliders-horizontal', group: 'nativeFormats' },
  colorLookupFormat: { slug: 'fcolorlookup', icon: 'lucide:sliders-horizontal', group: 'nativeFormats' },
  contourFormat: { slug: 'fcontour', icon: 'lucide:chart-spline', group: 'nativeFormats' },
  actionFormat: { slug: 'faction', icon: 'lucide:list-video', group: 'nativeFormats' },
} as const

export type DocumentationArticleId = keyof typeof documentationArticles

/** Code samples and source references are data, not translated messages. */
interface DocumentationExtras {
  code?: Record<string, string>
  images?: Record<string, EditorScreenshot['id']>
  references?: string[]
}

export const documentationExtras: Partial<Record<DocumentationArticleId, DocumentationExtras>> = {
  gettingStarted: { images: { workspace: 'editor' } },
  userGuide: { images: { adjustments: 'curves' } },
  platforms: { code: { linux: './install.sh' } },
  projectFormat: {
    code: {
      structure: 'project.focale\n├── manifest.json\n├── preview.png\n├── profiles/document.icc\n├── profiles/raster/….icc\n├── raster/….png | .fcraster | .fctiles\n├── masks/….png | .fctiles\n├── channels/….png | .fctiles\n├── objects/raster/N.fcraster\n├── placed/….bin\n├── placed_documents/….focale\n└── patterns/….fptile',
      manifest: '{\n  "format": "focale",\n  "version": 1,\n  "document": {\n    "width": 1920,\n    "height": 1080,\n    "dpi": 96,\n    "colorMode": "rgb",\n    "bitsPerChannel": 8\n  }\n}',
    },
    references: ['focale-format.md'],
  },
  presetFormats: {
    code: {
      envelope: '{\n  "format": "focale-gradient-presets",\n  "version": 1,\n  "presets": [{\n    "id": "gradient.user.example",\n    "name": "Black to white",\n    "gradient": {\n      "interpolation": "perceptual",\n      "stops": [\n        { "position": 0, "color": 4278190080 },\n        { "position": 1, "color": 4294967295 }\n      ]\n    }\n  }]\n}',
    },
    references: ['brush-presets.md', 'pattern-presets.md', 'custom-shape-presets.md', 'style-presets.md', 'reusable-presets.md', 'actions.md', 'adjustment-presets.md', 'contour-presets.md', 'duotone-presets.md', 'camera-raw-presets.md'],
  },
  brushFormat: { code: { schema: nativeFormatExamples.brushFormat }, references: ['brush-presets.md'] },
  patternFormat: { code: { schema: nativeFormatExamples.patternFormat }, references: ['pattern-presets.md'] },
  shapeFormat: { code: { schema: nativeFormatExamples.shapeFormat }, references: ['custom-shape-presets.md'] },
  styleFormat: { code: { schema: nativeFormatExamples.styleFormat }, references: ['style-presets.md'] },
  swatchFormat: { code: { schema: nativeFormatExamples.swatchFormat }, references: ['reusable-presets.md'] },
  gradientFormat: { code: { schema: nativeFormatExamples.gradientFormat }, references: ['reusable-presets.md'] },
  curveFormat: { code: { schema: nativeFormatExamples.curveFormat }, references: ['reusable-presets.md'] },
  levelsFormat: { code: { schema: nativeFormatExamples.levelsFormat }, references: ['adjustment-presets.md'] },
  hueSaturationFormat: { code: { schema: nativeFormatExamples.hueSaturationFormat }, references: ['adjustment-presets.md'] },
  selectiveColorFormat: { code: { schema: nativeFormatExamples.selectiveColorFormat }, references: ['adjustment-presets.md'] },
  channelMixerFormat: { code: { schema: nativeFormatExamples.channelMixerFormat }, references: ['adjustment-presets.md'] },
  blackAndWhiteFormat: { code: { schema: nativeFormatExamples.blackAndWhiteFormat }, references: ['adjustment-presets.md'] },
  duotoneFormat: { code: { schema: nativeFormatExamples.duotoneFormat }, references: ['duotone-presets.md'] },
  cameraRawFormat: { code: { schema: nativeFormatExamples.cameraRawFormat }, references: ['camera-raw-presets.md'] },
  colorLookupFormat: { code: { schema: nativeFormatExamples.colorLookupFormat }, references: ['adjustment-presets.md'] },
  contourFormat: { code: { schema: nativeFormatExamples.contourFormat }, references: ['contour-presets.md'] },
  actionFormat: { code: { schema: nativeFormatExamples.actionFormat }, references: ['actions.md'] },
}
