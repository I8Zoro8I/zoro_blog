---
# https://vitepress.dev/reference/default-theme-home-page
layout: home
home: true

hero:
  name: "zoro"
  text: "测试网站"
  tagline: My great project tagline
  image:
    # 首页右边的图片
     src: /avatar.png
     # 图片的描述
     alt: avatar
  # 按钮相关
  actions:
    - theme: brand
      text: 进入主页
      link: /markdown-examples
    - theme: alt
      text: 个人成长
      link: /api-examples

features:
  - icon: 🤹♀️ 
    title: 标签一
    details: Lorem ipsum dolor sit amet, consectetur adipiscing elit
  - icon: 👩🎨
    title: 标签二
    details: Lorem ipsum dolor sit amet, consectetur adipiscing elit
  - icon: 🧩
    title: 标签三
    details: Lorem ipsum dolor sit amet, consectetur adipiscing elit
---

[//]: # (<!-- 自定义组件 -->)

<script setup>

</script>


<home />

