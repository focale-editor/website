<script setup lang="ts">
const { t } = useI18n()
const { groups } = useDocumentation()
usePageSeo(() => ({ title: t('docs.title'), description: t('docs.description') }))
</script>

<template>
  <DocumentationLayout
    :title="t('docs.title')"
    :description="t('docs.description')"
  >
    <p class="docs-intro">
      {{ t('docs.startHere') }}
    </p>
    <section
      v-for="group in groups.filter(group => group.id !== 'overview')"
      :key="group.id"
    >
      <h2>{{ group.title }}</h2>
      <div class="docs-cards">
        <NuxtLink
          v-for="page in group.pages"
          :key="page.to"
          :to="page.to"
          class="docs-card"
        >
          <Icon
            :name="page.icon"
            aria-hidden="true"
          />
          <h3>{{ page.title }}</h3>
          <p>{{ page.description }}</p>
        </NuxtLink>
      </div>
    </section>
  </DocumentationLayout>
</template>

<style scoped lang="scss">
.docs-intro {
  margin-bottom: 2.5rem;
  color: var(--color-text-muted);
}

.docs-cards {
  display: grid;
  gap: 0.875rem;

  @include from($breakpoint-md) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.docs-card {
  display: block;
  padding: 1.25rem;
  color: var(--color-text) !important;
  text-decoration: none !important;
  background: var(--color-panel);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);

  &:hover {
    border-color: var(--color-accent-line);
    background: var(--color-panel-hover);
  }

  .iconify {
    margin-bottom: 1rem;
    color: var(--color-accent-bright);
    font-size: 1.375rem;
  }

  h3 {
    margin-bottom: 0.5rem;
    font-size: 1rem;
    line-height: 1.4;
  }

  p {
    color: var(--color-text-muted);
    font-size: 0.875rem;
    line-height: 1.65;
  }
}
</style>
