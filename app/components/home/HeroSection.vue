<script setup lang="ts">
const { t } = useI18n()
const principles = usePrinciples()
const { latestRelease } = useDownloads()

// Product names, so they stay identical in every locale.
const platforms = [
  { name: 'Linux', icon: 'simple-icons:linux' },
  { name: 'Windows', icon: 'simple-icons:windows' },
  { name: 'macOS', icon: 'simple-icons:apple' },
]
</script>

<template>
  <section class="hero">
    <div class="hero-scene">
      <img
        src="/images/branding/hero_background_dark.svg"
        class="hero-landscape"
        alt=""
        aria-hidden="true"
        width="2048"
        height="682"
        fetchpriority="high"
      >

      <div class="hero-inner">
        <div class="hero-copy">
          <FocaleLogo
            class="hero-logo"
            :size="128"
            :plate="false"
          />
          <p class="hero-status">
            <span class="hero-status-dot" />
            {{ latestRelease ? t('downloads.available', { version: latestRelease.version }) : t('hero.badge') }}
          </p>

          <h1 class="hero-title">
            {{ t('hero.title') }}
            <em class="hero-title-accent">{{ t('hero.titleAccent') }}</em>
          </h1>

          <p class="hero-subtitle">
            {{ t('hero.subtitle') }}
          </p>

          <div class="hero-actions">
            <Button
              as="a"
              href="#downloads"
              size="large"
              :label="t('downloads.title')"
            >
              <template #icon>
                <Icon
                  name="lucide:download"
                  aria-hidden="true"
                />
              </template>
            </Button>
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
      </div>
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
  padding-bottom: clamp(2.5rem, 5vw, 4rem);
  overflow: clip;
}

// The same landscape as the editor, open to the page edges. The short edge
// fades merge the sky and lake into the site's canvas without a visible frame.
.hero-scene {
  position: relative;
  isolation: isolate;
  padding-block: clamp(4rem, 7vw, 7rem) clamp(7rem, 11vw, 10rem);

  &::after {
    position: absolute;
    z-index: -1;
    inset: 0;
    background:
      linear-gradient(to bottom, var(--color-canvas), transparent 4rem, transparent 70%, var(--color-canvas)),
      linear-gradient(to right, var(--color-canvas) 10%, #{rgba($neutral-950, 0.84)} 35%, #{rgba($neutral-950, 0.12)} 70%, transparent);
    pointer-events: none;
    content: '';
  }
}

.hero-landscape {
  position: absolute;
  z-index: -2;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: right center;
  pointer-events: none;
}

.hero-inner {
  @include content-container;
}

.hero-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  max-width: 38rem;
}

.hero-logo {
  margin-bottom: 1rem;
}

.hero-status {
  @include label-text;

  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
  max-width: 100%;
  padding: 0.5rem 0.875rem;
  color: var(--color-accent-bright);
  background: var(--color-accent-soft);
  border: 1px solid var(--color-accent-line);
  border-radius: var(--radius-full);
}

.hero-status-dot {
  flex: none;
  width: 0.375rem;
  height: 0.375rem;
  background: var(--color-accent-bright);
  border-radius: 50%;
}

.hero-title {
  @include fluid-text(2.125rem, 3.5rem, 5.6vw);

  margin-top: 1.125rem;
  max-width: 18ch;
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
  justify-content: flex-start;
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
  margin-top: 0;
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

// On a narrow screen the image settles below the copy, leaving the moon and
// shoreline visible without placing their bright details behind the headline.
@include until($breakpoint-md) {
  .hero-scene {
    padding-top: 3rem;
    padding-bottom: 15rem;

    &::after {
      background: linear-gradient(
        to bottom,
        var(--color-canvas) 12%,
        #{rgba($neutral-950, 0.92)} 38%,
        #{rgba($neutral-950, 0.15)} 68%,
        transparent 82%,
        var(--color-canvas) 100%
      );
    }
  }

  .hero-landscape {
    top: auto;
    height: 28rem;
    mask-image: linear-gradient(to bottom, transparent, #000 20%);
  }

  .hero-copy {
    align-items: center;
    max-width: 34rem;
    margin-inline: auto;
    text-align: center;
  }

  .hero-platforms {
    justify-content: center;
  }
}
</style>
