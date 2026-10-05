<script setup lang="ts">
import catalogue from '../../../public/legal/components.json'

const { t } = useI18n()
const localePath = useLocalePath()
usePageSeo(() => ({ title: t('docs.licenses.title'), description: t('docs.licenses.description') }))
</script>

<template>
  <DocumentationLayout
    :title="t('docs.licenses.title')"
    :description="t('docs.licenses.description')"
  >
    <section>
      <h2>{{ t('docs.licenses.rightsTitle') }}</h2>
      <p>{{ t('docs.licenses.rights') }}</p>
      <p><NuxtLink :to="localePath('/docs/sources')">{{ t('docs.sources.title') }}</NuxtLink></p>
    </section>
    <section>
      <h2>{{ t('docs.licenses.offlineTitle') }}</h2>
      <p>{{ t('docs.licenses.offline') }}</p>
    </section>
    <section>
      <h2>{{ t('docs.licenses.dataTitle') }}</h2>
      <p>{{ t('docs.licenses.data') }}</p>
      <p><a href="https://creativecommons.org/licenses/by-sa/3.0/">Creative Commons BY-SA 3.0</a></p>
    </section>
    <section>
      <h2>{{ t('docs.licenses.catalogueTitle') }}</h2>
      <p>{{ t('docs.licenses.catalogueDescription') }}</p>
      <ul class="license-catalogue">
        <li
          v-for="component in catalogue.components"
          :key="component.name"
        >
          <div>
            <a :href="`/legal/${component.notice}`">{{ component.name }}</a>
            <span class="license-version">{{ component.version }}</span>
          </div>
          <span class="license-type">{{ component.license }}</span>
        </li>
      </ul>
    </section>
  </DocumentationLayout>
</template>

<style scoped lang="scss">
.license-catalogue {
  padding: 0;
  margin-top: 1.5rem;
  list-style: none;

  li {
    padding-block: 0.85rem;
    border-bottom: 1px solid var(--color-line);
  }
}

.license-version,
.license-type {
  display: block;
  color: var(--color-text-subtle);
  font-size: 0.8125rem;
  overflow-wrap: anywhere;
}
</style>
