<template>
  <v-app id="MedApp" :class="!smAndDown ? 'full-sidebar' : 'mini-sidebar'">
    <router-view />
  </v-app>
</template>

<script setup>
import { useDisplay } from 'vuetify'

const { smAndDown } = useDisplay()
</script>
