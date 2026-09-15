import { createApp } from 'vue'
import { createPinia } from 'pinia'
import * as Sentry from '@sentry/vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import router from './router/index'
import { logEvent } from '@/services/logs/logger'
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

// Registro de errores no capturados, para poder revisarlos en Ajustes
app.config.errorHandler = (err, instance, info) => {
  logEvent({
    nivel: 'error',
    scope: 'vue',
    mensaje: err?.message || String(err),
    detalle: err?.stack || null,
    contexto: { hook: info, componente: instance?.$options?.__name || null },
  })
  console.error(err)
}

window.addEventListener('error', (event) => {
  logEvent({
    nivel: 'error',
    scope: 'app',
    mensaje: event.message || 'Error no capturado',
    detalle: event.error?.stack || null,
    contexto: { fichero: event.filename || null, linea: event.lineno || null },
  })
})

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason
  logEvent({
    nivel: 'error',
    scope: 'app',
    mensaje: reason?.message || String(reason),
    detalle: reason?.stack || null,
    contexto: { tipo: 'promesa no capturada' },
  })
})

app.mount('#app')
