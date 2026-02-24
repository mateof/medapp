<template>
  <v-navigation-drawer
    v-model="sidebarDrawer"
    :color="uiStore.sidebarColor"
    mobile-breakpoint="960"
    rail-width="70"
    :rail="!smAndDown && railMode"
    :expand-on-hover="!smAndDown && railMode"
    id="main-sidebar"
  >
    <div
      class="d-flex align-center pa-4 mb-1"
      style="cursor: pointer"
      @click="showEditName = true"
      title="Editar nombre"
    >
      <v-avatar size="32">
        <v-img :src="userAvatar" />
      </v-avatar>
      <span class="ml-3 font-weight-bold text-body-1 text-truncate">{{ uiStore.activeUserName || 'MedApp' }}</span>
      <v-icon size="14" class="ml-auto text-medium-emphasis">mdi-pencil</v-icon>
    </div>

    <v-divider class="mb-2" />

    <v-list density="compact" nav>
      <v-list-item
        v-for="item in items"
        :key="item.title"
        :to="item.to"
        active-class="text-primary"
        link
        rounded="lg"
        :prepend-icon="item.icon"
        :title="item.title"
      />
    </v-list>

    <template #append>
      <v-divider />
      <v-list density="compact" nav>
        <v-list-item
          prepend-icon="mdi-account-switch"
          title="Cambiar usuario"
          rounded="lg"
          @click="switchUser"
        />
        <v-list-item
          prepend-icon="mdi-logout"
          title="Cerrar sesión"
          rounded="lg"
          @click="doLogout"
        />
      </v-list>
    </template>
  </v-navigation-drawer>

  <v-dialog v-model="showEditName" max-width="400">
    <v-card>
      <v-card-title class="text-h6">
        <v-icon class="mr-2">mdi-account-edit</v-icon>
        Editar nombre
      </v-card-title>
      <v-divider />
      <v-card-text>
        <v-text-field
          v-model="editName"
          label="Nombre"
          variant="outlined"
          autofocus
          :error-messages="editNameError"
          @keyup.enter="saveName"
        />
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="showEditName = false">Cancelar</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :disabled="!editName.trim()"
          :loading="savingName"
          @click="saveName"
        >
          Guardar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useUiStore } from '@/stores/ui'
import { generateInitialsAvatar, updateUser, userNameExists } from '@/services/storage/users'

const router = useRouter()
const uiStore = useUiStore()
const { smAndDown } = useDisplay()

const sidebarDrawer = computed({
  get: () => uiStore.sidebarDrawer,
  set: (val) => uiStore.setSidebarDrawer(val),
})

const railMode = computed({
  get: () => uiStore.sidebarRail,
  set: (val) => uiStore.setSidebarRail(val),
})

const userAvatar = computed(() => {
  if (uiStore.activeUserAvatar) return uiStore.activeUserAvatar
  return generateInitialsAvatar(uiStore.activeUserName || 'U')
})

const items = [
  {
    title: 'Inicio',
    icon: 'mdi-view-dashboard',
    to: '/medicamentos',
  },
  {
    title: 'Perfil',
    icon: 'mdi-account-circle',
    to: '/perfil',
  },
  {
    title: 'Ajustes',
    icon: 'mdi-cog',
    to: '/settings',
  },
]

const showEditName = ref(false)
const editName = ref('')
const editNameError = ref('')
const savingName = ref(false)

watch(showEditName, (val) => {
  if (val) {
    editName.value = uiStore.activeUserName
    editNameError.value = ''
  }
})

async function saveName() {
  const name = editName.value.trim()
  if (!name) return
  editNameError.value = ''

  if (name.toLowerCase() !== uiStore.activeUserName.toLowerCase()) {
    if (await userNameExists(name, uiStore.activeUserId)) {
      editNameError.value = 'Ya existe un usuario con ese nombre'
      return
    }
  }

  savingName.value = true
  await updateUser(uiStore.activeUserId, { nombre: name })
  uiStore.activeUserName = name
  showEditName.value = false
  savingName.value = false
}

function switchUser() {
  uiStore.switchUser()
  router.push('/login')
}

function doLogout() {
  uiStore.logout()
  router.push('/login')
}
</script>

<style lang="scss">
#main-sidebar {
  box-shadow: 1px 0 20px rgba(0, 0, 0, 0.08);
  -webkit-box-shadow: 1px 0 20px rgba(0, 0, 0, 0.08);
  .v-navigation-drawer__border {
    display: none;
  }
  .v-list {
    padding: 8px 15px;
  }
}
</style>
