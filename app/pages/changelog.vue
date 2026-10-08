<script setup lang="ts">
import catalogue from '../../public/changelog.json'
import { readChangelog } from '~/utils/changelog'

const { t } = useI18n()
const localePath = useLocalePath()
const releases = readChangelog(catalogue)

usePageSeo(() => ({ title: t('changelog.title'), description: t('changelog.description') }))
</script>

<template>
  <div class="changelog-page">
    <header class="changelog-heading">
      <p class="changelog-eyebrow">
        {{ t('changelog.eyebrow') }}
      </p>
      <h1>{{ t('changelog.title') }}</h1>
      <p class="changelog-description">
        {{ t('changelog.description') }}
      </p>
    </header>

    <template v-if="releases.length">
      <p class="changelog-language">
        {{ t('changelog.originalLanguage') }}
      </p>
      <ChangelogHistory :releases="releases" />
    </template>
    <section
      v-else
      class="changelog-waiting"
      aria-labelledby="changelog-empty-title"
    >
      <Icon
        name="lucide:history"
        aria-hidden="true"
      />
      <h2 id="changelog-empty-title">
        {{ t('changelog.emptyTitle') }}
      </h2>
      <p>{{ t('changelog.emptyDescription') }}</p>
      <NuxtLink :to="localePath('index') + '#downloads'">
        {{ t('downloads.title') }}
        <Icon
          name="lucide:arrow-right"
          aria-hidden="true"
        />
      </NuxtLink>
    </section>
  </div>
</template>

<style scoped lang="scss">
.changelog-page {
  @include content-container;

  max-width: 66rem;
  padding-block: clamp(3rem, 8vw, 6rem) 5rem;
}

.changelog-heading {
  max-width: 46rem;
  margin-block-end: 2.5rem;

  h1 {
    margin-block: 1rem 1.25rem;
    font-size: clamp(2.25rem, 5vw, 3.75rem);
    font-weight: 500;
    line-height: 1.08;
    letter-spacing: -0.04em;
    text-wrap: balance;
  }
}

.changelog-eyebrow {
  @include label-text;

  color: var(--color-accent-bright);
}

.changelog-description {
  color: var(--color-text-muted);
  line-height: 1.75;
}

.changelog-language {
  margin-block-end: 1.5rem;
  color: var(--color-text-subtle);
  font-size: 0.875rem;
}

.changelog-waiting {
  padding: clamp(1.5rem, 5vw, 3rem);
  background: var(--color-panel);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);

  > .iconify {
    color: var(--color-accent-bright);
    font-size: 1.75rem;
  }

  h2 {
    margin-block: 1.25rem 0.75rem;
    font-size: 1.375rem;
    line-height: 1.4;
  }

  p {
    max-width: 60ch;
    color: var(--color-text-muted);
    line-height: 1.75;
  }

  a {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 2.75rem;
    margin-block-start: 1.5rem;
    color: var(--color-accent-bright);
    font-weight: 500;

    &:hover {
      text-decoration: underline;
      text-underline-offset: 0.25em;
    }
    &:focus-visible { @include focus-ring; }
  }
}
</style>
