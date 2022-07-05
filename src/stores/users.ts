import { defineStore } from "pinia";
import { AuthenticatedUser, NewUser } from "../users";

interface UsersState {
  currentUser?: AuthenticatedUser;
}

export const useUsers = defineStore("users", {
  state: (): UsersState => ({
    currentUser: undefined,
  }),

  actions: {
    setAuthenticatedUser(user: AuthenticatedUser) {
      this.currentUser = user;
    },

    async login(newUser: NewUser) {
      const body = JSON.stringify({ id: "abc" });
      return await window.fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body,
      });
    },

    async createUser(newUser: NewUser) {
      const body = JSON.stringify(newUser);
      return await window.fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body,
      });
    },
  },
});
