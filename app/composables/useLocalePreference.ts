/** Only explicit selections should override the browser language on arrival. */
export function useLocalePreference() {
  const cookie = useCookie<string | null>('focale_locale', {
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
  })

  // Earlier versions also stored detected/route locales as bare codes. Their
  // origin is ambiguous, so let the browser decide until the next manual choice.
  return computed<string | null>({
    get: () => typeof cookie.value === 'string' && cookie.value.startsWith('manual:')
      ? cookie.value.slice('manual:'.length)
      : null,
    set: locale => cookie.value = locale ? `manual:${locale}` : null,
  })
}
