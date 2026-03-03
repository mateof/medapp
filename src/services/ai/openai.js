import axios from 'axios'

/**
 * Proveedor OpenAI-compatible.
 * Funciona con: OpenAI, GitHub Copilot, xAI Grok, DeepSeek, Ollama, LM Studio, vLLM, etc.
 */

function buildHeaders(apiKey) {
    const headers = { 'Content-Type': 'application/json' }
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`
    return headers
}

export async function generateJson(apiKey, prompt, model, provider) {
    const baseUrl = provider?.baseUrl || 'https://api.openai.com/v1'

    const body = {
        model,
        messages: [
            { role: 'system', content: 'Eres un asistente farmacéutico experto. Responde siempre en JSON válido.' },
            { role: 'user', content: prompt }
        ],
        temperature: 0.2,
    }

    // response_format no soportado por todos los servidores locales
    if (!provider?.keyOptional) {
        body.response_format = { type: 'json_object' }
    }

    const response = await axios.post(`${baseUrl}/chat/completions`, body, {
        headers: buildHeaders(apiKey)
    })

    const text = response.data.choices?.[0]?.message?.content
    if (!text) throw new Error('No se recibió respuesta del modelo')

    // Extraer JSON del texto (modelos locales pueden envolver en markdown)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('La respuesta no contiene JSON válido')

    return JSON.parse(jsonMatch[0])
}

export async function testConnection(apiKey, model, provider) {
    try {
        const baseUrl = provider?.baseUrl || 'https://api.openai.com/v1'

        const body = {
            model,
            messages: [{ role: 'user', content: 'Responde solo con: {"status":"ok"}' }],
            temperature: 0,
            max_tokens: 20,
        }

        if (!provider?.keyOptional) {
            body.response_format = { type: 'json_object' }
        }

        const response = await axios.post(`${baseUrl}/chat/completions`, body, {
            headers: buildHeaders(apiKey)
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

export async function getAvailableModels(apiKey, provider) {
    try {
        const baseUrl = provider?.baseUrl || 'https://api.openai.com/v1'
        const res = await axios.get(`${baseUrl}/models`, {
            headers: buildHeaders(apiKey)
        })
        // Ollama devuelve { models: [...] }, OpenAI devuelve { data: [...] }
        const models = res.data.data || res.data.models || []
        return models.map(m => ({
            id: m.id || m.name || m.model,
            name: m.id || m.name || m.model,
            inputTokenLimit: null,
            outputTokenLimit: null,
        }))
    } catch {
        return []
    }
}
