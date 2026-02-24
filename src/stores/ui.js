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

  const sidebarDrawer = ref(null)
  const customizerDrawer = ref(false)
  const sidebarColor = ref('white')
  const sidebarBg = ref('')
  const addButton = ref(true)
  const sidebarRail = ref(false)
  const apiKey = ref(saved?.apiKey ?? null)
  const pinRequired = ref(false)
  const geminiModel = ref(saved?.geminiModel ?? 'gemini-2.5-flash')

  // User session (restored from sessionStorage)
  const activeUserId = ref(saved?.activeUserId ?? null)
  const activeUserName = ref(saved?.activeUserName ?? '')
  const activeUserAvatar = ref(saved?.activeUserAvatar ?? null)
  const userPin = ref(saved?.userPin ?? null)
  const sessionReady = ref(saved?.sessionReady ?? false)
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
      apiKey: apiKey.value,
      geminiModel: geminiModel.value,
    })
  }

  function setApiKey(key) { apiKey.value = key; persistSession() }
  function clearApiKey() { apiKey.value = null; persistSession() }
  function setPinRequired(val) { pinRequired.value = val }
  function setGeminiModel(val) { geminiModel.value = val; persistSession() }

  function setActiveUser({ id, nombre, avatar }) {
    activeUserId.value = id
    activeUserName.value = nombre
    activeUserAvatar.value = avatar
    localStorage.setItem('medapp_active_user_id', String(id))
    persistSession()
  }

  function setUserPin(pin) { userPin.value = pin; persistSession() }

  function setSessionReady(val) { sessionReady.value = val; persistSession() }

  function switchUser() {
    if (activeUserId.value) {
      cachedSessions.value[activeUserId.value] = {
        pin: userPin.value,
        apiKey: apiKey.value,
        geminiModel: geminiModel.value
      }
    }
    activeUserId.value = null
    activeUserName.value = ''
    activeUserAvatar.value = null
    userPin.value = null
    apiKey.value = null
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
    apiKey.value = null
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
    apiKey, pinRequired, geminiModel,
    activeUserId, activeUserName, activeUserAvatar, userPin, sessionReady, cachedSessions,
    showAddButton,
    setSidebarDrawer, setCustomizerDrawer, setSidebarColor, setAddButton,
    setSidebarRail, toggleSidebarRail,
    setApiKey, clearApiKey, setPinRequired, setGeminiModel,
    setActiveUser, setUserPin, setSessionReady, switchUser, logout, getCachedSession,
  }
})
