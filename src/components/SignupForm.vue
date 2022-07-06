<script lang="ts" setup>
import { useModal } from "../composables/modal";
import { useUsers } from "../stores/users";
import { NewUser } from "../users";
import UserForm from "./UserForm.vue"

const usersStore = useUsers()
const modal = useModal()

async function handleSignup (newUser: NewUser) {
  await usersStore.createUser(newUser)
  modal.hideModal();
}
</script>

<template>
  <UserForm @submit="handleSignup" />
</template>