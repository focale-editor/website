<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <PageSection id="newsletter">
    <div class="cta">
      <div class="cta-content">
        <span class="cta-lens">
          <ApertureRings class="cta-rings" />
          <FocaleLogo
            :size="72"
            :plate="false"
          />
        </span>
        <h2 class="cta-title">
          {{ t('newsletter.title') }}
        </h2>
        <p class="cta-description">
          {{ t('newsletter.description') }}
        </p>
        <NewsletterForm class="cta-form" />
      </div>
    </div>
  </PageSection>
</template>

<style scoped lang="scss">
.cta {
  position: relative;
  display: grid;
  place-items: center;
  padding: clamp(2.5rem, 5vw, 3.75rem) clamp(1.25rem, 4vw, 3rem);
  overflow: hidden;
  background: var(--color-panel);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  isolation: isolate;
}

// The same lens barrel as the hero. It is centred on the mark's own box, which
// keeps the two concentric without any hand-tuned offset, and taken out of the
// flow so its size never pushes the panel taller.
.cta-lens {
  position: relative;
  display: inline-grid;
  place-items: center;
}

.cta-rings {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: -1;

  // The global reset caps every svg at its container's width, which here is the
  // mark's 72 pixels; the barrel is meant to overflow it.
  width: min(21rem, 62vw);
  max-width: none;
  height: auto;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  opacity: 0.7;
}

.cta-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.cta-title {
  @include fluid-text(1.625rem, 2.25rem, 3.6vw);

  margin-top: 1.25rem;
}

.cta-description {
  max-width: 46ch;
  margin-top: 0.75rem;
  color: var(--color-text-muted);
  font-size: 1.0625rem;
}

.cta-form {
  margin-top: 1.75rem;
}

:deep(.newsletter-privacy) {
  text-align: center;
}
</style>
