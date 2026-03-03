import axios from 'axios'

/**
 * Proveedor Anthropic (Claude).
 * NOTA: La API de Anthropic no permite llamadas directas desde el navegador (CORS).
 * Requiere un proxy backend o usar la API a través de un servicio intermediario.
 */

const ANTHROPIC_VERSION = '2023-06-01'

export async function generateJson(apiKey, prompt, model, provider) {
    const baseUrl = provider?.baseUrl || 'https://api.anthropic.com/v1'

    const response = await axios.post(`${baseUrl}/messages`, {
        model,
        max_tokens: 4096,
        messages: [
            { role: 'user', content: prompt + '\n\nResponde SOLO con JSON válido, sin texto adicional.' }
        ],
        temperature: 0.2,
    }, {
        headers: {
            'x-api-key': apiKey,
            'anthropic-version': ANTHROPIC_VERSION,
            'anthropic-dangerous-direct-browser-access': 'true',
            'Content-Type': 'application/json',
        }
    })

    const text = response.data.content?.[0]?.text
    if (!text) throw new Error('No se recibió respuesta de Claude')

    // Extraer JSON del texto (Claude puede envolver en markdown)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('La respuesta no contiene JSON válido')

    return JSON.parse(jsonMatch[0])
}

export async function testConnection(apiKey, model, provider) {
    try {
        const baseUrl = provider?.baseUrl || 'https://api.anthropic.com/v1'

        const response = await axios.post(`${baseUrl}/messages`, {
            model,
            max_tokens: 50,
            messages: [{ role: 'user', content: 'Responde solo con: {"status":"ok"}' }],
            temperature: 0,
        }, {
            headers: {
                'x-api-key': apiKey,
                'anthropic-version': ANTHROPIC_VERSION,
                'anthropic-dangerous-direct-browser-access': 'true',
                'Content-Type': 'application/json',
            }
        })

        const modelId = response.data.model || model
        return {
            ok: true,
            message: 'Conexión exitosa',
            model: {
                name: modelId,
                description: '',
                inputTokenLimit: null,
                outputTokenLimit: null,
                version: '',
            }
        }
    } catch (e) {
        const status = e.response?.status
        const apiMessage = e.response?.data?.error?.message || ''
        if (status === 401) {
            return { ok: false, message: `API key inválida. ${apiMessage}` }
        }
        if (status === 429) {
            return { ok: false, message: `Límite de peticiones excedido. ${apiMessage}` }
        }
        if (status === 404) {
            return { ok: false, message: `Modelo no encontrado. ${apiMessage}` }
        }
        return { ok: false, message: apiMessage || e.message || 'Error de conexión' }
    }
}
