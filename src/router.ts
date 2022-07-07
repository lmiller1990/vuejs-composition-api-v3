import { createRouter, createWebHistory } from "vue-router"
import { useUsers } from "./stores/users"
import Home from "./views/Home.vue"
import NewPost from "./views/NewPost.vue"
import ShowPost from "./views/ShowPost.vue"
import EditPost from "./views/EditPost.vue"

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: Home
    },
    {
      path: "/posts/new",
      component: NewPost,
      beforeEnter: () => {
        const usersStore = useUsers();

        if (!usersStore.currentUserId) {
          return {
            path: "/"
          }
        }
      }
    },
    {
      path: "/posts/:id/edit",
      component: EditPost
    },
    {
      path: "/posts/:id",
      component: ShowPost
    }
  ]
})