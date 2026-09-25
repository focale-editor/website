<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <PageSection
    id="preview"
    :eyebrow="t('preview.eyebrow')"
    :title="t('preview.title')"
    :description="t('preview.description')"
  >
    <figure class="preview">
      <img
        src="/images/screenshot.webp"
        class="preview-image"
        width="1088"
        height="723"
        :alt="t('preview.alt')"
        loading="lazy"
        decoding="async"
      >
      <figcaption class="preview-caption">
        <span class="preview-tag">{{ t('preview.tag') }}</span>
        {{ t('preview.caption') }}
      </figcaption>
    </figure>

    <ul
      class="preview-notes"
      role="list"
    >
      <li
        v-for="note in ['menus', 'panels', 'canvas']"
        :key="note"
        class="preview-note"
      >
        <Icon
          name="lucide:check"
          class="preview-note-icon"
        />
        {{ t(`preview.notes.${note}`) }}
      </li>
    </ul>
  </PageSection>
</template>

<style scoped lang="scss">
.preview {
  margin: 0;
}

// The capture carries the application's own title bar, so the page adds only a
// hairline and a shadow to lift it off the background.
.preview-image {
  width: 100%;
  height: auto;
  background: var(--color-canvas);
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-window);
}

.preview-caption {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 0.75rem;
  align-items: center;
  margin-top: 1rem;
  color: var(--color-text-subtle);
  font-size: 0.8125rem;
}

.preview-tag {
  @include label-text;

  padding: 0.15rem 0.5rem;
  color: var(--color-accent);
  font-size: 0.625rem;
  background: var(--color-accent-soft);
  border: 1px solid var(--color-accent-line);
  border-radius: var(--radius-xs);
}

.preview-notes {
  display: grid;
  gap: 0.75rem 2rem;
  margin: 2rem 0 0;

  @include from($breakpoint-md) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.preview-note {
  display: flex;
  gap: 0.55rem;
  align-items: flex-start;
  color: var(--color-text-muted);
  font-size: 0.9375rem;
}

.preview-note-icon {
  flex: none;
  margin-top: 0.2rem;
  color: var(--color-accent);
  font-size: 1rem;
}
</style>
