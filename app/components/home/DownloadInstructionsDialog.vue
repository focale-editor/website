<script setup lang="ts">
import Message from 'openvue/message'

const visible = defineModel<boolean>('visible', { required: true })
const { mode, downloadUrl } = defineProps<{
  mode: 'archive' | 'command'
  downloadUrl: string
}>()
const { t } = useI18n()
const copyStatus = ref<'idle' | 'copied' | 'error'>('idle')

/** Public installer hosted alongside the catalog; never executed by the site. */
const installCommand = 'curl -fsSL https://get.focale-editor.app/install.sh | bash'

watch(visible, (isVisible) => {
  if (isVisible) copyStatus.value = 'idle'
})

async function copyCommand(): Promise<void> {
  try {
    await navigator.clipboard.writeText(installCommand)
    copyStatus.value = 'copied'
  }
  catch {
    copyStatus.value = 'error'
  }
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    block-scroll
    dismissable-mask
    :draggable="false"
    :header="t(mode === 'archive' ? 'downloads.archiveInstructionsTitle' : 'downloads.oneCommand')"
    :close-button-props="{ 'severity': 'secondary', 'text': true, 'rounded': true, 'aria-label': t('downloads.close') }"
    :style="{ width: 'min(36rem, calc(100vw - 2rem))', maxHeight: 'calc(100dvh - 2rem)', borderRadius: 'var(--radius-lg)' }"
    :pt="{ footer: { style: { flexWrap: 'wrap' } } }"
    class="download-instructions"
  >
    <template #closeicon>
      <Icon
        name="lucide:x"
        aria-hidden="true"
      />
    </template>

    <div class="instructions-body">
      <template v-if="mode === 'archive'">
        <ol class="archive-steps">
          <li><strong>{{ t('downloads.archiveExtract') }}</strong></li>
          <li>
            <strong>{{ t('downloads.archiveRun') }}</strong>
            <pre class="install-command"><code>./install.sh</code></pre>
          </li>
        </ol>
        <Message severity="info">
          <template #icon>
            <Icon
              name="lucide:info"
              aria-hidden="true"
            />
          </template>
          {{ t('downloads.linuxRequirements') }}
        </Message>
      </template>
      <template v-else>
        <p>{{ t('downloads.oneCommandHint') }}</p>
        <p>{{ t('downloads.terminalStep') }}</p>
        <pre class="install-command"><code>{{ installCommand }}</code></pre>
        <p
          class="copy-feedback"
          role="status"
          aria-live="polite"
        >
          {{ copyStatus === 'error' ? t('downloads.commandCopyError') : copyStatus === 'copied' ? t('downloads.commandCopied') : '' }}
        </p>
      </template>
    </div>

    <template #footer>
      <Button
        type="button"
        severity="secondary"
        :label="t('downloads.close')"
        @click="visible = false"
      />
      <Button
        v-if="mode === 'archive'"
        as="a"
        :href="downloadUrl"
        :label="t('downloads.toggle')"
        :aria-label="t('downloads.downloadFor', { platform: 'Linux x64' })"
      >
        <template #icon>
          <Icon
            name="lucide:download"
            aria-hidden="true"
          />
        </template>
      </Button>
      <Button
        v-else
        type="button"
        :label="t(copyStatus === 'copied' ? 'downloads.commandCopied' : 'downloads.copyCommand')"
        class="copy-command"
        @click="copyCommand"
      >
        <template #icon>
          <Icon
            :name="copyStatus === 'copied' ? 'lucide:check' : 'lucide:copy'"
            aria-hidden="true"
          />
        </template>
      </Button>
    </template>
  </Dialog>
</template>

<style scoped lang="scss">
.instructions-body {
  display: grid;
  gap: 1rem;
  color: var(--color-text-muted);
}

.install-command {
  padding: 1rem;
  color: var(--color-text);
  font-size: 0.875rem;
  font-family: var(--font-mono);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  background: var(--color-canvas);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
}

.archive-steps {
  display: grid;
  gap: 1rem;
  padding-inline-start: 1.5rem;

  .install-command {
    margin-top: 0.75rem;
  }
}

.copy-feedback {
  font-size: 0.875rem;
}

.copy-feedback:empty {
  display: none;
}
</style>
