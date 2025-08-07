import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import 'tippy.js/dist/tippy.css'
import 'tippy.js/themes/light.css'

const app = createApp(App)
app.use(router)
app.mount('#app')