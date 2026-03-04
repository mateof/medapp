import axios from 'axios'
import { getStringUrl, resolveCimaUrl, resolveCimaVetUrl } from '../http/http'
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist'

GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).href

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta'

/**
 * Genera respuesta JSON usando Gemini API.
 * @param {string} apiKey
 * @param {string} prompt
 * @param {string} model - ID del modelo (e.g. 'gemini-2.5-flash')
 * @param {Object} provider - Config del proveedor (de providers.js)
 */
export async function generateJson(apiKey, prompt, model, provider) {
    const baseUrl = provider?.baseUrl || GEMINI_BASE
    const response = await axios.post(`${baseUrl}/models/${model}:generateContent?key=${apiKey}`, {
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
 * Prueba la conexión con Gemini.
 */
export async function testConnection(apiKey, model, provider) {
    try {
        const baseUrl = provider?.baseUrl || GEMINI_BASE
        const res = await axios.get(`${baseUrl}/models/${model}?key=${apiKey}`)
        const m = res.data
        return {
            ok: true,
            message: 'Conexión exitosa',
            model: {
                name: m.displayName || m.name,
                description: m.description || '',
                inputTokenLimit: m.inputTokenLimit,
                outputTokenLimit: m.outputTokenLimit,
                version: m.version || '',
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

/**
 * Obtiene modelos disponibles en Gemini.
 */
export async function getAvailableModels(apiKey, provider) {
    try {
        const baseUrl = provider?.baseUrl || GEMINI_BASE
        const res = await axios.get(`${baseUrl}/models?key=${apiKey}`)
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

/**
 * Descarga prospectos de CIMA para enriquecer el prompt.
 */
export async function fetchProspectos(medicamentos) {
    const prospectos = []
    for (const med of medicamentos) {
        const docs = med.data?.docs
        if (!docs) continue
        const prospecto = docs.find(d => d.tipo === 2 && d.urlHtml)
        if (!prospecto) continue
        try {
            const url = resolveCimaUrl(prospecto.urlHtml)
            const html = await getStringUrl(url)
            const texto = stripHtml(html).slice(0, 4000)
            prospectos.push({ nombre: med.name || med.data?.nombre, texto })
        } catch {
            // Si falla la descarga, continuamos sin este prospecto
        }
    }
    return prospectos
}

/**
 * Descarga prospectos PDF de CIMAVet, extrae el texto y lo devuelve.
 */
export async function fetchProspectosPdf(medicamentos) {
    const prospectos = []
    for (const med of medicamentos) {
        const docs = med.data?.docs
        if (!docs) continue
        const prospecto = docs.find(d => d.tipo === 2 && d.url)
        if (!prospecto) continue
        try {
            const url = resolveCimaVetUrl(prospecto.url)
            const response = await axios.get(url, { responseType: 'arraybuffer' })
            // Verificar que la respuesta es un PDF y no HTML (error/redirección)
            const bytes = new Uint8Array(response.data, 0, 5)
            const header = String.fromCharCode(...bytes)
            if (header !== '%PDF-') continue
            const texto = await extractTextFromPdf(response.data)
            if (texto) {
                prospectos.push({ nombre: med.name || med.data?.nombre, texto: texto.slice(0, 4000) })
            }
        } catch {
            // Si falla la descarga o extracción, continuamos sin este prospecto
        }
    }
    return prospectos
}

async function extractTextFromPdf(arrayBuffer) {
    const pdf = await getDocument({ data: arrayBuffer }).promise
    const pages = []
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        const text = content.items.map(item => item.str).join(' ')
        pages.push(text)
    }
    return pages.join('\n').replace(/\s+/g, ' ').trim()
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
