<script setup lang="ts">
const { id, eyebrow, title, description, narrow = false, muted = false } = defineProps<{
  /** Anchor identifier, so the navigation can link straight to the section. */
  id?: string
  /** Small label shown above the heading. */
  eyebrow?: string
  /** Section heading. */
  title?: string
  /** Introductory paragraph under the heading. */
  description?: string
  /** Whether the content column is the narrow reading width. */
  narrow?: boolean
  /** Whether the section sits on a slightly raised background band. */
  muted?: boolean
}>()

const headingId = computed(() => (id ? `${id}-title` : undefined))
</script>

<template>
  <section
    :id="id"
    class="section"
    :class="{ 'section-muted': muted }"
    :aria-labelledby="title ? headingId : undefined"
  >
    <div
      class="section-inner"
      :class="{ 'section-inner-narrow': narrow }"
    >
      <header
        v-if="title"
        class="section-header"
      >
        <p
          v-if="eyebrow"
          class="section-eyebrow"
        >
          <span class="section-eyebrow-tick" />
          {{ eyebrow }}
        </p>
        <h2
          :id="headingId"
          class="section-title"
        >
          {{ title }}
        </h2>
        <p
          v-if="description"
          class="section-description"
        >
          {{ description }}
        </p>
      </header>

      <slot />
    </div>
  </section>
</template>

<style scoped lang="scss">
.section {
  padding-block: var(--section-gap);
}

.section-muted {
  background: var(--color-canvas-raised);
  border-block: 1px solid var(--color-line);
}

.section-inner {
  @include content-container;
}

.section-inner-narrow {
  max-width: $content-width-narrow;
}

.section-header {
  max-width: 44rem;
  margin-bottom: clamp(2.25rem, 4vw, 3rem);
}

// The eyebrow reads as a panel title in the editor: a monospace label preceded
// by a short accent rule.
.section-eyebrow {
  @include label-text;

  display: flex;
  gap: 0.75rem;
  align-items: center;
  color: var(--color-accent);
}

.section-eyebrow-tick {
  width: 1.75rem;
  height: 1px;
  background: var(--color-accent);
}

.section-title {
  @include fluid-text(1.75rem, 2.5rem, 4vw);

  margin-top: 1rem;
}

.section-description {
  max-width: 56ch;
  margin-top: 0.875rem;
  color: var(--color-text-muted);
  font-size: 1.0625rem;
}
</style>
