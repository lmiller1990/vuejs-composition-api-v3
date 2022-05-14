<script lang="ts" setup>
import { ref, onMounted, watch, watchEffect } from "vue";
import { TimelinePost } from "../posts";
import { marked } from "marked"
import highlightjs from "highlight.js"
import debounce from "lodash/debounce"

const props = defineProps<{
  post: TimelinePost;
}>();

const title = ref(props.post.title);
const content = ref(props.post.markdown);
const html = ref('')
const contentEditable = ref<HTMLDivElement>();

function parseHtml (markdown: string) {
  marked.parse(markdown, {
    gfm: true,
    breaks: true,
    highlight: (code) => {
      return highlightjs.highlightAuto(code).value
    }
  }, (err, parseResult) => {
    html.value = parseResult
  })
}

watch(content, debounce((newContent) => {
  parseHtml(newContent)
}, 250), {
  immediate: true
})

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
      <div v-html="html" />
    </div>
  </div>
</template>
