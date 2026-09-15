/**
 * Errores de los proveedores de IA: mensajes legibles y reintentos.
 */
import { logError, logWarn, describeError } from '@/services/logs/logger'

// Estados que suelen ser transitorios (servidor saturado o caído un momento).
const STATUS_REINTENTABLES = [500, 502, 503, 504]
const ESPERAS_MS = [2000, 5000]

/**
 * Traduce un error de API a un mensaje que el usuario pueda entender.
 */
export function mensajeUsuario(error, providerName = 'el servicio de IA') {
  const status = error?.response?.status
  const detalle = describeError(error)
  const apiMessage = error?.response?.data?.error?.message

  switch (status) {
    case 400:
      return `${providerName} ha rechazado la petición (400). ${apiMessage || 'Revisa el modelo seleccionado en Ajustes.'}`
    case 401:
    case 403:
      return `API key inválida o sin permisos para ${providerName} (${status}).`
    case 404:
      return `El modelo seleccionado no existe en ${providerName} (404). Elige otro en Ajustes.`
    case 413:
      return `La consulta es demasiado grande para ${providerName} (413). Prueba con menos medicamentos.`
    case 429:
      return `Has superado el límite de peticiones de ${providerName} (429). Espera un poco antes de reintentar.`
    case 500:
    case 502:
    case 503:
    case 504:
      return `${providerName} no está disponible ahora mismo (${status}). Suele ser temporal: vuelve a intentarlo en unos minutos.`
    default:
      if (error?.request && !error?.response) {
        return `No se pudo contactar con ${providerName}. Comprueba tu conexión.`
      }
      return detalle.mensaje
  }
}

/**
 * Ejecuta una llamada al modelo reintentando los fallos transitorios y
 * dejando constancia en el registro de errores.
 *
 * @param {Function} fn - función que hace la llamada
 * @param {Object} contexto - datos para el log (proveedor, modelo, operación...)
 */
export async function llamarModelo(fn, contexto = {}) {
  const providerName = contexto.providerName || 'el servicio de IA'
  let ultimoError

  for (let intento = 0; intento <= ESPERAS_MS.length; intento++) {
    try {
      return await fn()
    } catch (e) {
      ultimoError = e
      const status = e?.response?.status
      const esTransitorio = STATUS_REINTENTABLES.includes(status) || (e?.request && !e?.response)
      const quedanIntentos = intento < ESPERAS_MS.length

      if (!esTransitorio || !quedanIntentos) break

      await logWarn('ia', `Reintentando tras fallo transitorio (${status || e.code || 'sin respuesta'})`, {
        ...contexto,
        intento: intento + 1,
        esperaMs: ESPERAS_MS[intento],
      })
      await esperar(ESPERAS_MS[intento])
    }
  }

  await logError('ia', ultimoError, { ...contexto, intentos: ESPERAS_MS.length + 1 })

  const error = new Error(mensajeUsuario(ultimoError, providerName))
  error.cause = ultimoError
  error.status = ultimoError?.response?.status ?? null
  error.registrado = true
  throw error
}

function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
