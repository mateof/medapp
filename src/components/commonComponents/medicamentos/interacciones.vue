<template>
  <div>
    <v-alert
      :type="alertType"
      :icon="alertIcon"
      variant="tonal"
      class="mb-4"
    >
      {{ resultado.resumen }}
    </v-alert>

    <v-list v-if="resultado.interacciones?.length" density="compact" class="mb-4">
      <v-list-item
        v-for="(inter, i) in resultado.interacciones"
        :key="'i-' + i"
        rounded="lg"
        @click="openDetail('interaccion', inter)"
      >
        <template #prepend>
          <v-chip :color="severidadColor(inter.severidad)" size="small" class="mr-2">
            {{ inter.severidad }}
          </v-chip>
        </template>
        <v-list-item-title class="text-wrap">{{ inter.medicamentos.join(' ↔ ') }}</v-list-item-title>
        <v-list-item-subtitle class="text-truncate">{{ inter.tipo }}</v-list-item-subtitle>
        <template #append>
          <v-icon size="small" color="medium-emphasis">mdi-chevron-right</v-icon>
        </template>
      </v-list-item>
    </v-list>

    <div v-if="resultado.contraindicaciones_enfermedad?.length">
      <h4 class="text-subtitle-1 font-weight-bold mb-2">Contraindicaciones por enfermedad</h4>
      <v-list density="compact">
        <v-list-item
          v-for="(ci, i) in resultado.contraindicaciones_enfermedad"
          :key="'ci-' + i"
          rounded="lg"
          @click="openDetail('contraindicacion', ci)"
        >
          <template #prepend>
            <v-icon color="warning" size="small">mdi-alert</v-icon>
          </template>
          <v-list-item-title class="text-wrap">{{ ci.medicamento }} → {{ ci.enfermedad }}</v-list-item-title>
          <v-list-item-subtitle class="text-truncate">{{ ci.detalle }}</v-list-item-subtitle>
          <template #append>
            <v-icon size="small" color="medium-emphasis">mdi-chevron-right</v-icon>
          </template>
        </v-list-item>
      </v-list>
    </div>

    <div v-if="resultado.contraindicaciones_alergia?.length">
      <h4 class="text-subtitle-1 font-weight-bold mb-2">Contraindicaciones por alergia</h4>
      <v-list density="compact">
        <v-list-item
          v-for="(ca, i) in resultado.contraindicaciones_alergia"
          :key="'ca-' + i"
          rounded="lg"
          @click="openDetail('contraindicacion_alergia', ca)"
        >
          <template #prepend>
            <v-icon color="error" size="small">mdi-allergy</v-icon>
          </template>
          <v-list-item-title class="text-wrap">{{ ca.medicamento }} → {{ ca.alergia }}</v-list-item-title>
          <v-list-item-subtitle class="text-truncate">{{ ca.detalle }}</v-list-item-subtitle>
          <template #append>
            <v-icon size="small" color="medium-emphasis">mdi-chevron-right</v-icon>
          </template>
        </v-list-item>
      </v-list>
    </div>

    <div v-if="resultado.observaciones_posologia?.length">
      <h4 class="text-subtitle-1 font-weight-bold mb-2">Observaciones de posología</h4>
      <v-list density="compact">
        <v-list-item
          v-for="(obs, i) in resultado.observaciones_posologia"
          :key="'pos-' + i"
          rounded="lg"
          @click="openDetail('posologia', obs)"
        >
          <template #prepend>
            <v-chip :color="posologiaColor(obs.tipo)" size="small" class="mr-2">
              {{ posologiaLabel(obs.tipo) }}
            </v-chip>
          </template>
          <v-list-item-title class="text-wrap">{{ obs.medicamento }}</v-list-item-title>
          <v-list-item-subtitle class="text-wrap">{{ obs.observacion }}</v-list-item-subtitle>
          <template #append>
            <v-icon size="small" color="medium-emphasis">mdi-chevron-right</v-icon>
          </template>
        </v-list-item>
      </v-list>
    </div>

    <div v-if="resultado._ai" class="d-flex align-center ga-2 mt-4 mb-2">
      <v-chip size="x-small" variant="tonal" color="primary" prepend-icon="mdi-robot-outline">
        {{ resultado._ai.providerName || resultado._ai.provider }}
      </v-chip>
      <v-chip size="x-small" variant="outlined" prepend-icon="mdi-chip">
        {{ resultado._ai.model }}
      </v-chip>
    </div>

    <v-alert
      type="warning"
      variant="outlined"
      density="compact"
      icon="mdi-stethoscope"
      class="mt-2"
    >
      <span class="text-caption">
        Esta información se genera mediante inteligencia artificial con carácter orientativo y no sustituye en ningún caso el criterio de un profesional sanitario.
        Consulte siempre con su médico o farmacéutico y revise el prospecto de cada medicamento.
      </span>
    </v-alert>

    <InteraccionDetailDialog
      v-model="showDetail"
      :type="detail.type"
      :data="detail.data"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import InteraccionDetailDialog from './InteraccionDetailDialog.vue'

const props = defineProps({
  resultado: {
    type: Object,
    required: true
  }
})

const showDetail = ref(false)
const detail = ref({ type: '', data: null })

function openDetail(type, data) {
  detail.value = { type, data }
  showDetail.value = true
}

const alertType = computed(() => {
  switch (props.resultado.severidad) {
    case 'grave': return 'error'
    case 'moderada': return 'warning'
    case 'leve': return 'info'
    default: return 'success'
  }
})

const alertIcon = computed(() => {
  switch (props.resultado.severidad) {
    case 'grave': return 'mdi-alert-octagon'
    case 'moderada': return 'mdi-alert'
    case 'leve': return 'mdi-information'
    default: return 'mdi-check-circle'
  }
})

function severidadColor(sev) {
  switch (sev) {
    case 'grave': return 'error'
    case 'moderada': return 'orange'
    case 'leve': return 'info'
    default: return 'success'
  }
}

function posologiaColor(tipo) {
  switch (tipo) {
    case 'excesiva': return 'error'
    case 'insuficiente': return 'warning'
    case 'precaucion': return 'orange'
    case 'adecuada': return 'success'
    default: return 'info'
  }
}

function posologiaLabel(tipo) {
  switch (tipo) {
    case 'excesiva': return 'Excesiva'
    case 'insuficiente': return 'Insuficiente'
    case 'precaucion': return 'Precaución'
    case 'adecuada': return 'Adecuada'
    default: return tipo || 'Info'
  }
}
</script>
