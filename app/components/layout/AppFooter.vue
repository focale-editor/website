<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const { footerSections } = useSiteNavigation()

const year = new Date().getFullYear()
</script>

<template>
  <footer class="footer">
    <div class="footer-inner">
      <div class="footer-identity">
        <NuxtLink
          :to="localePath('index')"
          class="footer-brand"
          :aria-label="t('nav.home')"
        >
          <FocaleWordmark :size="32" />
        </NuxtLink>
        <p class="footer-tagline">
          {{ t('footer.tagline') }}
        </p>
      </div>

      <nav
        class="footer-columns"
        :aria-label="t('nav.secondary')"
      >
        <div
          v-for="section in footerSections"
          :key="section.titleKey"
          class="footer-column"
        >
          <h2 class="footer-heading">
            {{ t(section.titleKey) }}
          </h2>
          <ul
            class="footer-links"
            role="list"
          >
            <li
              v-for="link in section.links"
              :key="link.to"
            >
              <a
                class="footer-link"
                :class="{ 'footer-link-mono': link.raw }"
                :href="link.to"
                :target="link.external ? '_blank' : undefined"
                :rel="link.external ? 'noopener noreferrer' : undefined"
              >
                <Icon
                  v-if="link.external"
                  name="lucide:arrow-up-right"
                  class="footer-link-icon"
                />
                {{ link.raw ? link.label : t(link.label) }}
              </a>
            </li>
          </ul>
        </div>
      </nav>
    </div>

    <!-- Laid out like the editor's status bar: hairline above, metadata below. -->
    <div class="footer-baseline">
      <p>{{ t('footer.copyright', { year }) }}</p>
      <p class="footer-origin">
        <Icon name="lucide:map-pin" />
        {{ t('footer.madeIn') }}
      </p>
    </div>
  </footer>
</template>

<style scoped lang="scss">
.footer {
  @include content-container;

  padding-top: 3.5rem;
  padding-bottom: 2rem;
  border-top: 1px solid var(--color-line);
}

.footer-inner {
  display: grid;
  gap: 2.5rem;

  @include from($breakpoint-md) {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.6fr);
  }
}

.footer-brand {
  display: inline-block;
}

.footer-tagline {
  max-width: 32ch;
  margin-top: 0.875rem;
  color: var(--color-text-subtle);
  font-size: 0.9375rem;
}

.footer-columns {
  display: grid;
  gap: 2rem;

  @include from($breakpoint-sm) {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.5fr);
  }
}

.footer-heading {
  @include label-text;

  margin-bottom: 0.875rem;
  color: var(--color-text-subtle);
}

.footer-links {
  display: grid;
  gap: 0.5rem;
  margin: 0;
}

.footer-link {
  display: inline-flex;
  gap: 0.3rem;
  align-items: baseline;
  color: var(--color-text-muted);
  font-size: 0.9375rem;
  transition: color 0.18s ease;

  &:hover,
  &:focus-visible {
    color: var(--color-accent-bright);
  }
}

.footer-link-mono {
  font-size: 0.8125rem;
  font-family: var(--font-mono);
  overflow-wrap: anywhere;
}

.footer-link-icon {
  flex: none;
  align-self: center;
  font-size: 0.875rem;
  opacity: 0.6;
}

.footer-baseline {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.5rem;
  justify-content: space-between;
  margin-top: 3rem;
  padding-top: 1.25rem;
  color: var(--color-text-subtle);
  font-size: 0.75rem;
  font-family: var(--font-mono);
  border-top: 1px solid var(--color-line);
}

.footer-origin {
  display: inline-flex;
  gap: 0.35rem;
  align-items: center;
}
</style>
