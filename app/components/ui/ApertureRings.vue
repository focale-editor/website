<script setup lang="ts">
const { ticks = 72 } = defineProps<{
  /** Number of graduation marks around the focus ring. */
  ticks?: number
}>()

const uid = useId()
const fadeId = computed(() => `aperture-fade-${uid}`)
const sweepId = computed(() => `aperture-sweep-${uid}`)

/**
 * Graduations around the focus ring, as a lens barrel carries them.
 *
 * Every fourth mark is longer, the way a real scale groups its steps, and the
 * cardinal ones longer still — the pattern is what makes the ring read as an
 * instrument rather than as decoration.
 */
const graduations = computed(() =>
  Array.from({ length: ticks }, (_, index) => {
    const angle = (index / ticks) * 360
    const isMajor = index % 12 === 0
    const isMedium = index % 4 === 0
    return {
      angle,
      length: isMajor ? 14 : isMedium ? 8 : 4,
      width: isMajor ? 1.6 : 1,
      opacity: isMajor ? 1 : isMedium ? 0.65 : 0.38,
    }
  }),
)

/** The eight shutter blades of the mark, drawn as open chords. */
const blades = computed(() => Array.from({ length: 8 }, (_, index) => index * 45))
</script>

<template>
  <svg
    class="rings"
    viewBox="-260 -260 520 520"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <radialGradient :id="fadeId">
        <stop
          offset="0.24"
          stop-color="#fff"
          stop-opacity="1"
        />
        <stop
          offset="0.64"
          stop-color="#fff"
          stop-opacity="0.45"
        />
        <stop
          offset="1"
          stop-color="#fff"
          stop-opacity="0"
        />
      </radialGradient>
      <linearGradient
        :id="sweepId"
        x1="0"
        y1="0"
        x2="1"
        y2="1"
      >
        <stop
          offset="0"
          stop-color="#007cf9"
          stop-opacity="0"
        />
        <stop
          offset="0.5"
          stop-color="#007cf9"
          stop-opacity="0.85"
        />
        <stop
          offset="1"
          stop-color="#0ab7ff"
          stop-opacity="0"
        />
      </linearGradient>
      <mask :id="`${fadeId}-mask`">
        <rect
          x="-260"
          y="-260"
          width="520"
          height="520"
          :fill="`url(#${fadeId})`"
        />
      </mask>
    </defs>

    <g :mask="`url(#${fadeId}-mask)`">
      <g
        fill="none"
        stroke="currentColor"
      >
        <circle
          r="74"
          stroke-opacity="0.3"
        />
        <circle
          r="112"
          stroke-opacity="0.24"
        />
        <circle
          r="168"
          stroke-opacity="0.13"
        />
        <circle
          r="236"
          stroke-opacity="0.07"
        />
      </g>

      <g stroke="currentColor">
        <line
          v-for="mark in graduations"
          :key="mark.angle"
          x1="0"
          :y1="-112"
          x2="0"
          :y2="-112 + mark.length"
          :stroke-width="mark.width"
          :stroke-opacity="mark.opacity"
          :transform="`rotate(${mark.angle})`"
        />
      </g>

      <!-- Eight open chords echoing the shutter blades inside the mark. -->
      <g
        fill="none"
        stroke="currentColor"
        stroke-opacity="0.14"
        stroke-width="1"
      >
        <path
          v-for="angle in blades"
          :key="angle"
          d="M 0.0 -74.0 L 68.4 -28.3"
          :transform="`rotate(${angle})`"
        />
      </g>
    </g>

    <!-- One lit arc, taken from the blue sweep on the logo's inner ring. -->
    <g class="rings-sweep">
      <!-- An invisible full circle forces the group's box to be centred on the
           origin, so the rotation below turns along the barrel rather than
           swinging the arc around it. -->
      <circle
        r="236"
        fill="none"
        stroke="none"
      />
      <path
        d="M 0 -112 A 112 112 0 0 1 101.5 47.3"
        fill="none"
        :stroke="`url(#${sweepId})`"
        stroke-width="1.5"
        stroke-linecap="round"
      />
    </g>
  </svg>
</template>

<style scoped lang="scss">
// Sizing is left to the caller: a scoped rule here would carry the same
// specificity as the caller's own class and win or lose on source order.
.rings {
  display: block;
  color: var(--color-text-subtle);
  overflow: visible;
}

.rings-sweep {
  @include motion-safe {
    transform-box: fill-box;
    transform-origin: center;
    animation: rings-sweep 24s linear infinite;
  }
}

@keyframes rings-sweep {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
