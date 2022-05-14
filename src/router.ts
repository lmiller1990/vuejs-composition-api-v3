import { createRouter, createWebHistory } from "vue-router"
import Home from "./views/Home.vue"
import NewPost from "./views/NewPost.vue"

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: Home
    },
    {
      path: "/posts/new",
      component: NewPost
    }
  ]
})