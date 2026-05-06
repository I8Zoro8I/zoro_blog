import {defineConfig} from 'vitepress'
import {nav, sidebar} from './relaConf';
// @ts-ignore
export default defineConfig({
    // base: '/zoro_blog/',
    base :'/',
    //github page  '/zoro_blog/'
    cleanUrls: true, // 加上这一行
    appearance: 'dark',
    title: "My Awesome Project",// 这里将会影响之后生成的根路径
    description: "A VitePress Site",
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        logo: '/avatar.png', // 表示docs/public/avatar.png
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
            label: '目录'
        }
    }
})
