import {DefaultTheme} from 'vitepress';

export const nav: DefaultTheme.NavItem[] = [
    {

        text: '首页',
        link: '/' // 表示docs/index.md
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

        text: '动漫',
        items: [
            {

                text: '数据结构与算法',
                link: '/column/fan/' // 对应docs/column/Algorithm下的idnex.md文件
            }
        ]
    },
    // {
    //
    //     text: '个人成长',
    //     items: [
    //         {
    //
    //             text: '大江南北游记',
    //             link: '/column/Travel/' // 表示docs/column/Travel/index.md
    //         },
    //         {
    //
    //             text: '所思·所想',
    //             link: '/column/Growing/' // 表示docs/column/Growing/index.md
    //         }
    //     ]
    // },
    {

        text: '关于我',
        items: [
            {
                text: 'Github', link: 'https://github.com/Jacqueline712' },
            {

                text: 'bilibili',
                link: 'https://juejin.cn/user/3131845139247960/posts'
            },
            {

                text: '抖音',
                link: 'https://pzfqk98jn1.feishu.cn/wiki/space/7193915595975491587?ccm_open_type=lark_wiki_spaceLink'
            }
        ]
    }
];

