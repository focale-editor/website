<script setup lang="ts">
import landscapeSource from '~~/public/images/branding/hero_background_dark.svg?raw'

// Inline the trusted, generated artwork so the website can animate its layers
// without changing the asset that Focale's branding sync replaces.
const landscape = landscapeSource
  .replace(/<\?xml[^>]*\?>\s*/, '')
  .replace('<svg ', '<svg preserveAspectRatio="xMaxYMid slice" ')
</script>

<template>
  <!-- eslint-disable vue/no-v-html -- Trusted SVG bundled from the repository. -->
  <div
    class="landscape"
    aria-hidden="true"
    v-html="landscape"
  />
  <!-- eslint-enable vue/no-v-html -->
</template>

<style scoped lang="scss">
.landscape {
  overflow: hidden;
  pointer-events: none;
}

.landscape :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
}

// These paint attributes identify the layers in the shared branding asset.
// Leave the original scene untouched when reduced motion is requested.
@media (prefers-reduced-motion: no-preference) {
  .landscape {
    // Give moving light enough contrast to remain visible through the hero's
    // reading fades. Static/reduced-motion rendering keeps the original palette.
    :deep([id="auroraVeil"] stop[offset="0.55"]) {
      stop-opacity: 0.1;
    }

    :deep([id="auroraVeil"] stop[offset="0.86"]) {
      stop-opacity: 0.38;
    }

    :deep([id="auroraVeil"] stop[offset="1"]) {
      stop-opacity: 0.08;
    }

    :deep([id="auroraEdge"] stop[offset="0.35"]) {
      stop-opacity: 0.4;
    }

    :deep([id="auroraEdge"] stop[offset="0.68"]) {
      stop-opacity: 0.75;
    }

    :deep([id="moonHalo"] stop:first-child) {
      stop-opacity: 0.34;
    }

    :deep([id="moonHalo"] stop[offset="0.45"]) {
      stop-opacity: 0.15;
    }

    :deep([id="waterLight"] stop:first-child) {
      stop-opacity: 0.3;
    }

    :deep([id="reflection"] stop:first-child) {
      stop-opacity: 0.85;
    }

    :deep([id="reflection"] stop[offset="0.5"]) {
      stop-opacity: 0.4;
    }

    :deep([fill="url(#auroraVeil)"]),
    :deep([stroke="url(#auroraEdge)"]) {
      transform-origin: 1500px 150px;
      animation: aurora-drift 18s ease-in-out -4s infinite;
    }

    :deep([fill="url(#auroraVeil)"][opacity]),
    :deep([stroke="url(#auroraEdge)"][opacity]) {
      --aurora-opacity: 0.5;

      animation-duration: 25s;
      animation-delay: -13s;
      animation-direction: reverse;
    }

    :deep(g[fill="#EDF0F4"] > circle),
    :deep(g[stroke="#8DB5FF"] > path[opacity]) {
      transform-box: fill-box;
      transform-origin: center;
      animation: star-twinkle 5s ease-in-out -1s infinite;
    }

    :deep(g[fill="#EDF0F4"] > circle:nth-child(3n)),
    :deep(g[stroke="#8DB5FF"] > path[opacity]:nth-child(2n)) {
      animation-duration: 7s;
      animation-delay: -4s;
    }

    :deep(g[fill="#EDF0F4"] > circle:nth-child(3n + 1)) {
      animation-duration: 6s;
      animation-delay: -2.5s;
    }

    :deep([fill="url(#moonHalo)"]) {
      transform-box: fill-box;
      transform-origin: center;
      animation: moon-glow 14s ease-in-out -5s infinite;
    }

    :deep([fill="url(#waterLight)"]) {
      animation: water-glow 14s ease-in-out -5s infinite;
    }

    :deep(g[fill="url(#reflection)"] > path) {
      transform-box: fill-box;
      transform-origin: center;
      animation: water-shimmer 8.4s ease-in-out -2.8s infinite;
    }

    :deep(g[fill="url(#reflection)"] > path:nth-child(2n)) {
      animation-duration: 10.8s;
      animation-delay: -6.4s;
      animation-direction: reverse;
    }

    :deep(g[fill="url(#reflection)"] > path:nth-child(3n)) {
      animation-duration: 7.2s;
      animation-delay: -4.6s;
    }

    // Rock the hull, mast and sails around the same waterline pivot. The last
    // path is the reflection beneath the boat, so keep it on the water.
    :deep(g:has(> path[fill="#151B2B"]) > path:not([stroke-opacity])) {
      transform-box: view-box;
      transform-origin: 1544px 560px;
      animation: boat-rock 8s ease-in-out -2s infinite;
    }
  }
}

@keyframes aurora-drift {
  0%, 100% {
    opacity: calc(var(--aurora-opacity, 1) * 0.45);
    transform: translate(0, 8px) scale(1, 0.97);
  }

  50% {
    opacity: var(--aurora-opacity, 1);
    transform: translate(42px, -20px) scale(1.08, 1.12);
  }
}

@keyframes star-twinkle {
  0%, 100% {
    opacity: 0.18;
    transform: scale(0.85);
  }

  50% {
    opacity: 1;
    transform: scale(1.45);
  }
}

@keyframes moon-glow {
  0%, 100% {
    opacity: 0.45;
    transform: scale(0.9);
  }

  50% {
    opacity: 1;
    transform: scale(1.15);
  }
}

@keyframes water-glow {
  0%, 100% {
    opacity: 0.4;
  }

  50% {
    opacity: 1;
  }
}

@keyframes water-shimmer {
  0%, 100% {
    opacity: 0.22;
    transform: translate(-16px, -1.5px) scale(0.7, 0.9);
  }

  50% {
    opacity: 1;
    transform: translate(16px, 2.5px) scale(1.35, 1.5);
  }
}

@keyframes boat-rock {
  0%, 100% {
    transform: translateY(3px) rotate(-5deg);
  }

  50% {
    transform: translateY(-3px) rotate(5deg);
  }
}
</style>
