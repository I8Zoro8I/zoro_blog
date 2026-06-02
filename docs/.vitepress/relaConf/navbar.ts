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
                text: '终端工具推荐',
                link: '/column/utils/terminal'
            }
        ]
    },
    {

        text: '发现',
        items: [
            {

                text: '标签导航',
                link: '/tags/'
            },
            {

                text: '时间归档',
                link: '/archive/'
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
                text: 'Gitee',
                link: 'https://gitee.com/zoro869466424'
            },
            {

                text: 'bilibili',
                link: 'https://space.bilibili.com/179491448'
            },
            {

                text: '抖音',
                link: 'https://v.douyin.com/AnOvAGcLGqM/ '
            },

        ]
    }
];
