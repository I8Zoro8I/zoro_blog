export interface VisibilityConfig {
    /**
     * 是否在首页分类导航中展示。
     * 未配置时默认展示，只有显式设置为 false 才隐藏。
     */
    visible?: boolean;
}

export interface ArticleConfig extends VisibilityConfig {
    title: string;
    url: string;
}

export interface SeriesConfig extends VisibilityConfig {
    title: string;
    remark?: string;
    items: ArticleConfig[];
}

export type LinkConfig = ArticleConfig | SeriesConfig;

export interface GroupConfig extends VisibilityConfig {
    name: string;
    links: LinkConfig[];
}

export type CategoryChildConfig = GroupConfig | LinkConfig;

export interface CategoryConfig extends VisibilityConfig {
    name: string;
    id: string;
    icon?: string;
    children: CategoryChildConfig[];
}
