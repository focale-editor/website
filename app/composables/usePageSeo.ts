/** Values a page provides to describe itself to crawlers and social cards. */
export interface PageSeoInput {
  /** Page title, already translated, without the site name suffix. */
  title: string
  /** Meta description, already translated. */
  description: string
  /** Whether the title is the site name itself, in which case it is not suffixed. */
  isHome?: boolean
}

/**
 * Applies the head tags every page needs.
 *
 * `useLocaleHead` from the i18n module contributes `lang`, the canonical URL
 * and the `hreflang` alternates, so this only has to add what is page-specific.
 */
export function usePageSeo(input: MaybeRefOrGetter<PageSeoInput>): void {
  const { t } = useI18n()
  const localeHead = useLocaleHead({ lang: true, dir: true, seo: true })
  const site = useSiteConfig()

  const resolved = computed(() => toValue(input))
  const title = computed(() =>
    resolved.value.isHome ? `Focale — ${resolved.value.title}` : `${resolved.value.title} — Focale`,
  )
  const socialImage = computed(() => new URL('/images/social/og-image.png', site.url).toString())
  const socialImageAlt = computed(() => `Focale — ${t('hero.title')} ${t('hero.titleAccent')}`)

  useHead(() => ({
    htmlAttrs: { ...localeHead.value.htmlAttrs, class: 'focale-dark' },
    link: localeHead.value.link,
    meta: localeHead.value.meta,
  }))

  useSeoMeta({
    title,
    description: () => resolved.value.description,
    ogTitle: title,
    ogDescription: () => resolved.value.description,
    ogType: 'website',
    ogSiteName: 'Focale',
    ogImage: socialImage,
    ogImageWidth: 1200,
    ogImageHeight: 630,
    ogImageType: 'image/png',
    ogImageAlt: socialImageAlt,
    twitterCard: 'summary_large_image',
    twitterTitle: title,
    twitterDescription: () => resolved.value.description,
    twitterImage: socialImage,
    twitterImageAlt: socialImageAlt,
  })
}
