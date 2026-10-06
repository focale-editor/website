/** Supported architectures with independent updater feeds. */
export const downloadTargets = ['macos-arm64', 'macos-x64', 'windows-x64', 'linux-x64'] as const

/** CPU and operating-system identity of a downloadable application. */
export type DownloadTarget = typeof downloadTargets[number]

/** One public first-install artifact. */
export interface DownloadAsset {
  url: string
  platformSigned: boolean
}

/** A complete version published after all four build lanes succeed. */
export interface DownloadRelease {
  version: string
  tag: string
  downloads: Record<DownloadTarget, DownloadAsset>
}

/** Validate public catalog data before allowing it to become a download link. */
export function parseDownloadCatalog(value: unknown): DownloadRelease | null {
  if (!value || typeof value !== 'object' || !('releases' in value) || !Array.isArray(value.releases)) {
    throw new Error('Invalid download catalog')
  }
  if (!value.releases.length) return null
  const release = value.releases[0]
  if (!release || typeof release.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(release.version)
    || typeof release.tag !== 'string' || release.tag.replace(/^v/, '') !== release.version
    || !release.downloads || typeof release.downloads !== 'object') {
    throw new Error('Invalid download release')
  }
  const downloads = {} as Record<DownloadTarget, DownloadAsset>
  for (const target of downloadTargets) {
    const asset = release.downloads[target]
    if (!asset || typeof asset.url !== 'string' || typeof asset.platformSigned !== 'boolean') {
      throw new Error('Incomplete download release')
    }
    const url = new URL(asset.url)
    const prefix = `https://github.com/focale-editor/get-focale/releases/download/${release.tag}/Focale-`
    if (!url.href.startsWith(prefix) || url.username || url.password || url.search || url.hash) {
      throw new Error('Unexpected download destination')
    }
    downloads[target] = { url: url.href, platformSigned: asset.platformSigned }
  }
  return { version: release.version, tag: release.tag, downloads }
}
