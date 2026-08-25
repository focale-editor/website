/** One capability card of the features grid. */
export interface FeatureCard {
  /** Stable identifier, also the translation sub-key under `features.items`. */
  id: string
  /** Iconify name rendered above the card title. */
  icon: string
}

/** One entry of the development timeline. */
export interface RoadmapEntry {
  /** Stable identifier, also the translation sub-key under `roadmap.items`. */
  id: string
  /** How far along the entry is. */
  state: 'done' | 'inProgress' | 'planned'
}

/**
 * The capabilities advertised on the landing page.
 *
 * They mirror what the Flutter application already implements, so the list is
 * a promise the editor can keep on the day the alpha ships rather than a wish.
 */
export function useFeatures(): FeatureCard[] {
  return [
    { id: 'localFirst', icon: 'lucide:hard-drive' },
    { id: 'layers', icon: 'lucide:layers' },
    { id: 'nonDestructive', icon: 'lucide:sliders-horizontal' },
    { id: 'filters', icon: 'lucide:wand-sparkles' },
    { id: 'layerEffects', icon: 'lucide:sparkles' },
    { id: 'tools', icon: 'lucide:brush' },
    { id: 'masks', icon: 'lucide:circle-dashed' },
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

/** The development timeline shown in the roadmap section. */
export function useRoadmap(): RoadmapEntry[] {
  return [
    { id: 'foundations', state: 'done' },
    { id: 'features', state: 'inProgress' },
    { id: 'debugging', state: 'planned' },
    { id: 'alpha', state: 'planned' },
  ]
}
