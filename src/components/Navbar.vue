<script lang="ts" setup>
import { useRouter } from 'vue-router';
import { useModal } from '../composables/modal'
import { useUsers } from '../stores/users';
import SignupForm from './SignupForm.vue';

const modal = useModal()
const usersStore = useUsers()
const router = useRouter();

async function logout () {
  await usersStore.logout();
  router.push({ path: "/" });
}
</script>

<template>
  <div class="navbar">
    <div class="navbar-end">
      <div v-if="usersStore.currentUserId" class="buttons">
        <RouterLink to="/posts/new" class="button">New Post</RouterLink>
        <button class="button" @click="logout()">Log Out</button>
      </div>

      <div v-else class="buttons">
        <button class="button" @click="modal.showModal('signUp')">Sign Up</button>
        <button class="button" @click="modal.showModal('signIn')">Sign In</button>
      </div>

    </div>
  </div>

  <Teleport to="#modal">
    <component :is="modal.component.value" />
  </Teleport>
</template>