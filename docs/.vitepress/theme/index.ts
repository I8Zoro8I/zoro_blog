import DefaultTheme from 'vitepress/theme';
import './custom.css';
// @ts-ignore
import {Fragment, h} from 'vue'
// @ts-ignore
import Giscus from './components/Giscus.vue'
// @ts-ignore
import DocMetaPanel from './components/DocMetaPanel.vue'
// @ts-ignore
import DocEngagementPanel from './components/DocEngagementPanel.vue'
// @ts-ignore
import ReadingProgressNotice from './components/ReadingProgressNotice.vue'

export default {
    ...DefaultTheme,
    Layout() {
        return h(DefaultTheme.Layout, null, {
            'doc-before': () => h(ReadingProgressNotice),
            'doc-footer-before': () => h(DocMetaPanel),
            /* 1. 评论组件 */
            'doc-after': () => h(Fragment, null, [h(DocEngagementPanel), h(Giscus)])
        })
    }
};
