import DefaultTheme from 'vitepress/theme';
import './custom.css';
// @ts-ignore
import { h } from 'vue'
// @ts-ignore
import Giscus from './components/Giscus.vue' /* 路径根据你实际位置调整 */
export default {

    ...DefaultTheme,
    Layout() {
        return h(DefaultTheme.Layout, null, {
            /* 在文档内容的末尾插入评论组件 */
            'doc-after': () => h(Giscus)
        })
    }
};