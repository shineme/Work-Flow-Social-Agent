import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import 'element-plus/dist/index.css'
//import './styles/theme.css'
import App from './App.vue'

const app = createApp(App)
app.use(ElementPlus)
app.mount('#app') 