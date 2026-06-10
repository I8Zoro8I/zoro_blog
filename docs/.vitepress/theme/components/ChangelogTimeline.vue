<script setup lang="ts">
import {computed} from 'vue'
import type {ChangelogItem} from '../../relaConf/changelog'

const props = defineProps<{
    items: ChangelogItem[]
}>()

const timelineItems = computed(() =>
    props.items.map((item, index) => ({
        ...item,
        side: index % 2 === 0 ? 'left' : 'right'
    }))
)
</script>

<template>
    <section class="changelog-page">
        <div class="changelog-hero">
            <p class="changelog-kicker">Changelog</p>
            <h1>更新日志</h1>
            <p class="changelog-lead">
                集中记录博客迭代、内容补充和页面调整。以后只维护数据源里的
                <code>items</code> 即可。
            </p>
        </div>

        <div class="changelog-timeline">
            <article
                v-for="(item, index) in timelineItems"
                :key="`${item.date}-${item.title}-${index}`"
                class="changelog-node"
                :class="`is-${item.side}`"
            >
                <div class="changelog-card">
                    <time class="changelog-date">{{ item.date }}</time>
                    <h2>{{ item.title }}</h2>
                    <p>{{ item.summary }}</p>
                    <ul v-if="item.items?.length" class="changelog-list">
                        <li v-for="(entry, entryIndex) in item.items" :key="`${item.title}-${entryIndex}`">
                            {{ entry }}
                        </li>
                    </ul>
                </div>
            </article>
        </div>
    </section>
</template>
