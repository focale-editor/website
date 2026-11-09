<script setup lang="ts">
defineProps<{ open: boolean }>()
</script>

<template>
  <div
    class="collapsible-panel"
    :class="{ 'is-open': open }"
    :inert="!open"
    :aria-hidden="!open"
  >
    <div class="collapsible-clip">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
// Only the content grows; adjacent controls keep their natural size. Grid
// transitions reverse smoothly without measuring or fixing a parent's height.
.collapsible-panel {
  display: grid;
  flex-shrink: 0;
  grid-template-rows: 0fr;
  visibility: hidden;

  &.is-open {
    grid-template-rows: 1fr;
    visibility: visible;
  }
}

.collapsible-clip {
  min-height: 0;
  overflow: hidden;
}

@include motion-safe {
  .collapsible-panel {
    transition: grid-template-rows 0.34s cubic-bezier(0.22, 1, 0.36, 1), visibility 0s linear 0.34s;

    &.is-open {
      transition-delay: 0s;
    }
  }
}
</style>
