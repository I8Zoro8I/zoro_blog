---
# https://vitepress.dev/reference/default-theme-home-page
layout: home
home: true

hero:
  name: "zoro"
  text: "A VitePress Site"
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
    title: Feature A
    details: Lorem ipsum dolor sit amet, consectetur adipiscing elit
  - icon: 👩🎨
    title: Feature B
    details: Lorem ipsum dolor sit amet, consectetur adipiscing elit
  - icon: 🧩
    title: Feature C
    details: Lorem ipsum dolor sit amet, consectetur adipiscing elit
---

[//]: # (<!-- 自定义组件 -->)

<script setup>

</script>


<home />

