const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const zlib = require('node:zlib')
const {createRequire} = require('node:module')

const root = path.resolve(__dirname, '..')
const requireVP = createRequire(require.resolve('vitepress/package.json'))
const requireVite = createRequire(requireVP.resolve('vite/package.json'))
const esbuild = requireVite('esbuild')
const MiniSearch = requireVP('minisearch')
const assets = path.join(root, 'docs/.vitepress/dist/assets')
const chunks = path.join(assets, 'chunks')
const files = fs.readdirSync(chunks)
const searchFile = files.find(file => /^@localSearchIndexroot\..*\.js$/.test(file))
assert(searchFile, '请先执行 pnpm docs:build')
const source = fs.readFileSync(path.join(chunks, searchFile), 'utf8')
const moduleResult = {exports: {}}
vm.runInNewContext(esbuild.transformSync(source, {format: 'cjs'}).code, {
    module: moduleResult, exports: moduleResult.exports
})
const serialized = moduleResult.exports.default
const index = MiniSearch.loadJSON(serialized, {
    fields: ['title', 'titles', 'text'], storeFields: ['title', 'titles']
})
assert(index.documentCount > 100, '全文搜索索引异常为空或严重缺失')
const results = index.search('LangGraph', {prefix: true})
assert(results.length > 0, 'LangGraph 应能被全文检索')
assert(results.some(result => result.id.includes('#') && result.title), '结果必须保留章节锚点及标题')
assert(!serialized.includes('docsify-copy-code-button'), '控件不能进入全文搜索')

const themeFile = files.find(file => /^theme\..*\.js$/.test(file))
const theme = fs.readFileSync(path.join(chunks, themeFile), 'utf8')
const summaries = [...theme.matchAll(/JSON\.parse\(("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')\)/g)]
    .map(match => vm.runInNewContext(`JSON.parse(${match[1]})`))
    .find(value => Array.isArray(value) && value[0]?.relativePath)
assert(summaries, '构建必须包含轻量文章摘要')
const pages = new Map()
for (const file of fs.readdirSync(assets).filter(file =>
    file.startsWith('column_') && file.endsWith('.js') && !file.endsWith('.lean.js'))) {
    const text = fs.readFileSync(path.join(assets, file), 'utf8')
    const match = text.match(/JSON\.parse\(("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')\)/)
    if (!match) continue
    const page = vm.runInNewContext(`JSON.parse(${match[1]})`)
    if (page.relativePath) pages.set(page.relativePath, page)
}
assert.equal(summaries.length, pages.size, '摘要不得漏掉已构建的 column 页面')
for (const summary of summaries) {
    const page = pages.get(summary.relativePath)
    assert(page, `找不到页面：${summary.relativePath}`)
    assert.equal(summary.frontmatter.title || summary.title || '',
        page.frontmatter.title || page.title || '', summary.relativePath)
    assert.equal(summary.lastUpdated, page.lastUpdated, summary.relativePath)
    for (const field of ['date', 'tags', 'series', 'category', 'group']) {
        assert.equal(JSON.stringify(summary.frontmatter[field]), JSON.stringify(page.frontmatter[field]),
            `${summary.relativePath}: ${field}`)
    }
    assert(summary.readingStats.readingMinutes >= 1)
    assert(!('src' in summary) && !('html' in summary), '摘要不得包含文章正文')
}
console.log(`通过：${summaries.length} 页元数据一致，${index.documentCount} 个全文章节，LangGraph 返回 ${results.length} 项`)
console.log(`搜索索引：${Buffer.byteLength(source)} 字节，gzip ${zlib.gzipSync(source).length} 字节`)
