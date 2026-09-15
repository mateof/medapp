/**
 * Servicio unificado de IA.
 * Delega al proveedor activo (Gemini, OpenAI, Anthropic, etc.)
 */
import { useUiStore } from '@/stores/ui'
import { getSetting, getMedicamentosActivos, saveInteraccion } from '@/services/storage/store'
import { getUserProfile } from '@/services/storage/users'
import { getProvider } from './providers'
import { buildPrompt, buildPosologiaPrompt } from './prompt'
import { fetchProspectos, fetchProspectosPdf, calcMaxCharsPerProspecto } from './gemini'
import { llamarModelo } from './errors'
import { logError, logInfo } from '@/services/logs/logger'
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
  const store = useUiStore()

  // Cargar perfil de salud del usuario
  const perfil = await getUserProfile(store.activeUserId)

  const contextTokens = provider.defaultContextTokens || 128000
  const maxChars = calcMaxCharsPerProspecto(medicamentos.length, contextTokens)

  const prospectos = perfil?.esMascota
    ? await fetchProspectosPdf(medicamentos, maxChars)
    : await fetchProspectos(medicamentos, maxChars)

  const prompt = buildPrompt(medicamentos, enfermedades, prospectos, perfil)

  const result = await llamarModelo(
    () => mod.generateJson(apiKey, prompt, model, provider),
    {
      operacion: 'interacciones',
      provider: provider.id,
      providerName: provider.name,
      model,
      medicamentos: medicamentos.length,
      prospectos: prospectos.length,
      promptChars: prompt.length,
    }
  )

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
 * Analiza el botiquín completo del usuario y guarda el resultado en el historial.
 * Cada llamada crea un registro nuevo, de modo que se conserva la opinión previa
 * de la IA para poder compararla con la actual.
 * @returns {Promise<{resultado: Object, medicamentos: Array, enfermedades: Array}>}
 */
export async function analizarBotiquin(apiKey) {
  // Solo la medicación activa: analizar tratamientos suspendidos falsearía el resultado.
  const medicamentos = await getMedicamentosActivos()
  if (medicamentos.length === 0) {
    throw new Error('No tienes ningún tratamiento activo que analizar.')
  }
  const enfermedades = [...new Set(medicamentos.flatMap(m => m.enfermedades || []))]

  const resultado = await checkInteracciones(apiKey, medicamentos, enfermedades)

  try {
    await saveInteraccion({
      medIds: medicamentos.map(m => m.id),
      medNames: medicamentos.map(m => m.name),
      severidad: resultado.severidad,
      resumen: resultado.resumen,
      detalle: JSON.stringify(resultado),
      enfermedades,
    })
  } catch (e) {
    await logError('db', e, { operacion: 'guardar-interaccion', medicamentos: medicamentos.length })
    throw e
  }

  await logInfo('ia', 'Análisis de interacciones completado', {
    medicamentos: medicamentos.length,
    severidad: resultado.severidad,
    provider: resultado._ai?.provider,
    model: resultado._ai?.model,
  })

  return { resultado, medicamentos, enfermedades }
}

/**
 * Consulta la posología recomendada para un medicamento según el perfil del paciente.
 */
export async function consultarPosologia(apiKey, medicamento) {
  const { provider, model } = await getActiveConfig()
  const mod = getModule(provider)
  const store = useUiStore()

  const perfil = await getUserProfile(store.activeUserId)
  if (!perfil) throw new Error('No se encontró el perfil del paciente')

  const contextTokens = provider.defaultContextTokens || 128000
  const maxChars = calcMaxCharsPerProspecto(1, contextTokens)

  const prospectos = perfil.esMascota
    ? await fetchProspectosPdf([{ data: medicamento }], maxChars)
    : await fetchProspectos([{ data: medicamento }], maxChars)

  const prompt = buildPosologiaPrompt(medicamento, prospectos, perfil)

  const result = await llamarModelo(
    () => mod.generateJson(apiKey, prompt, model, provider),
    {
      operacion: 'posologia',
      provider: provider.id,
      providerName: provider.name,
      model,
      medicamento: medicamento?.nombre || medicamento?.name || null,
      prospectos: prospectos.length,
      promptChars: prompt.length,
    }
  )

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
