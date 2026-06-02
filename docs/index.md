---
# https://vitepress.dev/reference/default-theme-home-page
layout: home
home: true

hero:
  name: "zoro"
  text: "个人博客"
  tagline: 技术沉淀 · 生活随笔 · 持续成长
  image:
    # 首页右边的图片
     src: /images/avatar.png
     # 图片的描述
     alt: avatar
  # 按钮相关
  actions:
    - theme: brand
      text: 博客介绍
      link: /column/blog
    - theme: alt
      text: 关于我
      link: /column/my

features:
  - icon: 💻 
    title: 技术沉淀
    details: 专注开发与实战，记录项目踩坑、技术复盘，分享可复用的开发经验与技巧
  - icon: 🧩
    title: 生活杂记
    details: 跳出代码世界，记录日常感悟、阅读随笔与成长碎片，藏着不慌不忙的生活态度
  - icon: 📈
    title: 成长存档
    details: 追踪学习进度，记录目标达成与自我突破，每一步前行都有迹可循
---

[//]: # (<!-- 自定义组件 -->)

<script setup>

</script>


<CustomHome />
