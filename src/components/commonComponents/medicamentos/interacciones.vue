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

    <v-alert
      type="warning"
      variant="outlined"
      density="compact"
      icon="mdi-stethoscope"
      class="mt-4"
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
</script>
