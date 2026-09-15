/**
 * Registro de eventos y errores de la aplicación.
 *
 * Los logs se guardan en IndexedDB (tabla `logs`) para poder consultarlos
 * y copiarlos desde Ajustes. Nunca deben contener API keys: todo lo que
 * entra pasa por sanitize().
 */
import { db } from '../db'
import { useUiStore } from '@/stores/ui'

// Máximo de registros conservados. Al superarlo se borran los más antiguos.
const MAX_LOGS = 300
// Tope de caracteres del detalle: una respuesta de error puede traer un HTML entero.
const MAX_DETALLE = 4000

const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev'

/**
 * Elimina credenciales de cualquier texto antes de guardarlo.
 */
export function sanitize(value) {
  if (value === null || value === undefined) return value
  let text = typeof value === 'string' ? value : safeStringify(value)
  if (!text) return text
  return text
    .replace(/([?&]key=)[^&"'\s]+/gi, '$1***')
    .replace(/(Bearer\s+)[\w.\-]+/gi, '$1***')
    .replace(/("?(?:api[_-]?key|x-api-key|authorization)"?\s*[:=]\s*"?)[^",\s}]+/gi, '$1***')
    .replace(/\b(sk-|AIza|gho_|ghp_)[A-Za-z0-9_\-]{8,}/g, '$1***')
}

/**
 * Sanitiza un objeto conservando su forma. Si el resultado no se puede
 * reconstruir, se guarda como texto para no perder la información.
 */
function sanitizeObject(obj) {
  const limpio = sanitize(safeStringify(obj))
  try {
    return JSON.parse(limpio)
  } catch {
    return { texto: limpio }
  }
}

function truncar(texto) {
  if (!texto || texto.length <= MAX_DETALLE) return texto
  return `${texto.slice(0, MAX_DETALLE)}\n[...] (${texto.length - MAX_DETALLE} caracteres omitidos)`
}

function safeStringify(value) {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function currentUserId() {
  try {
    return useUiStore().activeUserId ?? null
  } catch {
    return null
  }
}

/**
 * Guarda un evento. Nunca lanza: un fallo del log no debe romper la app.
 */
export async function logEvent({ nivel = 'info', scope = 'app', mensaje, detalle = null, contexto = null }) {
  try {
    await db.logs.add({
      fecha: new Date().toISOString(),
      nivel,
      scope,
      mensaje: sanitize(mensaje) || 'Sin mensaje',
      detalle: detalle ? truncar(sanitize(detalle)) : null,
      contexto: contexto ? sanitizeObject(contexto) : null,
      version: APP_VERSION,
      userId: currentUserId(),
    })
    await podar()
  } catch {
    // Si no se puede escribir el log, seguimos sin hacer ruido.
  }
}

async function podar() {
  try {
    const total = await db.logs.count()
    if (total <= MAX_LOGS) return
    const sobran = total - MAX_LOGS
    const antiguos = await db.logs.orderBy('id').limit(sobran).primaryKeys()
    await db.logs.bulkDelete(antiguos)
  } catch {
    // ignorar
  }
}

/**
 * Registra un error, extrayendo todo lo aprovechable si viene de axios.
 */
export async function logError(scope, error, contexto = {}) {
  const info = describeError(error)
  return logEvent({
    nivel: 'error',
    scope,
    mensaje: info.mensaje,
    detalle: info.detalle,
    contexto: { ...contexto, ...info.contexto },
  })
}

export async function logWarn(scope, mensaje, contexto = {}) {
  return logEvent({ nivel: 'warn', scope, mensaje, contexto })
}

export async function logInfo(scope, mensaje, contexto = {}) {
  return logEvent({ nivel: 'info', scope, mensaje, contexto })
}

/**
 * Normaliza un error (de axios o no) en mensaje corto, detalle y contexto.
 */
export function describeError(error) {
  if (!error) return { mensaje: 'Error desconocido', detalle: null, contexto: {} }

  const response = error.response
  if (response) {
    const status = response.status
    const apiMessage =
      response.data?.error?.message ||
      response.data?.error?.type ||
      response.data?.message ||
      (typeof response.data === 'string' ? response.data.slice(0, 500) : null)

    return {
      mensaje: `HTTP ${status}${apiMessage ? `: ${apiMessage}` : ` ${response.statusText || ''}`.trimEnd()}`,
      detalle: safeStringify(response.data),
      contexto: {
        status,
        statusText: response.statusText || null,
        url: error.config?.url || null,
        metodo: error.config?.method || null,
      },
    }
  }

  if (error.request) {
    return {
      mensaje: `Sin respuesta del servidor: ${error.message || 'petición fallida'}`,
      detalle: error.stack || null,
      contexto: {
        url: error.config?.url || null,
        metodo: error.config?.method || null,
        codigo: error.code || null,
      },
    }
  }

  return {
    mensaje: error.message || String(error),
    detalle: error.stack || null,
    contexto: {},
  }
}

export async function getLogs({ limit = MAX_LOGS } = {}) {
  try {
    return await db.logs.orderBy('id').reverse().limit(limit).toArray()
  } catch {
    return []
  }
}

export async function clearLogs() {
  try {
    await db.logs.clear()
  } catch {
    // ignorar
  }
}

/**
 * Vuelca los logs a texto plano, listo para pegar en un informe de error.
 */
export function formatLogs(logs) {
  const cabecera = [
    `MedApp ${APP_VERSION}`,
    `Exportado: ${new Date().toISOString()}`,
    `Navegador: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'desconocido'}`,
    `Registros: ${logs.length}`,
    '',
  ].join('\n')

  const cuerpo = logs.map(l => {
    const partes = [`[${l.fecha}] ${(l.nivel || 'info').toUpperCase()} (${l.scope}) ${l.mensaje}`]
    if (l.contexto && Object.keys(l.contexto).length > 0) {
      partes.push(`  contexto: ${JSON.stringify(l.contexto)}`)
    }
    if (l.detalle) {
      partes.push(l.detalle.split('\n').map(line => `  ${line}`).join('\n'))
    }
    return partes.join('\n')
  }).join('\n\n')

  return cabecera + cuerpo
}
