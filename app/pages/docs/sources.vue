<script setup lang="ts">
const { t } = useI18n()
usePageSeo(() => ({ title: t('docs.sources.title'), description: t('docs.sources.description') }))
const commands = 'python3 rebuild.py unpack --work work\npython3 rebuild.py imcodec_native --work work\npython3 rebuild.py rawkit --work work'
</script>

<template>
  <DocumentationLayout
    :title="t('docs.sources.title')"
    :description="t('docs.sources.description')"
  >
    <section>
      <h2>{{ t('docs.sources.downloadTitle') }}</h2>
      <p>{{ t('docs.sources.download') }}</p>
      <p><a href="https://github.com/focale-editor/get-focale/releases">{{ t('docs.sources.releases') }}</a></p>
      <p><code>Focale-VERSION+BUILD-third-party-sources.zip</code></p>
    </section>
    <section>
      <h2>{{ t('docs.sources.contentsTitle') }}</h2>
      <p>{{ t('docs.sources.contents') }}</p>
    </section>
    <section>
      <h2>{{ t('docs.sources.rebuildTitle') }}</h2>
      <p>{{ t('docs.sources.rebuild') }}</p>
      <pre tabindex="0"><code>{{ commands }}</code></pre>
    </section>
    <section>
      <h2>{{ t('docs.sources.replaceTitle') }}</h2>
      <p>{{ t('docs.sources.replace') }}</p>
      <p>{{ t('docs.sources.macos') }}</p>
      <p>{{ t('docs.sources.managed') }}</p>
    </section>
    <section>
      <h2>{{ t('docs.sources.patentsTitle') }}</h2>
      <p>{{ t('docs.sources.patents') }}</p>
    </section>
  </DocumentationLayout>
</template>
