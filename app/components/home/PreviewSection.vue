<script setup lang="ts">
import type { CarouselPassThroughOptions } from 'openvue/carousel'
import { editorScreenshots, screenshotLanguage, type ScreenshotTheme } from '~/utils/screenshotGallery'

const { t, locale } = useI18n()
const theme = ref<ScreenshotTheme>('dark')
const themes: ScreenshotTheme[] = ['dark', 'light']
const page = ref(0)
const announcement = ref('')
const screenshots = computed(() => editorScreenshots(locale.value, theme.value))
const currentView = computed(() => screenshots.value[page.value]?.id ?? 'editor')
const carouselKey = computed(() => `${screenshotLanguage(locale.value)}-${theme.value}`)

const carouselPt = computed<CarouselPassThroughOptions>(() => ({
  root: { 'aria-roledescription': t('preview.carouselRole') },
  item: ({ context }) => ({
    'aria-label': t('preview.slidePosition', { current: context.index + 1, total: screenshots.value.length }),
    'aria-roledescription': t('preview.slideRole'),
  }),
}))

/** Arrow controls and keyboard navigation stay within the supplied views. */
function changePage(direction: number): void {
  page.value = Math.max(0, Math.min(screenshots.value.length - 1, page.value + direction))
}

// Announce user-driven changes through a stable, initially empty status region.
watch([page, theme, locale], () => {
  announcement.value = t('preview.slideStatus', {
    title: t(`preview.slides.${currentView.value}.title`),
    current: page.value + 1,
    total: screenshots.value.length,
    theme: t(`preview.themes.${theme.value}`),
  })
})
</script>

<template>
  <PageSection
    id="preview"
    muted
    :eyebrow="t('preview.eyebrow')"
    :title="t('preview.title')"
    :description="t('preview.description')"
  >
    <div class="preview">
      <div class="preview-toolbar">
        <h3 class="preview-heading">
          {{ t(`preview.slides.${currentView}.title`) }}
        </h3>
        <div
          class="preview-themes"
          role="group"
          :aria-label="t('preview.interfaceTheme')"
        >
          <button
            v-for="option in themes"
            :key="option"
            type="button"
            class="preview-theme"
            :aria-pressed="theme === option"
            @click="theme = option"
          >
            <Icon
              :name="option === 'dark' ? 'lucide:moon' : 'lucide:sun'"
              aria-hidden="true"
            />
            {{ t(`preview.themes.${option}`) }}
          </button>
        </div>
      </div>

      <figure class="preview-frame">
        <Carousel
          id="preview-carousel"
          :key="carouselKey"
          v-model:page="page"
          class="preview-carousel"
          :value="screenshots"
          :num-visible="1"
          :num-scroll="1"
          :show-navigators="false"
          :show-indicators="false"
          :pt="carouselPt"
          :aria-label="t('preview.carouselLabel')"
          tabindex="0"
          @keydown.left.prevent="changePage(-1)"
          @keydown.right.prevent="changePage(1)"
          @keydown.home.prevent="page = 0"
          @keydown.end.prevent="page = screenshots.length - 1"
        >
          <template #item="{ data }">
            <img
              :src="data.src"
              :srcset="data.srcset"
              sizes="(min-width: 74rem) 69rem, 90vw"
              class="preview-image"
              :width="data.width"
              :height="data.height"
              :alt="`${t(`preview.slides.${data.id}.alt`)} — ${t(`preview.themes.${theme}`)}`"
              loading="lazy"
              decoding="async"
            >
          </template>
        </Carousel>

        <figcaption class="preview-footer">
          <div class="preview-caption">
            <span class="preview-tag">{{ t('preview.tag') }}</span>
            {{ t('preview.caption') }}
          </div>
          <div class="preview-navigation">
            <Button
              type="button"
              severity="secondary"
              outlined
              class="preview-arrow"
              :aria-label="t('preview.previous')"
              aria-controls="preview-carousel"
              :disabled="page === 0"
              @click="changePage(-1)"
            >
              <template #icon>
                <Icon
                  name="lucide:chevron-left"
                  aria-hidden="true"
                />
              </template>
            </Button>
            <span
              class="preview-position"
              aria-hidden="true"
            >{{ page + 1 }} / {{ screenshots.length }}</span>
            <Button
              type="button"
              severity="secondary"
              outlined
              class="preview-arrow"
              :aria-label="t('preview.next')"
              aria-controls="preview-carousel"
              :disabled="page === screenshots.length - 1"
              @click="changePage(1)"
            >
              <template #icon>
                <Icon
                  name="lucide:chevron-right"
                  aria-hidden="true"
                />
              </template>
            </Button>
          </div>
        </figcaption>
      </figure>

      <div
        class="preview-thumbnails"
        role="group"
        :aria-label="t('preview.chooseView')"
      >
        <button
          v-for="(screenshot, index) in screenshots"
          :key="screenshot.id"
          type="button"
          class="preview-thumbnail"
          :aria-pressed="page === index"
          aria-controls="preview-carousel"
          @click="page = index"
        >
          <img
            :src="screenshot.thumbnail"
            alt=""
            width="320"
            height="180"
            loading="lazy"
            decoding="async"
          >
          <span>{{ t(`preview.slides.${screenshot.id}.title`) }}</span>
        </button>
      </div>
      <p
        class="visually-hidden"
        role="status"
        aria-atomic="true"
      >
        {{ announcement }}
      </p>
    </div>

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
.preview-frame {
  margin: 0;
}

.preview-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.preview-heading {
  font-size: 1.125rem;
}

.preview-themes {
  display: flex;
  gap: 0.25rem;
  padding: 0.25rem;
  background: var(--color-panel);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
}

.preview-theme {
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0.5rem 0.875rem;
  color: var(--color-text-muted);
  font-size: 0.875rem;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;

  &[aria-pressed='true'] {
    color: var(--color-text);
    background: var(--color-panel-hover);
    border-color: var(--color-accent-line);
  }
}

.preview-carousel {
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-window);

  :deep(.p-carousel-viewport) {
    border-radius: inherit;
    touch-action: pan-y;
  }

  :deep(.p-carousel-item) {
    flex: 0 0 100%;
    min-width: 0;
  }

  :deep(.p-carousel-content-container),
  :deep(.p-carousel-content) {
    gap: 0;
    border-radius: inherit;
  }
}

.preview-image {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
  background: var(--color-canvas);
}

.preview-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  margin-top: 1rem;
}

.preview-caption {
  display: flex;
  flex: 1 1 24rem;
  flex-wrap: wrap;
  gap: 0.5rem 0.75rem;
  align-items: center;
  color: var(--color-text-subtle);
  font-size: 0.875rem;
}

.preview-tag {
  padding: 0.2rem 0.5rem;
  color: var(--color-accent-bright);
  font-size: 0.75rem;
  background: var(--color-accent-soft);
  border: 1px solid var(--color-accent-line);
  border-radius: var(--radius-xs);
}

.preview-navigation {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.preview-arrow {
  min-width: 2.75rem;
  min-height: 2.75rem;
}

.preview-position {
  min-width: 3rem;
  color: var(--color-text-muted);
  font-size: 0.875rem;
  font-variant-numeric: tabular-nums;
  text-align: center;
}

.preview-thumbnails {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-top: 1.5rem;

  @include from($breakpoint-sm) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.preview-thumbnail {
  min-width: 0;
  padding: 0.375rem;
  color: var(--color-text-muted);
  text-align: left;
  background: var(--color-panel);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  cursor: pointer;

  img {
    width: 100%;
    height: auto;
    border-radius: var(--radius-md);
  }

  span {
    display: block;
    padding: 0.625rem 0.25rem 0.25rem;
    font-size: 0.875rem;
  }

  &[aria-pressed='true'] {
    color: var(--color-text);
    border-color: var(--color-accent-bright);
    box-shadow: 0 0 0 1px var(--color-accent-bright) inset;
  }
}

@media (hover: hover) {
  .preview-theme:hover,
  .preview-thumbnail:hover {
    color: var(--color-text);
    background-color: var(--color-panel-hover);
  }
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
