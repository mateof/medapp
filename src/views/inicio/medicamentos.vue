<template>
  <v-container :class="isMobile ? 'pa-2' : 'pa-6'" fluid>
    <v-row justify="center">
      <v-col cols="12" lg="10" xl="8">

        <!-- Estado vacío -->
        <v-card v-if="loaded && medicamentos.length === 0" class="text-center pa-8">
          <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-pill-off</v-icon>
          <h2 class="text-h6 text-medium-emphasis mb-2">No tienes medicamentos añadidos</h2>
          <p class="text-body-2 text-medium-emphasis mb-6">
            Añade tu primer medicamento para empezar a gestionar tu botiquín.
          </p>
          <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" to="/nuevo">
            Añadir medicamento
          </v-btn>
        </v-card>

        <!-- Lista acordeón -->
        <v-expansion-panels v-if="medicamentos.length > 0" variant="accordion" v-model="expandedPanel">
          <v-expansion-panel
            v-for="item in medicamentos"
            :key="item.id"
            :value="item.id"
          >
            <v-expansion-panel-title>
              <div class="d-flex align-center flex-grow-1 mr-2" style="min-width: 0">
                <v-avatar :size="isMobile ? 36 : 44" class="mr-3 flex-shrink-0">
                  <v-img :src="getFoto(item)" />
                </v-avatar>
                <div style="min-width: 0" class="flex-grow-1">
                  <div class="d-flex align-center">
                    <span class="text-body-1 font-weight-medium text-truncate">{{ item.name }}</span>
                    <v-chip
                      v-if="getSeveridad(item.id)"
                      :color="getSeveridadColor(item.id)"
                      size="x-small"
                      variant="tonal"
                      class="ml-2 flex-shrink-0"
                    >
                      {{ getSeveridadLabel(item.id) }}
                    </v-chip>
                  </div>
                  <div class="text-caption text-medium-emphasis text-truncate">
                    {{ item.data.labtitular || '' }}
                  </div>
                  <div v-if="item.enfermedades?.length" class="d-flex flex-wrap ga-1 mt-1">
                    <v-chip
                      v-for="tag in item.enfermedades"
                      :key="tag"
                      size="x-small"
                      variant="outlined"
                      color="primary"
                      prepend-icon="mdi-label-outline"
                    >
                      {{ tag }}
                    </v-chip>
                  </div>
                </div>
              </div>
              <template #actions="{ expanded }">
                <div class="d-flex align-center ga-1">
                  <v-btn
                    icon
                    variant="text"
                    size="small"
                    @click.stop="goToDetails(item)"
                    title="Ver detalles"
                  >
                    <v-icon size="20">mdi-information-outline</v-icon>
                  </v-btn>
                  <v-btn
                    v-if="hasProspecto(item)"
                    icon
                    variant="text"
                    size="small"
                    @click.stop="openPDF(item)"
                    title="Ver prospecto"
                  >
                    <v-icon size="20">mdi-file-document-outline</v-icon>
                  </v-btn>
                  <v-btn
                    icon
                    variant="text"
                    size="small"
                    color="error"
                    @click.stop="deletemed(item)"
                    title="Eliminar"
                  >
                    <v-icon size="20">mdi-delete-outline</v-icon>
                  </v-btn>
                  <v-icon class="ml-1">{{ expanded ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
                </div>
              </template>
            </v-expansion-panel-title>

            <v-expansion-panel-text>
              <template v-if="getFilteredData(item.id)">
                <v-alert
                  :type="severidadAlertType(getFilteredData(item.id).severidad)"
                  variant="tonal"
                  density="compact"
                  class="mb-3"
                >
                  {{ getFilteredData(item.id).resumen }}
                </v-alert>

                <div v-if="getFilteredData(item.id).interacciones.length > 0">
                  <div
                    v-for="(inter, i) in getFilteredData(item.id).interacciones"
                    :key="'inter-' + i"
                    class="mb-3"
                  >
                    <div class="d-flex align-center mb-1">
                      <v-chip :color="severidadChipColor(inter.severidad)" size="x-small" class="mr-2">
                        {{ inter.severidad }}
                      </v-chip>
                      <span class="text-body-2 font-weight-medium">{{ inter.medicamentos.join(' ↔ ') }}</span>
                    </div>
                    <div class="text-body-2 text-medium-emphasis ml-1">
                      <div v-if="inter.tipo"><strong>Tipo:</strong> {{ inter.tipo }}</div>
                      <div v-if="inter.recomendacion"><strong>Recomendación:</strong> {{ inter.recomendacion }}</div>
                    </div>
                  </div>
                </div>

                <div v-if="getFilteredData(item.id).contraindicaciones.length > 0" class="mt-2">
                  <div class="text-subtitle-2 font-weight-bold mb-1">Contraindicaciones</div>
                  <div
                    v-for="(ci, i) in getFilteredData(item.id).contraindicaciones"
                    :key="'ci-' + i"
                    class="d-flex align-start mb-2"
                  >
                    <v-icon color="warning" size="small" class="mr-2 mt-1">mdi-alert</v-icon>
                    <div>
                      <div class="text-body-2 font-weight-medium">{{ ci.medicamento }} → {{ ci.enfermedad }}</div>
                      <div class="text-caption text-medium-emphasis">{{ ci.detalle }}</div>
                    </div>
                  </div>
                </div>
              </template>

              <div v-else class="text-body-2 text-medium-emphasis py-2">
                <v-icon size="small" class="mr-1">mdi-check-circle-outline</v-icon>
                No se han encontrado interacciones con otros medicamentos.
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

      </v-col>
    </v-row>

    <dialogo
      :showDialog="!!deletedId"
      :title="'Eliminar Medicamento'"
      :texto="`Eliminar el medicamento: <i>${deletedName}</i>`"
      :type="'delete'"
      @cancel="cancelDialogo()"
      @accept="confirmDelete()"
    />
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { getMedicamentos, deleteMedicamentos, getInteracciones, deleteInteraccionesByMedId } from '@/services/storage/store'
import { useUiStore } from '@/stores/ui'
import dialogo from '@/components/commonComponents/modals/dialog.vue'

const router = useRouter()
const { smAndDown } = useDisplay()
const uiStore = useUiStore()

const medicamentos = ref([])
const loaded = ref(false)
const expandedPanel = ref(null)
const deletedId = ref(null)
const deletedName = ref(null)
const interaccionesMap = ref({})
const interaccionesDataMap = ref({})

const isMobile = computed(() => smAndDown.value)

onMounted(async () => {
  uiStore.setAddButton(true)
  medicamentos.value = await getMedicamentos()
  await loadInteracciones()
  loaded.value = true
})

async function loadInteracciones() {
  const all = await getInteracciones()
  if (all.length === 0) return

  for (const med of medicamentos.value) {
    const record = all.find(r => {
      if ((r.medIds || []).includes(med.id)) return true
      if ((r.medNames || []).some(n => namesOverlap(n, med.name))) return true
      return false
    })
    if (!record || !record.detalle) continue

    let resultado
    try {
      resultado = JSON.parse(record.detalle)
    } catch {
      continue
    }

    const filtered = filterInteraccionesForMed(resultado, med)
    if (filtered) {
      interaccionesDataMap.value[med.id] = filtered
      interaccionesMap.value[med.id] = filtered.severidad
    }
  }
}

function namesOverlap(a, b) {
  const la = a.toLowerCase()
  const lb = b.toLowerCase()
  if (la.includes(lb) || lb.includes(la)) return true
  const wa = la.split(/[\s(,]/)[0]
  const wb = lb.split(/[\s(,]/)[0]
  return wa.length >= 3 && wb.length >= 3 && wa === wb
}

function filterInteraccionesForMed(resultado, med) {
  const nameLower = med.name.toLowerCase()
  const pa = med.data?.vtm?.nombre?.toLowerCase() || ''

  const interacciones = (resultado.interacciones || []).filter(inter =>
    (inter.medicamentos || []).some(m =>
      namesOverlap(m, nameLower) || (pa && m.toLowerCase().includes(pa))
    )
  )
  const contraindicaciones = (resultado.contraindicaciones_enfermedad || []).filter(ci =>
    ci.medicamento && (
      namesOverlap(ci.medicamento, nameLower) || (pa && ci.medicamento.toLowerCase().includes(pa))
    )
  )

  if (interacciones.length === 0 && contraindicaciones.length === 0) return null

  let maxSev = getMaxSeveridad(interacciones.map(i => i.severidad))
  if (maxSev === 'ninguna' && contraindicaciones.length > 0) {
    maxSev = 'contraindicacion'
  }

  return {
    severidad: maxSev,
    resumen: resultado.resumen,
    interacciones,
    contraindicaciones
  }
}

function getMaxSeveridad(severidades) {
  if (severidades.includes('grave')) return 'grave'
  if (severidades.includes('moderada')) return 'moderada'
  if (severidades.includes('leve')) return 'leve'
  return 'ninguna'
}

function getFilteredData(medId) {
  return interaccionesDataMap.value[medId] || null
}

function getSeveridad(medId) {
  return interaccionesMap.value[medId] || null
}

function getSeveridadColor(medId) {
  const sev = interaccionesMap.value[medId]
  switch (sev) {
    case 'grave': return 'error'
    case 'moderada': return 'orange'
    case 'leve': return 'info'
    case 'contraindicacion': return 'warning'
    default: return null
  }
}

function getSeveridadLabel(medId) {
  const sev = interaccionesMap.value[medId]
  switch (sev) {
    case 'grave': return 'Grave'
    case 'moderada': return 'Moderada'
    case 'leve': return 'Leve'
    case 'contraindicacion': return 'Contraindicación'
    default: return ''
  }
}

function severidadAlertType(sev) {
  switch (sev) {
    case 'grave': return 'error'
    case 'moderada': return 'warning'
    case 'leve': return 'info'
    case 'contraindicacion': return 'warning'
    default: return 'success'
  }
}

function severidadChipColor(sev) {
  switch (sev) {
    case 'grave': return 'error'
    case 'moderada': return 'orange'
    case 'leve': return 'info'
    default: return 'success'
  }
}

function getFoto(item) {
  if (item.data.fotos && item.data.fotos[0]?.url) {
    return item.data.fotos[0].url
  }
  return '/img/med-placeholder.png'
}

function hasProspecto(item) {
  return item.data.docs?.some(d => d.tipo === 2 && d.url)
}

function goToDetails(item) {
  router.push({ name: 'Detalles', params: { id: item.id } })
}

function openPDF(item) {
  const doc = item.data.docs?.find(d => d.tipo === 2 && d.url)
  if (doc) window.open(doc.url, '_blank')
}

function deletemed(item) {
  deletedId.value = item.id
  deletedName.value = item.name
}

async function confirmDelete() {
  if (deletedId.value) {
    await deleteInteraccionesByMedId(deletedId.value, deletedName.value)
    await deleteMedicamentos(deletedId.value)
    medicamentos.value = await getMedicamentos()
    interaccionesDataMap.value = {}
    interaccionesMap.value = {}
    await loadInteracciones()
    deletedId.value = null
  }
}

function cancelDialogo() {
  deletedId.value = null
}
</script>

<style scoped>
.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
