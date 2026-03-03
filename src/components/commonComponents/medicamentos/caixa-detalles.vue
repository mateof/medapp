<template>
  <v-container :class="isMobile ? 'pa-2' : 'pa-6'" fluid>
    <!-- Loading -->
    <v-row v-if="!loaded" justify="center" class="mt-8">
      <v-progress-circular indeterminate color="primary" size="48" />
    </v-row>

    <template v-if="loaded">
      <v-row justify="center">
        <v-col cols="12" lg="10" xl="8">

          <!-- CABECERA: foto + info principal -->
          <v-card class="mb-6">
            <v-row no-gutters>
              <v-col cols="12" md="5">
                <v-carousel
                  :continuous="false"
                  :show-arrows="fotos.length > 1"
                  hide-delimiter-background
                  delimiter-icon="mdi-minus"
                  height="300"
                >
                  <v-carousel-item
                    v-for="(slide, i) in fotos"
                    :src="slide.url"
                    :key="i"
                    cover
                  />
                </v-carousel>
              </v-col>

              <v-col cols="12" md="7">
                <div class="pa-6">
                  <h1 class="text-h5 font-weight-bold mb-1">{{ nombre }}</h1>
                  <p v-if="laboratorio" class="text-subtitle-1 text-medium-emphasis mb-2">
                    {{ laboratorio }}
                  </p>

                  <div v-if="principioActivo" class="d-flex align-center mb-2">
                    <v-icon size="small" class="mr-2" color="primary">mdi-flask-outline</v-icon>
                    <span class="text-body-1">{{ principioActivo }}</span>
                  </div>

                  <div v-if="nregistro" class="text-caption text-medium-emphasis mb-4">
                    N. Registro: {{ nregistro }}
                  </div>

                  <v-chip
                    v-if="estado"
                    :color="estadoColor"
                    variant="tonal"
                    size="small"
                    class="mb-4"
                  >
                    {{ estado }}
                  </v-chip>

                  <v-divider class="mb-4" />

                  <!-- Indicadores -->
                  <div class="d-flex flex-wrap ga-2">
                    <v-chip v-if="receta" color="purple" variant="tonal" size="small" prepend-icon="mdi-prescription">
                      Requiere receta
                    </v-chip>
                    <v-chip v-if="conduc" color="warning" variant="tonal" size="small" prepend-icon="mdi-car-off">
                      Afecta a la conducción
                    </v-chip>
                    <v-chip v-if="triangulo" color="error" variant="tonal" size="small" prepend-icon="mdi-triangle-outline">
                      Monitorización adicional
                    </v-chip>
                    <v-chip v-if="huerfano" color="info" variant="tonal" size="small" prepend-icon="mdi-hand-heart">
                      Medicamento huérfano
                    </v-chip>
                    <v-chip v-if="ema" color="success" variant="tonal" size="small" prepend-icon="mdi-earth">
                      Autorizado EMA
                    </v-chip>
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-card>

          <!-- DATOS RÁPIDOS -->
          <v-row class="mb-6">
            <v-col cols="12" sm="4">
              <v-card variant="outlined" class="text-center pa-4 h-100">
                <v-icon color="primary" size="32" class="mb-2">mdi-pill</v-icon>
                <div class="text-caption text-medium-emphasis">Forma farmacéutica</div>
                <div class="text-body-1 font-weight-medium">{{ formaFarmaceutica }}</div>
              </v-card>
            </v-col>
            <v-col cols="12" sm="4">
              <v-card variant="outlined" class="text-center pa-4 h-100">
                <v-icon color="primary" size="32" class="mb-2">mdi-routes</v-icon>
                <div class="text-caption text-medium-emphasis">Vía de administración</div>
                <div class="text-body-1 font-weight-medium">{{ viaAdministracion }}</div>
              </v-card>
            </v-col>
            <v-col cols="12" sm="4">
              <v-card variant="outlined" class="text-center pa-4 h-100">
                <v-icon color="primary" size="32" class="mb-2">mdi-scale-balance</v-icon>
                <div class="text-caption text-medium-emphasis">Dosis</div>
                <div class="text-body-1 font-weight-medium">{{ dosisText }}</div>
              </v-card>
            </v-col>
          </v-row>

          <!-- PROBLEMA DE SUMINISTRO -->
          <v-card v-if="psum" class="mb-6">
            <v-expansion-panels>
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <v-icon color="error" class="mr-2">mdi-cloud-alert</v-icon>
                  Problema de suministro
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-row v-for="presentacion in presentaciones" :key="presentacion.cn">
                    <v-divider class="mx-4" />
                    <v-col cols="12">
                      <div class="my-4 text-subtitle-1">{{ presentacion.nombre }}</div>
                      <v-divider />
                      <v-card variant="outlined" class="mt-2">
                        <v-card-title class="text-subtitle-1 font-weight-bold">
                          Fechas relacionadas
                        </v-card-title>
                        <v-divider />
                        <v-list density="compact">
                          <v-list-item>
                            <v-list-item-title>Fecha inicio:</v-list-item-title>
                            <v-list-item-subtitle class="text-end">
                              {{ new Date(presentacion.detalleProblemaSuministro.fini).toLocaleDateString('es-es') }}
                            </v-list-item-subtitle>
                          </v-list-item>
                          <v-list-item>
                            <v-list-item-title>Fecha fin:</v-list-item-title>
                            <v-list-item-subtitle class="text-end">
                              {{ new Date(presentacion.detalleProblemaSuministro.ffin).toLocaleDateString('es-es') }}
                            </v-list-item-subtitle>
                          </v-list-item>
                        </v-list>
                      </v-card>
                      <v-alert
                        v-if="!!presentacion.detalleProblemaSuministro.observ"
                        type="warning"
                        variant="tonal"
                        density="compact"
                        icon="mdi-exclamation"
                        class="mt-3"
                      >
                        {{ presentacion.detalleProblemaSuministro.observ }}
                      </v-alert>
                    </v-col>
                  </v-row>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-card>

          <!-- PRESCRITO PARA -->
          <v-card class="mb-6">
            <v-card-title>
              <v-icon class="mr-2">mdi-stethoscope</v-icon>
              Prescrito para
            </v-card-title>
            <v-card-text>
              <v-chip-group column>
                <v-chip v-for="tag in enfermedades" :key="tag" color="primary" variant="tonal">
                  {{ tag }}
                </v-chip>
                <v-chip v-if="enfermedades.length === 0" variant="outlined">Sin etiquetas</v-chip>
              </v-chip-group>
            </v-card-text>
          </v-card>

          <!-- INTERACCIONES -->
          <v-card class="mb-6">
            <v-card-title class="d-flex align-center">
              <v-icon class="mr-2">mdi-pill-multiple</v-icon>
              Interacciones
              <v-btn
                v-if="hasApiKey"
                size="small"
                variant="tonal"
                color="primary"
                class="ml-2"
                :loading="checkingInteracciones"
                @click="runInteractionCheck"
                prepend-icon="mdi-refresh"
              >
                Comprobar
              </v-btn>
            </v-card-title>
            <v-card-text>
              <v-alert v-if="!hasApiKey" type="info" variant="tonal" density="compact">
                Configura tu API key en Ajustes para comprobar interacciones.
              </v-alert>
              <interacciones-view v-else-if="filteredInteraccionResult" :resultado="filteredInteraccionResult" />
              <div v-else-if="!checkingInteracciones" class="text-medium-emphasis text-body-2">
                Pulsa "Comprobar" para analizar interacciones con tus otros medicamentos.
              </div>
            </v-card-text>
          </v-card>

          <!-- DOCUMENTOS -->
          <v-card class="mb-6">
            <v-card-title>
              <v-icon class="mr-2">mdi-file-document-multiple</v-icon>
              Documentos
            </v-card-title>
            <v-card-text>
              <v-list v-if="files.length > 0" lines="two">
                <v-list-item v-for="file in files" :key="file.tipo">
                  <template #prepend>
                    <v-avatar color="grey-lighten-1">
                      <v-icon>mdi-file-document</v-icon>
                    </v-avatar>
                  </template>
                  <v-list-item-title>{{ file.tipoString }}</v-list-item-title>
                  <template #append>
                    <v-btn v-if="file.hasUrlHtml" icon variant="text" @click="openUrl(file.urlHtml)">
                      <v-icon>mdi-eye</v-icon>
                    </v-btn>
                    <v-btn v-if="file.hasUrl" icon variant="text" @click="openUrl(file.url)">
                      <v-icon>mdi-download</v-icon>
                    </v-btn>
                  </template>
                </v-list-item>
              </v-list>
              <div v-else class="text-medium-emphasis text-body-2">
                No hay documentos disponibles.
              </div>
            </v-card-text>
          </v-card>

        </v-col>
      </v-row>
    </template>

  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'
import { getMedicamentoById, getMedicamentos, getInteraccionByMedId, saveInteraccion } from '@/services/storage/store'
import { useUiStore } from '@/stores/ui'
import { getMedicamentoByIdFromUrl } from '@/services/http/http'
import { getDocumentsFromDrug, getPresentacionesPSum } from '@/services/data/dataHelpers'
import { checkInteracciones } from '@/services/ai/ai'
import interaccionesView from '@/components/commonComponents/medicamentos/interacciones.vue'

const route = useRoute()
const { smAndDown } = useDisplay()
const uiStore = useUiStore()

const medicamento = ref(null)
const psum = ref(false)
const presentaciones = ref([])
const loaded = ref(false)
const files = ref([])
const hasApiKey = ref(false)
const checkingInteracciones = ref(false)
const interaccionResult = ref(null)

const isMobile = computed(() => smAndDown.value)

const fotos = computed(() => {
  if (medicamento.value?.data?.fotos?.length) {
    return medicamento.value.data.fotos
  }
  return [{ url: `${import.meta.env.BASE_URL}img/med-placeholder.png` }]
})

const nombre = computed(() => medicamento.value?.name || '')
const enfermedades = computed(() => medicamento.value?.enfermedades || [])
const laboratorio = computed(() => medicamento.value?.data?.labtitular || '')
const principioActivo = computed(() => medicamento.value?.data?.vtm?.nombre || '')
const nregistro = computed(() => medicamento.value?.data?.nregistro || '')

const estado = computed(() => {
  const e = medicamento.value?.data?.estado
  if (!e) return ''
  return typeof e === 'object' ? e.nombre : String(e)
})

const estadoColor = computed(() => {
  const e = estado.value?.toLowerCase() || ''
  if (e.includes('autorizado')) return 'success'
  if (e.includes('suspendido') || e.includes('revocado')) return 'error'
  return 'grey'
})

const receta = computed(() => !!medicamento.value?.data?.receta)
const conduc = computed(() => !!medicamento.value?.data?.conduc)
const triangulo = computed(() => !!medicamento.value?.data?.triangulo)
const huerfano = computed(() => !!medicamento.value?.data?.huerfano)
const ema = computed(() => !!medicamento.value?.data?.ema)

const formaFarmaceutica = computed(() => {
  const ff = medicamento.value?.data?.formaFarmaceutica
  if (!ff) return 'No disponible'
  return typeof ff === 'object' ? ff.nombre : String(ff)
})

const viaAdministracion = computed(() => {
  const vias = medicamento.value?.data?.viasAdministracion
  if (!vias || !Array.isArray(vias) || vias.length === 0) return 'No disponible'
  return vias.map(v => typeof v === 'object' ? v.nombre : String(v)).join(', ')
})

const dosisText = computed(() => medicamento.value?.data?.dosis || 'No disponible')

function fuzzyMatch(a, b) {
  const al = a.toLowerCase()
  const bl = b.toLowerCase()
  if (al.includes(bl) || bl.includes(al)) return true
  const fa = al.split(/[\s(,]/)[0]
  const fb = bl.split(/[\s(,]/)[0]
  return fa.length >= 3 && fb.length >= 3 && fa === fb
}

const filteredInteraccionResult = computed(() => {
  if (!interaccionResult.value) return null
  const medName = nombre.value
  const interacciones = (interaccionResult.value.interacciones || []).filter(inter =>
    (inter.medicamentos || []).some(m => fuzzyMatch(m, medName))
  )
  const contraindicaciones = (interaccionResult.value.contraindicaciones_enfermedad || []).filter(ci =>
    ci.medicamento && fuzzyMatch(ci.medicamento, medName)
  )
  if (interacciones.length === 0 && contraindicaciones.length === 0) return null
  return {
    ...interaccionResult.value,
    interacciones,
    contraindicaciones_enfermedad: contraindicaciones
  }
})

onMounted(async () => {
  const medId = Number(route.params.id)
  medicamento.value = await getMedicamentoById(medId)
  files.value = getDocumentsFromDrug(medicamento.value.data.docs)
  const restData = await getMedicamentoByIdFromUrl(medicamento.value.data.nregistro)
  presentaciones.value = getPresentacionesPSum(restData)
  psum.value = presentaciones.value.length > 0
  loaded.value = true

  hasApiKey.value = !!uiStore.apiKey

  const saved = await getInteraccionByMedId(medId, medicamento.value?.name)
  if (saved) {
    try {
      interaccionResult.value = JSON.parse(saved.detalle)
    } catch {
      interaccionResult.value = null
    }
  }
})

async function runInteractionCheck() {
  checkingInteracciones.value = true
  interaccionResult.value = null
  try {
    const apiKey = uiStore.apiKey
    const allMeds = await getMedicamentos()
    const allEnfermedades = [...new Set(allMeds.flatMap(m => m.enfermedades || []))]

    const result = await checkInteracciones(apiKey, allMeds, allEnfermedades)
    interaccionResult.value = result

    await saveInteraccion({
      medIds: allMeds.map(m => m.id),
      medNames: allMeds.map(m => m.name),
      severidad: result.severidad,
      resumen: result.resumen,
      detalle: JSON.stringify(result),
      enfermedades: allEnfermedades
    })
  } catch (e) {
    interaccionResult.value = {
      severidad: 'ninguna',
      resumen: `Error: ${e.message || 'No se pudo comprobar'}`,
      interacciones: [],
      contraindicaciones_enfermedad: []
    }
  }
  checkingInteracciones.value = false
}

function openUrl(url) {
  window.open(url, '_blank')
}
</script>

<style lang="scss">
@use "@/scss/pages/medicamentos.scss";

.h-100 {
  height: 100%;
}
</style>
