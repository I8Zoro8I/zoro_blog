// @ts-ignore
import categoriesData from '../relaConf/categories.json';

type Frontmatter = Record<string, any>;

type RawPageData = {
    title?: string;
    frontmatter?: Frontmatter;
    relativePath?: string;
    filePath?: string;
    lastUpdated?: number;
};

export type ArticleSummary = {
    title: string;
    link: string;
    date: string;
    sortTime: number;
    order: number;
    tags: string[];
    series: string | null;
    category: string | null;
    group: string | null;
    relativePath: string;
};

export type TaxonomySection = {
    name: string;
    anchor: string;
    count: number;
    articles: ArticleSummary[];
};

export type ArchiveMonthSection = {
    key: string;
    month: string;
    count: number;
    articles: ArticleSummary[];
};

export type ArchiveYearSection = {
    year: string;
    count: number;
    months: ArchiveMonthSection[];
};

type PathMeta = {
    category: string | null;
    group: string | null;
    series: string | null;
    tags: string[];
};

// @ts-ignore
const pageModules = import.meta.glob('../../column/**/*.md', {
    eager: true,
    import: '__pageData'
}) as Record<string, RawPageData>;

// @ts-ignore
const pathMetaMap = new Map<string, PathMeta>();
const siteBase = '/zoro_blog';

const pathFallbacks = [
    {
        prefix: '/column/blog/',
        category: '博客搭建',
        group: 'VitePress 博客',
        series: '博客搭建实录',
        tags: ['VitePress', '博客搭建']
    },
    {
        prefix: '/column/pgsql/',
        category: '服务端与数据库',
        group: 'PostgreSQL',
        series: 'PostgreSQL 实战',
        tags: ['PostgreSQL', '数据库']
    },
    {
        prefix: '/column/utils/',
        category: '工具合集',
        group: '效率工具',
        series: '工具合集',
        tags: ['工具', '效率']
    },
    {
        prefix: '/column/mac/',
        category: '效率工具',
        group: 'Mac',
        series: 'Mac 效率工具',
        tags: ['Mac', '效率工具']
    },
    {
        prefix: '/column/question/pm2/',
        category: '问题排查',
        group: 'PM2',
        series: 'PM2 问题排查',
        tags: ['PM2', 'Node 运维']
    },
    {
        prefix: '/column/ngnix/',
        category: '服务端与数据库',
        group: 'Nginx',
        series: 'Nginx 入门',
        tags: ['Nginx', '服务器']
    },
    {
        prefix: '/column/cloud/',
        category: '云服务',
        group: '云服务器',
        series: '云服务器实践',
        tags: ['云服务', '运维']
    },
    {
        prefix: '/column/AI/python/',
        category: 'AI 与数据工程',
        group: 'Python 基础',
        series: 'Python 基础',
        tags: ['Python', 'AI 基础']
    },
    {
        prefix: '/column/AI/pandas/',
        category: 'AI 与数据工程',
        group: 'Pandas 数据分析',
        series: 'Pandas 数据分析',
        tags: ['Pandas', '数据分析']
    },
    {
        prefix: '/column/AI/Numpy/',
        category: 'AI 与数据工程',
        group: 'NumPy 科学计算',
        series: 'NumPy 科学计算',
        tags: ['NumPy', '科学计算']
    },
    {
        prefix: '/column/AI/pyTorch/',
        category: 'AI 与数据工程',
        group: 'PyTorch',
        series: 'PyTorch 实战',
        tags: ['PyTorch', '深度学习']
    },
    {
        prefix: '/column/AI/math/',
        category: 'AI 与数据工程',
        group: '数学基础',
        series: '底层数学计算基石',
        tags: ['数学基础', 'AI 基础']
    },
    {
        prefix: '/column/AI/MachineLearning/data/',
        category: 'AI 与数据工程',
        group: '机器学习',
        series: '数据管道与特征工程',
        tags: ['机器学习', '数据工程']
    },
    {
        prefix: '/column/AI/MachineLearning/algorithm/',
        category: 'AI 与数据工程',
        group: '机器学习',
        series: '预测与决策算法模型',
        tags: ['机器学习', '算法']
    },
    {
        prefix: '/column/AI/MachineLearning/',
        category: 'AI 与数据工程',
        group: '机器学习',
        series: '机器学习生命周期',
        tags: ['机器学习', 'AI 基础']
    }
];

function toAnchor(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9\u4e00-\u9fa5-]/g, '')
        .replace(/-+/g, '-');
}

function normalizeLink(path: string): string {
    const withoutExt = `/${path.replace(/\\/g, '/').replace(/\.md$/, '')}`;
    // @ts-ignore
    if (withoutExt.endsWith('/index')) {
        return `${withoutExt.slice(0, -'/index'.length)}/`;
    }
    return withoutExt;
}

function normalizeRoutePath(path: string): string {
    let normalized = path.split('?')[0].split('#')[0];

    if (normalized === siteBase) {
        normalized = '/';
        // @ts-ignore
    } else if (normalized.startsWith(`${siteBase}/`)) {
        normalized = normalized.slice(siteBase.length);
    }

    normalized = normalized.replace(/\/index\.html$/, '/');
    normalized = normalized.replace(/\.html$/, '');
// @ts-ignore
    if (normalized.length > 1 && normalized.endsWith('/')) {
        normalized = normalized.slice(0, -1);
    }

    return normalized;
}

function normalizeStringArray(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value
            .map((item) => String(item).trim())
            .filter(Boolean);
    }

    if (typeof value === 'string') {
        return value
            .split(/[,\n]/)
            .map((item) => item.trim())
            .filter(Boolean);
    }

    return [];
}

function normalizeSeries(value: unknown): string | null {
    if (Array.isArray(value)) {
        // @ts-ignore
        const first = value.find(Boolean);
        return first ? String(first).trim() : null;
    }

    if (typeof value === 'string' && value.trim()) {
        return value.trim();
    }

    return null;
}

function parseDateToTime(value: unknown): number {
    if (typeof value !== 'string' || !value.trim()) {
        return 0;
    }

    const normalized = value
        .trim()
        .replace(/年/g, '-')
        .replace(/月/g, '-')
        .replace(/日/g, '')
        .replace(/\//g, '-');

    const time = Date.parse(normalized);
    // @ts-ignore
    return Number.isNaN(time) ? 0 : time;
}

function extractOrder(article: { title: string; relativePath: string }): number {
    const fileName = article.relativePath.split('/').pop() || '';
    const fileMatch = fileName.match(/^(\d+)/);

    if (fileMatch) {
        return Number(fileMatch[1]);
    }

    const titleMatch = article.title.match(/^(\d+)/);
    // @ts-ignore
    return titleMatch ? Number(titleMatch[1]) : Number.MAX_SAFE_INTEGER;
}

function unique(values: string[]): string[] {
    // @ts-ignore
    return [...new Set(values.filter(Boolean))];
}

function setPathMeta(link: string, meta: PathMeta): void {
    pathMetaMap.set(normalizeRoutePath(link), {
        category: meta.category,
        group: meta.group,
        series: meta.series,
        tags: unique(meta.tags)
    });
}

for (const category of categoriesData.categories || []) {
    for (const group of category.children || []) {
        for (const entry of group.links || []) {
            if (entry.items && entry.items.length > 0) {
                for (const item of entry.items) {
                    setPathMeta(item.url, {
                        category: category.name || null,
                        group: group.name || null,
                        series: entry.title || group.name || null,
                        tags: [category.name, group.name, entry.title].filter(Boolean)
                    });
                }
                continue;
            }

            if (entry.url) {
                setPathMeta(entry.url, {
                    category: category.name || null,
                    group: group.name || null,
                    series: group.name || null,
                    tags: [category.name, group.name].filter(Boolean)
                });
            }
        }
    }
}

function getFallbackMeta(link: string): PathMeta {
    const normalizedLink = normalizeRoutePath(link);
    const fromMap = pathMetaMap.get(normalizedLink);

    if (fromMap) {
        return fromMap;
    }
// @ts-ignore
    const matchedRule = pathFallbacks.find((rule) => normalizedLink.startsWith(normalizeRoutePath(rule.prefix)));

    if (matchedRule) {
        return {
            category: matchedRule.category,
            group: matchedRule.group,
            series: matchedRule.series,
            tags: matchedRule.tags
        };
    }

    return {
        category: null,
        group: null,
        series: null,
        tags: []
    };
}

function isIndexPage(relativePath: string): boolean {
    return /\/index\.md$/i.test(relativePath);
}

function createArticle(pageData: RawPageData): ArticleSummary | null {
    const relativePath = pageData.relativePath || pageData.filePath || '';

    if (!relativePath || isIndexPage(relativePath)) {
        return null;
    }

    const link = normalizeLink(relativePath);
    const fallbackMeta = getFallbackMeta(link);
    const frontmatter = pageData.frontmatter || {};
    const title = String(frontmatter.title || pageData.title || relativePath.split('/').pop() || '未命名文章').trim();
    const date = String(frontmatter.date || '').trim();
    const frontmatterTags = normalizeStringArray(frontmatter.tags);
    const tags = unique([...frontmatterTags, ...fallbackMeta.tags]);
    const series = normalizeSeries(frontmatter.series) || fallbackMeta.series;

    const article: ArticleSummary = {
        title,
        link,
        date,
        sortTime: parseDateToTime(date) || pageData.lastUpdated || 0,
        // @ts-ignore
        order: Number.MAX_SAFE_INTEGER,
        tags,
        series,
        category: fallbackMeta.category,
        group: fallbackMeta.group,
        relativePath
    };

    article.order = extractOrder(article);
    return article;
}

// @ts-ignore
export const articles = Object.values(pageModules)
    .map(createArticle)
    .filter((article): article is ArticleSummary => Boolean(article))
    .sort((a, b) => {
        if (b.sortTime !== a.sortTime) {
            return b.sortTime - a.sortTime;
        }

        return a.title.localeCompare(b.title, 'zh-CN');
    });

function createTaxonomySections(
    key: 'tags' | 'series',
    sorter?: (a: ArticleSummary, b: ArticleSummary) => number
): TaxonomySection[] {
    // @ts-ignore
    const map = new Map<string, ArticleSummary[]>();

    for (const article of articles) {
        const values = key === 'tags'
            ? article.tags
            : article.series
                ? [article.series]
                : [];

        for (const value of values) {
            const current = map.get(value) || [];
            current.push(article);
            map.set(value, current);
        }
    }

    return [...map.entries()]
        .map(([name, list]) => ({
            name,
            anchor: toAnchor(name),
            count: list.length,
            articles: [...list].sort(sorter || ((a, b) => b.sortTime - a.sortTime))
        }))
        .sort((a, b) => {
            if (b.count !== a.count) {
                return b.count - a.count;
            }

            return a.name.localeCompare(b.name, 'zh-CN');
        });
}

export const tagSections = createTaxonomySections('tags');

export const seriesSections = createTaxonomySections(
    'series',
    (a, b) => {
        if (a.order !== b.order) {
            return a.order - b.order;
        }

        if (a.sortTime !== b.sortTime) {
            return a.sortTime - b.sortTime;
        }

        return a.title.localeCompare(b.title, 'zh-CN');
    }
);

function padMonth(value: number): string {
    // @ts-ignore
    return String(value).padStart(2, '0');
}

function getArchiveParts(article: ArticleSummary): { year: string; month: string } {
    const date = article.sortTime ? new Date(article.sortTime) : null;

    // @ts-ignore
    if (!date || Number.isNaN(date.getTime())) {
        return {
            year: '未填写日期',
            month: '未分组'
        };
    }

    return {
        year: String(date.getFullYear()),
        month: `${padMonth(date.getMonth() + 1)} 月`
    };
}

export const archiveSections: ArchiveYearSection[] = (() => {
    // @ts-ignore
    const yearMap = new Map<string, Map<string, ArticleSummary[]>>();

    for (const article of articles) {
        const parts = getArchiveParts(article);
        // @ts-ignore
        const months = yearMap.get(parts.year) || new Map<string, ArticleSummary[]>();
        const list = months.get(parts.month) || [];
        list.push(article);
        months.set(parts.month, list);
        yearMap.set(parts.year, months);
    }

    return [...yearMap.entries()]
        .map(([year, months]) => ({
            year,
            count: [...months.values()].reduce((total, list) => total + list.length, 0),
            months: [...months.entries()]
                .map(([month, list]) => ({
                    key: `${year}-${month}`,
                    month,
                    count: list.length,
                    articles: [...list].sort((a, b) => b.sortTime - a.sortTime)
                }))
                .sort((a, b) => {
                    if (year === '未填写日期') {
                        return a.month.localeCompare(b.month, 'zh-CN');
                    }

                    return Number(b.month.slice(0, 2)) - Number(a.month.slice(0, 2));
                })
        }))
        .sort((a, b) => {
            if (a.year === '未填写日期') {
                return 1;
            }

            if (b.year === '未填写日期') {
                return -1;
            }

            return Number(b.year) - Number(a.year);
        });
})();

// @ts-ignore
const articleMap = new Map(
    articles.map((article) => [normalizeRoutePath(article.link), article])
);

export function getArticleByPath(path: string): ArticleSummary | null {
    return articleMap.get(normalizeRoutePath(path)) || null;
}

export function getTagAnchor(tag: string): string {
    return toAnchor(tag);
}

export function getSeriesAnchor(series: string): string {
    return toAnchor(series);
}
