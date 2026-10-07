<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <PageSection
    id="support"
    muted
    :eyebrow="t('support.eyebrow')"
    :title="t('support.home.title')"
    :description="t('support.home.description')"
  >
    <Button
      as="a"
      :href="localePath('/support')"
      :label="t('support.home.action')"
      icon-pos="right"
      class="support-action"
    >
      <template #icon>
        <Icon
          name="lucide:arrow-right"
          aria-hidden="true"
        />
      </template>
    </Button>
  </PageSection>
</template>

<style scoped lang="scss">
.support-action {
  max-width: 100%;
  white-space: normal;
}
</style>
