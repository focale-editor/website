<script setup lang="ts">
import HeroSection from '~/components/home/HeroSection.vue'
import OriginsSection from '~/components/home/OriginsSection.vue'
import PreviewSection from '~/components/home/PreviewSection.vue'
import FeaturesSection from '~/components/home/FeaturesSection.vue'
import RoadmapSection from '~/components/home/RoadmapSection.vue'
import DownloadsSection from '~/components/home/DownloadsSection.vue'
import NoScriptDownloads from '~/components/home/NoScriptDownloads.vue'
import SupportSection from '~/components/home/SupportSection.vue'

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
    <NoScriptDownloads />
    <SupportSection />
  </div>
</template>
