<script setup lang="ts">
import Message from 'openvue/message'

const { compact = false } = defineProps<{
  /** Whether the form is rendered inline in the hero rather than as a block. */
  compact?: boolean
}>()

const { t, locale } = useI18n()
const { email, status, error, isSubmitting, subscribe } = useNewsletter()

const inputId = useId()
const messageId = computed(() => `${inputId}-message`)

const feedback = computed(() => {
  if (status.value === 'success') {
    return { tone: 'success' as const, text: t('newsletter.success') }
  }
  if (status.value === 'error' && error.value) {
    return { tone: 'error' as const, text: t(`newsletter.errors.${error.value}`) }
  }
  return null
})

/** Hands the current address to Loops, tagged with the visitor's language. */
function onSubmit(): void {
  void subscribe(locale.value)
}
</script>

<template>
  <div
    class="newsletter"
    :class="{ 'newsletter-compact': compact }"
  >
    <form
      class="newsletter-form"
      novalidate
      @submit.prevent="onSubmit"
    >
      <label
        class="visually-hidden"
        :for="inputId"
      >{{ t('newsletter.label') }}</label>

      <InputText
        :id="inputId"
        v-model="email"
        class="newsletter-input"
        type="email"
        name="email"
        autocomplete="email"
        :placeholder="t('newsletter.placeholder')"
        :disabled="isSubmitting"
        :invalid="status === 'error'"
        :aria-describedby="feedback ? messageId : undefined"
      />

      <Button
        type="submit"
        class="newsletter-submit"
        :label="isSubmitting ? t('newsletter.submitting') : t('newsletter.submit')"
        :disabled="isSubmitting"
      >
        <template #icon>
          <Icon
            :name="isSubmitting ? 'lucide:loader-circle' : 'lucide:bell'"
            :class="{ 'newsletter-spinner': isSubmitting }"
          />
        </template>
      </Button>
    </form>

    <Message
      v-if="feedback"
      :id="messageId"
      :severity="feedback.tone"
      class="newsletter-feedback"
    >
      <template #icon>
        <Icon :name="feedback.tone === 'success' ? 'lucide:check-circle-2' : 'lucide:alert-circle'" />
      </template>
      {{ feedback.text }}
    </Message>

    <p class="newsletter-privacy">
      {{ t('newsletter.privacy') }}
    </p>
  </div>
</template>

<style scoped lang="scss">
.newsletter {
  width: 100%;
  max-width: 34rem;
}

.newsletter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 0.625rem;
}

.newsletter-input {
  flex: 1 1 16rem;
  min-width: 0;
}

.newsletter-submit {
  flex: 0 0 auto;
  justify-content: center;
  font-weight: 600;
  white-space: nowrap;

  @include until($breakpoint-sm) {
    flex: 1 1 100%;
  }
}

.newsletter-feedback {
  margin-top: 0.875rem;
}

.newsletter-spinner {
  @include motion-safe {
    animation: newsletter-spin 1s linear infinite;
  }
}

.newsletter-privacy {
  margin-top: 0.75rem;
  color: var(--color-text-subtle);
  font-size: 0.8125rem;
}

.newsletter-compact .newsletter-privacy {
  margin-top: 0.625rem;
}

@keyframes newsletter-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
