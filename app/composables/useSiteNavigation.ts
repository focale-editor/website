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
 * Shared localized routes keep desktop, mobile and footer links consistent.
 */
export function useSiteNavigation() {
  const { public: config } = useRuntimeConfig()
  const localePath = useLocalePath()
  const home = (hash: string) => localePath('index') + hash

  const headerLinks = computed<NavigationLink[]>(() => [
    { label: 'nav.homePage', to: localePath('index') },
    { label: 'docs.title', to: localePath('/docs') },
    { label: 'nav.faq', to: localePath('/docs/faq') },
    { label: 'nav.contribute', to: localePath('/support') },
  ])

  const footerSections = computed<NavigationSection[]>(() => [
    {
      titleKey: 'footer.sections.product',
      links: [
        { label: 'nav.features', to: home('#features') },
        { label: 'nav.preview', to: home('#preview') },
        { label: 'docs.title', to: localePath('/docs') },
        { label: 'nav.faq', to: localePath('/docs/faq') },
        { label: 'changelog.title', to: localePath('/changelog') },
        { label: 'support.title', to: localePath('/support') },
        { label: 'privacy.title', to: localePath('/privacy') },
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
