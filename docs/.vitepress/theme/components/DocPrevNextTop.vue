<script setup lang="ts">
import {computed} from 'vue';
import {useData} from 'vitepress';
import {usePrevNext} from 'vitepress/dist/client/theme-default/composables/prev-next.js';
import VPLink from 'vitepress/dist/client/theme-default/components/VPLink.vue';

const { theme } = useData();
const control = usePrevNext();

const hasPrevNext = computed(() => control.value.prev?.link || control.value.next?.link);
</script>

<template>
  <nav
    v-if="hasPrevNext"
    class="doc-top-prev-next"
    aria-labelledby="doc-top-nav-aria-label"
  >
    <span id="doc-top-nav-aria-label" class="visually-hidden">Pager</span>

    <div class="pager">
      <VPLink v-if="control.prev?.link" class="pager-link prev" :href="control.prev.link">
        <span class="desc">{{ theme.docFooter?.prev || 'Previous page' }}</span>
        <span class="title">{{ control.prev.text }}</span>
      </VPLink>
    </div>

    <div class="pager">
      <VPLink v-if="control.next?.link" class="pager-link next" :href="control.next.link">
        <span class="desc">{{ theme.docFooter?.next || 'Next page' }}</span>
        <span class="title">{{ control.next.text }}</span>
      </VPLink>
    </div>
  </nav>
</template>
