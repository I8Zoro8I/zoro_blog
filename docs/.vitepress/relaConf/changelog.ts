export interface ChangelogItem {
    date: string
    title: string
    summary?: string
    items?: string[]
}

// @ts-ignore
export const changelogItems: ChangelogItem[] = [
    {
        date: '2026-09-11',
        title: '首页优化',
        items: [
            '首页增加“最近更新”“学习路线”“继续阅读”。继续阅读只使用浏览器 localStorage，不引入后端或隐私数据上报',
            '首页搜索升级为文章标题、标签、系列、分类、分组的统一检索，并显示所属系列。',
            '文章底部增加学习路径进度和相关推荐，按同系列、分组、分类、标签计算权重。'
        ]
    },
    {
        date: '2026-09-09',
        title: '首页渲染样式修改:支持卡片跟列表展示',
    },
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
