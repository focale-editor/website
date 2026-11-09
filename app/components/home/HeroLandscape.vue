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
    :deep([fill="url(#auroraVeil)"]),
    :deep([stroke="url(#auroraEdge)"]) {
      transform-origin: 1500px 150px;
      animation: aurora-drift 18s ease-in-out -4s infinite;
    }

    :deep([fill="url(#auroraVeil)"][opacity]),
    :deep([stroke="url(#auroraEdge)"][opacity]) {
      animation-duration: 25s;
      animation-delay: -13s;
      animation-direction: reverse;
    }

    :deep(g[fill="#EDF0F4"] > circle),
    :deep(g[stroke="#8DB5FF"] > path[opacity]) {
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
      animation: water-shimmer 4.2s ease-in-out -1.4s infinite;
    }

    :deep(g[fill="url(#reflection)"] > path:nth-child(2n)) {
      animation-duration: 5.4s;
      animation-delay: -3.2s;
      animation-direction: reverse;
    }

    :deep(g[fill="url(#reflection)"] > path:nth-child(3n)) {
      animation-duration: 3.6s;
      animation-delay: -2.3s;
    }
  }
}

@keyframes aurora-drift {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }

  50% {
    transform: translate(16px, -8px) scale(1.025, 1.04);
  }
}

// The endpoints inherit each star's original opacity, preserving its brightness.
@keyframes star-twinkle {
  50% {
    opacity: 0.12;
  }
}

@keyframes moon-glow {
  0%, 100% {
    opacity: 0.7;
    transform: scale(0.97);
  }

  50% {
    opacity: 1;
    transform: scale(1.05);
  }
}

@keyframes water-glow {
  0%, 100% {
    opacity: 0.7;
  }

  50% {
    opacity: 1;
  }
}

@keyframes water-shimmer {
  0%, 100% {
    opacity: 0.3;
    transform: translate(-10px, -1px) scale(0.78, 0.85);
  }

  50% {
    opacity: 1;
    transform: translate(10px, 1.5px) scale(1.22, 1.25);
  }
}
</style>
