<script lang="ts" setup>
import { useModal } from '../composables/modal'
import { useUsers } from '../stores/users';
import { toRaw } from 'vue'
import SignupForm from './SignupForm.vue';

const modal = useModal()
const usersStore = useUsers()

const component = modal.modalComponent

function signup () {
  modal.showModal()
  modal.setModalComponent("signup")
}

function login () {
  modal.showModal()
  modal.setModalComponent("login")
}

</script>

<template>
  <div class="navbar">
    <div class="navbar-end">
      <div class="buttons">
        <template v-if="usersStore.currentUser">
          <RouterLink to="/posts/new" class="button">New Post</RouterLink>
          <button class="button" @click="usersStore.logout">Log out</button>
        </template>

        <template v-else>
          <button class="button" @click="signup">Sign Up</button>
          <button class="button" @click="login">Log In</button>
        </template>
      </div>
    </div>
  </div>

  <Teleport to="#modal">
    <component :is="component" />
  </Teleport>
</template>