/** A public profile of the project on a social network. */
export interface SocialLink {
  /** Network name, shown as is in every language. */
  network: string
  /** Account handle, kept out of translations because vue-i18n reserves `@`. */
  handle: string
  /** Simple Icons identifier of the network's logo. */
  icon: string
  /** Absolute profile URL. */
  href: string
}

/** Social profiles listed in the footer and on the support page. */
export const socialLinks: readonly SocialLink[] = [
  { network: 'Instagram', handle: '@pixels__in__progress', icon: 'simple-icons:instagram', href: 'https://www.instagram.com/pixels__in__progress/' },
  { network: 'TikTok', handle: '@pixelsinprogress', icon: 'simple-icons:tiktok', href: 'https://www.tiktok.com/@pixelsinprogress' },
  { network: 'YouTube', handle: '@pixelsinprogress', icon: 'simple-icons:youtube', href: 'https://www.youtube.com/@pixelsinprogress' },
]
