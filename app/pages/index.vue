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
    <NewsletterSection />
  </div>
</template>
