export default defineNuxtPlugin({
  name: 'focale:browser-locale',
  dependsOn: ['i18n:plugin:route-locale-detect', 'i18n:plugin:ssg-detect'],
  setup(nuxt) {
    const preferredLocale = useLocalePreference()

    // Nuxt's root can mount while an async page is still hydrating.
    onNuxtReady(async () => {
      if (nuxt.$router.currentRoute.value.path !== '/') return

      const i18n = nuxt.$i18n
      const savedLocale = i18n.localeCodes.value.find(code => code === preferredLocale.value)
      if (!savedLocale) preferredLocale.value = null
      const detectedLocale = i18n.getBrowserLocale() ?? i18n.defaultLocale
      const locale = savedLocale ?? i18n.localeCodes.value.find(code => code === detectedLocale)
      if (!locale) return

      const path = nuxt.$switchLocalePath(locale)
      if (path && locale !== i18n.locale.value) {
        await nuxt.runWithContext(() => navigateTo(path, { replace: true }))
      }
    })
  },
})
