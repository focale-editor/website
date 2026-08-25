<script setup lang="ts">
const { size = 32, animated = true } = defineProps<{
  /** Side length of the mark next to the name, in pixels. */
  size?: number
  /** Whether the mark's ring rotates. */
  animated?: boolean
}>()
</script>

<template>
  <span class="wordmark">
    <FocaleLogo
      :size="size"
      :animated="animated"
      :plate="false"
    />
    <span class="wordmark-name">Focale</span>
  </span>
</template>

<style scoped lang="scss">
.wordmark {
  display: inline-flex;
  gap: 0.625rem;
  align-items: center;
}

.wordmark-name {
  font-weight: 600;
  font-size: 1.125rem;
  font-family: var(--font-display);
  letter-spacing: -0.02em;
}
</style>
