const assert = require('node:assert/strict')
const {test} = require('node:test')
const {createRequire} = require('node:module')
const path = require('node:path')
const vm = require('node:vm')
const fs = require('node:fs')

const root = path.resolve(__dirname, '..')
const projectRequire = createRequire(path.join(root, 'package.json'))
const vpRequire = createRequire(projectRequire.resolve('vitepress/package.json'))
const viteRequire = createRequire(vpRequire.resolve('vite/package.json'))
const esbuild = viteRequire('esbuild')
const vue = vpRequire('vue')
const source = relative => path.join(root, 'docs/.vitepress', relative)
const resolveDependency = name => {
    try { return projectRequire(name) } catch (error) {
        if (error.code !== 'MODULE_NOT_FOUND') throw error
        return vpRequire(name)
    }
}

function load(relative, globals = {}) {
    const result = esbuild.buildSync({
        entryPoints: [source(relative)], bundle: true, write: false,
        platform: 'node', format: 'cjs', packages: 'external'
    })
    const module = {exports: {}}
    vm.runInNewContext(result.outputFiles[0].text, {
        module, exports: module.exports, require: resolveDependency, ...globals
    })
    return module.exports
}

function memoryStorage() {
    const values = new Map()
    return {
        get length() { return values.size },
        key: index => [...values.keys()][index] ?? null,
        getItem: key => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, value),
        removeItem: key => values.delete(key)
    }
}

test('路径统一兼容中文、站点前缀、旧后缀及异常编码', () => {
    const {normalizeRoutePath: normalize} = load('shared/routes.ts')
    for (const value of ['/column/中文', '/zoro_blog/column/%E4%B8%AD%E6%96%87.html?q=1#part',
        '/column/中文.md', '/column/中文/']) {
        assert.equal(normalize(value), '/column/中文')
    }
    assert.equal(normalize('/zoro_blog/index.html'), '/')
    assert.equal(normalize('/zoro_blog-other/a.html'), '/zoro_blog-other/a')
    assert.equal(normalize('/column/%invalid'), '/column/%invalid')
})

test('历史评价键迁移、进度别名合并及损坏数据过滤', () => {
    const window = {localStorage: memoryStorage()}
    const storage = load('theme/utils/storage.ts', {window})
    window.localStorage.setItem('rating:/zoro_blog/column/%E4%B8%AD%E6%96%87.html', 'helpful')
    assert.equal(storage.getRouteStoredValue('rating:', '/column/中文'), 'helpful')
    assert.equal(window.localStorage.getItem('rating:/column/中文'), 'helpful')
    const progress = load('theme/utils/readingProgress.ts', {window})
    const prefix = progress.PROGRESS_PREFIX
    window.localStorage.setItem(prefix + '/column/中文', '{"percent":20,"updatedAt":"2026-01-01"}')
    window.localStorage.setItem(prefix + '/zoro_blog/column/%E4%B8%AD%E6%96%87.html',
        '{"percent":60,"updatedAt":"2026-02-01"}')
    window.localStorage.setItem(prefix + '/bad', '{"percent":120,"updatedAt":"bad"}')
    assert.equal(progress.getReadingRecords().size, 1)
    assert.equal(progress.getReadingRecords().get('/column/中文').percent, 60)
    assert.equal(progress.parseProgress('{"percent":"30","updatedAt":"2026-01-01"}'), null)
})

test('SSR 和存储禁用时安全降级', () => {
    for (const globals of [{}, {window: {get localStorage() { throw Error('disabled') }}}]) {
        const storage = load('theme/utils/storage.ts', globals)
        assert.equal(storage.getStoredValue('x'), null)
        assert.equal(storage.setStoredValue('x', 'y'), false)
        assert.equal(storage.removeStoredValue('x'), false)
        assert.equal(storage.getStorageKeys('x').length, 0)
    }
})

test('延迟进度写入保持捕获路径，重复刷新不重复写入', () => {
    const {createProgressWriter} = load('theme/utils/readingProgress.ts')
    const writes = []
    const writer = createProgressWriter((path, value) => writes.push({path, percent: value.percent}))
    writer.capture('/column/A', 25)
    writer.capture('/column/A', 40)
    writer.flush()
    writer.flush()
    writer.capture('/column/B', 10)
    writer.flush()
    assert.deepEqual(writes, [{path: '/column/A', percent: 40}, {path: '/column/B', percent: 10}])
})

test('线性分页与原有排列规则等价，覆盖混合目录、模式和小容器', () => {
    const {buildPageRanges} = load('components/composables/useHomePagination.ts')
    function reference(items, columns, height, mode) {
        if (!items.length) return [{start: 0, end: 0}]
        function fits(batch) {
            if (!columns || !height) return batch.length <= 12
            const folders = batch.filter(item => !item.url && !item.isDoc).length
            const docs = batch.length - folders
            function section(count) {
                if (!count) return 0
                const rows = Math.ceil(count / (mode === 'list' ? 1 : columns))
                return rows * (mode === 'list' ? 52 : 90) + (rows - 1) * (mode === 'list' ? 8 : 16)
            }
            return section(folders) + section(docs) + (folders && docs ? 24 : 0) <= height + 36
        }
        const result = []
        for (let start = 0; start < items.length;) {
            let end = start
            while (end < items.length && fits(items.slice(start, end + 1))) end++
            end = Math.max(end, start + 1)
            result.push({start, end})
            start = end
        }
        return result
    }
    for (const count of [0, 1, 12, 13, 37, 265]) {
        const items = Array.from({length: count}, (_, index) =>
            index % 3 === 0 ? {} : index % 2 ? {url: '/article'} : {isDoc: true})
        for (const columns of [0, 1, 3, 8]) for (const height of [0, 1, 160, 500, 2000]) {
            for (const mode of ['card', 'list']) {
                assert.equal(JSON.stringify(buildPageRanges(items, columns, height, mode)),
                    JSON.stringify(reference(items, columns, height, mode)))
            }
        }
    }
})

test('分类遍历覆盖直接文章、系列和分组，保留隐藏条目供索引使用', () => {
    const {collectCategoryArticles} = load('relaConf/categories/walk.ts')
    const items = collectCategoryArticles({categories: [{name: '分类', children: [
        {title: '直接文章', url: '/a', visible: false},
        {title: '系列', items: [{title: '文章', url: '/b'}]},
        {name: '分组', links: [{title: '文章', url: '/c'}]}
    ]}]})
    assert.equal(items.length, 3)
    assert.equal(items[1].series, '系列')
    assert.equal(items[2].group, '分组')
})

test('搜索保留章节锚点、正文和行内 API，排除代码及隐藏控件', async () => {
    const {createMarkdownRenderer} = await import('vitepress')
    const md = await createMarkdownRenderer(path.join(root, 'docs'))
    const {renderSearchContent, readableTextFromTokens, countReadingWords} = load('build/readableContent.ts')
    const markdown = '# 标题\n\n## API章节\n\n正文 `getUser()` 调用。\n\n' +
        '```js\nSECRET_CODE\n```\n\n    INDENTED_SECRET\n\n' +
        '<div><h2 id="raw-heading">原始标题</h2><p>HTML正文</p>' +
        '<button>BUTTON_SECRET</button><span hidden>HIDDEN_SECRET</span>' +
        '<pre>RAW_CODE_SECRET</pre><script>SCRIPT_SECRET</script></div>\n\n' +
        '段落 <span aria-hidden="true">INLINE_SECRET</span>结束。\n'
    const env = {path: '/fixture.md', relativePath: 'fixture.md'}
    const html = renderSearchContent(markdown, env, md)
    assert.match(html, /id="api章节"/)
    assert.match(html, /id="raw-heading"/)
    assert.match(html, /<h2[^>]*>API章节\s*<a href="#api章节"><\/a><\/h2>/)
    assert.match(html, /<h2[^>]*>原始标题<a href="#raw-heading"><\/a><\/h2>/)
    assert.match(html, /getUser\(\)/)
    assert.match(html, /HTML正文/)
    assert.doesNotMatch(html, /SECRET/)
    const text = readableTextFromTokens(md.parse(markdown, {...env}))
    assert.doesNotMatch(text, /SECRET/)
    assert.match(text, /getUser\(\)/)
    assert.equal(renderSearchContent('---\nsearch: false\n---\n# 隐藏', {...env}, md), '')
    assert.equal(countReadingWords('中文 getUser API').characterCount, 2)
    assert.equal(countReadingWords('中文 getUser API').wordCount, 2)
    assert.match(md.render('```js\nNORMAL_CODE\n```', {...env}), /NORMAL_CODE/)
})

test('文章切换在 700ms 保存前刷新旧快照，不读取下一篇 DOM', async () => {
    const compiler = vpRequire('@vue/compiler-sfc')
    const component = compiler.parse(fs.readFileSync(source('theme/components/ReadingProgressNotice.vue'), 'utf8'))
    const script = compiler.compileScript(component.descriptor, {id: 'progress-test'})
    const module = {exports: {}}
    const route = vue.reactive({path: '/zoro_blog/column/A.html'})
    const page = vue.ref({relativePath: 'column/A.md'})
    const callbacks = {mounted: [], unmounted: [], watchers: []}
    const timers = new Map()
    const frames = new Map()
    let sequence = 0
    const window = {
        localStorage: memoryStorage(), scrollY: 400, innerHeight: 1000,
        setTimeout: callback => { timers.set(++sequence, callback); return sequence },
        clearTimeout: id => timers.delete(id),
        requestAnimationFrame: callback => { frames.set(++sequence, callback); return sequence },
        cancelAnimationFrame: id => frames.delete(id),
        addEventListener() {}, removeEventListener() {}
    }
    const progress = load('theme/utils/readingProgress.ts', {window})
    const js = esbuild.transformSync(script.content, {loader: 'ts', format: 'cjs'}).code
    vm.runInNewContext(js, {
        module, exports: module.exports, window,
        document: {documentElement: {scrollHeight: 2000, scrollTop: 0}},
        require(name) {
            if (name === 'vue') return {...vue,
                onMounted: callback => callbacks.mounted.push(callback),
                onBeforeUnmount: callback => callbacks.unmounted.push(callback),
                watch: (_, callback) => callbacks.watchers.push(callback)}
            if (name === 'vitepress') return {useRoute: () => route,
                useData: () => ({site: vue.ref({base: '/zoro_blog/'}), page})}
            if (name.includes('shared/routes')) return load('shared/routes.ts')
            if (name.includes('contentIndex')) return {getArticleByPath: path => /^\/column\/[AB]$/.test(path) ? {} : null}
            if (name.includes('readingProgress')) return progress
            throw Error(`Unexpected import ${name}`)
        }
    })
    const state = module.exports.default.setup({}, {expose() {}})
    async function settle() {
        await new Promise(resolve => setImmediate(resolve))
        for (const callback of frames.values()) callback()
        frames.clear()
    }
    callbacks.mounted.forEach(callback => callback())
    await settle()
    state.schedulePersist()
    assert.equal(timers.size, 1)
    route.path = '/zoro_blog/column/B.html'
    callbacks.watchers.forEach(callback => callback())
    window.scrollY = 0
    await settle()
    assert.equal(timers.size, 0)
    assert.equal(progress.getReadingRecords().get('/column/A').percent, 40)
    assert.equal(progress.getReadingRecords().has('/column/B'), false)
    window.scrollY = 800
    state.schedulePersist()
    assert.equal(timers.size, 0, '新路由尚未加载正文时不能采集旧页面滚动')
    page.value.relativePath = 'column/B.md'
    callbacks.watchers.forEach(callback => callback())
    await settle()
    window.scrollY = 200
    state.schedulePersist()
    callbacks.unmounted.forEach(callback => callback())
    assert.equal(progress.getReadingRecords().get('/column/B').percent, 20)
    assert.equal(timers.size, 0)
})
