import type { Ref } from 'vue'

interface PageMotionOptions {
  /** Descendants to reveal once. Server-rendered content stays visible. */
  reveal?: string
  /** Decorative animation containers to pause outside the viewport. */
  ambient?: string
  /** Reveal siblings with an 80ms stagger. */
  stagger?: string
}

/** Optional page motion shared by landing and content pages. */
export function usePageMotion(root: Ref<HTMLElement | null>, options: PageMotionOptions = {}) {
  let cleanup = () => {}

  onMounted(() => {
    const element = root.value
    if (!element || !window.IntersectionObserver) return
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const running = new Set<Animation>()
    const reveal = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        reveal.unobserve(entry.target)
        if (preference.matches || !entry.target.animate) continue
        const delay = options.stagger && entry.target.matches(options.stagger)
          ? Array.from(entry.target.parentElement!.children).indexOf(entry.target) * 80
          : 0
        const animation = entry.target.animate(
          [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }],
          { duration: 520, delay, fill: 'backwards', easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
        )
        running.add(animation)
        if (document.hidden) animation.pause()
        animation.onfinish = () => running.delete(animation)
      }
    }, { threshold: 0.08 })

    element.querySelectorAll(options.reveal ?? '[data-reveal]').forEach(target => reveal.observe(target))

    const ambient = new IntersectionObserver((entries) => {
      entries.forEach(entry => entry.target.toggleAttribute('data-motion-paused', !entry.isIntersecting))
    })
    element.querySelectorAll(options.ambient ?? '[data-ambient]').forEach(target => ambient.observe(target))

    function visibilityChanged() {
      element!.toggleAttribute('data-motion-paused', document.hidden)
      running.forEach(animation => document.hidden ? animation.pause() : animation.play())
    }

    function preferenceChanged() {
      if (!preference.matches) return
      running.forEach(animation => animation.cancel())
      running.clear()
    }

    document.addEventListener('visibilitychange', visibilityChanged)
    preference.addEventListener('change', preferenceChanged)
    visibilityChanged()
    cleanup = () => {
      reveal.disconnect()
      ambient.disconnect()
      running.forEach(animation => animation.cancel())
      document.removeEventListener('visibilitychange', visibilityChanged)
      preference.removeEventListener('change', preferenceChanged)
    }
  })

  onBeforeUnmount(() => cleanup())
}
