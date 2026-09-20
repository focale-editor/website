<script setup lang="ts">
const { t } = useI18n()
const roadmap = useRoadmap()

const currentIndex = computed(() => roadmap.findIndex(entry => entry.state === 'inProgress'))
</script>

<template>
  <PageSection
    id="roadmap"
    :eyebrow="t('roadmap.eyebrow')"
    :title="t('roadmap.title')"
    :description="t('roadmap.description')"
  >
    <ol
      class="roadmap"
      role="list"
    >
      <li
        v-for="(entry, index) in roadmap"
        :key="entry.id"
        class="roadmap-step"
        :aria-current="index === currentIndex ? 'step' : undefined"
        :class="[
          `roadmap-step-${entry.state}`,
          { 'roadmap-step-current': index === currentIndex },
        ]"
      >
        <div class="roadmap-scale">
          <span class="roadmap-rule" />
          <span class="roadmap-stop">
            <Icon
              v-if="entry.state === 'done'"
              name="lucide:check"
            />
          </span>
        </div>

        <p class="roadmap-index">
          {{ String(index + 1).padStart(2, '0') }} · {{ t(`roadmap.states.${entry.state}`) }}
        </p>
        <h3 class="roadmap-title">
          {{ t(`roadmap.items.${entry.id}.title`) }}
        </h3>
        <p class="roadmap-text">
          {{ t(`roadmap.items.${entry.id}.description`) }}
        </p>
      </li>
    </ol>
  </PageSection>
</template>

<style scoped lang="scss">
// A focus scale laid flat: four stops on one rule, the reached ones lit.
.roadmap {
  display: grid;
  gap: 2rem 0;
  margin: 0;
  padding: 0;
  list-style: none;

  @include from($breakpoint-md) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0;
  }
}

.roadmap-step {
  position: relative;

  @include from($breakpoint-md) {
    padding-right: 1.75rem;
  }
}

.roadmap-scale {
  position: relative;
  display: flex;
  align-items: center;
  height: 1.5rem;
  margin-bottom: 1rem;
}

// The rule runs edge to edge behind the stop, so the four cells read as one
// continuous scale rather than four separate markers.
.roadmap-rule {
  position: absolute;
  right: 0;
  left: 0;
  height: 1px;
  background: var(--color-line-strong);
}

.roadmap-stop {
  position: relative;
  display: grid;
  place-items: center;
  width: 1.5rem;
  height: 1.5rem;
  color: var(--color-accent-contrast);
  font-size: 0.8125rem;
  background: var(--color-canvas);
  border: 1px solid var(--color-line-strong);
  border-radius: 50%;
}

.roadmap-step-done .roadmap-stop {
  background: var(--color-accent);
  border-color: var(--color-accent);
}

.roadmap-step-current .roadmap-stop {
  background: var(--color-canvas);
  border-color: var(--color-accent);
  box-shadow: 0 0 0 4px var(--color-accent-soft);

  // A filled core marks the stop the project currently sits on.
  &::after {
    width: 0.5rem;
    height: 0.5rem;
    background: var(--color-accent);
    border-radius: 50%;
    content: '';
  }
}

.roadmap-step-done .roadmap-rule {
  background: var(--color-accent-line);
}

.roadmap-step-current .roadmap-rule {
  background: linear-gradient(90deg, var(--color-accent-line), var(--color-accent-line) 50%, var(--color-line-strong) 50%);
}

.roadmap-step:last-child .roadmap-rule {
  @include from($breakpoint-md) {
    right: auto;
    width: 1.5rem;
  }
}

.roadmap-index {
  @include label-text;

  color: var(--color-text-subtle);
}

.roadmap-step-current .roadmap-index {
  color: var(--color-accent);
}

.roadmap-title {
  margin-top: 0.5rem;
  font-size: 1.0625rem;
}

.roadmap-text {
  max-width: 34ch;
  margin-top: 0.4rem;
  color: var(--color-text-muted);
  font-size: 0.9375rem;
}
</style>
