import DefaultTheme from 'vitepress/theme';
import './custom.css';
// @ts-ignore
import {h} from 'vue'
// @ts-ignore
import Giscus from './components/Giscus.vue'
// @ts-ignore
import DocMetaPanel from './components/DocMetaPanel.vue'

export default {
    ...DefaultTheme,
    Layout() {
        return h(DefaultTheme.Layout, null, {
            'doc-footer-before': () => h(DocMetaPanel),
            /* 1. 评论组件 */
            'doc-after': () => h(Giscus)
        })
    }
};
