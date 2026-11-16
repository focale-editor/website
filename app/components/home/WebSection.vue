<script setup lang="ts">
import WebBrowserPreview from './WebBrowserPreview.vue'

const { t } = useI18n()
</script>

<template>
  <PageSection
    id="web"
    aside-start
    :eyebrow="t('webEdition.name')"
    :title="t('webEdition.title')"
    :description="t('webEdition.description')"
  >
    <Button
      as="a"
      :href="FOCALE_WEB_URL"
      :label="t('webEdition.action')"
      class="web-edition-action"
      icon-pos="right"
    >
      <template #icon>
        <Icon
          name="lucide:arrow-up-right"
          aria-hidden="true"
        />
      </template>
    </Button>

    <p class="web-edition-note">
      {{ t('webEdition.saveHint') }}
    </p>

    <template #aside>
      <WebBrowserPreview />
    </template>
  </PageSection>
</template>

<style scoped lang="scss">
.web-edition-action {
  max-width: 100%;
  white-space: normal;
}

.web-edition-note {
  max-width: 60ch;
  margin-top: 1rem;
  color: var(--color-text-subtle);
  font-size: 0.875rem;
}
</style>
