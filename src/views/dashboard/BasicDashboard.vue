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
              <div class="d-flex align-center flex-wrap ga-2 mb-4">
                <h3 class="text-h6 font-weight-regular">
                  <v-icon class="mr-1">mdi-pill-multiple</v-icon>
                  Último análisis de interacciones
                </h3>
                <v-spacer />
                <v-btn
                  v-if="hasApiKey"
                  size="small"
                  variant="tonal"
                  :color="motivosDesactualizado.length > 0 ? 'warning' : 'primary'"
                  :loading="analizando"
                  prepend-icon="mdi-refresh"
                  @click="pedirAnalisis"
                >
                  {{ latestInteraccion ? 'Analizar de nuevo' : 'Analizar ahora' }}
                </v-btn>
              </div>

              <v-alert v-if="analisisError" type="error" variant="tonal" density="compact" class="mb-4">
                {{ analisisError }}
              </v-alert>

              <!-- Sin checks -->
              <v-alert v-if="!latestInteraccion" type="info" variant="tonal" density="compact">
                No se han comprobado interacciones todavía.
                <template v-if="hasApiKey">Pulsa "Analizar ahora" para revisar todo tu botiquín.</template>
                <template v-else>Configura tu API key en Ajustes para poder analizarlas.</template>
              </v-alert>

              <!-- Con check -->
              <template v-else>
                <!-- Aviso de análisis desactualizado -->
                <v-alert
                  v-if="motivosDesactualizado.length > 0"
                  type="warning"
                  variant="tonal"
                  density="compact"
                  icon="mdi-history"
                  class="mb-4"
                >
                  <div class="text-body-2 font-weight-medium mb-1">Este análisis puede estar desactualizado</div>
                  <ul class="text-caption pl-4">
                    <li v-for="(motivo, i) in motivosDesactualizado" :key="'mot-' + i">{{ motivo }}</li>
                  </ul>
                </v-alert>

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

                <!-- Alternativas sugeridas -->
                <template v-if="latestDetalle?.alternativas?.length > 0">
                  <h4 class="text-subtitle-1 font-weight-medium mb-2 mt-4">Alternativas sugeridas</h4>
                  <v-list density="compact">
                    <v-list-item
                      v-for="(alt, i) in latestDetalle.alternativas"
                      :key="'alt-' + i"
                      rounded="lg"
                      @click="openDetail('alternativa', alt)"
                    >
                      <template #prepend>
                        <v-chip
                          :color="comparativaColor(alt.comparativa)"
                          size="x-small"
                          variant="flat"
                          class="mr-3"
                        >
                          {{ comparativaLabel(alt.comparativa) }}
                        </v-chip>
                      </template>
                      <v-list-item-title class="text-body-2 text-wrap">
                        {{ alt.medicamento_original }} → {{ alt.alternativa }}
                      </v-list-item-title>
                      <v-list-item-subtitle class="text-truncate">{{ alt.beneficio }}</v-list-item-subtitle>
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
              <v-list v-if="interaccionesHistory.length > 0" lines="two" density="compact" class="history-list">
                <template v-for="(check, i) in visibleHistory" :key="check.id || i">
                  <v-divider v-if="i !== 0" />
                  <v-list-item rounded="lg" @click="openCheckDetail(check)">
                    <template #prepend>
                      <v-chip
                        v-if="check.tipo === 'posologia'"
                        color="secondary"
                        size="x-small"
                        variant="flat"
                        class="mr-3"
                      >
                        Posología
                      </v-chip>
                      <v-chip
                        v-else
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
                      {{ formatFecha(check.fecha) }}
                      <template v-if="check.tipo === 'posologia'"> · {{ check.medName }}</template>
                      <template v-else> · {{ (check.medNames || []).length }} medicamentos</template>
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
              <div v-if="interaccionesHistory.length > HISTORY_PAGE_SIZE" class="text-center mt-2">
                <v-btn
                  variant="text"
                  size="small"
                  :prepend-icon="showAllHistory ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                  @click="showAllHistory = !showAllHistory"
                >
                  {{ showAllHistory ? 'Ver menos' : `Ver las ${interaccionesHistory.length} comprobaciones` }}
                </v-btn>
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
          <!-- Posología IA -->
          <template v-if="checkDetailCheck?.tipo === 'posologia'">
            <div class="d-flex align-center flex-wrap ga-2 mb-3">
              <v-chip color="secondary" size="small">Posología IA</v-chip>
              <v-chip size="x-small" color="primary" variant="tonal">{{ checkDetailCheck.medName }}</v-chip>
              <span class="text-caption text-medium-emphasis">{{ formatFecha(checkDetailCheck?.fecha) }}</span>
            </div>
            <v-alert type="info" variant="tonal" density="compact" class="mb-4">
              {{ checkDetailData.resumen }}
            </v-alert>
            <div class="d-flex flex-column ga-3 mb-2">
              <div v-if="checkDetailData.dosis" class="d-flex align-start">
                <v-icon size="small" class="mr-3 mt-1" color="primary">mdi-scale-balance</v-icon>
                <div>
                  <div class="text-body-2 font-weight-medium">Dosis</div>
                  <div class="text-body-2 text-medium-emphasis">{{ checkDetailData.dosis }}</div>
                </div>
              </div>
              <div v-if="checkDetailData.frecuencia" class="d-flex align-start">
                <v-icon size="small" class="mr-3 mt-1" color="primary">mdi-timer-outline</v-icon>
                <div>
                  <div class="text-body-2 font-weight-medium">Frecuencia</div>
                  <div class="text-body-2 text-medium-emphasis">{{ checkDetailData.frecuencia }}</div>
                </div>
              </div>
              <div v-if="checkDetailData.duracion" class="d-flex align-start">
                <v-icon size="small" class="mr-3 mt-1" color="primary">mdi-calendar-range</v-icon>
                <div>
                  <div class="text-body-2 font-weight-medium">Duración</div>
                  <div class="text-body-2 text-medium-emphasis">{{ checkDetailData.duracion }}</div>
                </div>
              </div>
              <div v-if="checkDetailData.via_administracion" class="d-flex align-start">
                <v-icon size="small" class="mr-3 mt-1" color="primary">mdi-medical-bag</v-icon>
                <div>
                  <div class="text-body-2 font-weight-medium">Vía de administración</div>
                  <div class="text-body-2 text-medium-emphasis">{{ checkDetailData.via_administracion }}</div>
                </div>
              </div>
              <div v-if="checkDetailData.notas" class="d-flex align-start">
                <v-icon size="small" class="mr-3 mt-1" color="primary">mdi-note-text-outline</v-icon>
                <div>
                  <div class="text-body-2 font-weight-medium">Notas</div>
                  <div class="text-body-2 text-medium-emphasis">{{ checkDetailData.notas }}</div>
                </div>
              </div>
            </div>
            <div v-if="checkDetailData.advertencias?.length > 0" class="mt-2">
              <v-alert
                v-for="(adv, j) in checkDetailData.advertencias"
                :key="j"
                type="warning"
                variant="tonal"
                density="compact"
                class="mb-1"
              >
                {{ adv }}
              </v-alert>
            </div>
            <p v-if="checkDetailData._ai" class="text-caption text-medium-emphasis mt-3">
              {{ checkDetailData._ai.providerName }} — {{ checkDetailData._ai.model }}
            </p>
          </template>

          <!-- Interacciones -->
          <template v-else>
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
          </template>
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

    <dialogo
      :showDialog="confirmAnalisis"
      :title="'Analizar de nuevo'"
      :type="'confirm'"
      :texto="textoConfirmacion"
      @cancel="confirmAnalisis = false"
      @accept="ejecutarAnalisis()"
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
import { formatDistanceToNow, parseISO, format, differenceInDays } from 'date-fns'
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
import dialogo from '@/components/commonComponents/modals/dialog.vue'
import { analizarBotiquin } from '@/services/ai/ai'
import { getProvider } from '@/services/ai/providers'
import { useUiStore } from '@/stores/ui'

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
    if (check.tipo === 'posologia') {
      checkDetailData.value = JSON.parse(check.resultado)
    } else {
      checkDetailData.value = JSON.parse(check.detalle)
    }
    checkDetailCheck.value = check
    showCheckDetail.value = true
  } catch {
    // Si no se puede parsear el detalle, no abrir
  }
}
const interaccionesHistory = ref([])
const latestInteraccion = ref(null)
const latestDetalle = ref(null)
const allMeds = ref([])
const showAllHistory = ref(false)
const HISTORY_PAGE_SIZE = 5

const visibleHistory = computed(() =>
  showAllHistory.value ? interaccionesHistory.value : interaccionesHistory.value.slice(0, HISTORY_PAGE_SIZE)
)

// --- Reanálisis bajo demanda ---
const uiStore = useUiStore()
const analizando = ref(false)
const analisisError = ref(null)
const confirmAnalisis = ref(false)

// A partir de este número de medicamentos el análisis es caro (descarga todos
// los prospectos y los envía al modelo), así que pedimos confirmación.
const MEDS_CONFIRM_THRESHOLD = 4
// Días tras los cuales consideramos que conviene repetir el análisis.
const ANALISIS_DIAS_VALIDEZ = 90

const hasApiKey = computed(() => !!uiStore.apiKey)

onMounted(loadData)

async function loadData() {
  const [count, tags, perTag, activity, monthly, meds, interacciones] = await Promise.all([
    getMedicamentoCount(),
    getDistinctEtiquetas(),
    getMedicamentosPorEnfermedad(),
    getActividadReciente(15),
    getActividadPorMes(6),
    getMedicamentos(),
    getInteracciones({ incluirPosologia: true }),
  ])
  totalMeds.value = count
  totalTags.value = tags.length
  allMeds.value = meds
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
  latestInteraccion.value = null
  latestDetalle.value = null
  const ultimo = interacciones.find(i => i.tipo !== 'posologia')
  if (ultimo) {
    latestInteraccion.value = ultimo
    try {
      latestDetalle.value = JSON.parse(ultimo.detalle)
    } catch {
      latestDetalle.value = null
    }
  }

  loading.value = false
}

// --- Reanálisis de interacciones ---

/**
 * Motivos por los que el último análisis puede haberse quedado obsoleto:
 * el botiquín ha cambiado, se usa otra IA o ha pasado demasiado tiempo.
 */
const motivosDesactualizado = computed(() => {
  if (!latestInteraccion.value) return []
  const motivos = []

  const analizados = new Set(latestInteraccion.value.medIds || [])
  const actuales = allMeds.value.map(m => m.id)
  const nuevos = actuales.filter(id => !analizados.has(id))
  const eliminados = [...analizados].filter(id => !actuales.includes(id))
  if (nuevos.length > 0) {
    motivos.push(nuevos.length === 1
      ? 'Has añadido un medicamento desde entonces.'
      : `Has añadido ${nuevos.length} medicamentos desde entonces.`)
  }
  if (eliminados.length > 0) {
    motivos.push('Ya no tomas alguno de los medicamentos analizados.')
  }

  const ai = latestDetalle.value?._ai
  if (ai) {
    if (ai.provider !== uiStore.aiProvider) {
      const actual = getProvider(uiStore.aiProvider)
      motivos.push(`Se analizó con ${ai.providerName || ai.provider} y ahora usas ${actual?.name || uiStore.aiProvider}.`)
    } else if (ai.model !== uiStore.aiModel) {
      motivos.push(`Se analizó con el modelo ${ai.model} y ahora usas ${uiStore.aiModel}.`)
    }
  }

  const dias = differenceInDays(new Date(), parseISO(latestInteraccion.value.fecha))
  if (dias >= ANALISIS_DIAS_VALIDEZ) {
    motivos.push(`Han pasado ${dias} días desde el análisis.`)
  }

  return motivos
})

const proveedorActualNombre = computed(() => {
  return getProvider(uiStore.aiProvider)?.name || uiStore.aiProvider
})

const textoConfirmacion = computed(() =>
  `Se van a analizar <b>${allMeds.value.length} medicamentos</b>. Se descargarán sus prospectos y se enviarán a ${proveedorActualNombre.value}, `
  + 'así que la consulta puede tardar un poco y consume tokens de tu cuenta.<br><br>El resultado se guarda como un análisis nuevo: el anterior se conserva en el historial.'
)

function pedirAnalisis() {
  analisisError.value = null
  if (allMeds.value.length >= MEDS_CONFIRM_THRESHOLD) {
    confirmAnalisis.value = true
    return
  }
  ejecutarAnalisis()
}

async function ejecutarAnalisis() {
  confirmAnalisis.value = false
  analizando.value = true
  analisisError.value = null
  try {
    await analizarBotiquin(uiStore.apiKey)
    await loadData()
  } catch (e) {
    analisisError.value = e.message || 'No se pudo completar el análisis'
  }
  analizando.value = false
}

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

function comparativaColor(comp) {
  switch (comp) {
    case 'menos_nociva': return 'success'
    case 'similar': return 'orange'
    case 'distinto_perfil': return 'info'
    default: return 'info'
  }
}

function comparativaLabel(comp) {
  switch (comp) {
    case 'menos_nociva': return 'Menos nociva'
    case 'similar': return 'Riesgo similar'
    case 'distinto_perfil': return 'Otros efectos'
    default: return 'Alternativa'
  }
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
    const raw = check.tipo === 'posologia' ? check.resultado : check.detalle
    const data = JSON.parse(raw)
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

<style lang="scss" scoped>
.history-list {
  max-height: 420px;
  overflow-y: auto;
}
</style>
