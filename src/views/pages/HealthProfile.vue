<template>
  <v-container fluid class="pa-6">
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card>
          <v-card-title class="text-h5">
            <v-icon class="mr-2">mdi-account-heart</v-icon>
            Perfil de salud
          </v-card-title>
          <v-divider />
          <v-card-text>

            <!-- Toggle humano / mascota -->
            <h3 class="text-subtitle-1 font-weight-bold mb-2">
              <v-icon class="mr-1" size="small">mdi-swap-horizontal</v-icon>
              Tipo de paciente
            </h3>
            <v-btn-toggle v-model="esMascota" mandatory color="primary" density="compact" class="mb-4">
              <v-btn :value="false">
                <v-icon class="mr-1">mdi-account</v-icon> Humano
              </v-btn>
              <v-btn :value="true">
                <v-icon class="mr-1">mdi-paw</v-icon> Mascota
              </v-btn>
            </v-btn-toggle>

            <!-- Tipo de mascota -->
            <v-expand-transition>
              <div v-if="esMascota">
                <v-select
                  v-model="tipoMascota"
                  :items="tiposMascota"
                  label="Tipo de mascota"
                  prepend-icon="mdi-paw"
                  variant="outlined"
                  class="mb-4"
                />
                <v-alert type="info" variant="tonal" density="compact" class="mb-4">
                  <v-icon size="small">mdi-information</v-icon>
                  Los medicamentos se buscarán en <strong>CIMAVet</strong> (base de datos veterinaria de la AEMPS).
                </v-alert>
              </div>
            </v-expand-transition>

            <v-divider class="mb-4" />

            <!-- Datos básicos -->
            <h3 class="text-subtitle-1 font-weight-bold mb-2">
              <v-icon class="mr-1" size="small">mdi-card-account-details</v-icon>
              Datos básicos
            </h3>
            <v-row dense class="mb-4">
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model.number="edad"
                  type="number"
                  label="Edad"
                  prepend-icon="mdi-calendar-account"
                  variant="outlined"
                  :suffix="esMascota ? 'años' : 'años'"
                  min="0"
                  max="200"
                />
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model.number="peso"
                  type="number"
                  label="Peso"
                  prepend-icon="mdi-weight-kilogram"
                  variant="outlined"
                  suffix="kg"
                  min="0"
                  step="0.1"
                />
              </v-col>
              <v-col cols="12" sm="4">
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

            <!-- Enfermedades crónicas -->
            <h3 class="text-subtitle-1 font-weight-bold mb-2">
              <v-icon class="mr-1" size="small">mdi-hospital-box</v-icon>
              Enfermedades crónicas
            </h3>
            <v-combobox
              v-model="enfermedadesCronicas"
              :items="enfermedadesSugeridas"
              chips
              closable-chips
              clearable
              multiple
              label="Condiciones crónicas"
              prepend-inner-icon="mdi-stethoscope"
              variant="outlined"
              hint="Escribe y pulsa Enter para añadir (ej: diabetes, hipertensión)"
              persistent-hint
              class="mb-4"
            />

            <!-- Alergias -->
            <h3 class="text-subtitle-1 font-weight-bold mb-2">
              <v-icon class="mr-1" size="small">mdi-alert-circle</v-icon>
              Alergias a medicamentos
            </h3>
            <v-combobox
              v-model="alergias"
              :items="alergiasSugeridas"
              chips
              closable-chips
              clearable
              multiple
              label="Alergias"
              prepend-inner-icon="mdi-allergy"
              variant="outlined"
              hint="Escribe y pulsa Enter para añadir (ej: penicilina, sulfamidas)"
              persistent-hint
              class="mb-4"
            />

            <!-- Peculiaridades -->
            <h3 class="text-subtitle-1 font-weight-bold mb-2">
              <v-icon class="mr-1" size="small">mdi-text-box-outline</v-icon>
              Otras peculiaridades
            </h3>
            <v-combobox
              v-model="peculiaridades"
              :items="peculiaridadesSugeridas"
              chips
              closable-chips
              clearable
              multiple
              label="Peculiaridades"
              prepend-inner-icon="mdi-note-text-outline"
              variant="outlined"
              hint="Embarazo, lactancia, edad avanzada, etc."
              persistent-hint
              class="mb-4"
            />
          </v-card-text>
          <v-divider />
          <v-card-actions class="pa-4">
            <v-spacer />
            <v-btn
              color="primary"
              variant="flat"
              :loading="saving"
              @click="save"
              prepend-icon="mdi-content-save"
            >
              Guardar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar" color="success" :timeout="3000" location="top">
      Perfil actualizado correctamente
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUiStore } from '@/stores/ui'
import { getUserById, updateUser } from '@/services/storage/users'

const uiStore = useUiStore()
const saving = ref(false)
const snackbar = ref(false)

const esMascota = ref(false)
const tipoMascota = ref(null)
const edad = ref(null)
const peso = ref(null)
const genero = ref(null)
const enfermedadesCronicas = ref([])
const alergias = ref([])
const peculiaridades = ref([])

const generosDisponibles = ['Masculino', 'Femenino', 'Otro']

const tiposMascota = ['Perro', 'Gato', 'Ave', 'Conejo', 'Reptil', 'Pez', 'Otro']

const enfermedadesSugeridas = [
  'Diabetes', 'Hipertensión', 'Asma', 'EPOC', 'Artritis',
  'Hipotiroidismo', 'Hipertiroidismo', 'Insuficiencia renal',
  'Insuficiencia hepática', 'Cardiopatía', 'Epilepsia',
  'Depresión', 'Ansiedad', 'Colesterol alto', 'Triglicéridos altos',
  'Anemia', 'Osteoporosis', 'Fibromialgia',
]

const alergiasSugeridas = [
  'Penicilina', 'Amoxicilina', 'Sulfamidas', 'AINEs', 'Ibuprofeno',
  'Aspirina', 'Cefalosporinas', 'Eritromicina', 'Tetraciclinas',
  'Metamizol', 'Paracetamol', 'Codeína', 'Látex',
]

const peculiaridadesSugeridas = [
  'Embarazo', 'Lactancia', 'Edad avanzada', 'Menor de edad',
  'Insuficiencia renal leve', 'Insuficiencia hepática leve',
  'Fumador', 'Consumo de alcohol frecuente',
]

onMounted(async () => {
  const user = await getUserById(uiStore.activeUserId)
  if (user) {
    esMascota.value = user.esMascota || false
    tipoMascota.value = user.tipoMascota || null
    edad.value = user.edad || null
    peso.value = user.peso || null
    genero.value = user.genero || null
    enfermedadesCronicas.value = user.enfermedades_cronicas || []
    alergias.value = user.alergias || []
    peculiaridades.value = user.peculiaridades || []
  }
})

async function save() {
  saving.value = true
  const updates = {
    enfermedades_cronicas: JSON.parse(JSON.stringify(enfermedadesCronicas.value)),
    alergias: JSON.parse(JSON.stringify(alergias.value)),
    peculiaridades: JSON.parse(JSON.stringify(peculiaridades.value)),
    esMascota: esMascota.value,
    tipoMascota: esMascota.value ? tipoMascota.value : null,
    edad: edad.value || null,
    peso: peso.value || null,
    genero: genero.value || null,
  }
  await updateUser(uiStore.activeUserId, updates)
  uiStore.activeUserEsMascota = esMascota.value
  uiStore.activeUserTipoMascota = esMascota.value ? tipoMascota.value : null
  saving.value = false
  snackbar.value = true
}
</script>
