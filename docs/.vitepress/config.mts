import {defineConfig} from 'vitepress'
import {nav, sidebar} from './relaConf';
// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "My Awesome Project",
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
