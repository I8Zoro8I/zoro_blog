export interface ChangelogItem {
    date: string
    title: string
    summary?: string
    items?: string[]
}

// @ts-ignore
export const changelogItems: ChangelogItem[] = [
    {
        date: '2026-06-10',
        title: '支持MD文件HTML代码块实时渲染',
    },
    {
        date: '2026-06-08',
        title: '文章头部添加上下翻页功能',
    },
    {
        date: '2026-06-05',
        title: '支持流程图mermaid',
    },
    {
        date: '2026-06-02',
        title: '首页更改为联级菜单',
    },
    {
        date: '2026-05-22',
        title: '多项功能优化',
        items: [
            '添加时间归档',
            '添加进度条',
            '数学公式样式完善'
        ]
    },
    {
        date: '2026-05-13',
        title: '支持数学公式代码块',
    },
    {
        date: '2026-05-08',
        title: '首页卡片优化',
    },
    {
        date: '2026-05-06',
        title: '集成功能',
        summary: 'Decap CMS管理后台,Giscus评论,Umami网站分析',
    },
    {
        date: '2026-04-30',
        title: 'Zoro Blog 2.0上线',
        summary: '摒弃Hexo 拥抱更轻量性能更好的Vitepress',
    },

]
