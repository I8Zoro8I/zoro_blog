---
title: 更新日志
description: 记录博客版本迭代、页面调整与内容更新
---

<script setup>import {changelogItems} from '../.vitepress/relaConf/changelog';
let changelogItem = changelogItems;
</script>

<ChangelogTimeline :items="changelogItems" />
