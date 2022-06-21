<script lang="ts" setup>
import Navbar from './components/Navbar.vue';
</script>

<template>
  <div class="modal" style="display: block; color: white;">
    <div class="modal-background">
      <div class="modal-content">
        <div id="modal"></div>
      </div>
    </div>
    <button class="modal-close is-large"></button>
  </div>

  <div class="section">
    <div class="container">
      <Navbar />
      <RouterView />
    </div>
  </div>
</template>

<style>
@import "https://cdn.jsdelivr.net/npm/bulma@0.9.3/css/bulma.min.css";
@import "highlight.js/styles/atom-one-dark.css";

ul {
  list-style: revert !important;
  list-style-position: inside !important;
}

h1, h2, h3, h4, h5, h6 {
  font-size: revert !important;
  margin: 10px 0 !important;
}

pre {
  margin: 10px 0 !important;
}

p {
  margin: 10px 0 !important;
}
</style>
