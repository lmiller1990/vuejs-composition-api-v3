<script lang="ts" setup>
import { DateTime } from "luxon"
import PostWriter from '../components/PostWriter.vue';
import { TimelinePost } from '../posts';

const post: TimelinePost = {
  id: "-1",
  title: "Title",
  created: DateTime.now(),
  markdown: '## Title'
}
</script>

<template>
  New Post
  <PostWriter :post="post" />
</template>