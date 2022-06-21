<template>
  <div class="navbar">
    <div class="navbar-end">
      <div class="buttons">
        <RouterLink to="/posts/new" class="button">New Post</RouterLink>
      </div>
    </div>
  </div>

  <Teleport to="#modal">
    Content to be rendered.
  </Teleport>
</template>