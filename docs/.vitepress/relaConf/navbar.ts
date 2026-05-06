import {DefaultTheme} from 'vitepress';

export const nav: DefaultTheme.NavItem[] = [
    {

        text: '首页',
        link: '/' // 表示docs/fanLink.md
    },
    {

        text: '开发',
        items: [
            {

                text: '数据结构与算法',
                link: '/column/Algorithm/' // 对应docs/column/Algorithm下的idnex.md文件
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
            }
        ]
    },
    {

        text: '关于我',
        items: [
            {
                text: 'Github', link: 'https://github.com/I8Zoro8I' },
            {

                text: 'bilibili',
                link: 'https://space.bilibili.com/179491448'
            },
            {

                text: '抖音',
                link: 'https://pzfqk98jn1.feishu.cn/wiki/space/7193915595975491587?ccm_open_type=lark_wiki_spaceLink'
            }
        ]
    }
];

