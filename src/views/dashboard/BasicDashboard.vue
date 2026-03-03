<template>
  <v-container fluid class="down-top-padding">
    <!-- Estado vacío -->
    <v-row v-if="!loading && totalMeds === 0" justify="center">
      <v-col cols="12" sm="8" md="6">
        <v-card class="text-center pa-8">
          <v-icon size="80" color="grey-lighten-1" class="mb-4">mdi-pill</v-icon>
          <h2 class="text-h5 font-weight-regular mb-2">No tienes medicamentos</h2>
          <p class="text-body-1 text-medium-emphasis mb-6">
            Añade tu primer medicamento para empezar a ver estadísticas aquí.
          </p>
          <v-btn color="primary" size="large" to="/nuevo" prepend-icon="mdi-plus">
            Añadir medicamento
          </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dashboard con datos -->
    <template v-if="!loading && totalMeds > 0">
      <!-- Fila 1: KPIs -->
      <v-row>
        <v-col cols="12" sm="6" md="3">
          <v-card>
            <v-card-text class="d-flex align-center">
              <v-avatar color="primary" size="50" class="mr-4">
                <v-icon color="white">mdi-pill</v-icon>
              </v-avatar>
              <div>
                <h2 class="text-h4 font-weight-bold">{{ totalMeds }}</h2>
                <span class="text-subtitle-2 text-medium-emphasis">Medicamentos</span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card>
            <v-card-text class="d-flex align-center">
              <v-avatar color="success" size="50" class="mr-4">
                <v-icon color="white">mdi-tag-multiple</v-icon>
              </v-avatar>
              <div>
                <h2 class="text-h4 font-weight-bold">{{ totalTags }}</h2>
                <span class="text-subtitle-2 text-medium-emphasis">Etiquetas</span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card>
            <v-card-text class="d-flex align-center">
              <v-avatar :color="interaccionKpiColor" size="50" class="mr-4">
                <v-icon color="white">mdi-pill-multiple</v-icon>
              </v-avatar>
              <div>
                <h2 class="text-body-1 font-weight-bold">{{ interaccionKpiText }}</h2>
                <span class="text-subtitle-2 text-medium-emphasis">Interacciones</span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card>
            <v-card-text class="d-flex align-center">
              <v-avatar color="accent" size="50" class="mr-4">
                <v-icon color="white">mdi-clock-outline</v-icon>
              </v-avatar>
              <div>
                <h2 class="text-body-1 font-weight-bold">{{ lastActivityText }}</h2>
                <span class="text-subtitle-2 text-medium-emphasis">Última actividad</span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Fila 2: Gráficos -->
      <v-row>
        <v-col cols="12" lg="8">
          <v-card>
            <v-card-text class="pa-5">
              <h3 class="text-h6 font-weight-regular mb-4">Medicamentos por enfermedad</h3>
              <div style="height: 280px">
                <Bar :data="barData" :options="barOptions" />
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" lg="4">
          <v-card>
            <v-card-text class="pa-5">
              <h3 class="text-h6 font-weight-regular mb-4">Distribución</h3>
              <div style="height: 280px" class="d-flex justify-center">
                <Doughnut :data="doughnutData" :options="doughnutOptions" />
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Fila 3: Último análisis de interacciones -->
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-text class="pa-5">
              <h3 class="text-h6 font-weight-regular mb-4">
                <v-icon class="mr-1">mdi-pill-multiple</v-icon>
                Último análisis de interacciones
              </h3>

              <!-- Sin checks -->
              <v-alert v-if="!latestInteraccion" type="info" variant="tonal" density="compact">
                No se han comprobado interacciones todavía. Usa el botón "Comprobar" en los detalles de un medicamento.
              </v-alert>

              <!-- Con check -->
              <template v-else>
                <v-alert
                  :type="severidadAlertType(latestInteraccion.severidad)"
                  variant="tonal"
                  class="mb-4"
                >
                  {{ latestInteraccion.resumen }}
                </v-alert>

                <div class="d-flex align-center flex-wrap ga-2 mb-4">
                  <v-chip size="small" variant="outlined" prepend-icon="mdi-calendar">
                    {{ formatFecha(latestInteraccion.fecha) }}
                  </v-chip>
                  <v-chip
                    v-for="name in (latestInteraccion.medNames || [])"
                    :key="name"
                    size="small"
                    color="primary"
                    variant="tonal"
                  >
                    {{ name }}
                  </v-chip>
                  <v-chip
                    v-if="latestDetalle?._ai"
                    size="x-small"
                    variant="tonal"
                    color="secondary"
                    prepend-icon="mdi-robot-outline"
                  >
                    {{ latestDetalle._ai.providerName || latestDetalle._ai.provider }} · {{ latestDetalle._ai.model }}
                  </v-chip>
                </div>

                <!-- Interacciones individuales -->
                <template v-if="latestDetalle?.interacciones?.length > 0">
                  <h4 class="text-subtitle-1 font-weight-medium mb-2">Interacciones detectadas</h4>
                  <v-list density="compact" class="mb-4">
                    <v-list-item
                      v-for="(inter, i) in latestDetalle.interacciones"
                      :key="i"
                      rounded="lg"
                      @click="openDetail('interaccion', inter)"
                    >
                      <template #prepend>
                        <v-chip
                          :color="severidadColor(inter.severidad)"
                          size="x-small"
                          variant="flat"
                          class="mr-3"
                        >
                          {{ inter.severidad }}
                        </v-chip>
                      </template>
                      <v-list-item-title class="text-body-2 text-wrap">
                        {{ inter.medicamentos?.join(' ↔ ') }}
                      </v-list-item-title>
                      <v-list-item-subtitle class="text-truncate">{{ inter.tipo }}</v-list-item-subtitle>
                      <template #append>
                        <v-icon size="small" color="medium-emphasis">mdi-chevron-right</v-icon>
                      </template>
                    </v-list-item>
                  </v-list>
                </template>

                <!-- Contraindicaciones por enfermedad -->
                <template v-if="latestDetalle?.contraindicaciones_enfermedad?.length > 0">
                  <h4 class="text-subtitle-1 font-weight-medium mb-2">Contraindicaciones por enfermedad</h4>
                  <v-list density="compact">
                    <v-list-item
                      v-for="(ci, i) in latestDetalle.contraindicaciones_enfermedad"
                      :key="'ci-' + i"
                      rounded="lg"
                      @click="openDetail('contraindicacion', ci)"
                    >
                      <template #prepend>
                        <v-icon color="warning" size="small" class="mr-2">mdi-alert</v-icon>
                      </template>
                      <v-list-item-title class="text-body-2 text-wrap">
                        {{ ci.medicamento }} — {{ ci.enfermedad }}
                      </v-list-item-title>
                      <v-list-item-subtitle class="text-truncate">{{ ci.detalle }}</v-list-item-subtitle>
                      <template #append>
                        <v-icon size="small" color="medium-emphasis">mdi-chevron-right</v-icon>
                      </template>
                    </v-list-item>
                  </v-list>
                </template>
              </template>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Fila 4: Timeline + tendencia -->
      <v-row>
        <v-col cols="12" lg="8">
          <v-card>
            <v-card-text class="pa-5">
              <h3 class="text-h6 font-weight-regular mb-4">Actividad reciente</h3>
              <div v-if="actividades.length === 0" class="text-center py-6 text-medium-emphasis">
                No hay actividad registrada todavía.
              </div>
              <v-timeline v-else density="compact" side="end">
                <v-timeline-item
                  v-for="evento in actividades"
                  :key="evento.id"
                  :dot-color="getEventColor(evento.tipo)"
                  :icon="getEventIcon(evento.tipo)"
                  size="small"
                >
                  <div class="text-body-2">{{ evento.detalle }}</div>
                  <div class="text-caption text-medium-emphasis">{{ formatFecha(evento.fecha) }}</div>
                </v-timeline-item>
              </v-timeline>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" lg="4">
          <v-card>
            <v-card-text class="pa-5">
              <h3 class="text-h6 font-weight-regular mb-4">Tendencia mensual</h3>
              <div v-if="hasMonthlyData" style="height: 280px">
                <Line :data="lineData" :options="lineOptions" />
              </div>
              <div v-else class="text-center py-6 text-medium-emphasis">
                No hay actividad registrada en los últimos 6 meses.
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Fila 5: Medicamentos recientes + Historial interacciones -->
      <v-row>
        <v-col cols="12" lg="6">
          <v-card>
            <v-card-text class="pa-5">
              <h3 class="text-h6 font-weight-regular mb-4">Últimos medicamentos añadidos</h3>
              <v-list v-if="recentMeds.length > 0" lines="two">
                <template v-for="(med, i) in recentMeds" :key="med.id">
                  <v-divider v-if="i !== 0" />
                  <v-list-item :to="'/detalles/' + med.id">
                    <v-list-item-title>{{ med.name }}</v-list-item-title>
                    <v-list-item-subtitle>
                      {{ med.dateins ? formatFecha(med.dateins) : 'Fecha desconocida' }}
                    </v-list-item-subtitle>
                    <template #append>
                      <v-chip
                        v-for="tag in (med.enfermedades || []).slice(0, 2)"
                        :key="tag"
                        size="x-small"
                        class="ml-1"
                        color="primary"
                        variant="tonal"
                      >{{ tag }}</v-chip>
                    </template>
                  </v-list-item>
                </template>
              </v-list>
              <div v-else class="text-center py-4 text-medium-emphasis">
                Sin datos recientes
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" lg="6">
          <v-card>
            <v-card-text class="pa-5">
              <h3 class="text-h6 font-weight-regular mb-4">Historial de comprobaciones</h3>
              <v-list v-if="interaccionesHistory.length > 0" lines="two" density="compact">
                <template v-for="(check, i) in interaccionesHistory.slice(0, 5)" :key="check.id || i">
                  <v-divider v-if="i !== 0" />
                  <v-list-item rounded="lg" @click="openCheckDetail(check)">
                    <template #prepend>
                      <v-chip
                        :color="severidadColor(check.severidad)"
                        size="x-small"
                        variant="flat"
                        class="mr-3"
                      >
                        {{ severidadLabel(check.severidad) }}
                      </v-chip>
                    </template>
                    <v-list-item-title class="text-body-2 text-wrap">
                      {{ check.resumen }}
                    </v-list-item-title>
                    <v-list-item-subtitle>
                      {{ formatFecha(check.fecha) }} · {{ (check.medNames || []).length }} medicamentos
                      <template v-if="getCheckAi(check)"> · {{ getCheckAi(check) }}</template>
                    </v-list-item-subtitle>
                    <template #append>
                      <v-icon size="small" color="medium-emphasis">mdi-chevron-right</v-icon>
                    </template>
                  </v-list-item>
                </template>
              </v-list>
              <div v-else class="text-center py-4 text-medium-emphasis">
                No hay comprobaciones todavía
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Fila 6: Top etiquetas -->
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-text class="pa-5">
              <h3 class="text-h6 font-weight-regular mb-4">Top etiquetas</h3>
              <div v-if="medsPerTag.length > 0">
                <v-chip-group column>
                  <v-chip
                    v-for="item in medsPerTag.slice(0, 8)"
                    :key="item.tag"
                    color="primary"
                    variant="tonal"
                    size="large"
                  >
                    {{ item.tag }}
                    <template #append>
                      <v-avatar color="primary" size="24" class="ml-2">
                        <span class="text-caption text-white">{{ item.count }}</span>
                      </v-avatar>
                    </template>
                  </v-chip>
                </v-chip-group>
              </div>
              <div v-else class="text-center py-4 text-medium-emphasis">
                No hay etiquetas todavía
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- Loading -->
    <v-row v-if="loading" justify="center" class="mt-8">
      <v-progress-circular indeterminate color="primary" size="48" />
    </v-row>

    <!-- Modal comprobación completa -->
    <v-dialog v-model="showCheckDetail" max-width="1200" width="90%">
      <v-card v-if="checkDetailData">
        <v-card-text>
          <div class="d-flex align-center flex-wrap ga-2 mb-3">
            <v-chip :color="severidadColor(checkDetailData.severidad)" size="small">
              {{ checkDetailData.severidad }}
            </v-chip>
            <span class="text-caption text-medium-emphasis">{{ formatFecha(checkDetailCheck?.fecha) }}</span>
          </div>
          <div class="d-flex flex-wrap ga-1 mb-3">
            <v-chip
              v-for="name in (checkDetailCheck?.medNames || [])"
              :key="name"
              size="x-small"
              color="primary"
              variant="tonal"
            >{{ name }}</v-chip>
          </div>
          <interacciones-view :resultado="checkDetailData" />
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="showCheckDetail = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <InteraccionDetailDialog
      v-model="showDetail"
      :type="detailItem.type"
      :data="detailItem.data"
    />
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Bar, Doughnut, Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import { formatDistanceToNow, parseISO, format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  getMedicamentoCount,
  getMedicamentosPorEnfermedad,
  getDistinctEtiquetas,
  getMedicamentos,
  getActividadReciente,
  getActividadPorMes,
  getInteracciones,
} from '@/services/storage/store'
import InteraccionDetailDialog from '@/components/commonComponents/medicamentos/InteraccionDetailDialog.vue'
import interaccionesView from '@/components/commonComponents/medicamentos/interacciones.vue'

ChartJS.register(
  CategoryScale, LinearScale,
  BarElement, PointElement, LineElement,
  ArcElement, Filler, Tooltip, Legend
)

const COLORS = ['#1e88e5', '#21c1d6', '#fc4b6c', '#7460ee', '#26c6da', '#ffb22b', '#4fc3f7', '#f44336']

const loading = ref(true)
const totalMeds = ref(0)
const totalTags = ref(0)
const medsPerTag = ref([])
const actividades = ref([])
const actividadMensual = ref([])
const recentMeds = ref([])
const lastActivity = ref(null)
const showDetail = ref(false)
const detailItem = ref({ type: '', data: null })

function openDetail(type, data) {
  detailItem.value = { type, data }
  showDetail.value = true
}

const showCheckDetail = ref(false)
const checkDetailData = ref(null)
const checkDetailCheck = ref(null)

function openCheckDetail(check) {
  try {
    checkDetailData.value = JSON.parse(check.detalle)
    checkDetailCheck.value = check
    showCheckDetail.value = true
  } catch {
    // Si no se puede parsear el detalle, no abrir
  }
}
const interaccionesHistory = ref([])
const latestInteraccion = ref(null)
const latestDetalle = ref(null)

onMounted(async () => {
  const [count, tags, perTag, activity, monthly, meds, interacciones] = await Promise.all([
    getMedicamentoCount(),
    getDistinctEtiquetas(),
    getMedicamentosPorEnfermedad(),
    getActividadReciente(15),
    getActividadPorMes(6),
    getMedicamentos(),
    getInteracciones(),
  ])
  totalMeds.value = count
  totalTags.value = tags.length
  medsPerTag.value = perTag
  actividades.value = activity
  actividadMensual.value = monthly
  lastActivity.value = activity.length > 0 ? activity[0] : null
  recentMeds.value = meds
    .sort((a, b) => {
      if (!a.dateins) return 1
      if (!b.dateins) return -1
      return new Date(b.dateins) - new Date(a.dateins)
    })
    .slice(0, 5)

  interaccionesHistory.value = interacciones
  if (interacciones.length > 0) {
    latestInteraccion.value = interacciones[0]
    try {
      latestDetalle.value = JSON.parse(interacciones[0].detalle)
    } catch {
      latestDetalle.value = null
    }
  }

  loading.value = false
})

// --- Chart data ---

const barData = computed(() => ({
  labels: medsPerTag.value.map(t => t.tag),
  datasets: [{
    label: 'Medicamentos',
    backgroundColor: COLORS.slice(0, medsPerTag.value.length),
    data: medsPerTag.value.map(t => t.count),
    borderRadius: 4,
  }]
}))

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { enabled: true },
  },
  scales: {
    y: { beginAtZero: true, ticks: { stepSize: 1 } },
  },
}

const doughnutData = computed(() => ({
  labels: medsPerTag.value.map(t => t.tag),
  datasets: [{
    data: medsPerTag.value.map(t => t.count),
    backgroundColor: COLORS.slice(0, medsPerTag.value.length),
  }]
}))

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom', labels: { boxWidth: 12 } },
  },
}

const hasMonthlyData = computed(() =>
  actividadMensual.value.some(m => m.adds > 0 || m.deletes > 0)
)

const lineData = computed(() => ({
  labels: actividadMensual.value.map(m => {
    const [y, mo] = m.month.split('-')
    return format(new Date(Number(y), Number(mo) - 1), 'MMM yy', { locale: es })
  }),
  datasets: [
    {
      label: 'Añadidos',
      borderColor: '#21c1d6',
      backgroundColor: 'rgba(33, 193, 214, 0.15)',
      data: actividadMensual.value.map(m => m.adds),
      fill: true,
      tension: 0.3,
    },
    {
      label: 'Eliminados',
      borderColor: '#fc4b6c',
      backgroundColor: 'rgba(252, 75, 108, 0.15)',
      data: actividadMensual.value.map(m => m.deletes),
      fill: true,
      tension: 0.3,
    },
  ]
}))

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom', labels: { boxWidth: 12 } },
  },
  scales: {
    y: { beginAtZero: true, ticks: { stepSize: 1 } },
  },
}

// --- Interacciones helpers ---

const interaccionKpiColor = computed(() => {
  if (!latestInteraccion.value) return 'grey'
  return severidadColor(latestInteraccion.value.severidad)
})

const interaccionKpiText = computed(() => {
  if (!latestInteraccion.value) return 'Sin comprobar'
  return severidadLabel(latestInteraccion.value.severidad)
})

function severidadColor(sev) {
  switch (sev) {
    case 'ninguna': return 'success'
    case 'leve': return 'info'
    case 'moderada': return 'warning'
    case 'grave': return 'error'
    default: return 'grey'
  }
}

function severidadAlertType(sev) {
  switch (sev) {
    case 'ninguna': return 'success'
    case 'leve': return 'info'
    case 'moderada': return 'warning'
    case 'grave': return 'error'
    default: return 'info'
  }
}

function severidadLabel(sev) {
  if (!sev) return 'Desconocida'
  return sev.charAt(0).toUpperCase() + sev.slice(1)
}

// --- General helpers ---

const lastActivityText = computed(() => {
  if (!lastActivity.value) return 'Sin actividad'
  return formatDistanceToNow(parseISO(lastActivity.value.fecha), { addSuffix: true, locale: es })
})

function formatFecha(fecha) {
  return formatDistanceToNow(parseISO(fecha), { addSuffix: true, locale: es })
}

function getEventColor(tipo) {
  switch (tipo) {
    case 'med_added': return 'success'
    case 'med_deleted': return 'error'
    case 'tag_added': return 'info'
    default: return 'grey'
  }
}

function getCheckAi(check) {
  try {
    const data = JSON.parse(check.detalle)
    if (data._ai) return `${data._ai.providerName || data._ai.provider} · ${data._ai.model}`
  } catch { /* ignore */ }
  return null
}

function getEventIcon(tipo) {
  switch (tipo) {
    case 'med_added': return 'mdi-plus-circle'
    case 'med_deleted': return 'mdi-delete'
    case 'tag_added': return 'mdi-tag'
    default: return 'mdi-circle'
  }
}
</script>
