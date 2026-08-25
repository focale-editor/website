<script setup lang="ts">
const { size = 48, animated = true, plate = true } = defineProps<{
  /** Side length of the square mark, in pixels. */
  size?: number
  /** Whether the shutter ring rotates. Ignored when the visitor asked for reduced motion. */
  animated?: boolean
  /**
   * Whether to draw the navy plate the application icon sits on. Without it the
   * mark is just the shutter and the letter, which is what suits a page that
   * already has its own background.
   */
  plate?: boolean
}>()

// The shutter is inlined rather than loaded through <img> so the browser keeps
// re-rasterising it while it turns; a rotated raster layer visibly aliases.
// Gradient ids must stay unique, since the mark appears several times per page.
const uid = useId()
const innerGradient = computed(() => `focale-logo-inner-${uid}`)
const outerGradient = computed(() => `focale-logo-outer-${uid}`)

// The proportions come from the application's own `FocaleLogo` widget: the
// artwork sits at 85% of the plate, and the letter at half of the artwork.
const plateSize = computed(() => `${size}px`)
const artworkSize = computed(() => `${size * 0.85}px`)
const letterSize = computed(() => `${size * 0.425}px`)
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
    <svg
      class="focale-logo-ring"
      viewBox="0 0 815 815"
      focusable="false"
    >
      <defs>
        <radialGradient :id="innerGradient">
          <stop
            offset="0"
            stop-color="#000000"
            stop-opacity="1"
          />
          <stop
            offset="1"
            stop-color="#000000"
            stop-opacity="0"
          />
        </radialGradient>
        <linearGradient
          :id="outerGradient"
          x1="0"
          y1="0"
          x2="1"
          y2="0"
        >
          <stop
            offset="0"
            stop-color="#000000"
            stop-opacity="0"
          />
          <stop
            offset="1"
            stop-color="#007cf9"
            stop-opacity="1"
          />
        </linearGradient>
      </defs>

      <circle
        v-if="plate"
        cx="407.5"
        cy="407.5"
        r="400"
        :fill="`url(#${innerGradient})`"
      />

      <g fill="#303950">
        <path d="m 272.3999,156.6001 c 0,0 -84,31.2 -133.5,148.6 l 273.4,-51.7 z" />
        <path d="m 134.6999,321.9001 c 0,0 -36.999993,81.6 11.4,199.4 l 156.1,-230.4 z" />
        <path d="m 155.6999,533.0001 c 0,0 31.2,83.9 148.6,133.5 l -51.7,-273.5 z" />
        <path d="m 320.9999,670.6001 c 0,0 81.5,37 199.4,-11.4 l -230.4,-156 z" />
        <path d="m 536.4999,652.3001 c 0,0 84,-31.2 133.5,-148.6 l -273.5,51.7 z" />
        <path d="m 662.7999,287.6001 -156,230.5 167.4,-31.1 c 0,0 36.9,-81.5 -11.4,-199.4 z" />
        <path d="m 652.2999,276.0001 c 0,0 -31.2,-83.9 -148.6,-133.5 l 51.7,273.5 z" />
        <path d="m 486.99996,138.40014 c 0,0 -81.5,-37 -199.4,11.4 l 230.5,156 z" />
      </g>

      <circle
        cx="404.69696"
        cy="404.69696"
        r="324.71038"
        fill="none"
        stroke="#303950"
        stroke-width="30"
      />
      <path
        d="m 407.18609,793.40178 c -213.50374,0 -386.115239,-172.61149 -386.115239,-386.2157 0,-213.50373 172.611499,-386.115229 386.115239,-386.115229 213.60421,0 386.21569,172.611499 386.21569,386.115229 0,213.60421 -172.61148,386.2157 -386.21569,386.2157 z"
        fill="none"
        stroke="#303950"
        stroke-width="30"
      />
      <circle
        cx="404.69696"
        cy="404.69696"
        r="324.71038"
        fill="none"
        :stroke="`url(#${outerGradient})`"
        stroke-width="30"
      />
    </svg>

    <img
      src="/images/branding/f.svg"
      class="focale-logo-letter"
      alt=""
      width="367"
      height="300"
      loading="eager"
      decoding="async"
    >
  </span>
</template>

<style scoped lang="scss">
.focale-logo {
  position: relative;
  display: inline-grid;
  flex: none;
  place-items: center;
  width: var(--focale-logo-plate-size);
  height: var(--focale-logo-plate-size);
}

.focale-logo-plated {
  background: $brand-navy;
  border-radius: calc(var(--focale-logo-plate-size) * 0.22);
}

.focale-logo-ring {
  grid-area: 1 / 1;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.focale-logo-plated .focale-logo-ring {
  width: var(--focale-logo-artwork-size);
  height: var(--focale-logo-artwork-size);
}

.focale-logo-animated .focale-logo-ring {
  @include motion-safe {
    // The application turns the ring once a minute; matching it keeps the mark
    // recognisable as the same object in both places.
    transform-origin: center;
    animation: focale-logo-spin 60s linear infinite;
  }
}

.focale-logo-letter {
  z-index: 1;
  grid-area: 1 / 1;
  width: calc(var(--focale-logo-letter-size) / 0.85);
  height: auto;
}

.focale-logo-plated .focale-logo-letter {
  width: var(--focale-logo-letter-size);
}

@keyframes focale-logo-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
