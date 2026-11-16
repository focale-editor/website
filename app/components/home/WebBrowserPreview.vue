<script setup lang="ts">

const preview = useTemplateRef('preview')
const clipPrefix = useId()
useWebDrawingAnimation(preview)
</script>

<template>
  <div
    ref="preview"
    class="web-browser"
    data-tool="brush"
    aria-hidden="true"
  >
    <div class="web-browser-toolbar">
      <Icon name="lucide:app-window" />
      <span class="web-browser-address">web.focale-editor.app</span>
      <Icon name="lucide:lock-keyhole" />
    </div>

    <div class="web-editor">
      <div class="web-editor-tools">
        <span class="web-tool"><Icon name="lucide:mouse-pointer-2" /></span>
        <span class="web-tool web-tool-pen"><span class="web-tool-highlight" /><Icon name="lucide:pen-tool" /></span>
        <span class="web-tool web-tool-brush"><span class="web-tool-highlight" /><Icon name="lucide:brush" /></span>
        <span class="web-tool"><Icon name="lucide:circle" /></span>
        <span class="web-tool web-tool-fill"><span class="web-tool-highlight" /><Icon name="lucide:paint-bucket" /></span>
        <span class="web-tool-colors">
          <span class="web-color-front" />
          <span class="web-color-back" />
        </span>
      </div>

      <div class="web-browser-canvas">
        <svg
          class="web-browser-artwork"
          viewBox="0 0 320 256"
          fill="none"
          focusable="false"
        >
          <rect
            x="20"
            y="24"
            width="280"
            height="208"
            rx="3"
            class="web-artboard"
          />
          <defs>
            <clipPath
              v-for="(shape, index) in webDrawingShapes"
              :id="`${clipPrefix}-${index}`"
              :key="index"
              clipPathUnits="userSpaceOnUse"
            >
              <circle
                :data-drawing-mask="index"
                :cx="shape.fillAt?.[0] ?? 0"
                :cy="shape.fillAt?.[1] ?? 0"
                r="400"
              />
            </clipPath>
          </defs>
          <g class="web-drawing">
            <g
              v-for="(shape, index) in webDrawingShapes"
              :key="index"
            >
              <path
                :data-drawing-shape="index"
                :d="shape.path"
                :class="shape.className"
                :clip-path="shape.fillAt ? `url(#${clipPrefix}-${index})` : undefined"
              />
              <path
                v-if="shape.fillAt"
                :data-drawing-trace="index"
                :d="shape.path"
                class="web-drawing-trace"
              />
            </g>
          </g>
          <g
            class="web-drawing-cursor"
            data-drawing-cursor
          >
            <circle
              data-drawing-click
              r="0"
              class="web-cursor-click"
            />
            <g class="web-cursor-pen">
              <path d="M0 0L4-12L7-15Q8-16 9-15L13-11Q14-10 13-9L10-6Z" />
              <path
                d="M4-12L10-6M0 0L2-6L6-2Z"
                class="web-pencil-tip"
              />
            </g>
            <path
              class="web-cursor-brush"
              d="M0 0C3-5 8-4 9-8L12-17L16-15L11-6C9-1 4 2 0 0Z"
            />
            <path
              class="web-cursor-fill"
              d="M0 0L1 16L5 11L10 16L13 13L8 8L14 6Z"
            />
          </g>
        </svg>
      </div>
    </div>

    <div class="web-editor-status">
      <span class="web-editor-palette"><span /><span /><span /></span>
      <span>100%</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.web-browser {
  --drawing-paper: #edf2f8;
  --drawing-sun: #d2a56c;

  width: 100%;
  max-width: 24rem;
  overflow: hidden;
  pointer-events: none;
  background: var(--color-panel);
  border: 1px solid var(--color-accent-line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-panel);
}

.web-browser-toolbar {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  padding: 0.875rem 1rem;
  color: var(--color-text-subtle);
  font-size: 0.875rem;
  border-bottom: 1px solid var(--color-line);
}

.web-browser-address {
  flex: 1;
  color: var(--color-text-muted);
  font-size: 0.6875rem;
  font-family: var(--font-mono);
}

.web-editor {
  display: grid;
  grid-template-columns: 2.75rem minmax(0, 1fr);
}

.web-editor-tools {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  align-items: center;
  padding: 0.625rem 0.375rem;
  border-right: 1px solid var(--color-line);
}

.web-tool {
  position: relative;
  display: grid;
  flex: none;
  place-items: center;
  width: 1.875rem;
  height: 1.875rem;
  color: var(--color-text-muted);
  font-size: 0.9375rem;
  isolation: isolate;

}

.web-tool-highlight {
  position: absolute;
  z-index: -1;
  inset: 0;
  background: var(--color-accent-soft);
  border: 1px solid var(--color-accent-line);
  border-radius: var(--radius-xs);
  opacity: 0;
}

.web-browser[data-tool='pen'] .web-tool-pen .web-tool-highlight,
.web-browser[data-tool='fill'] .web-tool-fill .web-tool-highlight,
.web-browser[data-tool='brush'] .web-tool-brush .web-tool-highlight {
  opacity: 1;
}

.web-tool-colors {
  position: relative;
  width: 1.5rem;
  height: 1.5rem;
  margin-top: auto;
  isolation: isolate;

  .web-color-front,
  .web-color-back {
    position: absolute;
    width: 1rem;
    height: 1rem;
    background: var(--drawing-paint, var(--color-accent));
    border: 1px solid var(--color-panel);
    border-radius: var(--radius-xs);
  }

  .web-color-back {
    z-index: -1;
    right: 0;
    bottom: 0;
    background: var(--drawing-paper);
  }
}

.web-browser-canvas {
  display: grid;
  place-items: center;
  min-height: 15rem;
  background: var(--checker);
}

.web-browser-artwork {
  width: 100%;
}

.web-artboard,
.web-snow {
  fill: var(--drawing-paper);
}

.web-sky {
  fill: #e2ecf5;
}

.web-sun-halo {
  fill: var(--drawing-sun);
  opacity: 0.14;
}

.web-distant-mountains {
  fill: #c0d5e6;
}

.web-mountain-fill {
  fill: var(--color-accent-bright);
}

.web-mountain-shade {
  fill: var(--color-accent);
}

.web-foothills {
  fill: #4176a8;
}

.web-lake {
  fill: #b4d2e7;
}

.web-shore {
  fill: #345f85;
}

.web-trees {
  fill: #253f62;
}

.web-sun-fill {
  fill: var(--drawing-sun);
}

.web-clouds,
.web-water-light,
.web-water-sun,
.web-birds {
  stroke: var(--drawing-paper);
  stroke-width: 1.5;
  stroke-linecap: round;
}

.web-clouds {
  opacity: 0.85;
}

.web-water-light {
  opacity: 0.65;
}

.web-water-sun {
  stroke: var(--drawing-sun);
  opacity: 0.6;
}

.web-birds {
  stroke: #4176a8;
  stroke-width: 1.2;
}

.web-drawing-stroke,
.web-sun-stroke {
  stroke: var(--color-accent);
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.web-sun-stroke {
  stroke: var(--drawing-sun);
  stroke-width: 2;
}

.web-drawing-cursor {
  fill: var(--color-canvas);
  stroke: var(--drawing-paper);
  stroke-width: 1.25;
  stroke-linejoin: round;
  opacity: 0;
}

.web-pencil-tip {
  fill: var(--drawing-paper);
}

.web-editor-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  color: var(--color-text-subtle);
  font-size: 0.625rem;
  font-family: var(--font-mono);
  border-top: 1px solid var(--color-line);
}

.web-editor-palette {
  display: flex;
  gap: 0.25rem;

  span {
    width: 0.5rem;
    height: 0.5rem;
    background: var(--color-accent-bright);
    border-radius: 50%;
  }

  span:nth-child(2) {
    background: var(--color-accent);
  }

  span:nth-child(3) {
    background: var(--drawing-sun);
  }
}

.web-drawing-trace {
  fill: none;
  stroke: var(--color-accent);
  stroke-width: 1.25;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0;
}

.web-cursor-pen,
.web-cursor-brush,
.web-cursor-fill {
  display: none;
}

.web-cursor-brush {
  fill: var(--drawing-paint, var(--color-accent));
}

.web-browser[data-tool='pen'] .web-cursor-pen,
.web-browser[data-tool='fill'] .web-cursor-fill,
.web-browser[data-tool='brush'] .web-cursor-brush {
  display: inline;
}

.web-cursor-click {
  fill: none;
  stroke: var(--drawing-paint, var(--color-accent));
  opacity: 0;
}
</style>
