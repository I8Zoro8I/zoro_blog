import {defineConfig} from 'vitepress'
import {nav, sidebar} from './relaConf';
import AutoSidebar from 'vite-plugin-vitepress-auto-sidebar';
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
    },
    vite: {
        plugins: [
            // 调用插件
            AutoSidebar({
                // 这里的配置可以根据需要调整
                path: '/docs', // 扫描哪个目录，默认是 docs
                collapsed: false, // 侧边栏是否默认折叠
                // 你还可以通过 ignoreList 忽略某些文件，比如 index.md
                ignoreList: ['index.md'],
            })
        ]
    }
})
