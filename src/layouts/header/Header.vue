<template>
  <v-app-bar color="primary" elevation="2" density="comfortable">
    <v-app-bar-nav-icon
      @click="toggleSidebar"
    />
    <v-app-bar-title class="d-flex align-center" style="cursor: pointer" @click="goTo('/medicamentos')">
      <img src="../../assets/MedApp-pills.png" height="28" class="mr-2" />
      <span class="font-weight-bold">MedApp</span>
    </v-app-bar-title>
    <v-spacer />
    <v-btn
      v-if="uiStore.showAddButton"
      icon="mdi-plus"
      variant="text"
      @click="goTo('/nuevo')"
    />
    <v-menu location="bottom end" transition="scale-transition" :offset="4">
      <template v-slot:activator="{ props: menuProps }">
        <v-btn icon="mdi-dots-vertical" variant="text" v-bind="menuProps" />
      </template>
      <v-list density="compact" nav rounded="lg" min-width="200" class="pa-2">
        <v-list-item
          prepend-icon="mdi-plus-circle-outline"
          title="Añadir medicamento"
          rounded="lg"
          @click="goTo('/nuevo')"
        />
        <v-divider class="my-1" />
        <v-list-subheader class="text-uppercase text-caption">Datos</v-list-subheader>
        <v-list-item
          prepend-icon="mdi-export-variant"
          title="Exportar"
          subtitle="Descargar backup"
          rounded="lg"
          @click="openExport"
        />
        <v-list-item
          prepend-icon="mdi-import"
          title="Importar"
          subtitle="Restaurar backup"
          rounded="lg"
          @click="triggerImport"
        />
      </v-list>
    </v-menu>
  </v-app-bar>

  <!-- Export dialog -->
  <v-dialog v-model="showExport" max-width="480">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-export-variant</v-icon>
        Exportar datos
      </v-card-title>
      <v-divider />
      <v-card-text>
        <p class="text-body-2 text-medium-emphasis mb-4">
          Selecciona los usuarios cuyos datos quieres exportar. Se generará un archivo JSON que podrás importar en otro navegador o dispositivo.
        </p>
        <v-list density="compact" select-strategy="classic" v-model:selected="selectedUserIds">
          <v-list-item
            v-for="user in allUsers"
            :key="user.id"
            :value="user.id"
          >
            <template #prepend="{ isSelected }">
              <v-list-item-action start>
                <v-checkbox-btn :model-value="isSelected" />
              </v-list-item-action>
            </template>
            <template #default>
              <div class="d-flex align-center">
                <v-avatar size="32" class="mr-3">
                  <v-img :src="getAvatar(user)" />
                </v-avatar>
                <div>
                  <div class="text-body-2 font-weight-medium">{{ user.nombre }}</div>
                  <div class="text-caption text-medium-emphasis">
                    {{ userStats[user.id]?.meds || 0 }} medicamentos
                  </div>
                </div>
              </div>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
      <v-divider />
      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="showExport = false">Cancelar</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-download"
          :loading="exporting"
          :disabled="selectedUserIds.length === 0"
          @click="doExport"
        >
          Descargar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Import dialog -->
  <v-dialog v-model="showImport" max-width="480">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-import</v-icon>
        Importar datos
      </v-card-title>
      <v-divider />
      <v-card-text>
        <!-- Step 1: File selection -->
        <template v-if="!importPreview">
          <p class="text-body-2 text-medium-emphasis mb-4">
            Selecciona un archivo de backup (.json) exportado previamente desde MedApp.
          </p>
          <v-btn
            variant="outlined"
            block
            prepend-icon="mdi-file-upload"
            :loading="readingFile"
            @click="fileInput?.click()"
          >
            Seleccionar archivo
          </v-btn>
          <input
            ref="fileInput"
            type="file"
            accept=".json"
            style="display: none"
            @change="onFileSelected"
          />
          <v-alert v-if="importError" type="error" variant="tonal" density="compact" class="mt-4">
            {{ importError }}
          </v-alert>
        </template>

        <!-- Step 2: Preview -->
        <template v-else>
          <v-alert type="info" variant="tonal" density="compact" class="mb-4">
            Backup del {{ formatDate(importPreview.exportDate) }}
          </v-alert>
          <p class="text-body-2 font-weight-medium mb-2">
            Se importarán {{ importPreview.users.length }} usuario{{ importPreview.users.length > 1 ? 's' : '' }}:
          </p>
          <v-list density="compact">
            <v-list-item v-for="(user, i) in importPreview.users" :key="i">
              <template #prepend>
                <v-avatar size="32" class="mr-3">
                  <v-img v-if="user.profile.avatar" :src="user.profile.avatar" />
                  <v-icon v-else>mdi-account</v-icon>
                </v-avatar>
              </template>
              <v-list-item-title>{{ user.profile.nombre }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ user.medicamentos?.length || 0 }} medicamentos,
                {{ user.interacciones?.length || 0 }} interacciones
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </template>
      </v-card-text>
      <v-divider />
      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="closeImport">Cancelar</v-btn>
        <v-btn
          v-if="importPreview"
          color="primary"
          variant="flat"
          prepend-icon="mdi-import"
          :loading="importing"
          @click="doImport"
        >
          Importar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="3000" location="top">
    {{ snackbarText }}
  </v-snackbar>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useUiStore } from '@/stores/ui'
import { getAllUsers, generateInitialsAvatar } from '@/services/storage/users'
import { exportUsers, downloadBackup, importBackup, readBackupFile } from '@/services/storage/backup'
import { db } from '@/services/db'

const router = useRouter()
const uiStore = useUiStore()
const { smAndDown } = useDisplay()

// --- Export ---
const showExport = ref(false)
const allUsers = ref([])
const userStats = ref({})
const selectedUserIds = ref([])
const exporting = ref(false)

async function openExport() {
  allUsers.value = await getAllUsers()
  // Load stats for each user
  const stats = {}
  for (const user of allUsers.value) {
    const meds = await db.medicamentos.where('userId').equals(user.id).count()
    stats[user.id] = { meds }
  }
  userStats.value = stats
  selectedUserIds.value = allUsers.value.map(u => u.id)
  showExport.value = true
}

async function doExport() {
  exporting.value = true
  try {
    const data = await exportUsers(selectedUserIds.value)
    downloadBackup(data)
    showExport.value = false
    showSnack('Backup descargado correctamente', 'success')
  } catch {
    showSnack('Error al exportar los datos', 'error')
  }
  exporting.value = false
}

function getAvatar(user) {
  return user.avatar || generateInitialsAvatar(user.nombre)
}

// --- Import ---
const showImport = ref(false)
const fileInput = ref(null)
const readingFile = ref(false)
const importing = ref(false)
const importPreview = ref(null)
const importError = ref('')

function triggerImport() {
  importPreview.value = null
  importError.value = ''
  showImport.value = true
}

async function onFileSelected(e) {
  const file = e.target.files[0]
  if (!file) return
  readingFile.value = true
  importError.value = ''
  try {
    const data = await readBackupFile(file)
    if (!data || data.app !== 'MedApp' || !data.users?.length) {
      importError.value = 'El archivo no es un backup válido de MedApp'
      readingFile.value = false
      return
    }
    importPreview.value = data
  } catch (err) {
    importError.value = err.message
  }
  readingFile.value = false
  // Reset file input for re-selection
  if (fileInput.value) fileInput.value.value = ''
}

async function doImport() {
  importing.value = true
  try {
    const imported = await importBackup(importPreview.value)
    showImport.value = false
    importPreview.value = null
    const names = imported.map(u => u.nombre).join(', ')
    showSnack(`Importado: ${names}`, 'success')
  } catch (err) {
    showSnack(err.message || 'Error al importar', 'error')
  }
  importing.value = false
}

function closeImport() {
  showImport.value = false
  importPreview.value = null
  importError.value = ''
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

// --- Snackbar ---
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

function showSnack(text, color) {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

// --- Navigation ---
function toggleSidebar() {
  if (smAndDown.value) {
    uiStore.setSidebarDrawer(!uiStore.sidebarDrawer)
  } else {
    uiStore.toggleSidebarRail()
  }
}

function goTo(val) {
  if (val) router.push(val)
}
</script>
