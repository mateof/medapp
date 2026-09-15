<template>
  <div>
    <v-row dense>
      <v-col cols="12" sm="6">
        <v-text-field
          v-model="local.dosis"
          label="Dosis"
          placeholder="Ej: 600 mg, 1 comprimido, 5 ml"
          prepend-icon="mdi-scale-balance"
          variant="outlined"
          density="comfortable"
          hide-details
          @update:model-value="emitir"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <v-combobox
          v-model="local.frecuencia"
          :items="FRECUENCIAS"
          label="Frecuencia"
          prepend-icon="mdi-timer-outline"
          variant="outlined"
          density="comfortable"
          hide-details
          @update:model-value="emitir"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <v-combobox
          v-model="local.duracion"
          :items="DURACIONES"
          label="Duración"
          prepend-icon="mdi-calendar-range"
          variant="outlined"
          density="comfortable"
          hide-details
          @update:model-value="emitir"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <v-text-field
          v-model="local.notas"
          label="Notas"
          placeholder="Ej: Tomar con comida, en ayunas..."
          prepend-icon="mdi-note-text-outline"
          variant="outlined"
          density="comfortable"
          hide-details
          @update:model-value="emitir"
        />
      </v-col>
    </v-row>

    <v-btn
      v-if="puedeConsultar"
      variant="tonal"
      color="secondary"
      prepend-icon="mdi-robot-outline"
      :loading="consultando"
      class="mt-4"
      @click="consultar"
    >
      Consultar posología con IA
    </v-btn>

    <!-- Resultado de la consulta -->
    <v-dialog v-model="showDialog" max-width="600">
      <v-card>
        <v-card-title class="text-h6">
          <v-icon class="mr-2">mdi-robot-outline</v-icon>
          Posología recomendada por IA
        </v-card-title>
        <v-divider />
        <v-card-text>
          <div v-if="consultando" class="text-center py-8">
            <v-progress-circular indeterminate color="primary" size="48" class="mb-4" />
            <p class="text-body-1">Consultando posología recomendada...</p>
          </div>
          <div v-else-if="error" class="text-center py-4">
            <v-alert type="error" variant="tonal">{{ error }}</v-alert>
          </div>
          <div v-else-if="resultado">
            <v-alert type="info" variant="tonal" density="compact" class="mb-4">
              {{ resultado.resumen }}
            </v-alert>

            <div class="d-flex flex-column ga-3 mb-2">
              <div v-if="resultado.dosis" class="d-flex align-start">
                <v-icon size="small" class="mr-2 mt-1">mdi-scale-balance</v-icon>
                <div>
                  <div class="text-body-2 font-weight-medium">Dosis</div>
                  <div class="text-body-2 text-medium-emphasis">{{ resultado.dosis }}</div>
                </div>
              </div>
              <div v-if="resultado.frecuencia" class="d-flex align-start">
                <v-icon size="small" class="mr-2 mt-1">mdi-timer-outline</v-icon>
                <div>
                  <div class="text-body-2 font-weight-medium">Frecuencia</div>
                  <div class="text-body-2 text-medium-emphasis">{{ resultado.frecuencia }}</div>
                </div>
              </div>
              <div v-if="resultado.duracion" class="d-flex align-start">
                <v-icon size="small" class="mr-2 mt-1">mdi-calendar-range</v-icon>
                <div>
                  <div class="text-body-2 font-weight-medium">Duración</div>
                  <div class="text-body-2 text-medium-emphasis">{{ resultado.duracion }}</div>
                </div>
              </div>
              <div v-if="resultado.via_administracion" class="d-flex align-start">
                <v-icon size="small" class="mr-2 mt-1">mdi-routes</v-icon>
                <div>
                  <div class="text-body-2 font-weight-medium">Vía de administración</div>
                  <div class="text-body-2 text-medium-emphasis">{{ resultado.via_administracion }}</div>
                </div>
              </div>
              <div v-if="resultado.notas" class="d-flex align-start">
                <v-icon size="small" class="mr-2 mt-1">mdi-note-text-outline</v-icon>
                <div>
                  <div class="text-body-2 font-weight-medium">Notas</div>
                  <div class="text-body-2 text-medium-emphasis">{{ resultado.notas }}</div>
                </div>
              </div>
            </div>

            <div v-if="resultado.advertencias?.length > 0">
              <v-alert
                v-for="(adv, i) in resultado.advertencias"
                :key="'adv-' + i"
                type="warning"
                variant="tonal"
                density="compact"
                class="mb-2"
              >
                {{ adv }}
              </v-alert>
            </div>

            <p v-if="resultado._ai" class="text-caption text-medium-emphasis mt-3">
              {{ resultado._ai.providerName }} · {{ resultado._ai.model }}
            </p>
          </div>
        </v-card-text>
        <v-divider />
        <v-card-actions class="justify-space-between">
          <v-btn
            v-if="resultado && !consultando"
            variant="tonal"
            color="primary"
            prepend-icon="mdi-content-copy"
            @click="aplicar"
          >
            Aplicar al formulario
          </v-btn>
          <v-spacer />
          <v-btn variant="text" @click="showDialog = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useUiStore } from '@/stores/ui'
import { getUserProfile } from '@/services/storage/users'
import { savePosologiaConsulta } from '@/services/storage/store'
import { consultarPosologia } from '@/services/ai/ai'
import { logError } from '@/services/logs/logger'

const FRECUENCIAS = [
  'Cada 4 horas', 'Cada 6 horas', 'Cada 8 horas',
  'Cada 12 horas', 'Cada 24 horas', 'Según necesidad',
]
const DURACIONES = [
  '3 días', '5 días', '7 días', '10 días', '14 días',
  '1 mes', '3 meses', 'Crónico', 'Según prescripción',
]

const props = defineProps({
  // Objeto { dosis, frecuencia, duracion, notas } o null
  modelValue: {
    type: Object,
    default: null,
  },
  // Datos del medicamento (formato CIMA) para poder consultar a la IA
  medicamento: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'consulta'])

const uiStore = useUiStore()

const local = reactive({
  dosis: props.modelValue?.dosis || '',
  frecuencia: props.modelValue?.frecuencia || '',
  duracion: props.modelValue?.duracion || '',
  notas: props.modelValue?.notas || '',
})

const perfil = ref(null)
const showDialog = ref(false)
const consultando = ref(false)
const resultado = ref(null)
const error = ref(null)

// La consulta necesita al menos edad o peso: sin eso la IA no puede ajustar la dosis
const puedeConsultar = computed(() =>
  !!props.medicamento && !!uiStore.apiKey && !!(perfil.value?.edad || perfil.value?.peso)
)

onMounted(async () => {
  try {
    perfil.value = await getUserProfile(uiStore.activeUserId)
  } catch {
    perfil.value = null
  }
})

// Sincroniza cuando el padre carga los datos más tarde (ficha del medicamento)
watch(() => props.modelValue, (nuevo) => {
  if (JSON.stringify(normalizar()) === JSON.stringify(nuevo)) return
  local.dosis = nuevo?.dosis || ''
  local.frecuencia = nuevo?.frecuencia || ''
  local.duracion = nuevo?.duracion || ''
  local.notas = nuevo?.notas || ''
})

function texto(valor) {
  if (valor === null || valor === undefined) return ''
  return typeof valor === 'string' ? valor.trim() : String(valor).trim()
}

/**
 * Devuelve la posología como se guarda en la base de datos, o null si está vacía.
 */
function normalizar() {
  const dosis = texto(local.dosis)
  const frecuencia = texto(local.frecuencia)
  const duracion = texto(local.duracion)
  const notas = texto(local.notas)
  if (!dosis && !frecuencia && !duracion && !notas) return null
  return {
    dosis: dosis || null,
    frecuencia: frecuencia || null,
    duracion: duracion || null,
    notas: notas || null,
  }
}

function emitir() {
  emit('update:modelValue', normalizar())
}

async function consultar() {
  showDialog.value = true
  consultando.value = true
  resultado.value = null
  error.value = null

  try {
    const r = await consultarPosologia(uiStore.apiKey, props.medicamento)
    resultado.value = r

    await savePosologiaConsulta({
      medName: props.medicamento.nombre || props.medicamento.name,
      nregistro: props.medicamento.nregistro,
      resultado: JSON.stringify(r),
      resumen: r.resumen,
    })
    emit('consulta', r)
  } catch (e) {
    error.value = e.message || 'Error al consultar posología'
    if (!e.registrado) logError('ui', e, { operacion: 'consultar-posologia' })
  }
  consultando.value = false
}

function aplicar() {
  const r = resultado.value
  if (!r) return
  if (r.dosis) local.dosis = r.dosis
  if (r.frecuencia) local.frecuencia = r.frecuencia
  if (r.duracion) local.duracion = r.duracion
  const notas = [r.notas, r.via_administracion ? `Vía: ${r.via_administracion}` : ''].filter(Boolean).join('. ')
  if (notas) local.notas = notas
  emitir()
  showDialog.value = false
}

defineExpose({ normalizar })
</script>
