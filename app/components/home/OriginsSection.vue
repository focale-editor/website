<script setup lang="ts">
const { t } = useI18n()
const paragraphs = ['need', 'alternatives', 'linux', 'vision'] as const
</script>

<template>
  <section
    id="origins"
    class="origins"
    aria-labelledby="origins-title"
  >
    <details class="origins-disclosure">
      <summary class="origins-summary">
        <span
          class="origins-symbol"
          aria-hidden="true"
        >
          <Icon name="lucide:lightbulb" />
        </span>
        <h2
          id="origins-title"
          class="origins-title"
        >
          {{ t('origins.title') }}
        </h2>
        <span
          class="origins-toggle"
          aria-hidden="true"
        >
          <Icon
            name="lucide:chevron-down"
            class="origins-chevron"
          />
        </span>
      </summary>
      <div class="origins-content">
        <div class="origins-copy">
          <p
            v-for="paragraph in paragraphs"
            :key="paragraph"
          >
            {{ t(`origins.${paragraph}`) }}
          </p>
        </div>
        <div
          class="origins-artwork"
          aria-hidden="true"
        >
          <div class="origins-orbit">
            <Icon
              name="simple-icons:linux"
              class="origins-linux"
            />
            <div class="origins-mark">
              <FocaleLogo
                :size="64"
                :animated="false"
              />
            </div>
          </div>
        </div>
      </div>
    </details>
  </section>
</template>

<style scoped lang="scss">
.origins {
  @include content-container;
}

.origins-disclosure {
  background: var(--color-panel);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-panel);
}

.origins-summary {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 1rem;
  align-items: center;
  min-height: 5rem;
  padding: 1.25rem clamp(1rem, 3vw, 2rem);
  border-radius: var(--radius-lg);
  cursor: pointer;
  list-style: none;

  @include motion-safe {
    transition: background-color 0.18s ease;
  }

  &::-webkit-details-marker {
    display: none;
  }

  &:hover {
    background-color: var(--color-panel-hover);
  }

  &:focus-visible {
    @include focus-ring(-3px);
  }
}

.origins-symbol {
  display: grid;
  place-items: center;
  width: 2.75rem;
  height: 2.75rem;
  color: var(--color-accent-bright);
  font-size: 1.375rem;
  background: var(--color-accent-soft);
  border: 1px solid var(--color-accent-line);
  border-radius: var(--radius-md);
}

.origins-title {
  font-size: clamp(1.125rem, 2vw, 1.375rem);
  line-height: 1.4;
  text-wrap: initial;
}

.origins-toggle {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  color: var(--color-accent-bright);
  font-size: 1rem;
  background: var(--color-canvas-raised);
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-md);
}

.origins-chevron {
  @include motion-safe {
    transition: transform 0.2s ease;
  }
}

.origins-disclosure[open] .origins-summary {
  border-bottom: 1px solid var(--color-line);
  border-end-start-radius: 0;
  border-end-end-radius: 0;
}

.origins-disclosure[open] .origins-chevron {
  transform: rotate(180deg);
}

.origins-content {
  display: grid;
  gap: 2.5rem;
  padding: clamp(1.5rem, 3vw, 2rem);

  @include from($breakpoint-lg) {
    grid-template-columns: minmax(0, 1fr) minmax(14rem, 0.45fr);
  }
}

.origins-copy {
  max-width: 68ch;
  color: var(--color-text-muted);

  p + p {
    margin-top: 1.125rem;
  }

  p:first-child {
    color: var(--color-text);
    font-size: 1.0625rem;
  }
}

// A quiet Linux/Focale emblem accompanies the story on wider screens.
.origins-artwork {
  display: none;
  align-self: center;
  padding-block: 1rem;
  pointer-events: none;

  @include from($breakpoint-lg) {
    display: grid;
    place-items: center;
  }
}

.origins-orbit {
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  max-width: 17rem;
  aspect-ratio: 1;
  background: radial-gradient(circle, var(--color-accent-soft), transparent 70%);
  border: 1px solid var(--color-line);
  border-radius: 50%;

  &::before {
    position: absolute;
    inset: 1.125rem;
    border: 1px dashed var(--color-accent-line);
    border-radius: inherit;
    content: '';
  }
}

.origins-linux {
  width: 42%;
  height: 42%;
  color: var(--color-text);
}

.origins-mark {
  position: absolute;
  right: 0;
  bottom: 0;
  padding: 0.5rem;
  background: var(--color-panel);
  border: 1px solid var(--color-accent-line);
  border-radius: var(--radius-lg);
  box-shadow: 0 0 2rem var(--color-accent-soft);
}
</style>
