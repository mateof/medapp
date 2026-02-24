<template>
  <Header />
  <Sidebar />
  <v-main>
    <v-container fluid>
      <v-breadcrumbs :items="crumbs" divider="/"></v-breadcrumbs>
      <router-view :key="$route.fullPath" />
    </v-container>
  </v-main>
  <Footer />
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Header from './header/Header.vue'
import Sidebar from './sidebar/Sidebar.vue'
import Footer from './footer/Footer.vue'

const route = useRoute()

const routeNames = {
  MisMedicamentos: 'Inicio',
  Nuevo: 'Nuevo medicamento',
  Detalles: 'Detalles',
  Perfil: 'Perfil',
  Settings: 'Ajustes',
}

const crumbs = computed(() => {
  const list = [{
    title: 'Inicio',
    href: '#/medicamentos',
    disabled: route.name === 'MisMedicamentos',
  }]
  if (route.name && route.name !== 'MisMedicamentos') {
    list.push({
      title: route.meta?.breadCrumb || routeNames[route.name] || String(route.name),
      disabled: true,
    })
  }
  return list
})
</script>
