<script setup lang="ts">
import { TimelinePost } from '../posts'

defineProps<{
  post: TimelinePost
}>()
</script>

<template>
  <RouterLink
    role="link"
    :to="`/posts/${post.id}`"
    class="panel-block is-flex is-flex-direction-column is-align-items-flex-start"> 
    <a>{{ post.title }}</a>
    <div>{{ post.created.toFormat("d MMM") }}</div>
  </RouterLink>
</template>