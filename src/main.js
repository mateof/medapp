import { createApp } from 'vue'
import { createPinia } from 'pinia'
import * as Sentry from '@sentry/vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import router from './router/index'
import '@/scss/vuetify/overrides.scss'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(vuetify)

if (__SENTRY_DSN__) {
  Sentry.init({
    app,
    dsn: __SENTRY_DSN__,
    release: __APP_VERSION__,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration({ router }),
    ],
    tracesSampleRate: 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  })
}

app.mount('#app')
