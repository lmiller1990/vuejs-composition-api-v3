<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { TimelinePost } from "../posts";

const props = defineProps<{
  post: TimelinePost;
}>();

const title = ref(props.post.title);
const content = ref(props.post.markdown);
const contentEditable = ref<HTMLDivElement>();

onMounted(() => {
  if (!contentEditable.value) {
    throw Error("ContentEditable DOM node was not found");
  }
  contentEditable.value.innerText = content.value;
});

function handleInput() {
  if (!contentEditable.value) {
    throw Error("ContentEditable DOM node was not found");
  }
  content.value = contentEditable.value.innerText;
}
</script>

<template>
  <div class="columns">
    <div class="column">
      <div class="field">
        <div class="label">Post title</div>
        <input
          v-model="title"
          type="text"
          class="input" />
      </div>
    </div>
  </div>

  <div class="columns">
    <div class="column">
      <div
        ref="contentEditable"
        contenteditable
        @input="handleInput" />
    </div>
    <div class="column">
      {{ content }}
    </div>
  </div>
</template>
