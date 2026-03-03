/**
 * Servicio unificado de IA.
 * Delega al proveedor activo (Gemini, OpenAI, Anthropic, etc.)
 */
import { useUiStore } from '@/stores/ui'
import { getSetting } from '@/services/storage/store'
import { getProvider } from './providers'
import { buildPrompt } from './prompt'
import { fetchProspectos } from './gemini'
import * as geminiProvider from './gemini'
import * as openaiProvider from './openai'
import * as anthropicProvider from './anthropic'

const providerModules = {
  gemini: geminiProvider,
  openai: openaiProvider,
  anthropic: anthropicProvider,
}

async function getActiveConfig() {
  try {
    const store = useUiStore()
    const providerId = store.aiProvider || 'gemini'
    const provider = { ...getProvider(providerId) }
    const apiKey = store.apiKey
    const model = store.aiModel || provider?.defaultModel

    // Cargar URL base personalizada (para servidores locales, etc.)
    if (provider.customBaseUrl) {
      const savedUrl = await getSetting(`${providerId}_base_url`)
      if (savedUrl) provider.baseUrl = savedUrl
    }

    return { providerId, provider, apiKey, model }
  } catch {
    const provider = getProvider('gemini')
    return { providerId: 'gemini', provider, apiKey: null, model: provider.defaultModel }
  }
}

function getModule(provider) {
  const apiType = provider.apiType
  return providerModules[apiType] || providerModules.openai
}

/**
 * Comprueba interacciones entre medicamentos usando el proveedor activo.
 * Devuelve el resultado + metadata del proveedor/modelo usado.
 */
export async function checkInteracciones(apiKey, medicamentos, enfermedades = []) {
  const { provider, model } = await getActiveConfig()
  const mod = getModule(provider)

  const prospectos = await fetchProspectos(medicamentos)
  const prompt = buildPrompt(medicamentos, enfermedades, prospectos)

  const result = await mod.generateJson(apiKey, prompt, model, provider)

  // Añadir metadata del proveedor/modelo al resultado
  result._ai = {
    provider: provider.id,
    providerName: provider.name,
    model: model,
    timestamp: new Date().toISOString(),
  }

  return result
}

/**
 * Prueba la conexión con el proveedor activo.
 */
export async function testConnection(apiKey) {
  const { provider, model } = await getActiveConfig()
  const mod = getModule(provider)
  return mod.testConnection(apiKey, model, provider)
}

/**
 * Obtiene los modelos disponibles del proveedor activo.
 */
export async function getAvailableModels(apiKey) {
  const { provider } = await getActiveConfig()
  const mod = getModule(provider)
  if (!mod.getAvailableModels) return []
  return mod.getAvailableModels(apiKey, provider)
}
