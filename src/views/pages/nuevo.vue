<template>
  <v-container :class="smAndDown ? 'pa-2' : 'pa-6'" fluid>
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">

        <!-- BUSCADOR -->
        <v-card class="mb-6">
          <v-card-title>
            <v-icon class="mr-2">mdi-magnify</v-icon>
            Buscar medicamento
          </v-card-title>
          <v-card-text>
            <p class="text-body-2 text-medium-emphasis mb-4">
              Busca por nombre en la base de datos de {{ uiStore.activeUserEsMascota ? 'CIMAVet' : 'CIMA' }} (AEMPS)
            </p>
            <v-autocomplete
              v-model="model"
              :items="items"
              :loading="isLoading"
              @update:search="onSearch"
              hide-no-data
              hide-selected
              item-title="nombre"
              return-object
              label="Nombre del medicamento"
              placeholder="Escribe al menos 3 caracteres..."
              prepend-inner-icon="mdi-database-search"
              variant="outlined"
              clearable
            />
          </v-card-text>
        </v-card>

        <!-- VISTA PREVIA DEL MEDICAMENTO SELECCIONADO -->
        <v-expand-transition>
          <v-card v-if="model" class="mb-6">
            <v-row no-gutters>
              <v-col cols="12" sm="4">
                <v-img
                  :src="selectedFoto"
                  height="200"
                  cover
                  class="h-100"
                >
                  <template #placeholder>
                    <div class="d-flex align-center justify-center fill-height">
                      <v-icon size="64" color="grey-lighten-1">mdi-pill</v-icon>
                    </div>
                  </template>
                </v-img>
              </v-col>
              <v-col cols="12" sm="8">
                <div class="pa-5">
                  <div class="d-flex align-start justify-space-between">
                    <h2 class="text-h6 font-weight-bold mb-1">{{ selectedNombre }}</h2>
                    <v-btn icon variant="text" size="small" @click="model = null">
                      <v-icon>mdi-close</v-icon>
                    </v-btn>
                  </div>

                  <p v-if="selectedLab" class="text-body-2 text-medium-emphasis mb-3">
                    {{ selectedLab }}
                  </p>

                  <div v-if="selectedPA" class="d-flex align-center mb-2">
                    <v-icon size="small" class="mr-2" color="primary">mdi-flask-outline</v-icon>
                    <span class="text-body-2">{{ selectedPA }}</span>
                  </div>

                  <div v-if="selectedForma" class="d-flex align-center mb-2">
                    <v-icon size="small" class="mr-2" color="primary">mdi-pill</v-icon>
                    <span class="text-body-2">{{ selectedForma }}</span>
                  </div>

                  <div v-if="selectedDosis" class="d-flex align-center mb-3">
                    <v-icon size="small" class="mr-2" color="primary">mdi-scale-balance</v-icon>
                    <span class="text-body-2">{{ selectedDosis }}</span>
                  </div>

                  <v-btn
                    v-if="prospectoUrl"
                    variant="tonal"
                    color="primary"
                    size="small"
                    prepend-icon="mdi-file-document-outline"
                    :href="prospectoUrl"
                    target="_blank"
                  >
                    Ver prospecto
                  </v-btn>
                </div>
              </v-col>
            </v-row>
          </v-card>
        </v-expand-transition>

        <!-- ENFERMEDADES + BOTÓN AÑADIR -->
        <v-card class="mb-6">
          <v-card-title>
            <v-icon class="mr-2">mdi-stethoscope</v-icon>
            Prescrito para
          </v-card-title>
          <v-card-text>
            <p class="text-body-2 text-medium-emphasis mb-4">
              Indica las enfermedades o síntomas para los que se prescribe este medicamento
            </p>
            <v-combobox
              v-model="chips"
              :items="itemsLabel"
              chips
              closable-chips
              clearable
              label="Enfermedades o síntomas"
              multiple
              prepend-inner-icon="mdi-label-outline"
              variant="outlined"
              hint="Escribe y pulsa Enter para añadir nuevas etiquetas"
              persistent-hint
            />
          </v-card-text>
        </v-card>

        <!-- POSOLOGÍA -->
        <v-card class="mb-6">
          <v-card-title>
            <v-icon class="mr-2">mdi-clock-outline</v-icon>
            Posología
          </v-card-title>
          <v-card-text>
            <p class="text-body-2 text-medium-emphasis mb-4">
              Indica la dosis y frecuencia prescrita (opcional)
            </p>
            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="posologiaDosis"
                  label="Dosis"
                  placeholder="Ej: 600 mg, 1 comprimido, 5 ml"
                  prepend-icon="mdi-scale-balance"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-combobox
                  v-model="posologiaFrecuencia"
                  :items="frecuenciasSugeridas"
                  label="Frecuencia"
                  prepend-icon="mdi-timer-outline"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-combobox
                  v-model="posologiaDuracion"
                  :items="duracionesSugeridas"
                  label="Duración"
                  prepend-icon="mdi-calendar-range"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="posologiaNotas"
                  label="Notas"
                  placeholder="Ej: Tomar con comida, en ayunas..."
                  prepend-icon="mdi-note-text-outline"
                  variant="outlined"
                />
              </v-col>
            </v-row>
          </v-card-text>
          <v-divider />
          <v-card-actions class="pa-4">
            <v-spacer />
            <v-btn
              :disabled="!model"
              color="primary"
              variant="flat"
              size="large"
              @click="call"
              prepend-icon="mdi-plus"
            >
              Añadir medicamento
            </v-btn>
          </v-card-actions>
        </v-card>

      </v-col>
    </v-row>

    <!-- Diálogo de interacciones -->
    <v-dialog v-model="showInteraccionDialog" max-width="700" persistent>
      <v-card>
        <v-card-title class="text-h6">
          <v-icon class="mr-2">mdi-pill-multiple</v-icon>
          Comprobación de interacciones
        </v-card-title>
        <v-divider />
        <v-card-text>
          <div v-if="checkingInteracciones" class="text-center py-8">
            <v-progress-circular indeterminate color="primary" size="48" class="mb-4" />
            <p class="text-body-1">Analizando interacciones con tus medicamentos...</p>
          </div>
          <div v-else-if="interaccionError" class="text-center py-4">
            <v-alert type="error" variant="tonal">
              Error al comprobar interacciones: {{ interaccionError }}
            </v-alert>
          </div>
          <interacciones v-else-if="filteredInteraccionResult" :resultado="filteredInteraccionResult" />
        </v-card-text>
        <v-divider />
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="cancelAdd">Cancelar</v-btn>
          <v-btn
            v-if="!checkingInteracciones"
            :color="addButtonColor"
            variant="flat"
            @click="confirmAdd"
          >
            {{ addButtonText }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="duplicateError" color="error" :timeout="3000" location="top">
      El medicamento ya existe en tu lista
    </v-snackbar>

  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { searchDrugs } from '@/services/http/http'
import { addMedicamento, existsInDatabase, getDistinctEtiquetas, getMedicamentos, saveInteraccion } from '@/services/storage/store'
import { getUserProfile } from '@/services/storage/users'
import { useUiStore } from '@/stores/ui'
import { checkInteracciones } from '@/services/ai/ai'
import interacciones from '@/components/commonComponents/medicamentos/interacciones.vue'

const router = useRouter()
const { smAndDown } = useDisplay()
const uiStore = useUiStore()

const descriptionLimit = 60
const entries = ref([])
const isLoading = ref(false)
const model = ref(null)
const search = ref(null)
const duplicateError = ref(false)
const chips = ref([])
const itemsLabel = ref([])
let searchTimerId = null

// Posología
const posologiaDosis = ref('')
const posologiaFrecuencia = ref(null)
const posologiaDuracion = ref(null)
const posologiaNotas = ref('')
const frecuenciasSugeridas = [
  'Cada 4 horas', 'Cada 6 horas', 'Cada 8 horas',
  'Cada 12 horas', 'Cada 24 horas', 'Según necesidad',
]
const duracionesSugeridas = [
  '3 días', '5 días', '7 días', '10 días', '14 días',
  '1 mes', '3 meses', 'Crónico', 'Según prescripción',
]

// Interacciones
const showInteraccionDialog = ref(false)
const checkingInteracciones = ref(false)
const interaccionResult = ref(null)
const interaccionError = ref(null)
const pendingInteraccion = ref(null)

const items = computed(() => {
  return entries.value
    ? entries.value.map((entry) => {
        const nombre =
          entry.nombre.length > descriptionLimit
            ? entry.nombre.slice(0, descriptionLimit) + '...'
            : entry.nombre
        return Object.assign({}, entry, { nombre })
      })
    : []
})

// Vista previa del medicamento seleccionado
const selectedFoto = computed(() => model.value?.fotos?.[0]?.url || `${import.meta.env.BASE_URL}img/med-placeholder.png`)
const selectedNombre = computed(() => model.value?.nombre || '')
const selectedLab = computed(() => model.value?.labtitular || '')
const selectedPA = computed(() => model.value?.vtm?.nombre || model.value?.pactivos || '')
const selectedForma = computed(() => {
  const ff = model.value?.formaFarmaceutica
  if (!ff) return ''
  return typeof ff === 'object' ? ff.nombre : String(ff)
})
const selectedDosis = computed(() => model.value?.dosis || '')
const prospectoUrl = computed(() => {
  const docs = model.value?.docs
  if (!docs) return null
  const doc = docs.find(d => d.tipo === 2 && (d.urlHtml || d.url))
  return doc?.urlHtml || doc?.url || null
})

function fuzzyMatch(a, b) {
  const al = a.toLowerCase()
  const bl = b.toLowerCase()
  if (al.includes(bl) || bl.includes(al)) return true
  const fa = al.split(/[\s(,]/)[0]
  const fb = bl.split(/[\s(,]/)[0]
  return fa.length >= 3 && fb.length >= 3 && fa === fb
}

const filteredInteraccionResult = computed(() => {
  if (!interaccionResult.value || !model.value) return interaccionResult.value
  const medName = model.value.nombre
  const enfermedades = chips.value.map(c => c.toLowerCase())

  const matchMed = (m) => fuzzyMatch(m, medName)

  const interacciones = (interaccionResult.value.interacciones || []).filter(inter =>
    (inter.medicamentos || []).some(m => matchMed(m))
  )

  const contraindicaciones = (interaccionResult.value.contraindicaciones_enfermedad || []).filter(ci => {
    const medMatch = ci.medicamento && matchMed(ci.medicamento)
    const matchEnf = ci.enfermedad && enfermedades.some(e =>
      ci.enfermedad.toLowerCase().includes(e) || e.includes(ci.enfermedad.toLowerCase())
    )
    return medMatch || matchEnf
  })

  const contraindicacionesAlergia = (interaccionResult.value.contraindicaciones_alergia || []).filter(ca =>
    ca.medicamento && matchMed(ca.medicamento)
  )

  const observacionesPosologia = (interaccionResult.value.observaciones_posologia || []).filter(op =>
    op.medicamento && matchMed(op.medicamento)
  )

  const severityOrder = { grave: 3, moderada: 2, leve: 1 }
  const maxSev = interacciones.reduce((max, i) =>
    (severityOrder[i.severidad] || 0) > (severityOrder[max] || 0) ? i.severidad : max
  , 'ninguna')

  return {
    ...interaccionResult.value,
    severidad: maxSev,
    interacciones,
    contraindicaciones_enfermedad: contraindicaciones,
    contraindicaciones_alergia: contraindicacionesAlergia,
    observaciones_posologia: observacionesPosologia,
  }
})

const addButtonColor = computed(() => {
  const result = filteredInteraccionResult.value
  if (!result) return 'primary'
  switch (result.severidad) {
    case 'grave': return 'error'
    case 'moderada': return 'warning'
    default: return 'primary'
  }
})

const addButtonText = computed(() => {
  const result = filteredInteraccionResult.value
  if (!result) return 'Añadir igualmente'
  if (result.severidad === 'grave') return 'Añadir bajo tu responsabilidad'
  if (result.severidad === 'moderada' || result.severidad === 'leve') return 'Añadir igualmente'
  return 'Añadir'
})

onMounted(async () => {
  uiStore.setAddButton(false)
  itemsLabel.value = await getDistinctEtiquetas()
})

onUnmounted(() => {
  uiStore.setAddButton(true)
})

function onSearch(val) {
  search.value = val
  entries.value = []
  clearTimeout(searchTimerId)

  if (!isLoading.value) isLoading.value = true

  if (val && val.length >= 3) {
    searchTimerId = setTimeout(async () => {
      await buscar(val)
      isLoading.value = false
    }, 500)
  }

  if (!val || val.length < 3) isLoading.value = false
}

async function buscar(val) {
  const p = await searchDrugs(val, uiStore.activeUserEsMascota)
  entries.value = p.resultados
}

async function call() {
  if (await existsInDatabase(model.value.nregistro)) {
    duplicateError.value = true
    return
  }

  const apiKey = uiStore.apiKey
  const existingMeds = await getMedicamentos()

  // Comprobar si hay datos suficientes para analizar aunque sea el primer medicamento
  const hasPosologia = !!buildPosologia()
  let hasProfileData = false
  if (apiKey && existingMeds.length === 0) {
    const perfil = await getUserProfile(uiStore.activeUserId)
    hasProfileData = !!(
      perfil &&
      (perfil.enfermedades_cronicas?.length > 0 ||
       perfil.alergias?.length > 0 ||
       perfil.peculiaridades?.length > 0 ||
       chips.value.length > 0 ||
       hasPosologia)
    )
  }

  const shouldCheck = apiKey && (existingMeds.length > 0 || hasProfileData)

  if (shouldCheck) {
    showInteraccionDialog.value = true
    checkingInteracciones.value = true
    interaccionResult.value = null
    interaccionError.value = null

    try {
      const newMed = { name: model.value.nombre, data: model.value, enfermedades: chips.value, posologia: buildPosologia() }
      const allMeds = [...existingMeds, newMed]
      const allEnfermedades = [...new Set([
        ...existingMeds.flatMap(m => m.enfermedades || []),
        ...chips.value
      ])]

      const result = await checkInteracciones(apiKey, allMeds, allEnfermedades)
      interaccionResult.value = result

      const medIds = existingMeds.map(m => m.id)
      const medNames = [...existingMeds.map(m => m.name), model.value.nombre]
      pendingInteraccion.value = {
        medIds,
        medNames,
        severidad: result.severidad,
        resumen: result.resumen,
        detalle: JSON.stringify(result),
        enfermedades: allEnfermedades
      }
    } catch (e) {
      interaccionError.value = e.message || 'Error desconocido'
    }
    checkingInteracciones.value = false
  } else {
    await doAdd()
  }
}

async function confirmAdd() {
  showInteraccionDialog.value = false
  await doAdd()
}

function cancelAdd() {
  showInteraccionDialog.value = false
  interaccionResult.value = null
  interaccionError.value = null
  pendingInteraccion.value = null
}

function buildPosologia() {
  const d = posologiaDosis.value?.trim()
  const f = posologiaFrecuencia.value?.trim?.() || posologiaFrecuencia.value || ''
  const du = posologiaDuracion.value?.trim?.() || posologiaDuracion.value || ''
  const n = posologiaNotas.value?.trim()
  if (!d && !f && !du && !n) return null
  return { dosis: d || null, frecuencia: f || null, duracion: du || null, notas: n || null }
}

async function doAdd() {
  const newId = await addMedicamento(model.value, chips.value, buildPosologia())
  if (pendingInteraccion.value) {
    pendingInteraccion.value.medIds = [...pendingInteraccion.value.medIds, newId]
    await saveInteraccion(pendingInteraccion.value)
    pendingInteraccion.value = null
  }
  router.push('/medicamentos')
}
</script>
