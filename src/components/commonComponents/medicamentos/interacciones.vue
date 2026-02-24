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

    <v-expansion-panels v-if="resultado.interacciones?.length" class="mb-4">
      <v-expansion-panel v-for="(inter, i) in resultado.interacciones" :key="'i-' + i">
        <v-expansion-panel-title>
          <v-chip :color="severidadColor(inter.severidad)" size="small" class="mr-2">
            {{ inter.severidad }}
          </v-chip>
          {{ inter.medicamentos.join(' ↔ ') }}
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <p class="mb-2"><strong>Tipo:</strong> {{ inter.tipo }}</p>
          <p><strong>Recomendación:</strong> {{ inter.recomendacion }}</p>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <div v-if="resultado.contraindicaciones_enfermedad?.length">
      <h4 class="text-subtitle-1 font-weight-bold mb-2">Contraindicaciones por enfermedad</h4>
      <v-list density="compact">
        <v-list-item
          v-for="(ci, i) in resultado.contraindicaciones_enfermedad"
          :key="'ci-' + i"
        >
          <template #prepend>
            <v-icon color="warning" size="small">mdi-alert</v-icon>
          </template>
          <v-list-item-title>{{ ci.medicamento }} → {{ ci.enfermedad }}</v-list-item-title>
          <v-list-item-subtitle>{{ ci.detalle }}</v-list-item-subtitle>
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
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  resultado: {
    type: Object,
    required: true
  }
})

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
