<script setup lang="ts">
const { t } = useI18n()
const { groups } = useDocumentation()
const emit = defineEmits<{ navigate: [] }>()

function onNavigate(event: MouseEvent): void {
  if (event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
    emit('navigate')
  }
}
</script>

<template>
  <nav :aria-label="t('docs.navigation')">
    <div
      v-for="group in groups"
      :key="group.id"
      class="documentation-group"
    >
      <p
        v-if="group.id !== 'overview'"
        class="documentation-group-title"
      >
        {{ group.title }}
      </p>
      <NuxtLink
        v-for="page in group.pages"
        :key="page.to"
        :to="page.to"
        class="documentation-link"
        exact-active-class="documentation-link-active"
        @click="onNavigate"
      >
        <Icon
          :name="page.icon"
          aria-hidden="true"
        />
        {{ page.title }}
      </NuxtLink>
    </div>
  </nav>
</template>

<style scoped lang="scss">
.documentation-group + .documentation-group {
  margin-top: 1.25rem;
}

.documentation-group-title {
  @include label-text;

  margin-bottom: 0.4rem;
  padding-inline: 0.65rem;
  color: var(--color-text-subtle);
}

.documentation-link {
  display: flex;
  gap: 0.6rem;
  align-items: center;
  min-height: 2.75rem;
  padding: 0.65rem;
  color: var(--color-text-muted);
  border-radius: var(--radius-sm);

  .iconify {
    flex: none;
  }

  &:hover,
  &:focus-visible {
    color: var(--color-text);
    background: var(--color-panel-hover);
  }

  &-active {
    color: var(--color-accent-bright);
    font-weight: 600;
    background: var(--color-accent-soft);
  }
}
</style>
