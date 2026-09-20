<script setup lang="ts">
const { t } = useI18n()
const features = useFeatures()
const previewCount = 3
const expanded = ref(false)
</script>

<template>
  <PageSection
    id="features"
    muted
    :eyebrow="t('features.eyebrow')"
    :title="t('features.title')"
    :description="t('features.description')"
  >
    <ul
      id="features-list"
      class="features"
      role="list"
    >
      <li
        v-for="(feature, index) in features"
        v-show="expanded || index < previewCount"
        :key="feature.id"
        class="features-cell"
      >
        <span class="features-icon">
          <Icon :name="feature.icon" />
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
        severity="secondary"
        outlined
        class="features-toggle"
        :label="expanded ? t('features.showLess') : t('features.showMore')"
        :aria-expanded="expanded"
        aria-controls="features-list"
        @click="expanded = !expanded"
      >
        <template #icon>
          <Icon
            :name="expanded ? 'lucide:chevron-up' : 'lucide:chevron-down'"
            aria-hidden="true"
          />
        </template>
      </Button>
    </div>

    <p class="features-note">
      <Icon name="lucide:info" />
      {{ t('features.note') }}
    </p>
  </PageSection>
</template>

<style scoped lang="scss">
// One panel divided by hairlines, the way the editor lays out its own docks —
// rather than a scatter of floating cards.
.features {
  display: grid;
  margin: 0;
  background: var(--color-panel);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  overflow: hidden;

  @include from($breakpoint-sm) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @include from($breakpoint-lg) {
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

.features-note {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  margin-top: 1.5rem;
  color: var(--color-text-subtle);
  font-size: 0.875rem;

  svg {
    flex: none;
    margin-top: 0.15rem;
  }
}
</style>
