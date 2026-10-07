<script setup lang="ts">
import { type ChangelogRelease, formatReleaseDate } from '~/utils/changelog'

defineProps<{ releases: ChangelogRelease[] }>()
const { t, locale } = useI18n()
</script>

<template>
  <div class="changelog-history">
    <article
      v-for="release in releases"
      :id="`v${release.version}`"
      :key="release.version"
      class="changelog-release"
      :aria-labelledby="`version-${release.version}`"
    >
      <header class="release-heading">
        <h2 :id="`version-${release.version}`">
          <a :href="`#v${release.version}`">{{ release.version }}</a>
        </h2>
        <time :datetime="release.date">{{ formatReleaseDate(release.date, locale) }}</time>
      </header>
      <ul
        v-if="release.changes.length"
        class="release-changes"
      >
        <li
          v-for="(change, index) in release.changes"
          :key="index"
        >
          <strong>{{ change.kind }}</strong>
          <span>{{ change.description }}</span>
        </li>
      </ul>
      <p
        v-else
        class="release-empty"
      >
        {{ t('changelog.noChanges') }}
      </p>
    </article>
  </div>
</template>

<style scoped lang="scss">
.changelog-history {
  display: grid;
  gap: 2.5rem;
}

.changelog-release {
  display: grid;
  gap: 1.25rem 3rem;
  padding-block-start: 2rem;
  border-top: 1px solid var(--color-line);
  scroll-margin-top: 7rem;

  @include from($breakpoint-md) {
    grid-template-columns: minmax(9rem, 1fr) minmax(0, 3fr);
  }
}

.release-heading {
  h2 {
    margin-block-end: 0.5rem;
    font-size: 1.5rem;
    font-family: var(--font-mono);
    letter-spacing: -0.04em;
    overflow-wrap: anywhere;
  }

  a {
    text-underline-offset: 0.25em;

    &:hover {
      color: var(--color-accent-bright);
      text-decoration: underline;
    }
    &:focus-visible { @include focus-ring; }
  }

  time {
    color: var(--color-text-subtle);
    font-size: 0.875rem;
  }
}

.release-changes {
  display: grid;
  gap: 1.25rem;
  margin: 0;
  padding-inline-start: 1.25rem;
  color: var(--color-text-muted);
  line-height: 1.75;
  overflow-wrap: anywhere;

  strong {
    display: block;
    color: var(--color-text);
    font-size: 0.75rem;
    font-family: var(--font-mono);
  }
}

.release-empty {
  color: var(--color-text-muted);
}
</style>
