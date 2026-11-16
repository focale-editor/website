import type { Ref } from 'vue'
import { webDrawingShapes } from '~/utils/webDrawing'

interface Point { x: number, y: number }
type Tool = 'pen' | 'fill' | 'brush'
interface Gesture {
  duration: number
  tool: Tool
  color: string
  render: (progress: number) => void
}

/** Draw the illustration through actual path gestures, then paint at each click. */
export function useWebDrawingAnimation(root: Ref<HTMLElement | null>) {
  let cleanup = () => {}

  onMounted(() => {
    const target = root.value
    if (!target || !window.IntersectionObserver) return
    const element = target
    const paths = [...element.querySelectorAll<SVGPathElement>('[data-drawing-shape]')]
    // Keep the complete server-rendered illustration in non-graphical clients.
    if (paths.length !== webDrawingShapes.length || paths.some(path => typeof path.getTotalLength !== 'function')) return

    const cursor = element.querySelector<SVGGElement>('[data-drawing-cursor]')!
    const click = element.querySelector<SVGCircleElement>('[data-drawing-click]')!
    const regions = paths.map((path, index) => {
      const style = window.getComputedStyle(path)
      const bounds = path.getBBox()
      const shape = webDrawingShapes[index]!
      const center = shape.fillAt
      return {
        path, shape,
        length: path.getTotalLength(),
        color: center ? style.fill : style.stroke,
        mask: element.querySelector<SVGCircleElement>(`[data-drawing-mask="${index}"]`)!,
        trace: element.querySelector<SVGPathElement>(`[data-drawing-trace="${index}"]`),
        radius: center
          ? (bounds.width || bounds.height
              ? Math.max(...[bounds.x, bounds.x + bounds.width].flatMap(x => [bounds.y, bounds.y + bounds.height].map(y => Math.hypot(x - center[0], y - center[1])))) + 2
              : 400)
          : 0,
      }
    })

    function pointAt(point: Point) {
      cursor.setAttribute('transform', `translate(${point.x} ${point.y})`)
      cursor.style.opacity = '1'
    }

    const gestures: Gesture[] = []
    let previous: Point = { x: 40, y: 44 }
    function move(to: Point, tool: Tool, color: string) {
      const from = previous
      gestures.push({
        duration: 160, tool, color,
        render: (progress) => {
          const eased = progress * progress * (3 - 2 * progress)
          pointAt({ x: from.x + (to.x - from.x) * eased, y: from.y + (to.y - from.y) * eased })
          click.style.opacity = '0'
        },
      })
      previous = to
    }

    function trace(region: typeof regions[number], tool: 'pen' | 'brush') {
      const stroke = region.trace ?? region.path
      move(region.path.getPointAtLength(0), tool, region.color)
      gestures.push({
        duration: Math.max(240, Math.min(850, region.length / 0.75)), tool, color: region.color,
        render: (progress) => {
          if (region.trace) region.trace.style.opacity = '0.75'
          stroke.style.strokeDashoffset = String(region.length * (1 - progress))
          pointAt(region.path.getPointAtLength(region.length * progress))
        },
      })
      previous = region.path.getPointAtLength(region.length)
    }

    // Sketch every filled region before using the bucket. Disconnected marks
    // are separate paths, so the cursor travels between them without drawing.
    regions.filter(region => region.shape.fillAt).forEach(region => trace(region, 'pen'))
    for (const region of regions.filter(region => region.shape.fillAt)) {
      const [x, y] = region.shape.fillAt!
      move({ x, y }, 'fill', region.color)
      gestures.push({
        duration: 340, tool: 'fill', color: region.color,
        render: (progress) => {
          pointAt({ x, y })
          const spread = 1 - (1 - progress) ** 3
          region.mask.setAttribute('r', String(region.radius * spread))
          region.trace!.style.opacity = String(0.75 * (1 - progress))
          click.setAttribute('r', String(2 + 10 * progress))
          click.style.opacity = String(1 - progress)
        },
      })
    }
    regions.filter(region => !region.shape.fillAt).forEach(region => trace(region, 'brush'))
    gestures.push({
      duration: 5000, tool: 'brush', color: '#538bd5',
      render: () => {
        cursor.style.opacity = '0'
      },
    })

    function showComplete() {
      for (const region of regions) {
        region.mask.setAttribute('r', '400')
        region.path.style.strokeDasharray = 'none'
        region.path.style.strokeDashoffset = '0'
        if (region.trace) region.trace.style.opacity = '0'
      }
      cursor.style.opacity = '0'
      element.dataset.tool = 'brush'
      element.style.removeProperty('--drawing-paint')
    }

    function clearDrawing() {
      for (const region of regions) {
        region.mask.setAttribute('r', '0')
        const stroke = region.trace ?? region.path
        stroke.style.strokeDasharray = String(region.length)
        stroke.style.strokeDashoffset = String(region.length)
        if (region.trace) region.trace.style.opacity = '0'
      }
      cursor.style.opacity = '0'
      click.style.opacity = '0'
    }

    let frame: number | undefined
    let lastTime: number | undefined
    let gestureIndex = 0
    let elapsed = 0
    let inView = false
    let currentColor: string | undefined
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')

    function paint(gesture: Gesture, progress: number) {
      if (element.dataset.tool !== gesture.tool) element.dataset.tool = gesture.tool
      if (currentColor !== gesture.color) {
        element.style.setProperty('--drawing-paint', gesture.color)
        currentColor = gesture.color
      }
      gesture.render(progress)
    }

    function tick(now: number) {
      // A busy frame slows the demo instead of skipping visible tool gestures.
      let delta = lastTime === undefined ? 0 : Math.min(now - lastTime, 50)
      lastTime = now
      while (delta >= gestures[gestureIndex]!.duration - elapsed) {
        const gesture = gestures[gestureIndex]!
        delta -= gesture.duration - elapsed
        paint(gesture, 1)
        elapsed = 0
        gestureIndex++
        if (gestureIndex === gestures.length) {
          clearDrawing()
          gestureIndex = 0
        }
      }
      elapsed += delta
      const gesture = gestures[gestureIndex]!
      paint(gesture, elapsed / gesture.duration)
      frame = window.requestAnimationFrame(tick)
    }

    function sync() {
      if (frame !== undefined) window.cancelAnimationFrame(frame)
      frame = undefined
      lastTime = undefined
      if (preference.matches) showComplete()
      else if (inView && !document.hidden) frame = window.requestAnimationFrame(tick)
    }

    function preferenceChanged() {
      currentColor = undefined
      gestureIndex = 0
      elapsed = 0
      if (!preference.matches) clearDrawing()
      sync()
    }

    const observer = new window.IntersectionObserver((entries) => {
      inView = entries.some(entry => entry.isIntersecting)
      sync()
    }, { threshold: 0.1 })
    if (preference.matches) showComplete()
    else clearDrawing()
    observer.observe(element)
    document.addEventListener('visibilitychange', sync)
    preference.addEventListener('change', preferenceChanged)
    cleanup = () => {
      if (frame !== undefined) window.cancelAnimationFrame(frame)
      observer.disconnect()
      document.removeEventListener('visibilitychange', sync)
      preference.removeEventListener('change', preferenceChanged)
    }
  })

  onBeforeUnmount(() => cleanup())
}
