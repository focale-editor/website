<script setup lang="ts">
defineProps<{ name: string }>()
</script>

<template>
  <!-- Put motion-trigger on the containing card/link to include keyboard focus. -->
  <span
    class="animated-icon"
    :data-icon="name"
    aria-hidden="true"
  >
    <!-- Split the few merged Lucide paths whose parts move independently. -->
    <svg
      v-if="['lucide:sliders-horizontal', 'lucide:hard-drive', 'lucide:clapperboard'].includes(name)"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <template v-if="name === 'lucide:sliders-horizontal'">
        <path
          d="M3 5h18M3 12h18M3 19h18"
          stroke-opacity="0.45"
        />
        <path
          class="slider-handle"
          d="M14 3v4"
        />
        <path
          class="slider-handle"
          d="M8 10v4"
        />
        <path
          class="slider-handle"
          d="M16 17v4"
        />
      </template>
      <template v-else-if="name === 'lucide:hard-drive'">
        <path d="M2.202 11.577a2 2 0 0 0-.212.896V18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5.527a2 2 0 0 0-.212-.896L18.55 5.11A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11ZM21.936 12.013H2.054" />
        <path
          class="drive-light"
          d="M6 16h.01"
        />
        <path
          class="drive-light"
          d="M10 16h.01"
        />
      </template>
      <template v-else>
        <path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
        <g class="clapper-top">
          <path d="M20.2 6L3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3ZM12.296 3.464l3.02 3.956M6.18 5.276l3.1 3.899" />
        </g>
      </template>
    </svg>
    <Icon
      v-else
      :name="name"
    />
  </span>
</template>

<style scoped lang="scss">
.animated-icon {
  display: inline-flex;
  flex: none;
  width: 1em;
  height: 1em;
  vertical-align: -0.125em;

  :deep(svg) {
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  :deep(svg),
  :deep(path),
  :deep(circle),
  :deep(rect) {
    transform-box: fill-box;
    transform-origin: center;
  }
}

@mixin active-icon {
  .motion-trigger:is(:hover, :focus-within) & {
    @content;
  }
}

@include motion-safe {
  .animated-icon {
    @include active-icon {
      :deep(svg) {
        animation: icon-lift 650ms ease-in-out;
      }
    }
  }

  .animated-icon[data-icon='lucide:hard-drive'] {
    @include active-icon {
      .drive-light {
        animation: icon-pulse 700ms ease-in-out;

        &:last-child { animation-delay: 120ms; }
      }
    }
  }

  .animated-icon[data-icon='lucide:layers'] {
    @include active-icon {
      :deep(path:first-child) {
        --motion-y: -2px;

        animation: icon-transform 650ms ease-in-out;
      }

      :deep(path:last-child) {
        --motion-y: 2px;

        animation: icon-transform 650ms ease-in-out;
      }
    }
  }

  .animated-icon[data-icon='lucide:sliders-horizontal'] {
    @include active-icon {
      .slider-handle {
        --motion-x: 3px;

        animation: icon-transform 650ms ease-in-out;

        &:nth-child(2n) { --motion-x: -3px; }
      }
    }
  }

  .animated-icon:is([data-icon='lucide:pen-tool'], [data-icon='lucide:spline']) {
    @include active-icon {
      :deep(path) {
        stroke-dasharray: 80;
        animation: icon-draw 750ms ease-out;
      }
    }
  }

  // Rotation suits the component assembly, mask outline and recovery ring.
  .animated-icon:is([data-icon='lucide:component'], [data-icon='lucide:circle-dashed'], [data-icon='lucide:life-buoy']) {
    --motion-rotation: 45deg;

    &[data-icon='lucide:life-buoy'] { --motion-rotation: -20deg; }

    @include active-icon {
      :deep(svg) { animation: icon-transform 850ms ease-in-out; }
    }
  }

  .animated-icon[data-icon='lucide:camera'] {
    @include active-icon {
      :deep(circle) {
        --motion-scale: 1.35;

        animation: icon-transform 700ms ease-in-out;
      }
    }
  }

  .animated-icon[data-icon='lucide:images'] {
    @include active-icon {
      :deep(path:nth-child(2)) {
        --motion-x: 2px;
        --motion-y: -2px;

        animation: icon-transform 700ms ease-in-out;
      }
    }
  }

  .animated-icon[data-icon='lucide:palette'] {
    @include active-icon {
      :deep(circle) {
        --motion-scale: 1.8;

        animation: icon-pulse 600ms ease-in-out;
      }

      :deep(circle:nth-of-type(2)) { animation-delay: 80ms; }
      :deep(circle:nth-of-type(3)) { animation-delay: 160ms; }
      :deep(circle:nth-of-type(4)) { animation-delay: 240ms; }
    }
  }

  .animated-icon:is([data-icon='lucide:brush'], [data-icon='lucide:wand-sparkles'], [data-icon='lucide:bug']) {
    --motion-rotation: -14deg;

    &[data-icon='lucide:bug'] { --motion-rotation: 8deg; }

    @include active-icon {
      :deep(svg) { animation: icon-transform 700ms ease-in-out; }
    }
  }

  .animated-icon[data-icon='lucide:type'] {
    @include active-icon {
      :deep(svg) { animation: type-stretch 700ms ease-in-out; }
    }
  }

  .animated-icon[data-icon='lucide:shapes'] {
    @include active-icon {
      :deep(path) {
        --motion-y: -2px;

        animation: icon-transform 700ms ease-in-out;
      }

      :deep(rect) {
        --motion-x: -1px;

        animation: icon-transform 700ms ease-in-out;
      }

      :deep(circle) {
        --motion-x: 1px;

        animation: icon-transform 700ms ease-in-out;
      }
    }
  }

  .animated-icon:is([data-icon='lucide:sparkles'], [data-icon='lucide:lightbulb']) {
    --motion-scale: 1.15;

    @include active-icon {
      :deep(svg) { animation: icon-pulse 700ms ease-in-out; }
    }
  }

  .animated-icon[data-icon='lucide:swatch-book'] {
    @include active-icon {
      :deep(path:last-child) {
        --motion-rotation: -14deg;

        transform-box: view-box;
        transform-origin: 7px 17px;
        animation: icon-transform 750ms ease-in-out;
      }
    }
  }

  .animated-icon[data-icon='lucide:workflow'] {
    @include active-icon {
      :deep(rect) { animation: icon-pulse 600ms ease-in-out; }
      :deep(rect:last-child) { animation-delay: 200ms; }

      :deep(path) {
        stroke-dasharray: 30;
        animation: workflow-connect 700ms ease-out;
      }
    }
  }

  .animated-icon[data-icon='lucide:clapperboard'] {
    @include active-icon {
      .clapper-top {
        --motion-rotation: 15deg;

        transform-origin: 3px 11px;
        animation: icon-transform 700ms ease-in-out;
      }
    }
  }

  .animated-icon[data-icon='lucide:panels-top-left'] {
    @include active-icon {
      :deep(path) {
        stroke-dasharray: 80;
        animation: icon-draw 700ms ease-out;
      }
    }
  }

  .animated-icon[data-icon='lucide:file-image'] {
    @include active-icon {
      :deep(circle),
      :deep(path:last-child) { animation: icon-pulse 700ms ease-in-out; }
    }
  }

  .animated-icon[data-icon='lucide:send'] {
    --motion-x: 2px;
    --motion-y: -2px;

    @include active-icon {
      :deep(svg) { animation: icon-transform 700ms ease-in-out; }
    }
  }
}

@keyframes icon-lift {
  50% { transform: translateY(-1px); }
}

@keyframes icon-transform {
  50% {
    transform: translate(var(--motion-x, 0), var(--motion-y, 0)) rotate(var(--motion-rotation, 0deg)) scale(var(--motion-scale, 1));
  }
}

@keyframes icon-pulse {
  50% {
    opacity: 0.35;
    transform: scale(var(--motion-scale, 1));
  }
}

@keyframes icon-draw {
  from { stroke-dashoffset: 80; }
  to { stroke-dashoffset: 0; }
}

@keyframes workflow-connect {
  from { stroke-dashoffset: 30; }
  to { stroke-dashoffset: 0; }
}

@keyframes type-stretch {
  50% { transform: scaleX(1.18); }
}
</style>
