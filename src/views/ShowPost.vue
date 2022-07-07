<script lang="ts" setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { usePosts } from "../stores/posts";
import { useUsers } from "../stores/users";

const route = useRoute();
const postsStore = usePosts();
const usersStore = useUsers();

const id = route.params.id as string;
const post = postsStore.all.get(id);

if (!post) {
  throw Error(`Post with id ${id} was not found`);
}

const canEdit = computed(() => {
  if (!usersStore.currentUserId) {
    return false;
  }

  if (usersStore.currentUserId !== post.authorId) {
    return false;
  }

  return true;
});
</script>

<template>
  <div class="columns">
    <div class="column"></div>
    <div class="column is-two-thirds">
      <RouterLink
        v-if="canEdit"
        :to="`/posts/${post.id}/edit`"
        class="is-link button is-rounded"
        >Edit Post</RouterLink
      >
      <h1>{{ post.title }}</h1>
      <div v-html="post.html" />
    </div>
    <div class="column"></div>
  </div>
</template>
