<script setup lang="ts">
import { type DocumentationArticleId, documentationExtras } from '~/utils/documentation'
import { editorScreenshots } from '~/utils/screenshotGallery'

const props = defineProps<{ article: DocumentationArticleId }>()
const { t, tm, rt, locale } = useI18n()
type Message = Parameters<typeof rt>[0]

interface ArticleSection {
  title: Message
  paragraphs?: Message[]
  items?: Message[]
  steps?: Message[]
  tip?: Message
  table?: { headers: Message[], rows: Message[][] }
}

const prefix = computed(() => `docs.articles.${props.article}`)
const sections = computed(() => Object.entries(tm(`${prefix.value}.sections`) as Record<string, ArticleSection>))
const extras = computed(() => documentationExtras[props.article])
const captures = computed(() => editorScreenshots(locale.value, 'dark'))
const { pages } = useDocumentation()
const suggested = computed(() => (extras.value?.related ?? [])
  .map(id => pages.value.find(page => page.article === id))
  .filter(page => page !== undefined))
const related = computed(() => pages.value.filter(page => page.article && page.article !== props.article && !suggested.value.includes(page)))

usePageSeo(() => ({ title: t(`${prefix.value}.title`), description: t(`${prefix.value}.description`) }))

/** Describes task articles and the FAQ in schema.org terms for search engines. */
const structuredData = computed(() => {
  const schema = extras.value?.schema
  if (!schema) {
    return undefined
  }
  const name = t(`${prefix.value}.title`)
  const description = t(`${prefix.value}.description`)
  const entries = sections.value.map(([, section]) => section)
  if (schema === 'faq') {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': entries.map(section => ({
        '@type': 'Question',
        'name': rt(section.title),
        'acceptedAnswer': { '@type': 'Answer', 'text': (section.paragraphs ?? []).map(paragraph => rt(paragraph)).join(' ') },
      })),
    }
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    'step': entries.flatMap(section => (section.steps ?? []).map(step => ({ '@type': 'HowToStep', 'text': rt(step) }))),
  }
})

useHead(() => ({
  script: structuredData.value
    ? [{ key: 'documentation-structured-data', type: 'application/ld+json', innerHTML: JSON.stringify(structuredData.value) }]
    : [],
}))

function captureFor(section: string) {
  const id = extras.value?.images?.[section]
  return captures.value.find(capture => capture.id === id)
}
</script>

<template>
  <DocumentationLayout
    :title="t(`${prefix}.title`)"
    :description="t(`${prefix}.description`)"
  >
    <p class="documentation-version">
      {{ t('docs.developmentNote') }}
    </p>
    <nav
      class="article-toc"
      :aria-label="t('docs.onThisPage')"
    >
      <p>{{ t('docs.onThisPage') }}</p>
      <ul role="list">
        <li
          v-for="[id, section] in sections"
          :key="id"
        >
          <a :href="`#${id}`">{{ rt(section.title) }}</a>
        </li>
      </ul>
    </nav>

    <section
      v-for="[id, section] in sections"
      :id="id"
      :key="id"
      class="article-section"
    >
      <h2>{{ rt(section.title) }}</h2>
      <p
        v-for="(paragraph, index) in section.paragraphs"
        :key="index"
      >
        {{ rt(paragraph) }}
      </p>
      <ol
        v-if="section.steps"
        class="article-list"
      >
        <li
          v-for="(step, index) in section.steps"
          :key="index"
        >
          {{ rt(step) }}
        </li>
      </ol>
      <ul
        v-if="section.items"
        class="article-list"
      >
        <li
          v-for="(item, index) in section.items"
          :key="index"
        >
          {{ rt(item) }}
        </li>
      </ul>
      <aside
        v-if="section.tip"
        class="article-tip"
      >
        <Icon
          name="lucide:lightbulb"
          aria-hidden="true"
        />
        <p>
          <strong>{{ t('docs.tip') }}</strong>
          {{ rt(section.tip) }}
        </p>
      </aside>
      <div
        v-if="section.table"
        class="article-table"
        role="region"
        :aria-label="rt(section.title)"
        tabindex="0"
      >
        <table>
          <caption class="visually-hidden">
            {{ rt(section.title) }}
          </caption>
          <thead>
            <tr>
              <th
                v-for="(heading, index) in section.table.headers"
                :key="index"
                scope="col"
              >
                {{ rt(heading) }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, rowIndex) in section.table.rows"
              :key="rowIndex"
            >
              <th scope="row">
                {{ rt(row[0]!) }}
              </th>
              <td
                v-for="(cell, index) in row.slice(1)"
                :key="index"
              >
                {{ rt(cell) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <pre
        v-if="extras?.code?.[id]"
        tabindex="0"
      ><code>{{ extras.code[id] }}</code></pre>
      <figure
        v-if="captureFor(id)"
        class="article-capture"
      >
        <img
          :src="captureFor(id)!.src"
          :srcset="captureFor(id)!.srcset"
          sizes="(min-width: 64rem) 48rem, 90vw"
          width="1600"
          height="900"
          :alt="t(`preview.slides.${captureFor(id)!.id}.alt`)"
          loading="lazy"
          decoding="async"
        >
        <figcaption>{{ t('docs.screenshotNote') }}</figcaption>
      </figure>
    </section>

    <section
      v-if="extras?.references"
      class="article-section"
    >
      <h2>{{ t('docs.completeReference') }}</h2>
      <p>{{ t('docs.referenceDescription') }}</p>
      <ul class="article-list">
        <li
          v-for="file in extras.references"
          :key="file"
        >
          <a
            :href="`/docs/reference/${file}`"
            download
          >{{ t('docs.downloadReference', { file }) }}</a>
        </li>
      </ul>
    </section>

    <section
      v-if="suggested.length"
      class="article-section article-next"
    >
      <h2>{{ t('docs.relatedGuides') }}</h2>
      <div class="article-next-cards">
        <NuxtLink
          v-for="page in suggested"
          :key="page.to"
          :to="page.to"
          class="article-next-card"
        >
          <Icon
            :name="page.icon"
            aria-hidden="true"
          />
          <span>
            <strong>{{ page.title }}</strong>
            <span>{{ page.description }}</span>
          </span>
        </NuxtLink>
      </div>
    </section>
    <details class="article-related">
      <summary>{{ t('docs.otherGuides') }}</summary>
      <ul class="article-list">
        <li
          v-for="page in related"
          :key="page.to"
        >
          <NuxtLink :to="page.to">{{ page.title }}</NuxtLink>
        </li>
      </ul>
    </details>
  </DocumentationLayout>
</template>

<style scoped lang="scss">
.documentation-version {
  padding: 0.875rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.875rem;
  background: var(--color-panel);
  border-left: 2px solid var(--color-accent);
  border-radius: var(--radius-sm);
}

.article-toc {
  padding-block: 1.5rem 2rem;

  p {
    @include label-text;

    color: var(--color-text-subtle);
  }

  ul {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1.25rem;
    margin-top: 0.75rem;
  }
}

.article-section {
  scroll-margin-top: calc(var(--header-height) + 1.5rem);
}

.article-tip {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  margin-top: 1.25rem;
  padding: 0.875rem 1rem;
  font-size: 0.9375rem;
  background: var(--color-panel);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);

  .iconify {
    flex: none;
    margin-top: 0.2rem;
    color: var(--color-accent-bright);
  }

  strong {
    color: var(--color-text);
  }

  p {
    margin: 0;
    color: var(--color-text-muted);
  }
}

.article-next-cards {
  display: grid;
  gap: 0.75rem;
  margin-top: 1rem;

  @include from($breakpoint-md) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.article-next-card {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  padding: 1rem;
  color: var(--color-text) !important;
  text-decoration: none !important;
  background: var(--color-panel);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);

  &:hover {
    border-color: var(--color-accent-line);
    background: var(--color-panel-hover);
  }

  .iconify {
    flex: none;
    margin-top: 0.15rem;
    color: var(--color-accent-bright);
    font-size: 1.125rem;
  }

  strong {
    display: block;
    font-size: 0.9375rem;
  }

  strong + span {
    display: block;
    margin-top: 0.25rem;
    color: var(--color-text-muted);
    font-size: 0.8125rem;
    line-height: 1.55;
  }
}

.article-list {
  padding-left: 1.5rem;
  margin-top: 1rem;

  li + li {
    margin-top: 0.6rem;
  }
}

.article-table {
  overflow-x: auto;
  margin-top: 1rem;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
    line-height: 1.6;
  }

  th,
  td {
    min-width: 7rem;
    padding: 0.875rem;
    vertical-align: top;
    text-align: left;
    border-bottom: 1px solid var(--color-line);
  }

  thead {
    background: var(--color-panel);
  }

  td {
    color: var(--color-text-muted);
  }

  tbody tr:last-child > * {
    border-bottom: 0;
  }
}

.article-capture {
  margin-top: 1.5rem;

  img {
    width: 100%;
    height: auto;
    border: 1px solid var(--color-line);
    border-radius: var(--radius-lg);
  }

  figcaption {
    margin-top: 0.75rem;
    color: var(--color-text-subtle);
    font-size: 0.8125rem;
  }
}

.article-related {
  padding: 1rem;
  margin-top: 2.5rem;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);

  summary {
    min-height: 2rem;
    font-weight: 600;
    cursor: pointer;
  }
}
</style>
