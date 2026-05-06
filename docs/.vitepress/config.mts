import {defineConfig} from 'vitepress'
import {nav, sidebar} from './relaConf';
// @ts-ignore
export default defineConfig({
    // base: '/zoro_blog/',
    base: '/',
    //github page  '/zoro_blog/'
    cleanUrls: true, // 加上这一行
    /* 核心配置：在 HTML 的 <head> 中添加图标链接 */
    head: [
        /* 注意：因为你的项目 base 是 /zoro_blog/，路径需包含前缀 */
        ['link', {rel: 'icon', href: '/zoro_blog/images/logo.png'}]
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
        outline: {

            level: [2, 6],
            label: '文章目录'
        }
    }
})
