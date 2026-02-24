<template>
  <v-container fluid class="pa-6">
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card>
          <v-card-title class="text-h5">
            <v-icon class="mr-2">mdi-cog</v-icon>
            Ajustes
          </v-card-title>
          <v-divider />
          <v-card-text>
            <h3 class="text-h6 mb-4">Inteligencia Artificial</h3>
            <p class="text-body-2 text-medium-emphasis mb-4">
              Introduce tu API key de Google Gemini para habilitar la comprobación automática de interacciones entre medicamentos.
            </p>

            <v-text-field
              v-model="apiKeyInput"
              :type="showKey ? 'text' : 'password'"
              label="API Key de Gemini"
              placeholder="AIza..."
              prepend-icon="mdi-key"
              variant="outlined"
              :append-inner-icon="showKey ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showKey = !showKey"
            />

            <div class="d-flex align-center ga-3 flex-wrap mb-4">
              <v-btn color="primary" @click="onSave" :loading="saving" prepend-icon="mdi-content-save">
                Guardar
              </v-btn>
              <v-btn
                variant="outlined"
                @click="testConnection"
                :loading="testing"
                :disabled="!currentKey"
                prepend-icon="mdi-connection"
              >
                Probar conexión
              </v-btn>
              <v-btn
                v-if="hasEncryptedKey"
                variant="outlined"
                color="error"
                @click="deleteKey"
                prepend-icon="mdi-delete"
              >
                Eliminar key
              </v-btn>
              <v-chip
                v-if="connectionStatus !== null"
                :color="connectionStatus ? 'success' : 'error'"
                size="small"
              >
                {{ connectionStatus ? 'Conexión OK' : 'Error de conexión' }}
              </v-chip>
            </div>

            <v-alert v-if="hasEncryptedKey" type="success" variant="tonal" density="compact" class="mb-2">
              <v-icon>mdi-shield-lock</v-icon> API key configurada y cifrada con tu PIN
            </v-alert>
            <v-alert v-else type="info" variant="tonal" density="compact" class="mb-2">
              <v-icon>mdi-information</v-icon> No hay API key configurada. Las interacciones no se comprobarán.
            </v-alert>

            <!-- Selector de modelo -->
            <v-select
              v-if="availableModels.length > 0"
              :model-value="selectedModel"
              @update:model-value="onModelChange"
              :items="availableModels"
              item-title="name"
              item-value="id"
              label="Modelo de IA"
              prepend-icon="mdi-robot-outline"
              variant="outlined"
              class="mt-4"
              hint="Modelo que se usará para analizar interacciones"
              persistent-hint
            >
              <template #item="{ item, props: itemProps }">
                <v-list-item v-bind="itemProps">
                  <template #append>
                    <span class="text-caption text-medium-emphasis">
                      {{ formatTokens(item.raw.inputTokenLimit) }} / {{ formatTokens(item.raw.outputTokenLimit) }}
                    </span>
                  </template>
                </v-list-item>
              </template>
            </v-select>

            <!-- Info del modelo tras probar conexión -->
            <v-card v-if="modelInfo" variant="tonal" color="primary" class="mt-4">
              <v-card-text>
                <div class="d-flex align-center mb-2">
                  <v-icon class="mr-2" size="small">mdi-robot-outline</v-icon>
                  <span class="text-subtitle-2 font-weight-bold">{{ modelInfo.name }}</span>
                  <v-chip v-if="modelInfo.version" size="x-small" class="ml-2">v{{ modelInfo.version }}</v-chip>
                </div>
                <p v-if="modelInfo.description" class="text-caption text-medium-emphasis mb-3">
                  {{ modelInfo.description }}
                </p>
                <div class="d-flex ga-4 flex-wrap">
                  <div class="d-flex align-center">
                    <v-icon size="x-small" class="mr-1">mdi-arrow-right-bold</v-icon>
                    <span class="text-caption"><strong>Input:</strong> {{ formatTokens(modelInfo.inputTokenLimit) }} tokens</span>
                  </div>
                  <div class="d-flex align-center">
                    <v-icon size="x-small" class="mr-1">mdi-arrow-left-bold</v-icon>
                    <span class="text-caption"><strong>Output:</strong> {{ formatTokens(modelInfo.outputTokenLimit) }} tokens</span>
                  </div>
                </div>
                <v-alert type="info" variant="outlined" density="compact" class="mt-3">
                  <span class="text-caption">
                    La API de Gemini no permite consultar la cuota ni el uso restante con una API key.
                    Puedes revisar tu consumo en <a href="https://aistudio.google.com" target="_blank" rel="noopener">Google AI Studio</a>.
                  </span>
                </v-alert>
              </v-card-text>
            </v-card>

            <v-divider class="my-4" />

            <v-card variant="outlined" class="pa-4" flat>
              <div class="text-subtitle-2 font-weight-bold mb-3">
                <v-icon size="small" class="mr-1">mdi-help-circle-outline</v-icon>
                ¿Cómo obtener una API key?
              </div>
              <v-timeline density="compact" side="end" line-thickness="1" line-color="primary" truncate-line="both">
                <v-timeline-item dot-color="primary" size="x-small">
                  <span class="text-body-2 text-high-emphasis">Ve a <a href="https://aistudio.google.com" target="_blank" rel="noopener">Google AI Studio</a></span>
                </v-timeline-item>
                <v-timeline-item dot-color="primary" size="x-small">
                  <span class="text-body-2 text-high-emphasis">Inicia sesión con tu cuenta de Google</span>
                </v-timeline-item>
                <v-timeline-item dot-color="primary" size="x-small">
                  <span class="text-body-2 text-high-emphasis">Crea una API key en la sección "API Keys"</span>
                </v-timeline-item>
                <v-timeline-item dot-color="success" size="x-small">
                  <span class="text-body-2 text-high-emphasis">Copia la key y pégala aquí</span>
                </v-timeline-item>
              </v-timeline>
            </v-card>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="3000" location="top">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getSetting, setSetting } from '@/services/storage/store'
import { testGeminiConnection, getAvailableModels } from '@/services/ai/gemini'
import { encrypt } from '@/services/crypto'
import { useUiStore } from '@/stores/ui'

const uiStore = useUiStore()

const apiKeyInput = ref('')
const showKey = ref(false)
const saving = ref(false)
const testing = ref(false)
const connectionStatus = ref(null)
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const hasEncryptedKey = ref(false)
const modelInfo = ref(null)
const availableModels = ref([])
const selectedModel = ref(uiStore.geminiModel)

const currentKey = () => uiStore.apiKey || apiKeyInput.value

onMounted(async () => {
  const savedModel = await getSetting('gemini_model')
  if (savedModel) {
    selectedModel.value = savedModel
    uiStore.setGeminiModel(savedModel)
  }
  const encrypted = await getSetting('gemini_api_key_encrypted')
  if (encrypted) {
    hasEncryptedKey.value = true
    if (uiStore.apiKey) {
      apiKeyInput.value = uiStore.apiKey
    }
  }
})

async function onSave() {
  if (!apiKeyInput.value) {
    showSnack('Introduce una API key', 'warning')
    return
  }
  const pin = uiStore.userPin
  if (!pin) {
    showSnack('Error: sesión no autenticada', 'error')
    return
  }
  saving.value = true
  try {
    const encrypted = await encrypt(apiKeyInput.value, pin)
    await setSetting('gemini_api_key_encrypted', encrypted)
    uiStore.setApiKey(apiKeyInput.value)
    hasEncryptedKey.value = true
    showSnack('API key cifrada y guardada correctamente', 'success')
  } catch {
    showSnack('Error al cifrar la API key', 'error')
  }
  saving.value = false
}

async function deleteKey() {
  await setSetting('gemini_api_key_encrypted', null)
  uiStore.clearApiKey()
  apiKeyInput.value = ''
  hasEncryptedKey.value = false
  connectionStatus.value = null
  modelInfo.value = null
  showSnack('API key eliminada', 'success')
}

async function testConnection() {
  testing.value = true
  connectionStatus.value = null
  modelInfo.value = null
  const key = uiStore.apiKey || apiKeyInput.value
  const [result, models] = await Promise.all([
    testGeminiConnection(key),
    getAvailableModels(key)
  ])
  connectionStatus.value = result.ok
  if (result.ok && result.model) {
    modelInfo.value = result.model
  }
  if (models.length > 0) {
    availableModels.value = models.filter(m =>
      m.id.includes('gemini') && !m.id.includes('embedding') && !m.id.includes('aqa')
    )
  }
  snackbarText.value = result.message
  snackbarColor.value = result.ok ? 'success' : 'error'
  testing.value = false
  snackbar.value = true
}

async function onModelChange(modelId) {
  selectedModel.value = modelId
  uiStore.setGeminiModel(modelId)
  await setSetting('gemini_model', modelId)
  const key = uiStore.apiKey || apiKeyInput.value
  if (key) {
    const result = await testGeminiConnection(key)
    if (result.ok && result.model) {
      modelInfo.value = result.model
    }
  }
}

function formatTokens(n) {
  if (!n) return '—'
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K'
  return String(n)
}

function showSnack(text, color) {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}
</script>
