<script lang="ts" setup>
import { DateTime } from "luxon"
import { useRouter } from "vue-router";
import PostWriter from '../components/PostWriter.vue';
import { Post, TimelinePost } from '../posts';
import { usePosts } from "../stores/posts";
import { useUsers } from "../stores/users";

const usersStore = useUsers();
const router = useRouter()
const postsStore = usePosts();

if (!usersStore.currentUserId) {
  throw Error('User was not found')
}

const post: TimelinePost = {
  id: "-1",
  title: "Title",
  authorId: usersStore.currentUserId,
  created: DateTime.now(),
  markdown: '## Title',
  html: '<h2>Title</h2>'
}

async function handleSubmit (post: Post) {
  await postsStore.createPost(post);
  router.push("/")
}
</script>

<template>
  New Post
  <PostWriter :post="post" @submit="handleSubmit" />
</template>