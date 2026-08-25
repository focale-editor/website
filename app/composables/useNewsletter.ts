/** Outcome of a newsletter subscription attempt. */
export type NewsletterStatus = 'idle' | 'submitting' | 'success' | 'error'

/** Reason a subscription attempt failed, mapped to a translation key. */
export type NewsletterError = 'invalidEmail' | 'unavailable' | 'rateLimited' | 'network'

/** Shape of the JSON returned by the Loops.so public form endpoint. */
interface LoopsFormResponse {
  success?: boolean
  message?: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/**
 * Drives the alpha-signup form.
 *
 * The site is generated statically, so it talks to the public Loops.so form
 * endpoint from the browser: that route takes a form identifier rather than an
 * API key, which is the only Loops surface that can be reached without a server
 * to hold a secret.
 */
export function useNewsletter() {
  const { public: config } = useRuntimeConfig()

  const email = ref('')
  const status = ref<NewsletterStatus>('idle')
  const error = ref<NewsletterError | null>(null)

  /** Whether a form identifier was configured at build time. */
  const isConfigured = computed(() => Boolean(config.loopsFormId))

  /** Whether the form should refuse further input while a request is in flight. */
  const isSubmitting = computed(() => status.value === 'submitting')

  /** Resets the form back to its initial state. */
  function reset(): void {
    email.value = ''
    status.value = 'idle'
    error.value = null
  }

  /** Records a failure and surfaces its translation key. */
  function fail(reason: NewsletterError): void {
    status.value = 'error'
    error.value = reason
  }

  /**
   * Submits the current address to Loops.
   *
   * The locale is sent along as a user group so a future launch announcement
   * can be written in the language the visitor signed up in.
   */
  async function subscribe(locale: string): Promise<void> {
    if (isSubmitting.value) {
      return
    }

    const address = email.value.trim()
    error.value = null

    if (!EMAIL_PATTERN.test(address)) {
      fail('invalidEmail')
      return
    }

    if (!isConfigured.value) {
      fail('unavailable')
      return
    }

    status.value = 'submitting'

    // Loops expects a form-encoded body; sending JSON silently yields a 400.
    const body = new URLSearchParams({
      email: address,
      userGroup: 'alpha-waitlist',
      mailingLists: '',
      locale,
    })

    try {
      const response = await fetch(
        `https://app.loops.so/api/newsletter-form/${config.loopsFormId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body,
        },
      )

      if (response.status === 429) {
        fail('rateLimited')
        return
      }

      const payload = await response.json().catch(() => null) as LoopsFormResponse | null

      if (!response.ok || payload?.success !== true) {
        fail('unavailable')
        return
      }

      status.value = 'success'
      email.value = ''
    }
    catch {
      fail('network')
    }
  }

  return {
    email,
    status,
    error,
    isConfigured,
    isSubmitting,
    subscribe,
    reset,
  }
}
