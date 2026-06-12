import {DefaultTheme} from 'vitepress';

export const nav: DefaultTheme.NavItem[] = [
    {

        text: '首页',
        link: '/' // 表示docs/fanLink.md
    },
    {

        text: '技术专栏',
        items: [
            {

                text: '博客架构介绍',
                link: '/column/blog/' // 对应docs/column/Algorithm下的idnex.md文件
            },
            {
                text: '机器学习', // 专门分一组放你的硬核算法文章
                items: [
                    { text: '黑神话悟空-用户分析', link: '/column/AI/MachineLearning/project/03客户分群' },
                    { text: '无畏契约-胜负预测', link: '/column/AI/MachineLearning/project/06VCT预测胜负' }
                ]
            },
            {
                text: '深度学习', // 专门分一组放你的硬核算法文章
                items: [
                    { text: '烟叶视觉识别', link: '/column/AI/pyTorch/番外-视觉识别烟叶种类' }
                ]
            },
            // 👇 为 PySpark 核心工程与数仓调优单开一栏
            {
                text: '大数据与数据工程',
                items: [
                    { text: '百万级用户画像：PySpark清洗与聚类', link: '/column/AI/ApacheSpark/pySpark/05实战客户分析' }
                ]
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

                text: '更新日志',
                link: '/changelog/'
            },
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

        text: '开源项目',
        items: [
            {

                text: '烟草一体化管控系统',
                link: 'https://gitee.com/zoro869466424'
            }
        ]
    },
    {

        text: '联系我',
        items: [
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
