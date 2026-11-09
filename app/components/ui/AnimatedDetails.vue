<script setup lang="ts">
const details = useTemplateRef('details')
const resize = useHeightTransition()

// Keep native details/summary semantics, including keyboard and no-JS use.
// The summary stays in the slot so each caller retains its own presentation.
function toggle(event: MouseEvent) {
  const element = details.value
  const target = event.target as Element
  if (!element || event.defaultPrevented || target.closest('summary')?.parentElement !== element) return
  if (target.closest('a, button, input, select, textarea')) return
  event.preventDefault()
  void resize(element, () => {
    element.open = !element.open
  })
}
</script>

<template>
  <details
    ref="details"
    @click="toggle"
  >
    <slot />
  </details>
</template>
