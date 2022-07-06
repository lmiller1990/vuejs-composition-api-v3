import { defineStore } from "pinia";
import { NewUser } from "../users";

export const useUsers = defineStore("users", {
  actions: {
    createUser (newUser: NewUser) {
      const body = JSON.stringify(newUser)
      return window.fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body
      })
    }
  }
})