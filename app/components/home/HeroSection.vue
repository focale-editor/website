<script setup lang="ts">
const { t } = useI18n()
const principles = usePrinciples()

// Product names, so they stay identical in every locale.
const platforms = [
  { name: 'Linux', icon: 'simple-icons:linux' },
  { name: 'Windows', icon: 'simple-icons:windows' },
  { name: 'macOS', icon: 'simple-icons:apple' },
]
</script>

<template>
  <section class="hero">
    <div class="hero-lens">
      <ApertureRings class="hero-rings" />
      <FocaleLogo
        :size="132"
        :plate="false"
        class="hero-mark"
      />
    </div>

    <div class="hero-inner">
      <p class="hero-status">
        <span class="hero-status-dot" />
        {{ t('hero.badge') }}
      </p>

      <h1 class="hero-title">
        {{ t('hero.title') }}
        <em class="hero-title-accent">{{ t('hero.titleAccent') }}</em>
      </h1>

      <p class="hero-subtitle">
        {{ t('hero.subtitle') }}
      </p>

      <div class="hero-actions">
        <NewsletterForm compact />
      </div>

      <ul
        class="hero-platforms"
        role="list"
        :aria-label="t('hero.platformsLabel')"
      >
        <li
          v-for="platform in platforms"
          :key="platform.name"
          class="hero-platform"
        >
          <Icon
            :name="platform.icon"
            class="hero-platform-icon"
          />
          {{ platform.name }}
        </li>
      </ul>
    </div>

    <ul
      class="hero-principles"
      role="list"
    >
      <li
        v-for="(principle, index) in principles"
        :key="principle.id"
        class="hero-principle"
      >
        <span class="hero-principle-index">{{ String(index + 1).padStart(2, '0') }}</span>
        <Icon
          :name="principle.icon"
          class="hero-principle-icon"
        />
        <h2 class="hero-principle-title">
          {{ t(`principles.${principle.id}.title`) }}
        </h2>
        <p class="hero-principle-text">
          {{ t(`principles.${principle.id}.description`) }}
        </p>
      </li>
    </ul>
  </section>
</template>

<style scoped lang="scss">
.hero {
  position: relative;
  padding-top: clamp(3rem, 6vw, 4.5rem);
  padding-bottom: clamp(2.5rem, 5vw, 4rem);
  overflow: clip;
  isolation: isolate;
}

// The lens: the mark sits at the centre of its own focus barrel, which bleeds
// past the fold instead of being framed like an illustration.
.hero-lens {
  position: relative;
  display: grid;
  place-items: center;
  width: min(40rem, 120vw);
  left: 50%;
  aspect-ratio: 1;
  margin-block: clamp(-11rem, -19vw, -5rem);
  transform: translateX(-50%);
  pointer-events: none;
}

.hero-rings {
  grid-area: 1 / 1;
  width: 100%;
  height: 100%;
}

.hero-mark {
  grid-area: 1 / 1;
}

.hero-inner {
  @include content-container(52rem);

  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.hero-status {
  @include label-text;

  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
  color: var(--color-text-muted);
}

.hero-status-dot {
  width: 0.375rem;
  height: 0.375rem;
  background: var(--color-accent-bright);
  border-radius: 50%;
}

.hero-title {
  @include fluid-text(2.125rem, 3.5rem, 5.6vw);

  margin-top: 1.125rem;
}

.hero-title-accent {
  display: block;
  color: var(--color-accent-bright);
  font-style: normal;
}

.hero-subtitle {
  max-width: 48ch;
  margin-top: 1.125rem;
  color: var(--color-text-muted);
  font-size: clamp(1rem, 1.4vw, 1.0625rem);
}

.hero-actions {
  margin-top: 1.875rem;
}

.hero-platforms {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.75rem;
  justify-content: center;
  margin: 1.75rem 0 0;
  padding: 0;
}

.hero-platform {
  @include label-text;

  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
  color: var(--color-text-subtle);
}

.hero-platform-icon {
  font-size: 1rem;
  opacity: 0.85;
}

// Give each principle the same rounded panel outline as the other sections.
.hero-principles {
  @include content-container;

  display: grid;
  gap: 1rem;
  margin-top: clamp(2.5rem, 5vw, 3.5rem);
  padding-left: clamp(1.25rem, 5vw, 2.5rem);
  list-style: none;

  @include from($breakpoint-md) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.hero-principle {
  position: relative;
  padding: 1.5rem 1.5rem 1.625rem;
  background: var(--color-panel);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  overflow: hidden;

  // A short accent tick over the top edge, aligned with the index.
  &::before {
    position: absolute;
    top: 0;
    left: 1.5rem;
    width: 2.25rem;
    height: 2px;
    background: var(--color-accent);
    border-radius: var(--radius-full);
    content: '';
  }
}

.hero-principle-index {
  @include label-text;

  display: block;
  color: var(--color-accent);
}

.hero-principle-icon {
  display: block;
  margin-top: 1.125rem;
  color: var(--color-text-muted);
  font-size: 1.375rem;
}

.hero-principle-title {
  margin-top: 0.75rem;
  font-size: 1.0625rem;
}

.hero-principle-text {
  margin-top: 0.4rem;
  color: var(--color-text-muted);
  font-size: 0.9375rem;
}
</style>
