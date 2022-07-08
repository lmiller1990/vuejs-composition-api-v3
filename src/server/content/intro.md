## Vue.js: The Composition API (v3)

The **THIRD** recording of this course! Lots of improvments:

### Vue.js
- `<script setup>`
- Vite + ES modules
- Vuex -> Pinia (official state management solution)
- Composables
- Reusable components

### General Skills
- Design Patterns, modular code
- TypeScript for type safety
- *real* authentication and authorization using jsonwebtoken (JWT)
- Basic server with Node.js + Express

### Bonus!
- Deploy to production
- Testing module

```html
<script setup lang="ts">
import { TimelinePost } from '../posts'

defineProps<{
  post: TimelinePost
}>()
</script>

<template>
  <RouterLink
    :to="`/posts/${post.id}`"
    class="panel-block is-flex is-flex-direction-column is-align-items-flex-start"> 
    <a>{{ post.title }}</a>
    <div>{{ post.created.toFormat("d MMM") }}</div>
  </RouterLink>
</template>
```