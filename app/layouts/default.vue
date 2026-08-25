<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <div class="layout">
    <a
      class="skip-link"
      href="#main"
    >{{ t('common.skipToContent') }}</a>

    <AppHeader />

    <main
      id="main"
      class="layout-main"
    >
      <slot />
    </main>

    <AppFooter />
  </div>
</template>

<style scoped lang="scss">
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100dvh;
  overflow-x: clip;
}

.layout-main {
  flex: 1;
}
</style>
