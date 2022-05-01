<script setup lang="ts">
const periods = ["Today", "This Week", "This Month"]
</script>

<template>
  <nav class="is-primary panel">
    <span class="panel-tabs">
      <a v-for="period of periods">
        {{ period }}
      </a>
    </span>
  </nav>
</template>
