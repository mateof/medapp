<template>
  <v-footer app color="white" class="footerpart pa-0 px-4" :height="isMobile ? 'auto' : 36">
    <div class="footer-content w-100" :class="isMobile ? 'footer-mobile' : 'footer-desktop'">
      <span class="text-caption text-medium-emphasis d-flex align-center" style="gap: 4px">
        &copy; {{ new Date().getFullYear() }} MedApp
        <span>·</span>
        v{{ appVersion }}
        <span>— Hecho con</span>
        <v-icon size="12" color="red">mdi-heart</v-icon>
      </span>
      <span class="text-caption text-medium-emphasis d-flex align-center" style="gap: 6px">
        <v-btn
          v-if="needRefresh"
          size="x-small"
          color="primary"
          variant="tonal"
          prepend-icon="mdi-update"
          @click="updateServiceWorker()"
        >
          Nueva versión disponible
        </v-btn>
        <a href="https://github.com/mateof/medapp" target="_blank" rel="noopener noreferrer" class="text-decoration-none text-medium-emphasis github-link d-inline-flex align-center" style="gap: 3px">
          <v-icon size="12">mdi-github</v-icon>
          GitHub
        </a>
        <span>·</span>
        <a href="https://github.com/mateof/medapp" target="_blank" rel="noopener noreferrer" class="text-decoration-none text-medium-emphasis github-link d-inline-flex align-center" style="gap: 2px" title="Regálanos una estrella en GitHub">
          <v-icon size="12" color="amber">mdi-star</v-icon>
        </a>
      </span>
    </div>
  </v-footer>
</template>

<script setup>
import { computed } from 'vue'
import { useDisplay } from 'vuetify'
import { useRegisterSW } from 'virtual:pwa-register/vue'

const { smAndDown } = useDisplay()
const isMobile = computed(() => smAndDown.value)

const appVersion = __APP_VERSION__

const { needRefresh, updateServiceWorker } = useRegisterSW()
</script>

<style lang="scss">
.footerpart {
  border-top: 1px solid rgba(0, 0, 0, 0.1) !important;
}
.github-link:hover {
  color: rgba(0, 0, 0, 0.87) !important;
}
.footer-desktop {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.footer-mobile {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px;
  padding: 6px 0;
}
</style>
