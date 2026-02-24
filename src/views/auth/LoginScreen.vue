<template>
  <v-container class="fill-height" fluid>
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="6" lg="4">

        <div class="text-center mb-8">
          <v-avatar size="80" class="mb-4">
            <img src="@/assets/MedApp-pills.png" />
          </v-avatar>
          <h1 class="text-h4 font-weight-bold">MedApp</h1>
          <p class="text-body-2 text-medium-emphasis mt-1">Selecciona tu perfil</p>
        </div>

        <v-row justify="center" class="mb-4">
          <v-col
            v-for="user in users"
            :key="user.id"
            cols="6"
            sm="4"
            class="d-flex"
          >
            <v-card
              class="text-center pa-4 flex-grow-1 position-relative"
              :variant="selectedUser?.id === user.id ? 'outlined' : 'flat'"
              :color="selectedUser?.id === user.id ? 'primary' : undefined"
              @click="selectUser(user)"
              hover
            >
              <v-btn
                icon="mdi-close"
                size="x-small"
                variant="text"
                color="error"
                class="position-absolute"
                style="top: 4px; right: 4px;"
                @click.stop="confirmDelete(user)"
              />
              <v-avatar size="64" class="mb-2">
                <v-img :src="getAvatar(user)" />
              </v-avatar>
              <div class="text-body-2 font-weight-medium text-truncate">{{ user.nombre }}</div>
              <v-icon v-if="uiStore.getCachedSession(user.id)" size="14" color="success" class="mt-1">mdi-circle</v-icon>
            </v-card>
          </v-col>

          <v-col cols="6" sm="4" class="d-flex">
            <v-card
              class="text-center pa-4 flex-grow-1"
              variant="outlined"
              @click="$router.push('/registro')"
              hover
            >
              <v-avatar size="64" color="grey-lighten-2" class="mb-2">
                <v-icon size="32">mdi-plus</v-icon>
              </v-avatar>
              <div class="text-body-2 text-medium-emphasis">Nuevo usuario</div>
            </v-card>
          </v-col>
        </v-row>

        <v-expand-transition>
          <v-card v-if="selectedUser" class="mt-2">
            <v-card-text>
              <!-- Legacy user: needs to set PIN -->
              <template v-if="isLegacyUser">
                <p class="text-body-2 text-medium-emphasis mb-4">
                  Este perfil fue creado antes del sistema multiusuario. Establece un PIN para proteger tus datos.
                </p>
                <v-text-field
                  v-model="newPin"
                  type="password"
                  inputmode="numeric"
                  maxlength="6"
                  label="Nuevo PIN (4-6 dígitos)"
                  prepend-icon="mdi-numeric"
                  variant="outlined"
                  :rules="pinRules"
                  class="mb-2"
                />
                <v-text-field
                  v-model="confirmPin"
                  type="password"
                  inputmode="numeric"
                  maxlength="6"
                  label="Confirmar PIN"
                  prepend-icon="mdi-numeric"
                  variant="outlined"
                  :error-messages="confirmPinError"
                  @keyup.enter="setupLegacyPin"
                />
                <v-btn
                  color="primary"
                  variant="flat"
                  block
                  :loading="loading"
                  :disabled="newPin.length < 4 || confirmPin !== newPin"
                  @click="setupLegacyPin"
                  class="mt-2"
                >
                  Establecer PIN y entrar
                </v-btn>
              </template>

              <!-- Normal user: enter PIN -->
              <template v-else>
                <p class="text-body-2 text-center text-medium-emphasis mb-4">
                  Introduce el PIN de {{ selectedUser.nombre }}
                </p>
                <v-text-field
                  ref="pinInput"
                  v-model="pin"
                  type="password"
                  inputmode="numeric"
                  maxlength="6"
                  label="PIN"
                  prepend-icon="mdi-lock"
                  variant="outlined"
                  :error-messages="pinError"
                  @keyup.enter="doLogin"
                />
                <v-btn
                  color="primary"
                  variant="flat"
                  block
                  :loading="loading"
                  :disabled="pin.length < 4"
                  @click="doLogin"
                  class="mt-2"
                >
                  Entrar
                </v-btn>
              </template>
            </v-card-text>
          </v-card>
        </v-expand-transition>

      </v-col>
    </v-row>

    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">
          <v-icon color="error" class="mr-2">mdi-alert</v-icon>
          Eliminar usuario
        </v-card-title>
        <v-divider />
        <v-card-text>
          <p>
            ¿Estás seguro de que quieres eliminar a <strong>{{ userToDelete?.nombre }}</strong>?
          </p>
          <p class="text-error text-body-2 mt-2">
            Se eliminarán todos sus datos: medicamentos, interacciones, actividad y ajustes. Esta acción no se puede deshacer.
          </p>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="showDeleteDialog = false">Cancelar</v-btn>
          <v-btn
            color="error"
            variant="flat"
            :loading="deleting"
            @click="doDelete"
          >
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getAllUsers, verifyPin, setPinForUser, generateInitialsAvatar, deleteUser } from '@/services/storage/users'
import { decrypt } from '@/services/crypto'
import { useUiStore } from '@/stores/ui'
import { db } from '@/services/db'

const router = useRouter()
const uiStore = useUiStore()

const users = ref([])
const selectedUser = ref(null)
const pin = ref('')
const pinError = ref('')
const loading = ref(false)
const pinInput = ref(null)

// Legacy user setup
const newPin = ref('')
const confirmPin = ref('')
const pinRules = [v => v.length >= 4 || 'Mínimo 4 dígitos', v => /^\d+$/.test(v) || 'Solo dígitos']
const confirmPinError = computed(() => {
  if (confirmPin.value && confirmPin.value !== newPin.value) return 'Los PIN no coinciden'
  return ''
})

const isLegacyUser = computed(() => selectedUser.value && !selectedUser.value.pin_check)

watch(selectedUser, () => {
  pin.value = ''
  pinError.value = ''
  newPin.value = ''
  confirmPin.value = ''
  nextTick(() => pinInput.value?.focus())
})

onMounted(async () => {
  users.value = await getAllUsers()

  const savedId = localStorage.getItem('medapp_active_user_id')
  if (savedId) {
    const user = users.value.find(u => u.id === Number(savedId))
    if (user) selectedUser.value = user
  }
})

function getAvatar(user) {
  return user.avatar || generateInitialsAvatar(user.nombre)
}

// --- Delete user ---
const showDeleteDialog = ref(false)
const userToDelete = ref(null)
const deleting = ref(false)

function confirmDelete(user) {
  userToDelete.value = user
  showDeleteDialog.value = true
}

async function doDelete() {
  deleting.value = true
  await deleteUser(userToDelete.value.id)
  users.value = users.value.filter(u => u.id !== userToDelete.value.id)
  if (selectedUser.value?.id === userToDelete.value.id) {
    selectedUser.value = null
  }
  showDeleteDialog.value = false
  userToDelete.value = null
  deleting.value = false

  if (users.value.length === 0) {
    router.push('/registro')
  }
}

async function selectUser(user) {
  const cached = uiStore.getCachedSession(user.id)
  if (cached) {
    loading.value = true
    uiStore.setActiveUser({ id: user.id, nombre: user.nombre, avatar: user.avatar })
    uiStore.setUserPin(cached.pin)
    uiStore.setApiKey(cached.apiKey)
    uiStore.setGeminiModel(cached.geminiModel)
    uiStore.setSessionReady(true)
    loading.value = false
    router.push('/medicamentos')
    return
  }
  selectedUser.value = selectedUser.value?.id === user.id ? null : user
}

async function doLogin() {
  if (pin.value.length < 4) return
  loading.value = true
  pinError.value = ''

  const ok = await verifyPin(selectedUser.value, pin.value)
  if (!ok) {
    pinError.value = 'PIN incorrecto'
    loading.value = false
    return
  }

  await completeLogin(pin.value)
}

async function setupLegacyPin() {
  if (newPin.value.length < 4 || newPin.value !== confirmPin.value) return
  loading.value = true

  await setPinForUser(selectedUser.value.id, newPin.value)
  selectedUser.value.pin_check = true

  await completeLogin(newPin.value)
}

async function completeLogin(userPin) {
  const user = selectedUser.value
  uiStore.setActiveUser({ id: user.id, nombre: user.nombre, avatar: user.avatar })
  uiStore.setUserPin(userPin)

  // Auto-decrypt API key if exists
  try {
    const prefix = `user_${user.id}_`
    const row = await db.settings.get(`${prefix}gemini_api_key_encrypted`)
    if (row?.value) {
      const decrypted = await decrypt(row.value, userPin)
      uiStore.setApiKey(decrypted)
    }
  } catch {
    // API key might have been encrypted with a different PIN (pre-migration)
  }

  // Load saved model
  try {
    const prefix = `user_${user.id}_`
    const modelRow = await db.settings.get(`${prefix}gemini_model`)
    if (modelRow?.value) uiStore.setGeminiModel(modelRow.value)
  } catch {
    // Ignore
  }

  uiStore.setSessionReady(true)
  loading.value = false
  router.push('/medicamentos')
}
</script>
