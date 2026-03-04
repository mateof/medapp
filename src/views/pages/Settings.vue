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

            <!-- SECCIÓN IA -->
            <h3 class="text-h6 mb-4">Inteligencia Artificial</h3>
            <p class="text-body-2 text-medium-emphasis mb-4">
              Selecciona un proveedor de IA y configura tu API key para habilitar la comprobación automática de interacciones entre medicamentos.
            </p>

            <!-- Selector de proveedor -->
            <div class="d-flex flex-wrap ga-2 mb-4">
              <v-chip
                v-for="prov in providerList"
                :key="prov.id"
                :color="selectedProvider === prov.id ? prov.color : undefined"
                :variant="selectedProvider === prov.id ? 'flat' : 'outlined'"
                :prepend-icon="prov.icon"
                size="default"
                @click="switchProvider(prov.id)"
              >
                {{ prov.name }}
              </v-chip>
            </div>

            <!-- Config del proveedor activo -->
            <v-card v-if="activeProvider" variant="outlined" class="mb-4">
              <v-card-text>
                <div class="d-flex align-center mb-3">
                  <v-icon :color="activeProvider.color" class="mr-2">{{ activeProvider.icon }}</v-icon>
                  <span class="text-subtitle-1 font-weight-bold">{{ activeProvider.name }}</span>
                </div>

                <v-alert v-if="activeProvider.requiresProxy" type="warning" variant="tonal" density="compact" class="mb-3">
                  {{ activeProvider.proxyNote }}
                </v-alert>

                <!-- URL base (solo para servidores locales) -->
                <template v-if="activeProvider.customBaseUrl">
                  <v-text-field
                    v-model="customBaseUrlInput"
                    label="URL base del servidor"
                    :placeholder="activeProvider.baseUrl"
                    prepend-icon="mdi-link"
                    variant="outlined"
                    hint="URL de la API compatible con OpenAI (ej: http://localhost:11434/v1)"
                    persistent-hint
                    class="mb-2"
                  />
                  <div class="d-flex align-center ga-2 flex-wrap mb-4">
                    <span class="text-caption text-medium-emphasis mr-1">Presets:</span>
                    <v-chip
                      v-for="preset in activeProvider.baseUrlPresets"
                      :key="preset.label"
                      size="small"
                      variant="outlined"
                      @click="customBaseUrlInput = preset.url"
                    >
                      {{ preset.label }}
                    </v-chip>
                  </div>
                </template>

                <!-- API Key -->
                <v-text-field
                  v-model="apiKeyInput"
                  :type="showKey ? 'text' : 'password'"
                  :label="activeProvider.keyOptional ? `API Key (opcional)` : `API Key de ${activeProvider.name}`"
                  :placeholder="activeProvider.keyPlaceholder"
                  prepend-icon="mdi-key"
                  variant="outlined"
                  :append-inner-icon="showKey ? 'mdi-eye-off' : 'mdi-eye'"
                  @click:append-inner="showKey = !showKey"
                  class="mb-1"
                />

                <v-checkbox
                  v-model="shareKey"
                  label="Compartir esta key con todos los usuarios"
                  density="compact"
                  hide-details
                  class="mb-2"
                  prepend-icon="mdi-share-variant"
                />

                <div class="d-flex align-center ga-3 flex-wrap mb-4">
                  <v-btn color="primary" @click="onSave" :loading="saving" prepend-icon="mdi-content-save">
                    Guardar
                  </v-btn>
                  <v-btn
                    variant="outlined"
                    @click="doTestConnection"
                    :loading="testing"
                    :disabled="!canTest"
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

                <v-alert v-if="hasEncryptedKey" type="success" variant="tonal" density="compact" class="mb-3">
                  <v-icon>mdi-shield-lock</v-icon> API key configurada y cifrada con tu PIN
                </v-alert>
                <v-alert v-else-if="isShared" type="info" variant="tonal" density="compact" class="mb-3">
                  <v-icon>mdi-share-variant</v-icon> Estás usando una key compartida por otro usuario.
                </v-alert>
                <v-alert v-else type="info" variant="tonal" density="compact" class="mb-3">
                  <v-icon>mdi-information</v-icon> No hay API key configurada para este proveedor.
                </v-alert>

                <!-- Modelo actual -->
                <v-card variant="tonal" :color="activeProvider.color" class="mb-3">
                  <v-card-text class="d-flex align-center">
                    <v-icon class="mr-2" size="small">mdi-robot-outline</v-icon>
                    <span class="text-subtitle-2 font-weight-bold">{{ selectedModelName }}</span>
                    <v-chip v-if="modelInfo?.version" size="x-small" class="ml-2">v{{ modelInfo.version }}</v-chip>
                    <v-spacer />
                    <v-btn
                      variant="text"
                      size="small"
                      :icon="showModelSelect ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                      @click="showModelSelect = !showModelSelect"
                    />
                  </v-card-text>
                  <template v-if="modelInfo">
                    <v-divider />
                    <v-card-text class="pt-2 pb-3">
                      <p v-if="modelInfo.description" class="text-caption text-medium-emphasis mb-3">
                        {{ modelInfo.description }}
                      </p>
                      <div v-if="modelInfo.inputTokenLimit" class="d-flex ga-4 flex-wrap">
                        <div class="d-flex align-center">
                          <v-icon size="x-small" class="mr-1">mdi-arrow-right-bold</v-icon>
                          <span class="text-caption"><strong>Input:</strong> {{ formatTokens(modelInfo.inputTokenLimit) }} tokens</span>
                        </div>
                        <div class="d-flex align-center">
                          <v-icon size="x-small" class="mr-1">mdi-arrow-left-bold</v-icon>
                          <span class="text-caption"><strong>Output:</strong> {{ formatTokens(modelInfo.outputTokenLimit) }} tokens</span>
                        </div>
                      </div>
                    </v-card-text>
                  </template>
                </v-card>

                <!-- Selector de modelo -->
                <v-combobox
                  v-if="showModelSelect && activeProvider.customBaseUrl"
                  :model-value="selectedModel"
                  @update:model-value="onModelChange"
                  :items="allModels.map(m => m.id)"
                  label="Modelo (selecciona o escribe)"
                  prepend-icon="mdi-swap-horizontal"
                  variant="outlined"
                  :hint="activeProvider.customBaseUrl ? 'Escribe el nombre del modelo o selecciona uno de la lista' : 'Modelo que se usará para analizar interacciones'"
                  persistent-hint
                />
                <v-select
                  v-else-if="showModelSelect"
                  :model-value="selectedModel"
                  @update:model-value="onModelChange"
                  :items="allModels"
                  item-title="name"
                  item-value="id"
                  label="Cambiar modelo"
                  prepend-icon="mdi-swap-horizontal"
                  variant="outlined"
                  hint="Modelo que se usará para analizar interacciones"
                  persistent-hint
                >
                  <template #item="{ item, props: itemProps }">
                    <v-list-item v-bind="itemProps">
                      <template #subtitle>
                        <span v-if="item.raw.description">{{ item.raw.description }}</span>
                      </template>
                      <template v-if="item.raw.inputTokenLimit" #append>
                        <span class="text-caption text-medium-emphasis">
                          {{ formatTokens(item.raw.inputTokenLimit) }} / {{ formatTokens(item.raw.outputTokenLimit) }}
                        </span>
                      </template>
                    </v-list-item>
                  </template>
                </v-select>

                <!-- Enlace para obtener key -->
                <v-card variant="outlined" class="pa-3 mt-3" flat>
                  <div class="text-caption text-medium-emphasis">
                    <v-icon size="x-small" class="mr-1">mdi-help-circle-outline</v-icon>
                    Obtén tu API key en
                    <a :href="activeProvider.keyLink" target="_blank" rel="noopener">{{ activeProvider.keyLinkText }}</a>
                  </div>
                </v-card>
              </v-card-text>
            </v-card>

            <v-divider class="my-6" />

            <!-- PROXY CORS -->
            <h3 class="text-h6 mb-4">
              <v-icon class="mr-1">mdi-shield-link-variant</v-icon>
              Proxy CORS
            </h3>
            <p class="text-body-2 text-medium-emphasis mb-4">
              Configura un proxy CORS para que la IA pueda descargar los prospectos de CIMA y usarlos al analizar interacciones.
              Sin proxy, el análisis se realizará sin información de prospectos.
            </p>

            <v-text-field
              v-model="proxyUrlInput"
              label="URL del proxy"
              placeholder="http://mi-servidor:3010/proxy?url={url}"
              prepend-icon="mdi-server-network"
              variant="outlined"
              hint="Usa {url} donde debe ir la URL de destino (se codificará automáticamente)"
              persistent-hint
              class="mb-2"
            />

            <div class="d-flex align-center ga-2 flex-wrap mb-4">
              <span class="text-caption text-medium-emphasis mr-1">Plantillas:</span>
              <v-chip
                v-for="preset in proxyPresets"
                :key="preset.label"
                size="small"
                variant="outlined"
                @click="proxyUrlInput = preset.url"
              >
                {{ preset.label }}
              </v-chip>
            </div>

            <div class="d-flex align-center ga-3 flex-wrap mb-4">
              <v-btn color="primary" @click="saveProxy" prepend-icon="mdi-content-save">
                Guardar
              </v-btn>
              <v-btn
                variant="outlined"
                @click="testProxy"
                :loading="testingProxy"
                :disabled="!proxyUrlInput"
                prepend-icon="mdi-connection"
              >
                Probar
              </v-btn>
              <v-btn
                v-if="proxyUrlInput"
                variant="outlined"
                color="error"
                @click="deleteProxy"
                prepend-icon="mdi-delete"
              >
                Eliminar
              </v-btn>
              <v-chip
                v-if="proxyStatus !== null"
                :color="proxyStatus ? 'success' : 'error'"
                size="small"
              >
                {{ proxyStatus ? 'Proxy OK' : 'Error de conexión' }}
              </v-chip>
            </div>

            <v-alert v-if="hasCorsProxyConfigured" type="success" variant="tonal" density="compact">
              Proxy CORS configurado. Los prospectos se descargarán para incluirlos en el análisis de interacciones con IA.
            </v-alert>
            <v-alert v-else type="info" variant="tonal" density="compact">
              Sin proxy configurado. Las interacciones se analizarán sin información de prospectos.
            </v-alert>

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
import { ref, computed, onMounted, watch } from 'vue'
import { getSetting, setSetting, getSharedSetting, setSharedSetting, deleteSharedSetting } from '@/services/storage/store'
import { testConnection, getAvailableModels } from '@/services/ai/ai'
import { getProviderList, getProvider } from '@/services/ai/providers'
import { encrypt, decrypt as decryptKey } from '@/services/crypto'
import { useUiStore } from '@/stores/ui'
import { getCorsProxyUrl, setCorsProxyUrl, getStringUrl } from '@/services/http/http'

const uiStore = useUiStore()

// --- Proveedores ---
const providerList = getProviderList()
const selectedProvider = ref(uiStore.aiProvider || 'gemini')
const activeProvider = computed(() => getProvider(selectedProvider.value))

// --- API key ---
const apiKeyInput = ref('')
const showKey = ref(false)
const saving = ref(false)
const testing = ref(false)
const connectionStatus = ref(null)
const hasEncryptedKey = ref(false)
const shareKey = ref(false)
const isShared = ref(false)

// --- URL base personalizada (servidores locales) ---
const customBaseUrlInput = ref('')

// --- Modelo ---
const modelInfo = ref(null)
const fetchedModels = ref([])
const selectedModel = ref(uiStore.aiModel || 'gemini-2.5-flash')
const showModelSelect = ref(false)

const allModels = computed(() => {
  if (fetchedModels.value.length > 0) return fetchedModels.value
  return activeProvider.value?.models || []
})

// Para servidor local la key es opcional, basta con tener URL configurada
const canTest = computed(() => {
  if (activeProvider.value?.keyOptional) return !!(customBaseUrlInput.value || currentKey())
  return !!currentKey()
})

const selectedModelName = computed(() => {
  const found = allModels.value.find(m => m.id === selectedModel.value)
  return found?.name || selectedModel.value
})

const currentKey = () => uiStore.getApiKeyFor(selectedProvider.value) || apiKeyInput.value

// --- Snackbar ---
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

// --- Proxy CORS ---
const proxyUrlInput = ref(getCorsProxyUrl())
const testingProxy = ref(false)
const proxyStatus = ref(null)
const hasCorsProxyConfigured = ref(!!getCorsProxyUrl())

const proxyPresets = [
  { label: 'Proxy propio', url: 'http://localhost:3010/proxy?url={url}' },
  { label: 'corsproxy.io', url: 'https://corsproxy.io/?{url}' },
  { label: 'allorigins.win', url: 'https://api.allorigins.win/raw?url={url}' },
]

// --- Init ---
onMounted(async () => {
  // Cargar proveedor y modelo guardados
  const savedProvider = await getSetting('ai_provider')
  if (savedProvider) {
    selectedProvider.value = savedProvider
    uiStore.setAiProvider(savedProvider)
  }

  const savedModel = await getSetting('ai_model')
  if (savedModel) {
    selectedModel.value = savedModel
    uiStore.setAiModel(savedModel)
  } else {
    // Compat: migrar gemini_model antiguo
    const oldModel = await getSetting('gemini_model')
    if (oldModel) {
      selectedModel.value = oldModel
      uiStore.setAiModel(oldModel)
    }
  }

  // Cargar modelos cacheados
  const savedModels = await getSetting(`${selectedProvider.value}_available_models`)
  if (savedModels?.length) {
    fetchedModels.value = savedModels
    const current = savedModels.find(m => m.id === selectedModel.value)
    if (current) {
      modelInfo.value = { name: current.name, inputTokenLimit: current.inputTokenLimit, outputTokenLimit: current.outputTokenLimit }
    }
  }

  // Cargar URL base personalizada
  const savedBaseUrl = await getSetting(`${selectedProvider.value}_base_url`)
  customBaseUrlInput.value = savedBaseUrl || activeProvider.value?.baseUrl || ''

  // Cargar API key
  await loadEncryptedKey()
})

// Cuando se cambia de proveedor, recargar config
watch(selectedProvider, async () => {
  connectionStatus.value = null
  modelInfo.value = null
  fetchedModels.value = []
  showModelSelect.value = false

  // Cargar modelo por defecto del proveedor
  const savedModel = await getSetting(`${selectedProvider.value}_model`)
  if (savedModel) {
    selectedModel.value = savedModel
  } else {
    selectedModel.value = activeProvider.value?.defaultModel || ''
  }
  uiStore.setAiModel(selectedModel.value)

  // Cargar modelos cacheados del proveedor
  const savedModels = await getSetting(`${selectedProvider.value}_available_models`)
  if (savedModels?.length) {
    fetchedModels.value = savedModels
  }

  // Cargar URL base personalizada
  const savedBaseUrl = await getSetting(`${selectedProvider.value}_base_url`)
  customBaseUrlInput.value = savedBaseUrl || activeProvider.value?.baseUrl || ''

  // Cargar API key del proveedor
  await loadEncryptedKey()
})

async function loadEncryptedKey() {
  const encrypted = await getSetting(`${selectedProvider.value}_api_key_encrypted`)
  hasEncryptedKey.value = !!encrypted

  // Comprobar si existe key compartida
  const sharedEncrypted = await getSharedSetting(`${selectedProvider.value}_api_key_encrypted`)
  isShared.value = !!sharedEncrypted
  shareKey.value = !!sharedEncrypted

  // Mostrar la key descifrada del proveedor seleccionado (si está en el mapa)
  const decryptedKey = uiStore.getApiKeyFor(selectedProvider.value)
  if (encrypted && decryptedKey) {
    apiKeyInput.value = decryptedKey
  } else if (!encrypted && sharedEncrypted) {
    // Intentar descifrar la key compartida para mostrarla
    try {
      const decrypted = await decryptKey(sharedEncrypted, 'MEDAPP_SHARED')
      apiKeyInput.value = decrypted
    } catch {
      apiKeyInput.value = ''
    }
  } else {
    apiKeyInput.value = ''
  }
}

async function switchProvider(providerId) {
  if (providerId === selectedProvider.value) return
  selectedProvider.value = providerId
  uiStore.setAiProvider(providerId)
  await setSetting('ai_provider', providerId)
}

// --- Acciones ---
async function onSave() {
  const isKeyOptional = activeProvider.value?.keyOptional
  if (!apiKeyInput.value && !isKeyOptional) {
    showSnack('Introduce una API key', 'warning')
    return
  }

  saving.value = true

  // Guardar URL base personalizada si aplica
  if (activeProvider.value?.customBaseUrl) {
    await setSetting(`${selectedProvider.value}_base_url`, customBaseUrlInput.value.trim())
  }

  // Guardar API key (cifrada) si se ha introducido
  if (apiKeyInput.value) {
    const pin = uiStore.userPin
    if (!pin) {
      showSnack('Error: sesión no autenticada', 'error')
      saving.value = false
      return
    }
    try {
      const encrypted = await encrypt(apiKeyInput.value, pin)
      await setSetting(`${selectedProvider.value}_api_key_encrypted`, encrypted)
      uiStore.setApiKey(apiKeyInput.value, selectedProvider.value)
      hasEncryptedKey.value = true
    } catch {
      showSnack('Error al cifrar la API key', 'error')
      saving.value = false
      return
    }

    // Gestionar compartición de key
    if (shareKey.value) {
      try {
        const sharedEncrypted = await encrypt(apiKeyInput.value, 'MEDAPP_SHARED')
        await setSharedSetting(`${selectedProvider.value}_api_key_encrypted`, sharedEncrypted)
        isShared.value = true
      } catch {
        showSnack('Error al compartir la API key', 'warning')
      }
    } else if (isShared.value) {
      await deleteSharedSetting(`${selectedProvider.value}_api_key_encrypted`)
      isShared.value = false
    }
  }

  uiStore.setAiProvider(selectedProvider.value)
  showSnack('Configuración guardada correctamente', 'success')
  saving.value = false
}

async function deleteKey() {
  await setSetting(`${selectedProvider.value}_api_key_encrypted`, null)
  if (isShared.value) {
    await deleteSharedSetting(`${selectedProvider.value}_api_key_encrypted`)
    isShared.value = false
  }
  uiStore.clearApiKey(selectedProvider.value)
  apiKeyInput.value = ''
  hasEncryptedKey.value = false
  shareKey.value = false
  connectionStatus.value = null
  modelInfo.value = null
  showSnack('API key eliminada', 'success')
}

async function doTestConnection() {
  testing.value = true
  connectionStatus.value = null
  modelInfo.value = null
  const key = uiStore.getApiKeyFor(selectedProvider.value) || apiKeyInput.value || null

  // Guardar temporalmente el proveedor/modelo/url para que el servicio lo use
  const prevProvider = uiStore.aiProvider
  const prevModel = uiStore.aiModel
  uiStore.setAiProvider(selectedProvider.value)
  uiStore.setAiModel(selectedModel.value)

  // Guardar URL base temporal para servidores locales
  if (activeProvider.value?.customBaseUrl && customBaseUrlInput.value) {
    await setSetting(`${selectedProvider.value}_base_url`, customBaseUrlInput.value.trim())
  }

  try {
    const [result, models] = await Promise.all([
      testConnection(key),
      activeProvider.value.supportsModelList ? getAvailableModels(key) : Promise.resolve([]),
    ])

    connectionStatus.value = result.ok
    if (result.ok && result.model) {
      modelInfo.value = result.model
    }

    if (models.length > 0) {
      // Filtrar modelos según el proveedor
      let filtered = models
      if (selectedProvider.value === 'gemini') {
        filtered = models.filter(m =>
          m.id.includes('gemini') && !m.id.includes('embedding') && !m.id.includes('aqa')
        )
      }
      fetchedModels.value = filtered
      await setSetting(`${selectedProvider.value}_available_models`, JSON.parse(JSON.stringify(filtered)))
    }

    snackbarText.value = result.message
    snackbarColor.value = result.ok ? 'success' : 'error'
  } catch (e) {
    connectionStatus.value = false
    snackbarText.value = e.message || 'Error de conexión'
    snackbarColor.value = 'error'
  }

  // Restaurar si falló
  if (!connectionStatus.value) {
    uiStore.setAiProvider(prevProvider)
    uiStore.setAiModel(prevModel)
  }

  testing.value = false
  snackbar.value = true
}

async function onModelChange(modelId) {
  selectedModel.value = modelId
  uiStore.setAiModel(modelId)
  await setSetting('ai_model', modelId)
  await setSetting(`${selectedProvider.value}_model`, modelId)

  const found = allModels.value.find(m => m.id === modelId)
  if (found) {
    modelInfo.value = {
      name: found.name,
      description: found.description || '',
      inputTokenLimit: found.inputTokenLimit,
      outputTokenLimit: found.outputTokenLimit,
      version: found.version || '',
    }
  }
}

function formatTokens(n) {
  if (!n) return '—'
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K'
  return String(n)
}

// --- Proxy ---
function saveProxy() {
  const url = proxyUrlInput.value.trim()
  if (url && !url.includes('{url}')) {
    showSnack('La URL debe contener {url} como marcador', 'warning')
    return
  }
  setCorsProxyUrl(url)
  hasCorsProxyConfigured.value = !!url
  proxyStatus.value = null
  showSnack(url ? 'Proxy CORS guardado' : 'Proxy CORS eliminado', 'success')
}

function deleteProxy() {
  proxyUrlInput.value = ''
  setCorsProxyUrl('')
  hasCorsProxyConfigured.value = false
  proxyStatus.value = null
  showSnack('Proxy CORS eliminado', 'success')
}

async function testProxy() {
  const url = proxyUrlInput.value.trim()
  if (!url) return
  testingProxy.value = true
  proxyStatus.value = null
  try {
    const testUrl = url.replace('{url}', encodeURIComponent('https://cima.aemps.es/cima/rest/medicamentos?nombre=ibuprofeno'))
    await getStringUrl(testUrl)
    proxyStatus.value = true
    showSnack('Proxy CORS funciona correctamente', 'success')
  } catch {
    proxyStatus.value = false
    showSnack('No se pudo conectar al proxy', 'error')
  }
  testingProxy.value = false
}

function showSnack(text, color) {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}
</script>
