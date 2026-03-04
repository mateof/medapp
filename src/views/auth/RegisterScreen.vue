<template>
  <v-container class="fill-height" fluid>
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="6" lg="4">

        <div class="text-center mb-6">
          <v-avatar size="64" class="mb-3">
            <img src="@/assets/MedApp-pills.png" />
          </v-avatar>
          <h1 class="text-h5 font-weight-bold">Crear usuario</h1>
        </div>

        <v-card>
          <v-card-text>
            <!-- Avatar preview -->
            <div class="text-center mb-6">
              <div style="position: relative; display: inline-block">
                <v-avatar size="96">
                  <v-img :src="avatarPreview" />
                </v-avatar>
                <v-btn
                  icon
                  size="small"
                  color="primary"
                  style="position: absolute; bottom: 0; right: 0"
                  @click="$refs.fileInput.click()"
                >
                  <v-icon size="16">mdi-camera</v-icon>
                </v-btn>
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/*"
                  style="display: none"
                  @change="onFileSelected"
                />
              </div>
              <div v-if="avatarFile" class="mt-2">
                <v-btn size="x-small" variant="text" color="error" @click="removeAvatar">
                  Quitar imagen
                </v-btn>
              </div>
            </div>

            <v-text-field
              v-model="nombre"
              label="Nombre"
              prepend-icon="mdi-account"
              variant="outlined"
              :rules="[v => !!v.trim() || 'Obligatorio']"
              :error-messages="nombreError"
              class="mb-2"
            />

            <v-text-field
              v-model="pin"
              type="password"
              inputmode="numeric"
              maxlength="6"
              label="PIN (4-6 dígitos)"
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
              @keyup.enter="doRegister"
            />

            <v-divider class="my-4" />

            <div
              class="d-flex align-center mb-2"
              style="cursor: pointer"
              @click="showHealthFields = !showHealthFields"
            >
              <v-icon class="mr-2">mdi-heart-pulse</v-icon>
              <span class="text-body-2">Perfil de salud (opcional)</span>
              <v-spacer />
              <v-icon>{{ showHealthFields ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
            </div>

            <v-expand-transition>
              <div v-if="showHealthFields">
                <v-btn-toggle v-model="esMascota" mandatory color="primary" density="compact" class="mb-4">
                  <v-btn :value="false"><v-icon class="mr-1">mdi-account</v-icon> Humano</v-btn>
                  <v-btn :value="true"><v-icon class="mr-1">mdi-paw</v-icon> Mascota</v-btn>
                </v-btn-toggle>

                <v-select
                  v-if="esMascota"
                  v-model="tipoMascota"
                  :items="tiposMascota"
                  label="Tipo de mascota"
                  prepend-icon="mdi-paw"
                  variant="outlined"
                  class="mb-2"
                />

                <v-row dense class="mb-2">
                  <v-col cols="4">
                    <v-text-field
                      v-model.number="edad"
                      type="number"
                      label="Edad"
                      prepend-icon="mdi-calendar-account"
                      variant="outlined"
                      min="0"
                      max="200"
                    />
                  </v-col>
                  <v-col cols="4">
                    <v-text-field
                      v-model.number="peso"
                      type="number"
                      label="Peso (kg)"
                      prepend-icon="mdi-weight-kilogram"
                      variant="outlined"
                      min="0"
                      step="0.1"
                    />
                  </v-col>
                  <v-col cols="4">
                    <v-select
                      v-model="genero"
                      :items="generosDisponibles"
                      label="Género"
                      prepend-icon="mdi-gender-male-female"
                      variant="outlined"
                      clearable
                    />
                  </v-col>
                </v-row>

                <v-combobox
                  v-model="enfermedadesCronicas"
                  :items="enfermedadesSugeridas"
                  chips
                  closable-chips
                  clearable
                  multiple
                  label="Enfermedades crónicas"
                  variant="outlined"
                  class="mb-2"
                />

                <v-combobox
                  v-model="alergiasList"
                  :items="alergiasSugeridas"
                  chips
                  closable-chips
                  clearable
                  multiple
                  label="Alergias a medicamentos"
                  variant="outlined"
                  class="mb-2"
                />

                <v-combobox
                  v-model="peculiaridadesList"
                  :items="peculiaridadesSugeridas"
                  chips
                  closable-chips
                  clearable
                  multiple
                  label="Otras peculiaridades"
                  variant="outlined"
                />
              </div>
            </v-expand-transition>
          </v-card-text>

          <v-divider />

          <v-card-actions class="pa-4">
            <v-btn
              v-if="hasUsers"
              variant="text"
              @click="$router.push('/login')"
            >
              Volver
            </v-btn>
            <v-spacer />
            <v-btn
              color="primary"
              variant="flat"
              :loading="loading"
              :disabled="!canSubmit"
              @click="doRegister"
            >
              Crear y entrar
            </v-btn>
          </v-card-actions>
        </v-card>

      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { createUser, getAllUsers, generateInitialsAvatar, resizeImage, userNameExists } from '@/services/storage/users'
import { useUiStore } from '@/stores/ui'

const router = useRouter()
const uiStore = useUiStore()

const nombre = ref('')
const pin = ref('')
const confirmPin = ref('')
const loading = ref(false)
const hasUsers = ref(false)
const avatarFile = ref(null)
const avatarBase64 = ref(null)

const nombreError = ref('')

// Health profile fields
const showHealthFields = ref(false)
const esMascota = ref(false)
const tipoMascota = ref(null)
const edad = ref(null)
const peso = ref(null)
const genero = ref(null)
const enfermedadesCronicas = ref([])
const alergiasList = ref([])
const peculiaridadesList = ref([])

const generosDisponibles = ['Masculino', 'Femenino', 'Otro']

const tiposMascota = ['Perro', 'Gato', 'Ave', 'Conejo', 'Reptil', 'Pez', 'Otro']
const enfermedadesSugeridas = [
  'Diabetes', 'Hipertensión', 'Asma', 'EPOC', 'Artritis',
  'Hipotiroidismo', 'Insuficiencia renal', 'Cardiopatía', 'Epilepsia',
]
const alergiasSugeridas = [
  'Penicilina', 'Amoxicilina', 'Sulfamidas', 'AINEs', 'Ibuprofeno',
  'Aspirina', 'Cefalosporinas',
]
const peculiaridadesSugeridas = [
  'Embarazo', 'Lactancia', 'Edad avanzada', 'Menor de edad',
]

const pinRules = [v => v.length >= 4 || 'Mínimo 4 dígitos', v => /^\d+$/.test(v) || 'Solo dígitos']

const confirmPinError = computed(() => {
  if (confirmPin.value && confirmPin.value !== pin.value) return 'Los PIN no coinciden'
  return ''
})

const canSubmit = computed(() =>
  nombre.value.trim() && pin.value.length >= 4 && confirmPin.value === pin.value
)

const avatarPreview = computed(() => {
  if (avatarBase64.value) return avatarBase64.value
  if (nombre.value.trim()) return generateInitialsAvatar(nombre.value.trim())
  return generateInitialsAvatar('?')
})

onMounted(async () => {
  const users = await getAllUsers()
  hasUsers.value = users.length > 0
})

async function onFileSelected(event) {
  const file = event.target.files?.[0]
  if (!file) return
  avatarFile.value = file
  avatarBase64.value = await resizeImage(file)
}

function removeAvatar() {
  avatarFile.value = null
  avatarBase64.value = null
}

async function doRegister() {
  if (!canSubmit.value) return
  loading.value = true
  nombreError.value = ''

  if (await userNameExists(nombre.value)) {
    nombreError.value = 'Ya existe un usuario con ese nombre'
    loading.value = false
    return
  }

  const userId = await createUser({
    nombre: nombre.value.trim(),
    pin: pin.value,
    avatar: avatarBase64.value,
    enfermedades_cronicas: JSON.parse(JSON.stringify(enfermedadesCronicas.value)),
    alergias: JSON.parse(JSON.stringify(alergiasList.value)),
    peculiaridades: JSON.parse(JSON.stringify(peculiaridadesList.value)),
    esMascota: esMascota.value,
    tipoMascota: esMascota.value ? tipoMascota.value : null,
    edad: edad.value || null,
    peso: peso.value || null,
    genero: genero.value || null,
  })

  uiStore.setActiveUser({
    id: userId,
    nombre: nombre.value.trim(),
    avatar: avatarBase64.value,
    esMascota: esMascota.value,
    tipoMascota: esMascota.value ? tipoMascota.value : null,
  })
  uiStore.setUserPin(pin.value)
  uiStore.setSessionReady(true)

  loading.value = false
  router.push('/medicamentos')
}
</script>
