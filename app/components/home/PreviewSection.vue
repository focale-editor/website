<script setup lang="ts">
import type { CarouselPassThroughOptions } from 'openvue/carousel'
import { editorScreenshots, type ScreenshotTheme } from '~/utils/screenshotGallery'

const { t, locale } = useI18n()
const theme = ref<ScreenshotTheme>('dark')
const themes: ScreenshotTheme[] = ['dark', 'light']
const page = ref(0)
const announcement = ref('')
const screenshots = computed(() => editorScreenshots(locale.value, theme.value))
const currentView = computed(() => screenshots.value[page.value]?.id ?? 'editor')
const previousScreenshot = ref<(typeof screenshots.value)[number] | null>(null)
const thumbnails = useTemplateRef('thumbnails')
const selection = ref<{ width: string, height: string, transform: string } | null>(null)
let thumbnailObserver: ResizeObserver | undefined

function changeTheme(option: ScreenshotTheme) {
  if (option === theme.value) return
  // Keep the cached image over the new carousel until its replacement decodes.
  previousScreenshot.value ??= screenshots.value[page.value] ?? null
  theme.value = option
}

async function imageReady(event: Event, src: string) {
  const image = event.currentTarget as HTMLImageElement
  if (image.decode) await image.decode().catch(() => {})
  if (image.complete && image.naturalWidth && src === screenshots.value[page.value]?.src) {
    previousScreenshot.value = null
  }
}

async function moveSelection() {
  await nextTick()
  const target = thumbnails.value?.querySelector<HTMLElement>('[aria-pressed="true"]')
  if (!target || !target.offsetWidth) return
  selection.value = {
    width: `${target.offsetWidth}px`,
    height: `${target.offsetHeight}px`,
    transform: `translate(${target.offsetLeft}px, ${target.offsetTop}px)`,
  }
}

onMounted(() => {
  if (thumbnails.value) {
    thumbnailObserver = new ResizeObserver(() => {
      void moveSelection()
    })
    thumbnailObserver.observe(thumbnails.value)
    void moveSelection()
  }
})

onBeforeUnmount(() => thumbnailObserver?.disconnect())

watch([page, locale], () => {
  previousScreenshot.value = null
  void moveSelection()
})

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
        <div class="preview-heading-slot">
          <Transition
            name="preview-title"
            mode="out-in"
          >
            <h3
              :key="currentView"
              class="preview-heading"
            >
              {{ t(`preview.slides.${currentView}.title`) }}
            </h3>
          </Transition>
        </div>
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
            @click="changeTheme(option)"
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
        <div class="preview-stage">
          <Carousel
            id="preview-carousel"
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
                @load="imageReady($event, data.src)"
                @error="data.src === screenshots[page]?.src && (previousScreenshot = null)"
              >
            </template>
          </Carousel>
          <Transition name="preview-theme-fade">
            <img
              v-if="previousScreenshot"
              :key="previousScreenshot.src"
              class="preview-previous"
              :src="previousScreenshot.src"
              :srcset="previousScreenshot.srcset"
              sizes="(min-width: 74rem) 69rem, 90vw"
              :width="previousScreenshot.width"
              :height="previousScreenshot.height"
              alt=""
              aria-hidden="true"
            >
          </Transition>
        </div>

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
        ref="thumbnails"
        class="preview-thumbnails"
        :class="{ 'has-selection': selection }"
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
        <span
          v-if="selection"
          class="preview-selection"
          :style="selection"
          aria-hidden="true"
        />
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

.preview-heading-slot {
  min-height: 1.5rem;
}

.preview-stage {
  position: relative;
}

.preview-previous {
  position: absolute;
  z-index: 1;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-lg);
  pointer-events: none;
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
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-top: 1.5rem;

  @include from($breakpoint-sm) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @include from($breakpoint-lg) {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
}

.preview-selection {
  position: absolute;
  top: 0;
  left: 0;
  border: 2px solid var(--color-accent-bright);
  border-radius: var(--radius-lg);
  pointer-events: none;
}

@include motion-safe {
  .preview-selection {
    transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), width 0.3s ease, height 0.3s ease;
  }

  .preview-theme,
  .preview-thumbnail {
    transition: background-color 0.2s ease, color 0.2s ease;
  }

  .preview-title-enter-active,
  .preview-title-leave-active {
    transition: opacity 0.15s ease, transform 0.15s ease;
  }

  .preview-title-enter-from {
    opacity: 0;
    transform: translateY(5px);
  }

  .preview-title-leave-to {
    opacity: 0;
    transform: translateY(-5px);
  }

  .preview-theme-fade-leave-active {
    transition: opacity 0.4s ease;
  }

  .preview-theme-fade-leave-to {
    opacity: 0;
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

.has-selection .preview-thumbnail[aria-pressed='true'] {
  border-color: var(--color-line);
  box-shadow: none;
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
