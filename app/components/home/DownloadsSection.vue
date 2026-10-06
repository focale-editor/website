<script setup lang="ts">
import { downloadTargets } from '~/utils/downloadCatalog'

const { t } = useI18n()
const { latestRelease } = useDownloads()
const platforms = {
  'macos-arm64': { name: 'macOS', architecture: 'Apple Silicon', icon: 'simple-icons:apple', format: 'DMG' },
  'macos-x64': { name: 'macOS', architecture: 'Intel', icon: 'simple-icons:apple', format: 'DMG' },
  'windows-x64': { name: 'Windows', architecture: 'x64', icon: 'simple-icons:windows', format: 'EXE' },
  'linux-x64': { name: 'Linux', architecture: 'x64', icon: 'simple-icons:linux', format: 'ZIP' },
}
</script>

<template>
  <PageSection
    v-if="latestRelease"
    id="downloads"
    :title="t('downloads.title')"
    :description="t('downloads.description')"
  >
    <p class="release-version">
      {{ t('downloads.available', { version: latestRelease.version }) }}
      <a :href="`https://github.com/focale-editor/get-focale/releases/tag/${latestRelease.tag}`">{{ t('downloads.releaseNotes') }}</a>
    </p>
    <ul
      class="download-list"
      role="list"
    >
      <li
        v-for="target in downloadTargets"
        :key="target"
        class="download-row"
      >
        <Icon
          :name="platforms[target].icon"
          class="platform-icon"
        />
        <div class="platform-name">
          <h3>{{ platforms[target].name }}</h3>
          <p>{{ platforms[target].architecture }}</p>
        </div>
        <Button
          as="a"
          :href="latestRelease.downloads[target].url"
          :label="t('downloads.download', { format: platforms[target].format })"
          :aria-label="t('downloads.downloadFor', { platform: `${platforms[target].name} ${platforms[target].architecture}` })"
          class="download-button"
        />
        <p
          v-if="target !== 'linux-x64' && !latestRelease.downloads[target].platformSigned"
          class="preview-note"
        >
          {{ t('downloads.unsignedPreview') }}
        </p>
      </li>
    </ul>
    <p class="install-hint">
      {{ t('downloads.installHint') }}
    </p>
    <p class="install-hint">
      {{ t('downloads.linuxHint') }}
    </p>
  </PageSection>
</template>

<style scoped lang="scss">
.release-version {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
  color: var(--color-text-muted);

  a {
    color: var(--color-accent-bright);
    text-decoration: underline;
    text-underline-offset: 0.2em;
  }
}

.download-list {
  display: grid;
  gap: 1rem;

  @include from($breakpoint-md) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

.download-row {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1rem;
  align-items: center;
  padding: 1.5rem;
  background: var(--color-panel);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
}

.platform-icon {
  font-size: 1.75rem;
  color: var(--color-text-muted);
}

.platform-name h3 { font-size: 1.25rem; }

.platform-name p {
  color: var(--color-text-muted);
  font-size: 0.9375rem;
}

.download-button {
  grid-column: 1 / -1;
  justify-self: start;
}

.preview-note {
  grid-column: 1 / -1;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.install-hint {
  max-width: 75ch;
  margin-top: 1.5rem;
  color: var(--color-text-muted);
  font-size: 0.9375rem;
}
</style>
