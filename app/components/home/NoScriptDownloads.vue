<script setup lang="ts">
const { t } = useI18n()

// With JavaScript enabled, the HTML parser treats noscript's contents as text.
// Supply opaque HTML so Vue never tries to hydrate a tree inside this element.
const markup = computed(() => {
  const entities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }
  const label = t('downloads.title').replace(/[&<>"']/g, character => entities[character]!)
  return `<div class="download-fallback"><a href="https://github.com/focale-editor/get-focale/releases">${label}</a></div>`
})
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -- Fixed markup; the translated label is escaped above. -->
  <noscript v-html="markup" />
</template>

<style scoped lang="scss">
:deep(.download-fallback) {
  @include content-container;

  padding-block: var(--section-gap);
}
</style>
