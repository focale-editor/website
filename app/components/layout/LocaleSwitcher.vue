<script setup lang="ts">
const { locale, locales, setLocale, t } = useI18n()

/** One entry of the language list. */
interface LocaleOption {
  /** Locale code, e.g. `fr`. */
  code: string
  /** Endonym shown in the list, e.g. `Français`. */
  name: string
}

const options = computed<LocaleOption[]>(() =>
  locales.value.map(entry => ({
    code: entry.code,
    name: entry.name ?? entry.code.toUpperCase(),
  })),
)

const selected = computed({
  get: () => locale.value,
  set: (value: string) => {
    void setLocale(value as typeof locale.value)
  },
})
</script>

<template>
  <div class="locale-switcher">
    <Icon
      name="lucide:languages"
      class="locale-switcher-icon"
      aria-hidden="true"
    />
    <Select
      v-model="selected"
      class="locale-switcher-select"
      :options="options"
      option-label="name"
      option-value="code"
      :aria-label="t('nav.language')"
    />
  </div>
</template>

<style scoped lang="scss">
.locale-switcher {
  position: relative;
  display: flex;
  align-items: center;
}

.locale-switcher-icon {
  position: absolute;
  left: 0.7rem;
  z-index: 1;
  color: var(--color-text-subtle);
  font-size: 1rem;
  pointer-events: none;
}

.locale-switcher-select {
  --p-select-background: transparent;
  --p-select-border-color: var(--color-line);
  --p-select-hover-border-color: var(--color-line-strong);
  --p-select-padding-y: 0.375rem;
  --p-select-padding-x: 0.75rem;

  min-width: 10.5rem;
  font-size: 0.875rem;

  // Room for the language icon sitting inside the control.
  :deep(.p-select-label) {
    padding-left: 1.85rem;
  }
}
</style>
