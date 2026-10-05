<script setup lang="ts">
defineProps<{ title: string, description: string }>()
</script>

<template>
  <div class="documentation">
    <aside class="documentation-sidebar">
      <DocumentationNavigation class="documentation-desktop" />
      <DocumentationMobileNavigation class="documentation-mobile" />
    </aside>
    <article class="documentation-article">
      <header class="documentation-heading">
        <h1>{{ title }}</h1>
        <p>{{ description }}</p>
      </header>
      <div class="documentation-content">
        <slot />
      </div>
    </article>
  </div>
</template>

<style scoped lang="scss">
.documentation {
  display: grid;
  gap: 2.5rem;
  width: 100%;
  padding-inline: clamp(1.25rem, 4vw, 2.5rem);
  padding-top: clamp(2rem, 5vw, 4rem);
  padding-bottom: 5rem;

  @include from($breakpoint-lg) {
    grid-template-columns: 16rem minmax(0, 1fr);
    column-gap: clamp(2rem, 5vw, 5rem);
  }
}

.documentation-sidebar {
  align-self: start;

  @include from($breakpoint-lg) {
    position: sticky;
    top: calc(var(--header-height) + 2rem);
    max-height: calc(100dvh - var(--header-height) - 4rem);
    padding-block: 0.125rem 1rem;
    overflow-y: auto;
    scrollbar-width: thin;
  }
}

.documentation-desktop {
  display: none;

  @include from($breakpoint-lg) {
    display: block;
  }
}

.documentation-mobile {
  @include from($breakpoint-lg) {
    display: none;
  }
}

.documentation-article {
  justify-self: center;
  width: 100%;
  min-width: 0;
  max-width: 48rem;
}

.documentation-heading {
  padding-bottom: 2rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--color-line);

  h1 {
    margin-bottom: 1rem;
    font-weight: 600;
    font-size: clamp(2rem, 4vw, 3rem);
    line-height: 1.15;
    letter-spacing: -0.035em;
  }

  p {
    max-width: 65ch;
    color: var(--color-text-muted);
    font-size: 1.125rem;
    line-height: 1.7;
  }
}

.documentation-content {
  font-size: 1rem;
  line-height: 1.75;

  :deep(section + section) {
    margin-top: 2.5rem;
  }

  :deep(h2) {
    margin-bottom: 0.75rem;
    font-size: 1.35rem;
    line-height: 1.35;
    overflow-wrap: anywhere;
  }

  :deep(p + p) {
    margin-top: 1rem;
  }

  :deep(a) {
    color: var(--color-accent-bright);
    text-decoration: underline;
    text-underline-offset: 0.2em;
    overflow-wrap: anywhere;
  }

  :deep(pre) {
    overflow-x: auto;
    padding: 1.25rem;
    margin-top: 1rem;
    font-size: 0.8125rem;
    line-height: 1.6;
    background: rgb(0, 0, 0, 25%);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-md);
  }

  :deep(code) {
    font-family: var(--font-mono);
  }
}
</style>
