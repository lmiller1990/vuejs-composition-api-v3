## Vue.js: The Composition API (v3)

The **THIRD** recording of this course! Lots of improvments:

- `<script setup>`
- Vite + ES modules
- Vuex -> Pinia (official state management solution)
- Composables
- Design Patterns, modular code
- Reusable components
- TypeScript for type safety
- *real* authentication and authorization using jsonwebtoken (JWT)
- Basic server with Node.js + Express
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