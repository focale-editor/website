<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

// The ways to contribute listed on the support page, set around the mark.
const contributions = [
  { icon: 'lucide:heart', angle: -90 },
  { icon: 'lucide:download', angle: -18 },
  { icon: 'lucide:bug', angle: 54 },
  { icon: 'lucide:lightbulb', angle: 126 },
  { icon: 'lucide:share-2', angle: 198 },
]
</script>

<template>
  <PageSection
    id="support"
    :eyebrow="t('support.eyebrow')"
    :title="t('support.home.title')"
    :description="t('support.home.description')"
  >
    <Button
      as="a"
      :href="localePath('/support')"
      :label="t('support.home.action')"
      icon-pos="right"
      class="support-action"
    >
      <template #icon>
        <Icon
          name="lucide:arrow-right"
          aria-hidden="true"
        />
      </template>
    </Button>

    <template #aside>
      <div class="support-orbit">
        <span class="support-orbit-track" />
        <div class="support-satellites">
          <span
            v-for="contribution in contributions"
            :key="contribution.icon"
            class="support-satellite"
            :style="{ '--angle': `${contribution.angle}deg` }"
          >
            <span class="support-satellite-body">
              <Icon :name="contribution.icon" />
            </span>
          </span>
        </div>
        <div class="support-mark">
          <FocaleLogo :size="72" />
        </div>
      </div>
    </template>
  </PageSection>
</template>

<style scoped lang="scss">
.support-action {
  max-width: 100%;
  white-space: normal;
}

// Contributions orbit the application mark and its aperture ring.
.support-orbit {
  --radius: 7.5rem;

  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  max-width: 19rem;
  aspect-ratio: 1;
  background: radial-gradient(circle, var(--color-accent-soft), transparent 68%);
  border: 1px solid var(--color-line);
  border-radius: 50%;
}

.support-orbit-track {
  position: absolute;
  inset: 2rem;
  border: 1px dashed var(--color-accent-line);
  border-radius: 50%;

  @include motion-safe {
    animation: orbit-spin 90s linear infinite;
  }
}

// The satellites orbit against the logo's own ring, while each one counter-
// rotates so its icon stays upright.
.support-satellites {
  position: absolute;
  inset: 0;

  @include motion-safe {
    animation: orbit-spin 120s linear infinite reverse;
  }
}

.support-satellite {
  position: absolute;
  top: 50%;
  left: 50%;
  margin: -1.375rem 0 0 -1.375rem;
  transform: rotate(var(--angle)) translateX(var(--radius)) rotate(calc(-1 * var(--angle)));
}

.support-satellite-body {
  display: grid;
  place-items: center;
  width: 2.75rem;
  height: 2.75rem;
  color: var(--color-accent-bright);
  font-size: 1.125rem;
  background: var(--color-panel);
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-panel);

  @include motion-safe {
    animation: orbit-spin 120s linear infinite;
  }
}

.support-satellite:first-child .support-satellite-body {
  color: var(--color-accent-contrast);
  background: var(--color-accent);
  border-color: var(--color-accent);
}

.support-mark {
  padding: 0.5rem;
  background: var(--color-panel);
  border: 1px solid var(--color-accent-line);
  border-radius: var(--radius-lg);
  box-shadow: 0 0 2.5rem var(--color-accent-soft);
}

@keyframes orbit-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
