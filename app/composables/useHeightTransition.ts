/** Animate a disclosure's measured height, including reversals during motion. */
export function useHeightTransition() {
  const running = new Map<HTMLElement, { animation: Animation, overflow: string }>()
  const revisions = new WeakMap<HTMLElement, symbol>()
  let disposed = false
  let preference: MediaQueryList | undefined

  function cancel(element: HTMLElement) {
    const current = running.get(element)
    if (!current) return
    current.animation.cancel()
    element.style.overflow = current.overflow
    running.delete(element)
  }

  function stopMotion() {
    if (preference?.matches) running.forEach((_, element) => cancel(element))
  }

  onMounted(() => {
    preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    preference.addEventListener('change', stopMotion)
  })

  onBeforeUnmount(() => {
    disposed = true
    preference?.removeEventListener('change', stopMotion)
    running.forEach((_, element) => cancel(element))
  })

  return async (element: HTMLElement | null, update: () => void) => {
    if (!element || !element.animate || preference?.matches) {
      update()
      return
    }

    const revision = Symbol()
    revisions.set(element, revision)
    const from = element.getBoundingClientRect().height
    cancel(element)
    update()
    await nextTick()
    if (disposed || revisions.get(element) !== revision || preference?.matches) return

    const to = element.getBoundingClientRect().height
    if (Math.abs(to - from) < 1) return
    const overflow = element.style.overflow
    element.style.overflow = 'clip'
    const animation = element.animate(
      [{ height: `${from}px` }, { height: `${to}px` }],
      { duration: 340, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    )
    running.set(element, { animation, overflow })
    animation.onfinish = () => cancel(element)
  }
}
