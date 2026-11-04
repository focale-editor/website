<script setup lang="ts">
import { socialLinks } from '~/utils/socialLinks'

const { variant = 'icons' } = defineProps<{
  /** Round icon buttons for compact areas, or labelled tiles with the account handle. */
  variant?: 'icons' | 'tiles'
}>()

const { t } = useI18n()

/** Brand colours, revealed on hover so the site palette stays calm at rest. */
const accents: Record<string, string> = {
  Instagram: 'linear-gradient(45deg, #f9ce34 0%, #ee2a7b 50%, #6228d7 100%)',
  TikTok: 'linear-gradient(135deg, #25f4ee 0%, #fe2c55 100%)',
  YouTube: '#ff0033',
}
</script>

<template>
  <ul
    class="social-links"
    :class="`social-links-${variant}`"
    role="list"
  >
    <li
      v-for="link in socialLinks"
      :key="link.href"
    >
      <a
        class="social-link"
        :href="link.href"
        target="_blank"
        rel="noopener noreferrer"
        :aria-label="variant === 'icons' ? t('social.label', { network: link.network }) : undefined"
        :title="variant === 'icons' ? link.network : undefined"
        :style="{ '--social-accent': accents[link.network] }"
      >
        <span class="social-mark">
          <Icon
            :name="link.icon"
            aria-hidden="true"
          />
        </span>
        <template v-if="variant === 'tiles'">
          <span class="social-text">
            <span class="social-network">{{ link.network }}</span>
            <span class="social-handle">{{ link.handle }}</span>
          </span>
          <Icon
            class="social-arrow"
            name="lucide:arrow-up-right"
            aria-hidden="true"
          />
        </template>
      </a>
    </li>
  </ul>
</template>

<style scoped lang="scss">
.social-links {
  margin: 0;
  padding: 0;
  list-style: none;
}

.social-link {
  color: var(--color-text-muted);
  text-decoration: none;

  &:focus-visible {
    @include focus-ring(3px);
  }
}

.social-mark {
  display: grid;
  flex: none;
  place-items: center;
  position: relative;
  isolation: isolate;
  overflow: hidden;

  // The brand colour fades in underneath the logo rather than replacing it abruptly.
  &::before {
    position: absolute;
    inset: 0;
    z-index: -1;
    background: var(--social-accent);
    opacity: 0;
    content: '';
  }

  @include motion-safe {
    &::before {
      transition: opacity 0.2s ease;
    }
  }
}

// Compact: round buttons sized for touch.
.social-links-icons {
  display: flex;
  gap: 0.625rem;

  .social-mark {
    width: 2.5rem;
    height: 2.5rem;
    font-size: 1.0625rem;
    border: 1px solid var(--color-line);
    border-radius: var(--radius-full);
  }

  .social-link {
    display: inline-flex;
    border-radius: var(--radius-full);
  }

}

// Tiles: network, handle and an outbound arrow.
.social-links-tiles {
  display: grid;
  gap: 0.75rem;

  @include from($breakpoint-md) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .social-link {
    display: flex;
    gap: 0.875rem;
    align-items: center;
    min-height: 4.5rem;
    padding: 0.875rem 1rem;
    color: var(--color-text);
    background: var(--color-canvas-raised);
    border: 1px solid var(--color-line);
    border-radius: var(--radius-lg);

    @include motion-safe {
      transition: border-color 0.18s ease, background-color 0.18s ease;
    }

    &:hover,
    &:focus-visible {
      background: var(--color-panel-hover);
      border-color: var(--color-accent-line);
    }
  }

  .social-mark {
    width: 2.75rem;
    height: 2.75rem;
    color: var(--color-accent-bright);
    font-size: 1.25rem;
    background: var(--color-accent-soft);
    border-radius: var(--radius-md);
  }

  .social-text {
    display: grid;
    flex: 1 1 auto;
    gap: 0.125rem;
    min-width: 0;
  }

  .social-network {
    font-weight: 600;
    line-height: 1.3;
  }

  .social-handle {
    overflow: hidden;
    color: var(--color-text-subtle);
    font-size: 0.8125rem;
    font-family: var(--font-mono);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .social-arrow {
    flex: none;
    color: var(--color-text-subtle);
    font-size: 1rem;

    @include motion-safe {
      transition: transform 0.18s ease, color 0.18s ease;
    }
  }

  .social-link:hover .social-arrow,
  .social-link:focus-visible .social-arrow {
    color: var(--color-accent-bright);
    transform: translate(2px, -2px);
  }
}

// Shared hover state, declared after both variants so it wins over their resting colours.
.social-link:hover .social-mark,
.social-link:focus-visible .social-mark {
  color: #fff;
  border-color: transparent;

  &::before {
    opacity: 1;
  }
}
</style>
