import {DefaultTheme} from 'vitepress';

export const nav: DefaultTheme.NavItem[] = [
    {

        text: '首页',
        link: '/' // 表示docs/fanLink.md
    },
    {

        text: '博客',
        items: [
            {

                text: '技术架构介绍',
                link: '/column/blog/' // 对应docs/column/Algorithm下的idnex.md文件
            }
        ]
    },
    {

        text: '工具合集',
        items: [
            {

                text: '动漫网站链接',
                link: '/column/utils/fanLink' // 对应docs/column/Algorithm下的idnex.md文件
            },
            {
                text: '破解游戏软件',
                link: '/column/utils/gameCrack'
            },
            {
                text: '终端工具推荐',
                link: '/column/utils/terminal'
            }
        ]
    },
    {

        text: '笔记',
        items: [
            {

                text: 'AI工程岗',
                link: '/column/AI/'
            }
        ]
    },
    {

        text: '联系我',
        items: [
            {
                text: 'Github', link: 'https://github.com/I8Zoro8I'
            },
            {

                text: 'bilibili',
                link: 'https://space.bilibili.com/179491448'
            },
            {

                text: '抖音',
                link: 'https://v.douyin.com/AnOvAGcLGqM/ '
            }
        ]
    }
];

