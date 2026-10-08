<script setup lang="ts">
import type { DownloadTarget } from '~/utils/downloadCatalog'
import Message from 'openvue/message'

const { t } = useI18n()
const localePath = useLocalePath()
const { latestRelease, status } = useDownloads()
const isLoading = computed(() => status.value === 'idle' || status.value === 'loading')

/** Hosted by get-focale next to the catalog; it installs the latest Linux ZIP. */
const installCommand = 'curl -fsSL https://get.focale-editor.app/install.sh | bash'

type DownloadOption
  = | { kind: 'file', target: DownloadTarget, label: string, detail: string, note?: string }
    | { kind: 'link', href: string, label: string, detail: string, note: string }
    | { kind: 'store', label: string }
    | { kind: 'command' }

interface Platform {
  id: string
  name: string
  summary: string
  icon: string
  options: DownloadOption[]
}

// Product and store names stay identical in every locale.
const platforms = computed<Platform[]>(() => [
  {
    id: 'windows',
    name: 'Windows',
    summary: 'x64',
    icon: 'simple-icons:windows',
    options: [
      { kind: 'file', target: 'windows-x64', label: t('downloads.installer', { format: 'EXE' }), detail: 'x64' },
      { kind: 'store', label: 'Microsoft Store' },
    ],
  },
  {
    id: 'macos',
    name: 'macOS',
    summary: 'Apple Silicon · Intel',
    icon: 'simple-icons:apple',
    options: [
      { kind: 'file', target: 'macos-arm64', label: t('downloads.installer', { format: 'DMG' }), detail: 'Apple Silicon' },
      { kind: 'file', target: 'macos-x64', label: t('downloads.installer', { format: 'DMG' }), detail: 'Intel' },
      { kind: 'store', label: 'Mac App Store' },
    ],
  },
  {
    id: 'linux',
    name: 'Linux',
    summary: 'x64',
    icon: 'simple-icons:linux',
    options: [
      { kind: 'link', href: 'https://flatpak.focale-editor.app/Focale.flatpakref', label: 'Flatpak', detail: '.flatpakref', note: t('downloads.flatpakHint') },
      { kind: 'command' },
      { kind: 'file', target: 'linux-x64', label: t('downloads.archive', { format: 'ZIP' }), detail: 'x64', note: t('downloads.linuxHint') },
    ],
  },
])

const expanded = ref<Record<string, boolean>>({})
const commandStatus = ref<'idle' | 'copied'>('idle')

/** Signing status is published per file, so the warning follows each one. */
function noteFor(option: Extract<DownloadOption, { kind: 'file' }>) {
  if (option.note) return option.note
  return latestRelease.value?.downloads[option.target].platformSigned ? undefined : t('downloads.unsignedPreview')
}

async function copyCommand(): Promise<void> {
  try {
    await navigator.clipboard.writeText(installCommand)
    commandStatus.value = 'copied'
    setTimeout(() => (commandStatus.value = 'idle'), 2000)
  }
  catch {
    // The command stays visible and selectable when the clipboard is blocked.
  }
}
</script>

<template>
  <PageSection
    id="downloads"
    muted
    :eyebrow="t('downloads.eyebrow')"
    :title="t('downloads.title')"
  >
    <template v-if="latestRelease">
      <i18n-t
        keypath="downloads.release"
        tag="p"
        scope="global"
        class="release-version"
      >
        <template #version>
          {{ latestRelease.version }}
        </template>
        <template #notes>
          <NuxtLink :to="localePath('changelog')">{{ t('downloads.releaseNotes') }}</NuxtLink>
        </template>
      </i18n-t>

      <ul
        class="download-list"
        role="list"
      >
        <li
          v-for="platform in platforms"
          :key="platform.id"
          class="download-card"
          :class="{ 'download-card-open': expanded[platform.id] }"
        >
          <div class="download-heading">
            <span class="platform-icon">
              <Icon
                :name="platform.icon"
                aria-hidden="true"
              />
            </span>
            <div class="platform-name">
              <h3>{{ platform.name }}</h3>
              <p>{{ platform.summary }}</p>
            </div>
          </div>

          <Button
            :label="t('downloads.toggle')"
            icon-pos="right"
            class="download-toggle"
            :aria-expanded="expanded[platform.id] ? 'true' : 'false'"
            :aria-controls="`downloads-${platform.id}`"
            @click="expanded[platform.id] = !expanded[platform.id]"
          >
            <template #icon>
              <Icon
                name="lucide:chevron-down"
                class="download-chevron"
                aria-hidden="true"
              />
            </template>
          </Button>

          <ul
            v-show="expanded[platform.id]"
            :id="`downloads-${platform.id}`"
            class="download-menu"
            role="list"
            :aria-label="t('downloads.optionsFor', { platform: platform.name })"
          >
            <li
              v-for="(option, index) in platform.options"
              :key="index"
            >
              <a
                v-if="option.kind === 'file'"
                :href="latestRelease.downloads[option.target].url"
                :aria-label="`${option.label} · ${t('downloads.downloadFor', { platform: `${platform.name} ${option.detail}` })}`"
                class="download-option"
              >
                <span class="option-copy">
                  <span class="option-title">
                    <Icon
                      name="lucide:download"
                      class="option-icon"
                      aria-hidden="true"
                    />
                    <span class="option-label">{{ option.label }}</span>
                    <span class="option-tag">{{ option.detail }}</span>
                  </span>
                  <span
                    v-if="noteFor(option)"
                    class="option-note"
                  >{{ noteFor(option) }}</span>
                </span>
              </a>

              <a
                v-else-if="option.kind === 'link'"
                :href="option.href"
                class="download-option"
              >
                <span class="option-copy">
                  <span class="option-title">
                    <Icon
                      name="lucide:package"
                      class="option-icon"
                      aria-hidden="true"
                    />
                    <span class="option-label">{{ option.label }}</span>
                    <span class="option-tag">{{ option.detail }}</span>
                  </span>
                  <span class="option-note">{{ option.note }}</span>
                </span>
              </a>

              <div
                v-else-if="option.kind === 'store'"
                class="download-option download-option-disabled"
                aria-disabled="true"
              >
                <span class="option-copy">
                  <span class="option-title">
                    <Icon
                      name="lucide:store"
                      class="option-icon"
                      aria-hidden="true"
                    />
                    <span class="option-label">{{ option.label }}</span>
                    <span class="option-tag">{{ t('downloads.soon') }}</span>
                  </span>
                  <span class="option-note">{{ t('downloads.storeSoon') }}</span>
                </span>
              </div>

              <div
                v-else
                class="download-command"
              >
                <p class="option-label">
                  <Icon
                    name="lucide:terminal"
                    class="option-icon"
                    aria-hidden="true"
                  />
                  {{ t('downloads.oneCommand') }}
                </p>
                <div class="command-row">
                  <code class="command-code">{{ installCommand }}</code>
                  <button
                    type="button"
                    class="command-copy"
                    :aria-label="t(commandStatus === 'copied' ? 'downloads.commandCopied' : 'downloads.copyCommand')"
                    :title="t(commandStatus === 'copied' ? 'downloads.commandCopied' : 'downloads.copyCommand')"
                    @click="copyCommand"
                  >
                    <Icon
                      :name="commandStatus === 'copied' ? 'lucide:check' : 'lucide:copy'"
                      aria-hidden="true"
                    />
                  </button>
                </div>
                <p class="option-note">
                  {{ t('downloads.oneCommandHint') }}
                </p>
                <p
                  class="visually-hidden"
                  aria-live="polite"
                >
                  {{ commandStatus === 'copied' ? t('downloads.commandCopied') : '' }}
                </p>
              </div>
            </li>
          </ul>
        </li>
      </ul>

      <div class="update-panel">
        <span class="update-icon">
          <Icon
            name="lucide:refresh-cw"
            aria-hidden="true"
          />
        </span>
        <div class="update-copy">
          <h3>{{ t('downloads.autoUpdateTitle') }}</h3>
          <p>
            {{ t('downloads.autoUpdate') }}
            {{ t('downloads.installHint') }}
          </p>
        </div>
      </div>
    </template>
    <Message
      v-else
      :severity="isLoading ? 'info' : 'warn'"
      :pt="{ root: { 'role': 'status', 'aria-live': 'polite' } }"
      class="download-notice"
    >
      <template #icon>
        <Icon
          :name="isLoading ? 'lucide:info' : 'lucide:triangle-alert'"
          aria-hidden="true"
        />
      </template>
      <p>{{ t(isLoading ? 'downloads.loading' : 'downloads.unavailable') }}</p>
      <a
        v-if="!isLoading"
        href="https://github.com/focale-editor/get-focale/releases"
        class="download-fallback-link"
      >
        {{ t('downloads.browseReleases') }}
        <Icon
          name="lucide:arrow-up-right"
          aria-hidden="true"
        />
      </a>
    </Message>
  </PageSection>
</template>

<style scoped lang="scss">
.download-notice {
  max-width: 44rem;
  border-radius: var(--radius-lg);

  :deep(.p-message-content) {
    align-items: flex-start;
  }
}

.download-fallback-link {
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
  min-height: 2.75rem;
  margin-top: 0.5rem;
  text-decoration: underline;
  text-underline-offset: 0.2em;
}

.release-version {
  margin-bottom: 1.5rem;
  color: var(--color-text-muted);

  a {
    color: var(--color-accent-bright);
    text-decoration: underline;
    text-underline-offset: 0.2em;

    &:hover {
      color: var(--color-text);
    }
  }
}

.download-list {
  display: grid;
  gap: 1rem;
  align-items: start;

  @include from($breakpoint-lg) { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

.download-card {
  @include panel;

  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.5rem;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-panel);

  @include motion-safe {
    transition: border-color 0.18s ease;
  }

  &:hover,
  &:focus-within {
    border-color: var(--color-accent-line);
  }
}

.download-heading {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.875rem;
  align-items: center;
}

.platform-icon {
  display: grid;
  place-items: center;
  width: 2.75rem;
  height: 2.75rem;
  color: var(--color-text);
  font-size: 1.25rem;
  background: var(--color-canvas-raised);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
}

.platform-name h3 {
  font-size: 1.125rem;
}

.platform-name p {
  color: var(--color-text-subtle);
  font-size: 0.875rem;
}

.download-toggle {
  justify-content: center;
  width: 100%;
}

.download-chevron {
  @include motion-safe {
    transition: transform 0.2s ease;
  }
}

.download-card-open .download-chevron {
  transform: rotate(180deg);
}

// The options read as a small menu unfolding under the button, separated by
// the same hairlines as the editor's panels.
.download-menu {
  margin-top: -0.25rem;
  overflow: hidden;
  background: var(--color-canvas-raised);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);

  > li + li {
    border-top: 1px solid var(--color-line);
  }
}

.download-option {
  display: block;
  padding: 0.875rem 1rem;
  color: var(--color-text);

  @include motion-safe {
    transition: background-color 0.18s ease;
  }
}

a.download-option {
  &:hover {
    background: var(--color-panel-hover);
  }

  &:focus-visible {
    @include focus-ring(-2px);
  }
}

.download-option-disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.option-icon {
  flex: none;
  color: var(--color-accent-bright);
  font-size: 1rem;
}

.option-copy {
  display: grid;
  gap: 0.5rem;
}

.option-title {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.75rem;
  align-items: center;
}

.option-label {
  font-weight: 500;
  font-size: 0.9375rem;
}

.option-note {
  color: var(--color-text-subtle);
  font-size: 0.8125rem;
  line-height: 1.5;
}

.option-tag {
  @include label-text;

  padding: 0.125rem 0.375rem;
  color: var(--color-accent-bright);
  white-space: nowrap;
  background: var(--color-accent-soft);
  border-radius: var(--radius-sm);
}

.download-command {
  display: grid;
  gap: 0.5rem;
  padding: 0.875rem 1rem;

  .option-label {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }
}

.command-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  overflow: hidden;
  background: var(--color-canvas);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-sm);
}

.command-code {
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;
  font-family: var(--font-mono);
  overflow-wrap: anywhere;
}

.command-copy {
  display: grid;
  place-items: center;
  width: 2.5rem;
  color: var(--color-text-muted);
  font-size: 0.9375rem;
  background: var(--color-panel);
  border: 0;
  border-left: 1px solid var(--color-line);
  cursor: pointer;

  &:hover {
    color: var(--color-text);
    background: var(--color-panel-hover);
  }

  &:focus-visible {
    @include focus-ring(-2px);
  }
}

.update-panel {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
  margin-top: 1.5rem;
  padding: 1.25rem 1.5rem;
  background: var(--color-accent-soft);
  border: 1px solid var(--color-accent-line);
  border-radius: var(--radius-lg);

  @include from($breakpoint-md) { align-items: center; }
}

.update-icon {
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  color: var(--color-accent-bright);
  font-size: 1.125rem;
  background: var(--color-canvas-raised);
  border: 1px solid var(--color-accent-line);
  border-radius: var(--radius-md);
}

.update-copy h3 {
  font-size: 1rem;
}

.update-copy p {
  max-width: 80ch;
  margin-top: 0.25rem;
  color: var(--color-text-muted);
  font-size: 0.9375rem;
}
</style>
