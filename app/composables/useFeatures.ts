/** One capability card of the features grid. */
export interface FeatureCard {
  /** Stable identifier, also the translation sub-key under `features.items`. */
  id: string
  /** Iconify name rendered above the card title. */
  icon: string
}

/**
 * The capabilities advertised on the landing page.
 *
 * They mirror what the published alpha of the Flutter application implements,
 * so the list describes what a visitor can download rather than a wish.
 */
export function useFeatures(): FeatureCard[] {
  return [
    { id: 'localFirst', icon: 'lucide:hard-drive' },
    { id: 'layers', icon: 'lucide:layers' },
    { id: 'nonDestructive', icon: 'lucide:sliders-horizontal' },
    { id: 'smartObjects', icon: 'lucide:component' },
    { id: 'raw', icon: 'lucide:camera' },
    { id: 'photoMerge', icon: 'lucide:images' },
    { id: 'colorManagement', icon: 'lucide:palette' },
    { id: 'tools', icon: 'lucide:brush' },
    { id: 'masks', icon: 'lucide:circle-dashed' },
    { id: 'vector', icon: 'lucide:pen-tool' },
    { id: 'filters', icon: 'lucide:wand-sparkles' },
    { id: 'layerEffects', icon: 'lucide:sparkles' },
    { id: 'presets', icon: 'lucide:swatch-book' },
    { id: 'automation', icon: 'lucide:workflow' },
    { id: 'animation', icon: 'lucide:clapperboard' },
    { id: 'workspaces', icon: 'lucide:panels-top-left' },
    { id: 'formats', icon: 'lucide:file-image' },
    { id: 'recovery', icon: 'lucide:life-buoy' },
  ]
}

/** The three claims shown as a bordered strip under the hero. */
export function usePrinciples(): FeatureCard[] {
  return [
    { id: 'advanced', icon: 'lucide:layers-2' },
    { id: 'crossPlatform', icon: 'lucide:monitor' },
    { id: 'photoshop', icon: 'lucide:file-symlink' },
  ]
}
