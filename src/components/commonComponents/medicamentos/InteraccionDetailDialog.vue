<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="1200" width="90%">
    <v-card v-if="data">
      <v-card-text>
        <div class="d-flex align-start mb-3">
          <v-chip
            v-if="type === 'interaccion'"
            :color="severidadColor(data.severidad)"
            size="small"
            class="mr-2 mt-1 flex-shrink-0"
          >
            {{ data.severidad }}
          </v-chip>
          <v-icon v-else color="warning" class="mr-2 mt-1 flex-shrink-0">mdi-alert</v-icon>
          <span class="text-h6">
            {{ type === 'interaccion' ? data.medicamentos?.join(' ↔ ') : `${data.medicamento} → ${data.enfermedad}` }}
          </span>
        </div>
        <v-divider class="mb-4" />
        <template v-if="type === 'interaccion'">
          <div class="mb-3">
            <div class="text-caption text-medium-emphasis font-weight-bold mb-1">Tipo</div>
            <div class="text-body-2">{{ data.tipo }}</div>
          </div>
          <div>
            <div class="text-caption text-medium-emphasis font-weight-bold mb-1">Recomendación</div>
            <div class="text-body-2">{{ data.recomendacion }}</div>
          </div>
        </template>
        <template v-else>
          <div>
            <div class="text-caption text-medium-emphasis font-weight-bold mb-1">Detalle</div>
            <div class="text-body-2">{{ data.detalle }}</div>
          </div>
        </template>
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="$emit('update:modelValue', false)">Cerrar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
defineProps({
  modelValue: Boolean,
  type: {
    type: String,
    default: 'interaccion'
  },
  data: {
    type: Object,
    default: null
  }
})

defineEmits(['update:modelValue'])

function severidadColor(sev) {
  switch (sev) {
    case 'grave': return 'error'
    case 'moderada': return 'orange'
    case 'leve': return 'info'
    default: return 'success'
  }
}
</script>
