<script lang="ts" setup>
import { ref } from "vue"
import { TimelinePost } from '../posts';

const props = defineProps<{
  post: TimelinePost
}>()

const title = ref(props.post.title)
</script>

<template>
  <div class="columns">
    <div class="column">
      <div class="field">
        <div class="label">Post title</div>
        <input type="text" class="input" v-model="title">
      </div>
    </div>
  </div>
</template>