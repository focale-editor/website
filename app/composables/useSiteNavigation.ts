/** A single entry of the header or footer navigation. */
export interface NavigationLink {
  /** Translation key holding the visible label, or a literal when `raw` is set. */
  label: string
  /** In-page anchor, unlocalized route, or absolute URL. */
  to: string
  /** Whether `to` points outside the site. */
  external?: boolean
  /** Whether `label` is already display text rather than a translation key. */
  raw?: boolean
}

/** A titled group of links, as rendered by one footer column. */
export interface NavigationSection {
  /** Translation key holding the column heading. */
  titleKey: string
  /** Links belonging to the column. */
  links: NavigationLink[]
}

/**
 * Single source of truth for the site's navigation.
 *
 * Pages that do not exist yet — documentation, FAQ, terms, privacy, contact —
 * are added here once, and both the header and the footer pick them up.
 */
export function useSiteNavigation() {
  const { public: config } = useRuntimeConfig()

  const headerLinks = computed<NavigationLink[]>(() => [
    { label: 'nav.features', to: '#features' },
    { label: 'nav.preview', to: '#preview' },
    { label: 'nav.roadmap', to: '#roadmap' },
  ])

  const footerSections = computed<NavigationSection[]>(() => [
    {
      titleKey: 'footer.sections.product',
      links: [
        { label: 'nav.features', to: '#features' },
        { label: 'nav.preview', to: '#preview' },
        { label: 'nav.roadmap', to: '#roadmap' },
        { label: 'nav.newsletter', to: '#newsletter' },
      ],
    },
    {
      // The editor itself is closed for now; what is open is the site, the
      // organisation and the Dart packages the editor is built on.
      titleKey: 'footer.sections.openSource',
      links: [
        { label: 'github.com/focale-editor', to: 'https://github.com/focale-editor', external: true, raw: true },
        { label: 'github.com/focale-editor/website', to: config.repositoryUrl, external: true, raw: true },
        { label: 'pub.dev/publishers/focale-editor.app', to: config.packagesUrl, external: true, raw: true },
      ],
    },
  ])

  return { headerLinks, footerSections }
}
