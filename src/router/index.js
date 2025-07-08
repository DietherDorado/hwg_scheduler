import { createRouter, createWebHistory } from 'vue-router'
import Login from '../components/Login.vue'
import MyCalendar from '../components/MyCalendar.vue'

const routes = [
  { path: '/', name: 'Login', component: Login },
  { path: '/calendar', name: 'Calendar', component: MyCalendar }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
