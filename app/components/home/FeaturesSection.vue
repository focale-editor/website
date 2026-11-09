<script setup lang="ts">
const { t } = useI18n()
const features = useFeatures()
const previewCount = 3
const expanded = ref(false)
const list = useTemplateRef('list')
const resize = useHeightTransition()

function toggleFeatures() {
  void resize(list.value, () => {
    expanded.value = !expanded.value
  })
}
</script>

<template>
  <PageSection
    id="features"
    :eyebrow="t('features.eyebrow')"
    :title="t('features.title')"
    :description="t('features.description')"
  >
    <ul
      id="features-list"
      ref="list"
      class="features"
      :class="{ 'features-expanded': expanded }"
      role="list"
    >
      <li
        v-for="(feature, index) in features"
        v-show="expanded || index < previewCount"
        :key="feature.id"
        class="features-cell motion-trigger"
        :data-feature="feature.id"
        :style="{ '--feature-delay': `${Math.max(0, Math.min(index - previewCount, 5)) * 35}ms` }"
      >
        <span class="features-icon">
          <AnimatedIcon :name="feature.icon" />
        </span>
        <h3 class="features-title">
          {{ t(`features.items.${feature.id}.title`) }}
        </h3>
        <p class="features-text">
          {{ t(`features.items.${feature.id}.description`) }}
        </p>
      </li>
    </ul>

    <div
      v-if="features.length > previewCount"
      class="features-actions"
    >
      <Button
        type="button"
        severity="contrast"
        variant="text"
        class="features-toggle"
        :label="expanded ? t('features.showLess') : t('features.showMore')"
        :aria-expanded="expanded"
        aria-controls="features-list"
        @click="toggleFeatures"
      >
        <template #icon>
          <Icon
            name="lucide:chevron-down"
            class="features-chevron"
            aria-hidden="true"
          />
        </template>
      </Button>
    </div>
  </PageSection>
</template>

<style scoped lang="scss">
// One panel divided by hairlines, the way the editor lays out its own docks —
// rather than a scatter of floating cards.
.features {
  display: block;
  margin: 0;
  background: var(--color-panel);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  overflow: hidden;

  @include from($breakpoint-lg) {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.features-cell {
  position: relative;
  padding: 1.625rem 1.5rem 1.75rem;

  // Hairlines drawn as shadows so no cell needs to know where it sits in the
  // grid, and the outer edges never double up.
  box-shadow:
    1px 0 0 var(--color-line),
    0 1px 0 var(--color-line);
  transition: background 0.18s ease;

  &:hover {
    background: var(--color-panel-hover);
  }
}

.features-icon {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  color: var(--color-accent-bright);
  font-size: 1.25rem;
}

.features-title {
  margin-top: 0.875rem;
  font-size: 1.0625rem;
}

.features-text {
  margin-top: 0.4rem;
  color: var(--color-text-muted);
  font-size: 0.9375rem;
}

.features-actions {
  display: flex;
  justify-content: center;
  margin-top: 1.5rem;
}

.features-toggle {
  min-height: 2.75rem;
  text-align: center;
}

@include motion-safe {
  .features-chevron {
    transition: transform 0.25s ease;
  }

  .features-toggle[aria-expanded='true'] .features-chevron {
    transform: rotate(180deg);
  }

  .features-expanded .features-cell:nth-child(n + 4) {
    animation: feature-appear 320ms ease-out var(--feature-delay) both;
  }

}

@keyframes feature-appear {
  from {
    opacity: 0;
    transform: translateY(12px);
  }

  to {
    opacity: 1;
    transform: none;
  }
}
</style>
