import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

function loadSession() {
  try {
    const raw = sessionStorage.getItem('medapp_session')
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveSession(data) {
  sessionStorage.setItem('medapp_session', JSON.stringify(data))
}

function clearSession() {
  sessionStorage.removeItem('medapp_session')
}

export const useUiStore = defineStore('ui', () => {
  const saved = loadSession()

  const sidebarDrawer = ref(window.innerWidth > 960)
  const customizerDrawer = ref(false)
  const sidebarColor = ref('white')
  const sidebarBg = ref('')
  const addButton = ref(true)
  const sidebarRail = ref(false)
  // Mapa de API keys descifradas por proveedor: { gemini: 'AIza...', openai: 'sk-...', ... }
  const apiKeys = ref(saved?.apiKeys ?? {})
  const pinRequired = ref(false)
  const aiProvider = ref(saved?.aiProvider ?? 'gemini')
  const aiModel = ref(saved?.aiModel ?? 'gemini-2.5-flash')
  // Compat alias — código legacy que use geminiModel sigue funcionando
  const geminiModel = aiModel

  // apiKey computed: devuelve la key del proveedor activo
  const apiKey = computed(() => apiKeys.value[aiProvider.value] || null)

  // User session (restored from sessionStorage)
  const activeUserId = ref(saved?.activeUserId ?? null)
  const activeUserName = ref(saved?.activeUserName ?? '')
  const activeUserAvatar = ref(saved?.activeUserAvatar ?? null)
  const userPin = ref(saved?.userPin ?? null)
  const sessionReady = ref(saved?.sessionReady ?? false)
  const activeUserEsMascota = ref(saved?.activeUserEsMascota ?? false)
  const activeUserTipoMascota = ref(saved?.activeUserTipoMascota ?? null)
  const cachedSessions = ref({})

  const showAddButton = computed(() => addButton.value)

  function setSidebarDrawer(val) { sidebarDrawer.value = val }
  function setCustomizerDrawer(val) { customizerDrawer.value = val }
  function setSidebarColor(val) { sidebarColor.value = val }
  function setAddButton(val) { addButton.value = val }
  function setSidebarRail(val) { sidebarRail.value = val }
  function toggleSidebarRail() { sidebarRail.value = !sidebarRail.value }
  function persistSession() {
    saveSession({
      activeUserId: activeUserId.value,
      activeUserName: activeUserName.value,
      activeUserAvatar: activeUserAvatar.value,
      userPin: userPin.value,
      sessionReady: sessionReady.value,
      apiKeys: apiKeys.value,
      aiProvider: aiProvider.value,
      aiModel: aiModel.value,
      activeUserEsMascota: activeUserEsMascota.value,
      activeUserTipoMascota: activeUserTipoMascota.value,
    })
  }

  function setApiKey(key, provider) {
    const prov = provider || aiProvider.value
    apiKeys.value = { ...apiKeys.value, [prov]: key }
    persistSession()
  }
  function clearApiKey(provider) {
    const prov = provider || aiProvider.value
    const copy = { ...apiKeys.value }
    delete copy[prov]
    apiKeys.value = copy
    persistSession()
  }
  function getApiKeyFor(provider) {
    return apiKeys.value[provider] || null
  }
  function setPinRequired(val) { pinRequired.value = val }
  function setAiProvider(val) { aiProvider.value = val; persistSession() }
  function setAiModel(val) { aiModel.value = val; persistSession() }
  // Compat alias
  function setGeminiModel(val) { aiModel.value = val; persistSession() }

  function setActiveUser({ id, nombre, avatar, esMascota, tipoMascota }) {
    activeUserId.value = id
    activeUserName.value = nombre
    activeUserAvatar.value = avatar
    activeUserEsMascota.value = esMascota || false
    activeUserTipoMascota.value = tipoMascota || null
    localStorage.setItem('medapp_active_user_id', String(id))
    persistSession()
  }

  function setUserPin(pin) { userPin.value = pin; persistSession() }

  function setSessionReady(val) { sessionReady.value = val; persistSession() }

  function switchUser() {
    if (activeUserId.value) {
      cachedSessions.value[activeUserId.value] = {
        pin: userPin.value,
        apiKeys: { ...apiKeys.value },
        aiProvider: aiProvider.value,
        aiModel: aiModel.value,
      }
    }
    activeUserId.value = null
    activeUserName.value = ''
    activeUserAvatar.value = null
    userPin.value = null
    apiKeys.value = {}
    aiProvider.value = 'gemini'
    aiModel.value = 'gemini-2.5-flash'
    activeUserEsMascota.value = false
    activeUserTipoMascota.value = null
    sessionReady.value = false
    pinRequired.value = false
    localStorage.removeItem('medapp_active_user_id')
    clearSession()
  }

  function logout() {
    if (activeUserId.value) {
      delete cachedSessions.value[activeUserId.value]
    }
    activeUserId.value = null
    activeUserName.value = ''
    activeUserAvatar.value = null
    userPin.value = null
    apiKeys.value = {}
    aiProvider.value = 'gemini'
    aiModel.value = 'gemini-2.5-flash'
    activeUserEsMascota.value = false
    activeUserTipoMascota.value = null
    sessionReady.value = false
    pinRequired.value = false
    localStorage.removeItem('medapp_active_user_id')
    clearSession()
  }

  function getCachedSession(userId) {
    return cachedSessions.value[userId] || null
  }

  return {
    sidebarDrawer, customizerDrawer, sidebarColor, sidebarBg, addButton, sidebarRail,
    apiKey, apiKeys, pinRequired, aiProvider, aiModel, geminiModel,
    activeUserId, activeUserName, activeUserAvatar, userPin, sessionReady,
    activeUserEsMascota, activeUserTipoMascota, cachedSessions,
    showAddButton,
    setSidebarDrawer, setCustomizerDrawer, setSidebarColor, setAddButton,
    setSidebarRail, toggleSidebarRail,
    setApiKey, clearApiKey, getApiKeyFor, setPinRequired, setAiProvider, setAiModel, setGeminiModel,
    setActiveUser, setUserPin, setSessionReady, switchUser, logout, getCachedSession,
  }
})
