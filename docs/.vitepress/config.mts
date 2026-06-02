import {defineConfig} from 'vitepress'
import {nav, sidebar} from './relaConf';
// 1. 彻底停用并注释掉之前容易导致样式碎掉的 markdown-it-katex 插件
// import katex from 'markdown-it-katex'

// @ts-ignore
// @ts-ignore
export default defineConfig({
    lang: 'zh-CN',
    base: '/zoro_blog/',
    cleanUrls: true,
    head: [
        ['link', { rel: 'icon', href: '/zoro_blog/images/logo.png' }],
        // 2. 核心：通过全局配置项告诉 MathJax，直接寻找页面上的 $ 和 $$ 并接管它们
        [
            'script',
            {},
            `
          window.MathJax = {
            tex: {
              inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
              displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
              processEscapes: true
            },
            options: {
              // 关键：只处理带这两个类名或特定区域的数学公式
              processHtmlClass: 'tex2jax_process'
            }
          };
          `
        ],
        // 3. 核心：引入官方功能最全、抗干扰能力最强的 tex-mml-chtml 引擎
        [
            'script',
            {
                src: 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js',
                id: 'MathJax-script',
                async: 'true'
            }
        ],
        // Umami 统计
        [
            'script',
            {
                async: '',
                defer: '',
                src: 'https://cloud.umami.is/script.js',
                'data-website-id': '6e4a1d59-7078-490f-9521-7b833f23befe'
            }
        ]
    ],
    appearance: 'dark',
    title: "zoro's Blog",
    description: "记录成长，分享技术与生活 | zoro 个人博客",
    themeConfig: {
        logo: '/images/avatar.png',
        nav: nav,
        sidebar: sidebar,
        search: { provider: 'local' },
        socialLinks: [{ icon: 'github', link: 'https://github.com/vuejs/vitepress' }],
        // @ts-ignore
        outline: { level: [1, 4], label: '页面大纲', deep: true },
        lastUpdated: {
            text: '最后更新于',
            formatOptions: { dateStyle: 'full', timeStyle: 'medium' } as any
        },
        footer: {
            message: '基于 VitePress 驱动',
            copyright: `版权所有 © 2024-${new Date().getFullYear()} Zoro`
        },
        docFooter: { prev: '上一篇', next: '下一篇' },
        editLink: {
            pattern: 'https://github.com/I8zoro8I/zoro_blog/edit/main/docs/:path',
            text: '在 GitHub 上编辑此页'
        },
    },
    // 4. 清空 markdown 插件配置，让文档原封不动地吐出 $$
    // 这样前端加载好后，MathJax 脚本就会自动把原本完好的 $$ 变成和 Typora 精度一模一样的矢量公式
    markdown: {}
})