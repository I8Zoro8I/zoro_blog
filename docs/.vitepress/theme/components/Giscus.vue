<template>
  <div class="giscus-container">
    <component
        :is="'script'"
        src="https://giscus.app/client.js"
        data-repo="I8Zoro8I/zoro_blog"
        data-repo-id="R_kgDOSQZqjw"
        data-category="Announcements"
        data-category-id="DIC_kwDOSQZqj84C8bsH"
        data-mapping="pathname"
        data-strict="0"
        data-reactions-enabled="1"
        data-emit-metadata="0"
        data-input-position="top"
        data-theme="preferred_color_scheme"
        data-loading="lazy"
        data-lang="zh-CN"
        crossorigin="anonymous"
        async
    />
  </div>
</template>

<style scoped>
.giscus-container {
  margin-top: 40px;
  border-top: 1px solid var(--vp-c-divider);
  padding-top: 20px;
}
</style>