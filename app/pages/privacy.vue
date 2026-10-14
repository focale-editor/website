<script setup lang="ts">
const { t, tm, rt } = useI18n()
type Message = Parameters<typeof rt>[0]

/** One titled part of the policy, as stored in the locale files. */
interface PolicySection {
  title: Message
  paragraphs: Message[]
  items?: Message[]
  /** Paragraphs that follow the list. */
  notes?: Message[]
}

/** Address for data requests, kept out of the messages because `@` is message syntax. */
const email = 'contact@focale-editor.app'

const sections = computed(() => Object.entries(tm('privacy.sections') as Record<string, PolicySection>))

usePageSeo(() => ({ title: t('privacy.title'), description: t('privacy.description') }))
</script>

<template>
  <div class="privacy-page">
    <header class="privacy-heading">
      <p class="privacy-eyebrow">
        {{ t('privacy.eyebrow') }}
      </p>
      <h1>{{ t('privacy.title') }}</h1>
      <p class="privacy-description">
        {{ t('privacy.description') }}
      </p>
      <p class="privacy-updated">
        {{ t('privacy.updated') }}
      </p>
    </header>

    <section
      v-for="[id, section] in sections"
      :id="id"
      :key="id"
      class="privacy-section"
    >
      <h2>{{ rt(section.title) }}</h2>
      <p
        v-for="(paragraph, index) in section.paragraphs"
        :key="index"
      >
        {{ rt(paragraph, { email }) }}
      </p>
      <ul v-if="section.items">
        <li
          v-for="(item, index) in section.items"
          :key="index"
        >
          {{ rt(item) }}
        </li>
      </ul>
      <p
        v-for="(note, index) in section.notes"
        :key="`note-${index}`"
      >
        {{ rt(note, { email }) }}
      </p>
    </section>

    <a
      class="privacy-contact"
      :href="`mailto:${email}`"
    >
      <Icon
        name="lucide:mail"
        aria-hidden="true"
      />{{ t('privacy.contact') }}
    </a>
  </div>
</template>

<style scoped lang="scss">
.privacy-page {
  @include content-container;

  max-width: 48rem;
  padding-block: clamp(3rem, 8vw, 6rem) 5rem;
  line-height: 1.75;
}

.privacy-heading {
  padding-bottom: 2rem;
  margin-bottom: 2.5rem;
  border-bottom: 1px solid var(--color-line);

  h1 {
    margin-block: 1rem 1.25rem;
    font-size: clamp(2.25rem, 5vw, 3.75rem);
    font-weight: 500;
    line-height: 1.08;
    letter-spacing: -0.04em;
    text-wrap: balance;
  }
}

.privacy-eyebrow {
  @include label-text;

  color: var(--color-accent-bright);
}

.privacy-description {
  color: var(--color-text-muted);
  font-size: 1.125rem;
}

.privacy-updated {
  margin-top: 1rem;
  color: var(--color-text-subtle);
  font-size: 0.875rem;
}

.privacy-section {
  scroll-margin-top: calc(var(--header-height) + 1.5rem);

  & + & { margin-top: 2.5rem; }

  h2 {
    margin-bottom: 0.75rem;
    font-size: 1.35rem;
    line-height: 1.35;
  }

  p,
  li { color: var(--color-text-muted); }

  p + p,
  ul + p { margin-top: 1rem; }

  ul {
    display: grid;
    gap: 0.5rem;
    padding-left: 1.25rem;
    margin-top: 0.75rem;
    list-style: disc;
  }
}

.privacy-contact {
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
  min-height: 2.75rem;
  margin-top: 2.5rem;
  color: var(--color-accent-bright);
  font-weight: 500;

  &:hover {
    text-decoration: underline;
    text-underline-offset: 0.25em;
  }
  &:focus-visible { @include focus-ring; }
}
</style>
