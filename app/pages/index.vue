<script setup lang="ts">
const { t } = useI18n()

usePageSeo(() => ({
  title: t('meta.home.title'),
  description: t('meta.home.description'),
  isHome: true,
}))
</script>

<template>
  <div>
    <HeroSection />
    <OriginsSection />
    <PreviewSection />
    <FeaturesSection />
    <RoadmapSection />
    <DownloadsSection />
    <noscript>
      <PageSection>
      <a href="https://github.com/focale-editor/releases/releases">{{ t('downloads.title') }}</a>
      </PageSection>
    </noscript>
    <NewsletterSection />
  </div>
</template>
