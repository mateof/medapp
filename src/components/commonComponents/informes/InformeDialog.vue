<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="640">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-file-pdf-box</v-icon>
        Generar informe
      </v-card-title>
      <v-divider />

      <v-card-text>
        <v-select
          v-if="tiposDisponibles.length > 1"
          v-model="tipoSel"
          :items="tiposDisponibles"
          item-title="titulo"
          item-value="valor"
          label="Tipo de informe"
          variant="outlined"
          density="compact"
          class="mb-2"
        />

        <p class="text-body-2 text-medium-emphasis mb-4">{{ descripcionTipo }}</p>

        <template v-if="tipoSel === 'medicacion'">
          <v-checkbox v-model="op.perfil" density="compact" hide-details label="Datos del paciente (edad, peso, condiciones crónicas)" />
          <v-checkbox v-model="op.alergias" density="compact" hide-details label="Alergias declaradas" />
          <v-checkbox v-model="op.suspendidos" density="compact" hide-details :label="`Tratamientos suspendidos (${suspendidos})`" />
          <v-checkbox
            v-model="op.interacciones"
            density="compact"
            hide-details
            :disabled="!analisisDisponible"
            :label="analisisDisponible ? 'Último análisis de interacciones' : 'Último análisis de interacciones (no hay ninguno)'"
          />
          <v-checkbox
            v-model="op.alternativas"
            density="compact"
            hide-details
            :disabled="!analisisDisponible || !op.interacciones"
            label="Alternativas sugeridas por la IA"
          />
          <v-textarea
            v-model="op.notas"
            label="Notas para el profesional (opcional)"
            variant="outlined"
            rows="2"
            density="compact"
            hide-details
            class="mt-4"
          />
        </template>

        <template v-else-if="tipoSel === 'interacciones'">
          <v-checkbox v-model="op.alternativas" density="compact" hide-details label="Incluir alternativas sugeridas" />
        </template>

        <template v-else-if="tipoSel === 'ficha'">
          <v-checkbox v-model="op.consultas" density="compact" hide-details label="Incluir consultas de posología a la IA" />
        </template>

        <v-alert
          v-if="incluyeIA"
          type="info"
          variant="tonal"
          density="compact"
          icon="mdi-robot-outline"
          class="mt-4"
        >
          <span class="text-caption">
            Las secciones generadas por IA salen marcadas en el PDF, con el modelo y la fecha, para que quien lo lea
            sepa que no son una valoración clínica.
          </span>
        </v-alert>

        <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-4">
          {{ error }}
        </v-alert>

        <p class="text-caption text-medium-emphasis mt-4 mb-0">
          El PDF se genera en este dispositivo. Contiene datos de salud: sale de aquí solo si tú lo compartes.
        </p>
      </v-card-text>

      <v-divider />
      <v-card-actions class="flex-wrap ga-2 pa-4">
        <v-spacer />
        <v-btn variant="text" @click="$emit('update:modelValue', false)">Cancelar</v-btn>
        <v-btn
          v-if="puedeCompartir"
          color="primary"
          variant="tonal"
          prepend-icon="mdi-share-variant"
          :loading="generando === 'compartir'"
          @click="generar('compartir')"
        >
          Compartir
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-download"
          :loading="generando === 'descargar'"
          @click="generar('descargar')"
        >
          Descargar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useUiStore } from '@/stores/ui'
import { getMedicamentos, getInteracciones, getPosologiaConsultas } from '@/services/storage/store'
import { getUserProfile } from '@/services/storage/users'
import { logError } from '@/services/logs/logger'

// jsPDF pesa más de 400 KB: se carga al generar el informe, no al abrir la vista.
const cargarMotor = () => Promise.all([
  import('@/services/reports/informes'),
  import('@/services/reports/pdf'),
])

const props = defineProps({
  modelValue: Boolean,
  // Tipos ofrecidos: 'medicacion', 'urgencias', 'interacciones', 'ficha'
  tipos: {
    type: Array,
    default: () => ['medicacion', 'urgencias'],
  },
  // Análisis concreto a imprimir (para el tipo 'interacciones')
  analisis: {
    type: Object,
    default: null,
  },
  // Medicamento concreto (para el tipo 'ficha')
  medicamento: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'generado'])

const TIPOS = {
  medicacion: {
    titulo: 'Informe de medicación',
    descripcion: 'Tratamiento actual con pautas, para llevar a la consulta. Elige qué incluir.',
  },
  urgencias: {
    titulo: 'Tarjeta de urgencias',
    descripcion: 'Media hoja para la cartera: alergias, condiciones crónicas y medicación con su pauta. No incluye nada generado por IA.',
  },
  interacciones: {
    titulo: 'Informe de interacciones',
    descripcion: 'El análisis seleccionado, con su fecha y el modelo que lo generó.',
  },
  ficha: {
    titulo: 'Ficha del medicamento',
    descripcion: 'Datos oficiales del medicamento, estado del tratamiento y pauta registrada.',
  },
}

const uiStore = useUiStore()

const tipoSel = ref(props.tipos[0])
const generando = ref(null)
const error = ref(null)
const medicamentos = ref([])
const perfil = ref(null)
const ultimoAnalisis = ref(null)
const consultasPosologia = ref([])

const op = ref({
  perfil: true,
  alergias: true,
  suspendidos: false,
  interacciones: false,
  alternativas: false,
  consultas: true,
  notas: '',
})

const tiposDisponibles = computed(() =>
  props.tipos.map(t => ({ valor: t, titulo: TIPOS[t]?.titulo || t }))
)

const descripcionTipo = computed(() => TIPOS[tipoSel.value]?.descripcion || '')

const suspendidos = computed(() => medicamentos.value.filter(m => m.activo === false).length)

const analisisDisponible = computed(() => !!(props.analisis || ultimoAnalisis.value))

const incluyeIA = computed(() => {
  if (tipoSel.value === 'interacciones') return true
  if (tipoSel.value === 'medicacion') return op.value.interacciones && analisisDisponible.value
  if (tipoSel.value === 'ficha') return op.value.consultas && consultasPosologia.value.length > 0
  return false
})

const puedeCompartir = computed(() => {
  try {
    if (typeof navigator === 'undefined' || typeof navigator.canShare !== 'function') return false
    const prueba = new File([new Blob(['test'])], 'test.pdf', { type: 'application/pdf' })
    return navigator.canShare({ files: [prueba] })
  } catch {
    return false
  }
})

watch(() => props.modelValue, async (abierto) => {
  if (!abierto) return
  error.value = null
  tipoSel.value = props.tipos[0]
  await cargarDatos()
})

watch(() => op.value.interacciones, (valor) => {
  if (!valor) op.value.alternativas = false
})

async function cargarDatos() {
  try {
    medicamentos.value = await getMedicamentos()
    perfil.value = await getUserProfile(uiStore.activeUserId)

    const checks = await getInteracciones()
    ultimoAnalisis.value = checks.length > 0 ? checks[0] : null

    if (props.medicamento) {
      consultasPosologia.value = (await getPosologiaConsultas(props.medicamento.name)).map(c => {
        let parsed = {}
        try { parsed = JSON.parse(c.resultado) } catch { /* ignore */ }
        return { ...c, parsed }
      })
    }
  } catch (e) {
    error.value = 'No se pudieron cargar los datos del informe'
    logError('informes', e, { operacion: 'cargar-datos', tipo: tipoSel.value })
  }
}

/**
 * Normaliza el registro guardado (con `detalle` en JSON) al formato del informe.
 */
function prepararAnalisis(registro) {
  if (!registro) return null
  if (registro.detalle && typeof registro.detalle === 'string') {
    try {
      return { fecha: registro.fecha, detalle: JSON.parse(registro.detalle), medNames: registro.medNames || [] }
    } catch {
      return null
    }
  }
  return registro
}

function construirDocumento(informes, pdf) {
  const { informeMedicacion, tarjetaUrgencias, informeInteracciones, fichaMedicamento } = informes
  const { nombreFichero } = pdf
  const usuario = { nombre: uiStore.activeUserName }
  const base = { usuario, perfil: perfil.value }

  switch (tipoSel.value) {
    case 'urgencias':
      return {
        doc: tarjetaUrgencias({ ...base, medicamentos: medicamentos.value }),
        nombre: nombreFichero('urgencias', uiStore.activeUserName),
      }

    case 'interacciones': {
      const analisis = prepararAnalisis(props.analisis || ultimoAnalisis.value)
      if (!analisis) throw new Error('No hay ningún análisis que imprimir')
      return {
        doc: informeInteracciones({ ...base, analisis, medNames: analisis.medNames || [] }),
        nombre: nombreFichero('interacciones', uiStore.activeUserName),
      }
    }

    case 'ficha':
      return {
        doc: fichaMedicamento({
          ...base,
          medicamento: props.medicamento,
          consultasPosologia: op.value.consultas ? consultasPosologia.value : [],
        }),
        nombre: nombreFichero('ficha', props.medicamento?.name),
      }

    default: {
      const analisis = op.value.interacciones ? prepararAnalisis(props.analisis || ultimoAnalisis.value) : null
      return {
        doc: informeMedicacion({
          ...base,
          medicamentos: medicamentos.value,
          analisis,
          opciones: { ...op.value },
        }),
        nombre: nombreFichero('medicacion', uiStore.activeUserName),
      }
    }
  }
}

async function generar(accion) {
  generando.value = accion
  error.value = null
  try {
    const [informes, pdf] = await cargarMotor()
    const { doc, nombre } = construirDocumento(informes, pdf)

    if (accion === 'compartir') {
      const compartido = await pdf.compartirPdf(doc, nombre, TIPOS[tipoSel.value]?.titulo)
      if (!compartido) pdf.guardarPdf(doc, nombre)
    } else {
      pdf.guardarPdf(doc, nombre)
    }

    emit('generado', { tipo: tipoSel.value, nombre })
    emit('update:modelValue', false)
  } catch (e) {
    error.value = e.message || 'No se pudo generar el informe'
    logError('informes', e, { operacion: 'generar', tipo: tipoSel.value, accion })
  }
  generando.value = null
}
</script>
