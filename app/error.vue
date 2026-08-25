<script setup lang="ts">
import type { NuxtError } from '#app'

const { error } = defineProps<{
  /** The error Nuxt could not render a page for. */
  error: NuxtError
}>()

const { t } = useI18n()
const localePath = useLocalePath()

// Anything that is not a missing page is reported as an unexpected failure:
// the visitor cannot act on a 502 differently than on a 500.
const kind = computed(() => (error.statusCode === 404 ? 'notFound' : 'unexpected'))

useHead(() => ({
  title: `${t(`error.${kind.value}.title`)} — Focale`,
  htmlAttrs: { class: 'focale-dark' },
  meta: [{ name: 'robots', content: 'noindex' }],
}))

/** Leaves the error screen and re-enters the site at its home page. */
async function goHome(): Promise<void> {
  await clearError({ redirect: localePath('index') })
}
</script>

<template>
  <NuxtLayout>
    <section class="error">
      <div
        class="error-glow"
        aria-hidden="true"
      />

      <p class="error-code">
        {{ error.statusCode ?? 500 }}
      </p>
      <h1 class="error-title">
        {{ t(`error.${kind}.title`) }}
      </h1>
      <p class="error-text">
        {{ t(`error.${kind}.description`) }}
      </p>

      <div class="error-actions">
        <Button
          :label="t('error.backHome')"
          @click="goHome"
        >
          <template #icon>
            <Icon name="lucide:arrow-left" />
          </template>
        </Button>
      </div>
    </section>
  </NuxtLayout>
</template>

<style scoped lang="scss">
.error {
  @include content-container($content-width-narrow);

  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding-block: var(--section-gap);
  text-align: center;
  isolation: isolate;
}

.error-glow {
  position: absolute;
  top: 10%;
  left: 50%;
  z-index: -1;
  width: 36rem;
  height: 24rem;
  background: radial-gradient(circle, rgb(0, 124, 249, 22%), transparent 65%);
  filter: blur(70px);
  transform: translateX(-50%);
}

.error-code {
  color: var(--color-accent);
  font-weight: 700;
  font-size: clamp(3.5rem, 12vw, 6rem);
  font-family: var(--font-display);
  line-height: 1;
  letter-spacing: -0.04em;
}

.error-title {
  @include fluid-text(1.5rem, 2.25rem, 4vw);

  margin-top: 1rem;
}

.error-text {
  max-width: 44ch;
  margin-top: 0.875rem;
  color: var(--color-text-muted);
}

.error-actions {
  margin-top: 2rem;
}
</style>
