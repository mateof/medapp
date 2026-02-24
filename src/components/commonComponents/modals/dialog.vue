<template>
  <v-row id="dialogo" justify="center">
    <v-dialog
      :fullscreen="isFullscreen"
      :model-value="showDialog"
      persistent
      max-width="600"
    >
      <v-card>
        <v-card-title class="text-h5 d-flex align-center">
          {{ title }}
          <v-spacer></v-spacer>
          <v-btn v-if="canFullscreen" icon @click="toggleFullscreen()">
            <v-icon>{{ isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen' }}</v-icon>
          </v-btn>
          <v-btn v-if="type === 'info'" icon @click="clickAccept()">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <iframe
            v-if="isIframe"
            :height="heightIframe"
            frameborder="0"
            style="right: 0; margin: 0; overflow: hidden; width: 100%"
            width="100%"
            :srcdoc="iframeSrcdoc"
          ></iframe>
          <span v-if="!isIframe" v-html="texto"></span>
        </v-card-text>
        <v-card-actions v-if="type !== 'info' || !showAcceptButton">
          <v-spacer></v-spacer>
          <v-btn
            color="red-darken-1"
            variant="text"
            v-if="type !== 'info'"
            @click="clickCancel()"
          >
            <v-icon>mdi-arrow-left-circle</v-icon> Cancelar
          </v-btn>
          <v-btn
            v-if="showAcceptButton"
            color="green-darken-1"
            variant="text"
            @click="clickAccept()"
          >
            <v-icon>mdi-check</v-icon> Aceptar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const anchorFixScript = `<script>document.addEventListener('click',function(e){var a=e.target.closest('a[href^="#"]');if(a){e.preventDefault();var el=document.getElementById(a.getAttribute('href').substring(1));if(el)el.scrollIntoView({behavior:'smooth'})}})<\/script>`

const props = defineProps({
  showDialog: {
    type: Boolean,
    default: false,
  },
  showAcceptButton: {
    type: Boolean,
    default: true,
  },
  type: {
    type: String,
    default: 'info',
  },
  title: {
    type: String,
    default: 'Titulo',
  },
  texto: {
    type: String,
    default: 'Texto',
  },
  isIframe: {
    type: Boolean,
    default: false,
  },
  canFullscreen: {
    type: Boolean,
    default: false,
  },
})

const iframeSrcdoc = computed(() => props.texto + anchorFixScript)

const emit = defineEmits(['accept', 'cancel'])

const isFullscreen = ref(false)
const heightIframe = ref(window.innerHeight - 180)

function clickAccept() {
  emit('accept')
}

function clickCancel() {
  emit('cancel')
}

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
  heightIframe.value = isFullscreen.value
    ? window.innerHeight - 90
    : window.innerHeight - 180
}

watch(() => props.showDialog, (newValue) => {
  if (!newValue) {
    clickCancel()
  }
})
</script>
