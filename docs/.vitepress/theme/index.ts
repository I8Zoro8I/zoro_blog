import DefaultTheme from 'vitepress/theme';
import './custom.css';
// @ts-ignore
import {Fragment, h} from 'vue'
import {useData} from 'vitepress'
// @ts-ignore
import Giscus from './components/Giscus.vue'
// @ts-ignore
import DocMetaPanel from './components/DocMetaPanel.vue'
// @ts-ignore
import DocEngagementPanel from './components/DocEngagementPanel.vue'
// @ts-ignore
import ReadingProgressNotice from './components/ReadingProgressNotice.vue'
// @ts-ignore
import DocPrevNextTop from './components/DocPrevNextTop.vue'
// @ts-ignore
import CustomHome from '../components/CustomHome.vue'
// @ts-ignore
import ArchivePage from './components/ArchivePage.vue'
// @ts-ignore
import TagsPage from './components/TagsPage.vue'
// @ts-ignore
import NavCascadeMenu from './components/NavCascadeMenu.vue'
// @ts-ignore
import MermaidRenderer from './components/MermaidRenderer.vue'
// @ts-ignore
import HtmlPreview from './components/HtmlPreview.vue'
// @ts-ignore
import ChangelogTimeline from './components/ChangelogTimeline.vue'

export default {
    ...DefaultTheme,
    enhanceApp({ app }) {
        // 注册为全局组件
        app.component('CustomHome', CustomHome)
        app.component('TagsPage', TagsPage)
        app.component('ArchivePage', ArchivePage)
        app.component('HtmlPreview', HtmlPreview)
        app.component('ChangelogTimeline', ChangelogTimeline)
    },
    Layout() {
        const {page} = useData()
        // @ts-ignore
        const hiddenDocAfterPages = new Set([
            'archive/index.md',
            'tags/index.md',
            'changelog/index.md'
        ])

        return h(DefaultTheme.Layout, null, {
            'nav-bar-content-after': () => h(NavCascadeMenu),
            'doc-before': () => h(Fragment, null, [h(DocPrevNextTop), h(ReadingProgressNotice)]),
            'doc-footer-before': () => h(DocMetaPanel),
            'doc-after': () => hiddenDocAfterPages.has(page.value.relativePath)
                ? null
                : h(Fragment, null, [h(MermaidRenderer), h(DocEngagementPanel), h(Giscus)])
        })
    }
};
