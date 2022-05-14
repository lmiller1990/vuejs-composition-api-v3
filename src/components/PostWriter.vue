<script lang="ts" setup>
import { ref, onMounted } from "vue"
import { TimelinePost } from '../posts';

const props = defineProps<{
  post: TimelinePost
}>()

const title = ref(props.post.title)
const contentEditable = ref<HTMLDivElement>()

onMounted(() => {
  console.log(contentEditable.value?.innerText)
})
</script>

<template>
  <div class="columns">
    <div class="column">
      <div class="field">
        <div class="label">Post title</div>
        <input type="text" class="input" v-model="title">
      </div>

      <div contenteditable ref="contentEditable">
        This is the post.
      </div>
    </div>
  </div>
</template>