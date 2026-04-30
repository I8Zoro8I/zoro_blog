import {defineConfig} from 'vitepress'
import {nav, sidebar} from './relaConf';
// https://vitepress.dev/reference/site-config11
export default defineConfig({
    base: '/zoro_blog/',
    title: "My Awesome Project",// 这里将会影响之后生成的根路径
    description: "A VitePress Site",
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        logo: '/avatar.png', // 表示docs/public/avatar.png
        nav: nav,
        //
        sidebar:sidebar,
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
