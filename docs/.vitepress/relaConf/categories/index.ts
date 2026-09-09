import {aiEngineeringCategory} from './ai-engineering';
import {backendCategory} from './backend';
import {blogCategory} from './blog';
import {codexCategory} from './codex';
import {linuxCategory} from './linux';
import {llmApplicationCategory} from './llm-application';
import {macosCategory} from './macos';
import {toolboxCategory} from './toolbox';
import {troubleshootingCategory} from './troubleshooting';
import type {ArticleConfig, CategoryChildConfig, CategoryConfig, GroupConfig, LinkConfig, SeriesConfig} from './types';
import {windowsCategory} from './windows';

const categories: CategoryConfig[] = [
    backendCategory,
    aiEngineeringCategory,
    llmApplicationCategory,
    troubleshootingCategory,
    toolboxCategory,
    blogCategory,
    macosCategory,
    windowsCategory,
    codexCategory,
    linuxCategory
];

function isVisible(node: { visible?: boolean }): boolean {
    return node.visible !== false;
}

function isSeries(link: LinkConfig): link is SeriesConfig {
    return 'items' in link;
}

function filterLink(link: LinkConfig): LinkConfig | null {
    if (!isVisible(link)) {
        return null;
    }

    if (!isSeries(link)) {
        return link;
    }

    const items: ArticleConfig[] = link.items.filter(isVisible);
    return items.length > 0 ? {...link, items} : null;
}

function filterGroup(group: GroupConfig): GroupConfig | null {
    if (!isVisible(group)) {
        return null;
    }

    const links = group.links
        .map(filterLink)
        .filter((link): link is LinkConfig => link !== null);

    return links.length > 0 ? {...group, links} : null;
}

function filterCategoryChild(child: CategoryChildConfig): CategoryChildConfig | null {
    return 'links' in child ? filterGroup(child) : filterLink(child);
}

function filterCategory(category: CategoryConfig): CategoryConfig | null {
    if (!isVisible(category)) {
        return null;
    }

    const children = category.children
        .map(filterCategoryChild)
        .filter((child): child is CategoryChildConfig => child !== null);

    return children.length > 0 ? {...category, children} : null;
}

/**
 * 原始分类数据供侧边栏、文章索引等现有功能使用。
 * visible 字段不影响这些功能。
 */
export const rawCategoriesData = {
    categories
};

/**
 * 首页专用数据：过滤隐藏节点，并移除过滤后为空的分组和分类。
 */
export const homeCategoriesData = {
    categories: categories
        .map(filterCategory)
        .filter((category): category is CategoryConfig => category !== null)
};

export type {
    ArticleConfig,
    CategoryChildConfig,
    CategoryConfig,
    GroupConfig,
    LinkConfig,
    SeriesConfig
} from './types';
