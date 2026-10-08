import { type DownloadRelease, parseDownloadCatalog } from '~/utils/downloadCatalog'

/** Load the live public catalog once per visit, independently of static site builds. */
export function useDownloads() {
  const latestRelease = useState<DownloadRelease | null>('focale-download-release', () => null)
  const status = useState<'idle' | 'loading' | 'ready' | 'unavailable'>('focale-download-status', () => 'idle')
  const { public: config } = useRuntimeConfig()

  onMounted(async () => {
    if (status.value !== 'idle') return
    status.value = 'loading'
    try {
      const catalog = await $fetch<unknown>(config.downloadCatalogUrl, { timeout: 10000, retry: 1 })
      latestRelease.value = parseDownloadCatalog(catalog)
      status.value = latestRelease.value ? 'ready' : 'unavailable'
    }
    catch {
      // The download section offers a direct GitHub fallback on failure.
      status.value = 'unavailable'
    }
  })

  return { latestRelease, status }
}
