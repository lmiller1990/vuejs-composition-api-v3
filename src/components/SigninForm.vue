<script lang="ts" setup>
import { ref } from "vue";
import { useModal } from "../composables/modal";
import { useUsers } from "../stores/users";
import { NewUser } from "../users";
import UserForm from "./UserForm.vue"

const usersStore = useUsers()
const modal = useModal()
const error = ref('')

async function handleSignin (newUser: NewUser) {
  const body = JSON.stringify(newUser);
  const res = await window.fetch("/api/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
  });

  if ([401, 404].includes(res.status)) {
    error.value = "Username or password was incorrect."
  } else {
    usersStore.authenticate(); 
    modal.hideModal();
  }
}
</script>

<template>
  <UserForm @submit="handleSignin" :error="error" />
</template>