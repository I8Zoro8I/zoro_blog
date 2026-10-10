import {computed, type Ref} from 'vue'
import {articles, type ArticleSummary} from '../../theme/contentIndex'

export type HomeSearchResult = ArticleSummary & {isDoc: true}

const searchableArticles = articles.map((article) => ({
  article,
  haystack: [article.title, article.category, article.group, article.series, ...article.tags]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase('zh-CN')
}))

export function useHomeSearch(query: Ref<string>) {
  return computed<HomeSearchResult[]>(() => {
    const normalizedQuery = query.value.trim().toLocaleLowerCase('zh-CN')
    if (!normalizedQuery) return []

    return searchableArticles
      .filter(({haystack}) => haystack.includes(normalizedQuery))
      .map(({article}) => ({...article, isDoc: true as const}))
  })
}
