<script setup lang="ts">
import { usePosts } from "../stores/posts";
import TimelineItem from "./TimelineItem.vue"
import { periods } from "../constants"

const postsStore = usePosts()

await postsStore.fetchPosts()
</script>

<template>
  <div class="message is-primary is-marginless">
    <div class="message-header">
      <div>Posts for {{ postsStore.selectedPeriod.toLowerCase() }}</div>
    </div>
  </div>
  <nav class="is-primary panel">
    <span class="panel-tabs">
      <a
        v-for="period of periods"
        :key="period"
        :class="{ 'is-active': period === postsStore.selectedPeriod }"
        @click="postsStore.setSelectedPeriod(period)"
      >
        {{ period }}
      </a>
    </span>

    <TimelineItem
      v-for="post of postsStore.filteredPosts"
      :key="post.id"
      :post="post"
    />
  </nav>
</template>
