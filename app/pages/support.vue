<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const shareStatus = ref<'idle' | 'copied' | 'error'>('idle')

usePageSeo(() => ({ title: t('support.title'), description: t('support.description') }))

/** Public funding destinations supplied by the maintainer's FUNDING.yml. */
const fundingLinks = [
  { name: 'GitHub Sponsors', href: 'https://github.com/sponsors/Skyost' },
  { name: 'Ko-fi', href: 'https://ko-fi.com/Skyost' },
  { name: 'PayPal', href: 'https://paypal.me/Skyost' },
  { name: 'thanks.dev', href: 'https://thanks.dev/u/gh/Skyost' },
]

/** Shares the canonical home page without opening a social-network popup. */
async function copyLink(): Promise<void> {
  try {
    await navigator.clipboard.writeText('https://focale-editor.app')
    shareStatus.value = 'copied'
  }
  catch {
    shareStatus.value = 'error'
  }
}
</script>

<template>
  <div class="support-page">
    <header class="support-heading">
      <p class="support-eyebrow">
        <Icon
          name="lucide:heart"
          aria-hidden="true"
        />{{ t('support.eyebrow') }}
      </p>
      <h1>{{ t('support.heading') }}</h1>
      <p class="support-description">
        {{ t('support.description') }}
      </p>
    </header>

    <section
      class="support-donation"
      aria-labelledby="donate-title"
    >
      <div>
        <h2 id="donate-title">
          {{ t('support.donateTitle') }}
        </h2>
        <p>{{ t('support.donateDescription') }}</p>
      </div>
      <nav
        class="support-funding-links"
        :aria-label="t('support.donateAction')"
      >
        <Button
          v-for="link in fundingLinks"
          :key="link.href"
          as="a"
          :href="link.href"
          target="_blank"
          rel="noopener noreferrer"
          :label="link.name"
        >
          <template #icon>
            <Icon
              name="lucide:arrow-up-right"
              aria-hidden="true"
            />
          </template>
        </Button>
      </nav>
    </section>

    <div class="support-grid">
      <section class="support-card">
        <Icon
          class="support-icon"
          name="lucide:brush"
          aria-hidden="true"
        />
        <h2>{{ t('support.tryTitle') }}</h2>
        <p>{{ t('support.tryDescription') }}</p>
        <NuxtLink
          :to="localePath('index') + '#downloads'"
          class="support-link"
        >{{ t('support.tryAction') }}<Icon
          name="lucide:arrow-right"
          aria-hidden="true"
        /></NuxtLink>
      </section>
      <section class="support-card">
        <Icon
          class="support-icon"
          name="lucide:bug"
          aria-hidden="true"
        />
        <h2>{{ t('support.bugTitle') }}</h2>
        <p>{{ t('support.bugDescription') }}</p>
        <a
          href="https://github.com/focale-editor/community/issues/new?template=01-bug-report.yml"
          class="support-link"
          target="_blank"
          rel="noopener noreferrer"
        >{{ t('support.bugAction') }}<Icon
          name="lucide:arrow-up-right"
          aria-hidden="true"
        /></a>
      </section>
      <section class="support-card">
        <Icon
          class="support-icon"
          name="lucide:lightbulb"
          aria-hidden="true"
        />
        <h2>{{ t('support.ideaTitle') }}</h2>
        <p>{{ t('support.ideaDescription') }}</p>
        <a
          href="https://github.com/focale-editor/community/issues/new?template=03-improvement.yml"
          class="support-link"
          target="_blank"
          rel="noopener noreferrer"
        >{{ t('support.ideaAction') }}<Icon
          name="lucide:arrow-up-right"
          aria-hidden="true"
        /></a>
      </section>
      <section class="support-card">
        <Icon
          class="support-icon"
          name="lucide:send"
          aria-hidden="true"
        />
        <h2>{{ t('support.shareTitle') }}</h2>
        <p>{{ t('support.shareDescription') }}</p>
        <button
          type="button"
          class="support-link"
          @click="copyLink"
        >
          {{ t('support.shareAction') }}<Icon
            name="lucide:copy"
            aria-hidden="true"
          />
        </button>
        <p
          v-if="shareStatus !== 'idle'"
          role="status"
          class="support-feedback"
        >
          {{ t(shareStatus === 'copied' ? 'support.copied' : 'support.copyError') }}
        </p>
      </section>
    </div>

    <aside
      class="support-founders"
      aria-labelledby="founders-title"
    >
      <Icon
        name="lucide:gift"
        aria-hidden="true"
      />
      <div>
        <h2 id="founders-title">
          {{ t('support.foundersTitle') }}
        </h2>
        <p>{{ t('support.foundersDescription') }}</p>
      </div>
    </aside>
    <p class="support-thanks">
      {{ t('support.thanks') }}
    </p>
  </div>
</template>

<style scoped lang="scss">
.support-page {
  @include content-container;

  max-width: 66rem;
  padding-top: clamp(3rem, 8vw, 6rem);
  padding-bottom: 4rem;
}

.support-heading {
  max-width: 46rem;
  margin-bottom: 2.5rem;

  h1 {
    margin-block: 1rem 1.25rem;
    font-size: clamp(2.25rem, 5vw, 3.75rem);
    font-weight: 500;
    line-height: 1.08;
    letter-spacing: -0.04em;
    text-wrap: balance;
  }
}

.support-eyebrow {
  @include label-text;

  display: flex;
  align-items: center;
  gap: 0.625rem;
  color: var(--color-accent-bright);
}

.support-description { color: var(--color-text-muted); line-height: 1.75; }

.support-grid {
  display: grid;
  gap: 1rem;

  @include from($breakpoint-md) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

.support-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: clamp(1.25rem, 3vw, 2rem);
  background: var(--color-panel);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);

  h2 { margin-block: 1.25rem 0.75rem; font-size: 1.25rem; line-height: 1.35; }
  p { margin-bottom: 1.5rem; color: var(--color-text-muted); line-height: 1.7; }
}

.support-icon { color: var(--color-accent-bright); font-size: 1.5rem; }

.support-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.75rem;
  margin-top: auto;
  padding: 0;
  color: var(--color-text);
  font: inherit;
  font-weight: 600;
  text-align: start;
  background: none;
  border: 0;
  cursor: pointer;

  &:hover { color: var(--color-accent-bright); }
  &:focus-visible { outline: 2px solid var(--color-accent-bright); outline-offset: 4px; border-radius: 2px; }
  .iconify { flex-shrink: 0; }
}

.support-card .support-feedback { margin: 0.5rem 0 0; font-size: 0.875rem; }

.support-donation, .support-founders {
  display: flex;
  gap: 1.5rem;
  padding: 1.5rem;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);

  h2 { margin-bottom: 0.5rem; font-size: 1.125rem; }
  p { color: var(--color-text-muted); line-height: 1.7; }
}

.support-donation {
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  background: var(--color-panel);

  > div { flex: 1 1 24rem; }
}

.support-funding-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  width: 100%;

  > a { justify-content: center; }

  @include until($breakpoint-sm) {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
  }
}

.support-founders {
  margin-top: 1.5rem;

  > .iconify { flex-shrink: 0; margin-top: 0.15rem; color: var(--color-accent-bright); font-size: 1.5rem; }
}

.support-thanks { margin-top: 2rem; color: var(--color-text-subtle); text-align: center; }
</style>
