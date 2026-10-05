<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()
const visible = ref(false)
const trigger = ref<{ $el: HTMLButtonElement } | null>(null)
const drawerId = useId()
let desktopQuery: MediaQueryList | undefined
let background: HTMLElement | null = null
let backgroundWasInert = false
let restoreTriggerFocus = true

function open(): void {
  restoreTriggerFocus = true
  visible.value = true
}

function closeForNavigation(): void {
  restoreTriggerFocus = false
  visible.value = false
}

function makeBackgroundInert(): void {
  if (background) return
  // Drawer teleports to the body, outside Nuxt's application root.
  background = document.getElementById('__nuxt')
  if (background) {
    backgroundWasInert = background.hasAttribute('inert')
    background.setAttribute('inert', '')
  }
}

function restoreBackground(): void {
  if (background && !backgroundWasInert) background.removeAttribute('inert')
  background = null
}

function onAfterHide(): void {
  restoreBackground()
  if (restoreTriggerFocus && !desktopQuery?.matches) {
    trigger.value?.$el.focus({ preventScroll: true })
  }
}

function onBreakpointChange(): void {
  if (desktopQuery?.matches) closeForNavigation()
}

watch(() => route.fullPath, closeForNavigation)

onMounted(() => {
  desktopQuery = window.matchMedia('(min-width: 64rem)')
  desktopQuery.addEventListener('change', onBreakpointChange)
})

onBeforeUnmount(() => {
  desktopQuery?.removeEventListener('change', onBreakpointChange)
  restoreBackground()
})
</script>

<template>
  <div class="documentation-mobile-navigation">
    <Button
      ref="trigger"
      type="button"
      class="documentation-menu-trigger"
      :label="t('docs.browse')"
      severity="secondary"
      variant="outlined"
      aria-haspopup="dialog"
      :aria-expanded="visible"
      :aria-controls="drawerId"
      @click="open"
    >
      <template #icon>
        <Icon
          name="lucide:panel-left"
          aria-hidden="true"
        />
      </template>
    </Button>
    <Drawer
      :id="drawerId"
      v-model:visible="visible"
      class="documentation-drawer"
      position="left"
      :header="t('docs.browse')"
      :aria-label="t('docs.browse')"
      :close-button-props="{ 'severity': 'secondary', 'text': true, 'rounded': true, 'aria-label': t('nav.closeMenu') }"
      block-scroll
      @show="makeBackgroundInert"
      @after-hide="onAfterHide"
    >
      <DocumentationNavigation @navigate="closeForNavigation" />
    </Drawer>
  </div>
</template>

<style scoped lang="scss">
.documentation-menu-trigger {
  justify-content: flex-start;
  width: 100%;
  min-height: 3rem;
  padding: 0.85rem 1rem;
  border-radius: var(--radius-lg);

  :deep(.p-button-label) {
    text-align: left;
  }
}

// The panel is teleported outside this component's DOM tree.
:global(.documentation-drawer) {
  width: min(22rem, calc(100vw - 2rem));
  max-width: 100%;
  color: var(--color-text);
  background: var(--color-canvas-raised);
}

:global(.documentation-drawer .p-drawer-header) {
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid var(--color-line);
}

:global(.documentation-drawer .p-drawer-title) {
  font-size: 1rem;
  line-height: 1.4;
}

:global(.documentation-drawer .p-drawer-close-button) {
  flex: none;
  width: 2.75rem;
  height: 2.75rem;
}

:global(.documentation-drawer .p-drawer-content) {
  padding: 1rem 1rem max(1rem, env(safe-area-inset-bottom));
  overscroll-behavior: contain;
  scrollbar-width: thin;
}
</style>
