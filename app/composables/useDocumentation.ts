import { type DocumentationArticleId, documentationArticles } from '~/utils/documentation'

/** Stable documentation routes shared by the index and the article sidebar. */
export function useDocumentation() {
  const { t } = useI18n()
  const localePath = useLocalePath()
  const pages = computed(() => [
    { to: localePath('/docs'), title: t('docs.overview'), description: t('docs.description'), icon: 'lucide:book-open', group: 'overview', article: undefined },
    ...Object.entries(documentationArticles).map(([id, page]) => ({
      to: localePath(`/docs/${page.slug}`),
      title: t(`docs.articles.${id}.title`),
      description: t(`docs.articles.${id}.description`),
      icon: page.icon,
      group: page.group,
      article: id as DocumentationArticleId,
    })),
    { to: localePath('/docs/licenses'), title: t('docs.licenses.title'), description: t('docs.licenses.description'), icon: 'lucide:scale', group: 'about', article: undefined },
    { to: localePath('/docs/sources'), title: t('docs.sources.title'), description: t('docs.sources.description'), icon: 'lucide:code-xml', group: 'about', article: undefined },
  ])
  const groups = computed(() => ['overview', 'guides', 'reference', 'nativeFormats', 'about'].map(id => ({
    id,
    title: t(`docs.groups.${id}`),
    pages: pages.value.filter(page => page.group === id),
  })))
  return { pages, groups }
}
