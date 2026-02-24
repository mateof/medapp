import axios from 'axios'
import { getStringUrl } from '../http/http'
import { useUiStore } from '@/stores/ui'

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta'
const DEFAULT_MODEL = 'gemini-2.5-flash'

function getModel() {
    try {
        return useUiStore().geminiModel || DEFAULT_MODEL
    } catch {
        return DEFAULT_MODEL
    }
}

/**
 * Comprueba interacciones entre medicamentos usando Gemini API.
 * @param {string} apiKey - API key de Gemini
 * @param {Array} medicamentos - Array de medicamentos [{name, data, enfermedades}]
 * @param {Array} enfermedades - Etiquetas de enfermedades/síntomas del usuario
 * @returns {Object} { severidad, resumen, interacciones, contraindicaciones_enfermedad }
 */
export async function checkInteracciones(apiKey, medicamentos, enfermedades = []) {
    const prospectos = await fetchProspectos(medicamentos)
    const prompt = buildPrompt(medicamentos, enfermedades, prospectos)

    const model = getModel()
    const response = await axios.post(`${GEMINI_BASE}/models/${model}:generateContent?key=${apiKey}`, {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2
        }
    })

    const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error('No se recibió respuesta de Gemini')

    return JSON.parse(text)
}

/**
 * Prueba la conexión con la API key de Gemini.
 * @param {string} apiKey
 * @returns {boolean}
 */
export async function testGeminiConnection(apiKey) {
    try {
        const modelId = getModel()
        const res = await axios.get(`${GEMINI_BASE}/models/${modelId}?key=${apiKey}`)
        const model = res.data
        return {
            ok: true,
            message: 'Conexión exitosa',
            model: {
                name: model.displayName || model.name,
                description: model.description || '',
                inputTokenLimit: model.inputTokenLimit,
                outputTokenLimit: model.outputTokenLimit,
                version: model.version || '',
            }
        }
    } catch (e) {
        const status = e.response?.status
        const apiMessage = e.response?.data?.error?.message || ''
        if (status === 429) {
            return { ok: false, message: `Límite de peticiones excedido. ${apiMessage}` }
        }
        if (status === 400 || status === 403) {
            return { ok: false, message: `API key inválida o sin permisos. ${apiMessage}` }
        }
        if (status === 404) {
            return { ok: false, message: `Modelo no encontrado. ${apiMessage}` }
        }
        return { ok: false, message: apiMessage || e.message || 'Error de conexión' }
    }
}

export async function getAvailableModels(apiKey) {
    try {
        const res = await axios.get(`${GEMINI_BASE}/models?key=${apiKey}`)
        return (res.data.models || []).map(m => ({
            id: m.name?.replace('models/', ''),
            name: m.displayName || m.name,
            inputTokenLimit: m.inputTokenLimit,
            outputTokenLimit: m.outputTokenLimit,
        }))
    } catch {
        return []
    }
}

function buildPrompt(medicamentos, enfermedades, prospectos) {
    const medList = medicamentos.map((m, i) => {
        const nombre = m.name || m.data?.nombre || 'Desconocido'
        const pa = m.data?.vtm?.nombre || ''
        return `${i + 1}. ${nombre}${pa ? ` (Principio activo: ${pa})` : ''}`
    }).join('\n')

    const enfList = enfermedades.length > 0
        ? enfermedades.join(', ')
        : 'No especificadas'

    let prospectosSection = ''
    if (prospectos.length > 0) {
        prospectosSection = '\nPROSPECTOS DISPONIBLES:\n' + prospectos.map(p =>
            `--- ${p.nombre} ---\n${p.texto}\n`
        ).join('\n')
    }

    return `Eres un asistente farmacéutico experto. Analiza las posibles interacciones entre los siguientes medicamentos que un paciente toma simultáneamente.

MEDICAMENTOS:
${medList}

ENFERMEDADES/SÍNTOMAS DEL PACIENTE:
${enfList}
${prospectosSection}
Responde EXCLUSIVAMENTE en formato JSON con esta estructura:
{
  "severidad": "ninguna" | "leve" | "moderada" | "grave",
  "resumen": "frase corta de 1-2 líneas describiendo el resultado general",
  "interacciones": [
    {
      "medicamentos": ["nombre_med1", "nombre_med2"],
      "tipo": "descripción breve de la interacción",
      "severidad": "leve" | "moderada" | "grave",
      "recomendacion": "qué debe hacer el paciente"
    }
  ],
  "contraindicaciones_enfermedad": [
    {
      "medicamento": "nombre",
      "enfermedad": "nombre",
      "detalle": "por qué está contraindicado"
    }
  ]
}

Si no hay interacciones ni contraindicaciones, devuelve severidad "ninguna", resumen indicándolo, y arrays vacíos.
Sé preciso y basa tu análisis en evidencia farmacológica.`
}

async function fetchProspectos(medicamentos) {
    const prospectos = []
    for (const med of medicamentos) {
        const docs = med.data?.docs
        if (!docs) continue
        const prospecto = docs.find(d => d.tipo === 2 && d.urlHtml)
        if (!prospecto) continue
        try {
            const url = prospecto.urlHtml.replace('https://cima.aemps.es', '')
            const html = await getStringUrl(url)
            const texto = stripHtml(html).slice(0, 4000)
            prospectos.push({ nombre: med.name || med.data?.nombre, texto })
        } catch {
            // Si falla la descarga, continuamos sin este prospecto
        }
    }
    return prospectos
}

function stripHtml(html) {
    return html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ')
        .trim()
}
