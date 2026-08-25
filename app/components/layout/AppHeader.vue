<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const { headerLinks } = useSiteNavigation()

const isMenuOpen = ref(false)
const route = useRoute()

watch(() => route.fullPath, () => {
  isMenuOpen.value = false
})

/** Closes the mobile menu once a link inside it has been followed. */
function closeMenu(): void {
  isMenuOpen.value = false
}
</script>

<template>
  <header class="header">
    <div class="header-inner">
      <NuxtLink
        :to="localePath('index')"
        class="header-brand"
        :aria-label="t('nav.home')"
      >
        <FocaleWordmark :size="30" />
      </NuxtLink>

      <nav
        id="header-nav"
        class="header-nav"
        :class="{ 'header-nav-open': isMenuOpen }"
        :aria-label="t('nav.primary')"
      >
        <ul
          class="header-links"
          role="list"
        >
          <li
            v-for="link in headerLinks"
            :key="link.to"
          >
            <a
              class="header-link"
              :href="link.to"
              @click="closeMenu"
            >{{ t(link.label) }}</a>
          </li>
        </ul>

        <div class="header-actions">
          <LocaleSwitcher />
          <Button
            as="a"
            href="#newsletter"
            :label="t('nav.notifyMe')"
            size="small"
            class="header-cta"
            @click="closeMenu"
          />
        </div>
      </nav>

      <button
        type="button"
        class="header-toggle"
        :aria-expanded="isMenuOpen"
        aria-controls="header-nav"
        :aria-label="isMenuOpen ? t('nav.closeMenu') : t('nav.openMenu')"
        @click="isMenuOpen = !isMenuOpen"
      >
        <Icon :name="isMenuOpen ? 'lucide:x' : 'lucide:menu'" />
      </button>
    </div>
  </header>
</template>

<style scoped lang="scss">
.header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgb(11, 12, 16, 82%);
  border-bottom: 1px solid var(--color-line);
  backdrop-filter: blur(18px) saturate(140%);
}

.header-inner {
  @include content-container;

  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  min-height: var(--header-height);
}

.header-brand {
  border-radius: var(--radius-md);

  &:focus-visible {
    @include focus-ring(4px);
  }
}

.header-nav {
  display: flex;
  flex: 1;
  gap: 2rem;
  align-items: center;
  justify-content: flex-end;
}

.header-links {
  display: flex;
  gap: 1.75rem;
  align-items: center;
  margin: 0;
}

.header-link {
  position: relative;
  color: var(--color-text-muted);
  font-weight: 500;
  font-size: 0.9375rem;
  transition: color 0.18s ease;
  white-space: nowrap;

  &::after {
    position: absolute;
    bottom: -0.35rem;
    left: 0;
    width: 100%;
    height: 1px;
    background: var(--color-accent);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.22s ease;
    content: '';
  }

  &:hover,
  &:focus-visible {
    color: var(--color-text);

    &::after {
      transform: scaleX(1);
    }
  }
}

.header-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.header-toggle {
  display: none;
  padding: 0.5rem;
  color: var(--color-text);
  font-size: 1.25rem;
  background: transparent;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: border-color 0.18s ease;

  &:hover {
    border-color: var(--color-line-strong);
  }
}

@include until($breakpoint-lg) {
  .header-nav {
    position: absolute;
    top: 100%;
    right: 0;
    left: 0;
    flex-direction: column;
    gap: 1.25rem;
    align-items: stretch;
    padding: 1.5rem clamp(1.25rem, 5vw, 2.5rem) 2rem;
    background: var(--color-canvas-raised);
    border-bottom: 1px solid var(--color-line);

    &:not(.header-nav-open) {
      display: none;
    }
  }

  .header-links {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .header-link {
    font-size: 1.0625rem;
  }

  .header-actions {
    flex-direction: column;
    align-items: stretch;

    // Stretch the language control to match the full-width call to action.
    :deep(.locale-switcher),
    :deep(.locale-switcher-select) {
      width: 100%;
    }
  }

  .header-toggle {
    display: block;
  }
}
</style>
