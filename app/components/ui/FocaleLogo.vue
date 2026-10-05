<script setup lang="ts">
const { size = 48, animated = true, plate = true } = defineProps<{
  /** Side length of the square mark, in pixels. */
  size?: number
  /** Optional aperture rotation, disabled under reduced motion. */
  animated?: boolean
  /** Whether to include the navy application-icon plate. */
  plate?: boolean
}>()

// Use the application's SVG layers and its exact 85% / 42.5% proportions.
const plateSize = computed(() => `${size}px`)
const artworkSize = computed(() => `${size * (plate ? 0.85 : 1)}px`)
const letterSize = computed(() => `${size * (plate ? 0.425 : 0.5)}px`)
</script>

<template>
  <span
    class="focale-logo"
    :class="{
      'focale-logo-animated': animated,
      'focale-logo-plated': plate,
    }"
    :style="{
      '--focale-logo-plate-size': plateSize,
      '--focale-logo-artwork-size': artworkSize,
      '--focale-logo-letter-size': letterSize,
    }"
    aria-hidden="true"
  >
    <img
      src="/images/branding/aperture.svg"
      class="focale-logo-ring"
      alt=""
      width="815"
      height="815"
      decoding="async"
    >
    <img
      src="/images/branding/f.svg"
      class="focale-logo-letter"
      alt=""
      width="300"
      height="300"
      decoding="async"
    >
  </span>
</template>

<style scoped lang="scss">
.focale-logo {
  display: inline-grid;
  flex: none;
  place-items: center;
  width: var(--focale-logo-plate-size);
  height: var(--focale-logo-plate-size);
}

.focale-logo-plated {
  background: $brand-navy;
  border-radius: calc(var(--focale-logo-plate-size) * 160 / 1024);
}

.focale-logo-ring {
  grid-area: 1 / 1;
  width: var(--focale-logo-artwork-size);
  height: var(--focale-logo-artwork-size);
}

.focale-logo-animated .focale-logo-ring {
  @include motion-safe {
    animation: focale-logo-spin 120s linear infinite;
  }
}

.focale-logo-letter {
  z-index: 1;
  grid-area: 1 / 1;
  width: var(--focale-logo-letter-size);
  height: var(--focale-logo-letter-size);
}

@keyframes focale-logo-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
