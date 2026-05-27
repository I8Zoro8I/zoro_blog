import {defineConfig} from 'vitepress'
import {nav, sidebar} from './relaConf';
// @ts-ignore
import katex from 'markdown-it-katex'
// @ts-ignore
export default defineConfig({
    lang: 'zh-CN', // 设置页面的 lang 属性
    base: '/zoro_blog/',
    // base: '/',
    //github page  '/zoro_blog/'
    cleanUrls: true, // 加上这一行
    /* 核心配置：在 HTML 的 <head> 中添加图标链接 */
    head: [
        /* 注意：因为你的项目 base 是 /zoro_blog/，路径需包含前缀 */
        [
            'link',
            {
                rel: 'stylesheet',
                href: 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css'
            }
        ],
        ['link', {rel: 'icon', href: '/zoro_blog/images/logo.png'}],
        [
            'script',
            {
                async: '',
                defer: '',
                src: 'https://cloud.umami.is/script.js', // 如果是自建，换成你的域名
                'data-website-id': '6e4a1d59-7078-490f-9521-7b833f23befe'    // 替换为实际 ID
            }
        ]
    ],
    appearance: 'dark',
    title: "zoro's Blog",// 这里将会影响之后生成的根路径
    description: "记录成长，分享技术与生活 | zoro 个人博客",
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        logo: '/images/avatar.png', // 表示docs/public/avatar.png
        nav: nav,
        //
        sidebar: sidebar,
        search: {

            provider: 'local'
        },
        socialLinks: [
            {icon: 'github', link: 'https://github.com/vuejs/vitepress'}
        ],
        // 右侧大纲的标题映射
        outline: {

            level: [1, 4],
            label: '页面大纲',
            // @ts-ignore
            deep: true     // 开启深度按需加载/折叠
        },
        // 显示最后更新时间
        lastUpdated: {
            text: '最后更新于',
            formatOptions: {
                dateStyle: 'full',
                timeStyle: 'medium'
            } as any
        },
        // 自定义页脚
        footer: {
            message: '基于 VitePress 驱动',
            copyright: `版权所有 © 2024-${new Date().getFullYear()} Zoro`
        },
        // 文档页面的翻页按钮文字
        docFooter: {
            prev: '上一篇',
            next: '下一篇'
        },
        // 编辑链接：允许读者直接在 GitHub 上纠错
        editLink: {
            pattern: 'https://github.com/I8zoro8I/zoro_blog/edit/main/docs/:path',
            text: '在 GitHub 上编辑此页'
        },
    },
    markdown: {
        config: (md) => {
            md.use(katex)
        }
    }
})
