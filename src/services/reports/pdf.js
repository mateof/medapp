/**
 * Utilidades de composición de PDF.
 *
 * Todo se genera en el dispositivo: ningún dato de salud sale de aquí salvo
 * que el usuario comparta el fichero explícitamente.
 */
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev'

export const COLOR = {
  primario: [30, 136, 229],
  texto: [38, 38, 38],
  suave: [120, 120, 120],
  linea: [220, 220, 220],
  ia: [116, 96, 238],
  alerta: [211, 47, 47],
  fondoIa: [242, 240, 253],
  fondoAlerta: [253, 237, 237],
}

const CFG_POR_DEFECTO = { margen: 15, escala: 1 }

// En formatos pequeños hay que reducir tipografía y márgenes o el contenido
// no respira: los mismos puntos ocupan proporcionalmente el doble.
const CFG_FORMATO = {
  a4: { margen: 15, escala: 1 },
  a5: { margen: 11, escala: 0.85 },
  a6: { margen: 8, escala: 0.68 },
}

function cfg(doc) {
  return doc.__medapp || CFG_POR_DEFECTO
}

/**
 * Tamaño de fuente ajustado al formato del documento.
 */
function fuente(doc, puntos) {
  return puntos * cfg(doc).escala
}

/**
 * Crea un documento con los márgenes y la tipografía del resto de informes.
 */
export function nuevoDocumento({ formato = 'a4', orientacion = 'portrait', titulo = 'Informe' } = {}) {
  const doc = new jsPDF({ unit: 'mm', format: formato, orientation: orientacion })
  doc.__medapp = CFG_FORMATO[formato] || CFG_POR_DEFECTO
  doc.setProperties({
    title: titulo,
    creator: `MedApp ${APP_VERSION}`,
    subject: 'Informe de medicación',
  })
  doc.setFont('helvetica', 'normal')
  return doc
}

export function anchoUtil(doc) {
  return doc.internal.pageSize.getWidth() - cfg(doc).margen * 2
}

export function altoPagina(doc) {
  return doc.internal.pageSize.getHeight()
}

export function margen(doc) {
  return cfg(doc).margen
}

/**
 * Membrete del informe. Devuelve la Y donde empieza el contenido.
 */
export function cabecera(doc, { titulo, subtitulo = '', paciente = '', fecha = new Date() }) {
  const ancho = doc.internal.pageSize.getWidth()
  const m = cfg(doc).margen
  const e = cfg(doc).escala
  const altoBanda = 26 * e

  doc.setFillColor(...COLOR.primario)
  doc.rect(0, 0, ancho, altoBanda, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(fuente(doc, 15))
  doc.text(titulo, m, 12 * e)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(fuente(doc, 9))
  if (subtitulo) doc.text(subtitulo, m, 19 * e)

  const fechaTexto = formatearFecha(fecha)
  doc.text(fechaTexto, ancho - m, 19 * e, { align: 'right' })

  doc.setTextColor(...COLOR.texto)

  let y = altoBanda + 8 * e
  if (paciente) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(fuente(doc, 11))
    doc.text(paciente, m, y)
    y += 7 * e
  }
  return y
}

/**
 * Pie con paginación y trazabilidad. Se dibuja al final, sobre todas las páginas.
 */
export function pie(doc, { aviso = '' } = {}) {
  const total = doc.getNumberOfPages()
  const ancho = doc.internal.pageSize.getWidth()
  const alto = doc.internal.pageSize.getHeight()

  const m = cfg(doc).margen
  const e = cfg(doc).escala

  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    doc.setDrawColor(...COLOR.linea)
    doc.line(m, alto - 14 * e, ancho - m, alto - 14 * e)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(fuente(doc, 7.5))
    doc.setTextColor(...COLOR.suave)

    if (aviso) {
      const lineas = doc.splitTextToSize(aviso, ancho - m * 2 - 25 * e)
      doc.text(lineas, m, alto - 10 * e)
    }
    doc.text(`Página ${i} de ${total}`, ancho - m, alto - 10 * e, { align: 'right' })
    doc.text(`MedApp ${APP_VERSION}`, ancho - m, alto - 6.5 * e, { align: 'right' })
  }
  doc.setTextColor(...COLOR.texto)
}

/**
 * Título de sección. Reserva espacio y salta de página si no cabe.
 */
export function seccion(doc, y, texto, { ia = false } = {}) {
  const m = cfg(doc).margen
  const e = cfg(doc).escala
  y += 3 * e
  y = saltoSiNoCabe(doc, y, 16 * e)

  const color = ia ? COLOR.ia : COLOR.primario
  doc.setFillColor(...color)
  doc.rect(m, y - 4 * e, 2.5 * e, 6 * e, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(fuente(doc, 11.5))
  doc.setTextColor(...color)
  doc.text(texto, m + 5 * e, y)
  doc.setTextColor(...COLOR.texto)

  return y + 6 * e
}

/**
 * Encabezado menor, para nombrar cada tabla dentro de una sección.
 */
export function subtitulo(doc, y, texto) {
  const e = cfg(doc).escala
  y = saltoSiNoCabe(doc, y, 10 * e)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(fuente(doc, 9.5))
  doc.setTextColor(...COLOR.suave)
  doc.text(texto, cfg(doc).margen, y)
  doc.setTextColor(...COLOR.texto)
  return y + 4 * e
}

export function parrafo(doc, y, texto, { tamano = 9.5, color = COLOR.texto, ancho = null } = {}) {
  if (!texto) return y
  const m = cfg(doc).margen
  const pts = fuente(doc, tamano)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(pts)
  doc.setTextColor(...color)

  const lineas = doc.splitTextToSize(String(texto), ancho || anchoUtil(doc))
  const altoLinea = pts * 0.45

  for (const linea of lineas) {
    y = saltoSiNoCabe(doc, y, altoLinea + 2)
    doc.text(linea, m, y)
    y += altoLinea + 1
  }
  doc.setTextColor(...COLOR.texto)
  return y + 2
}

/**
 * Par etiqueta/valor en una línea.
 */
export function dato(doc, y, etiqueta, valor) {
  if (valor === null || valor === undefined || valor === '') return y
  const m = cfg(doc).margen
  const e = cfg(doc).escala
  y = saltoSiNoCabe(doc, y, 7 * e)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(fuente(doc, 9.5))
  doc.text(`${etiqueta}:`, m, y)

  const anchoEtiqueta = doc.getTextWidth(`${etiqueta}: `)
  doc.setFont('helvetica', 'normal')
  const lineas = doc.splitTextToSize(String(valor), anchoUtil(doc) - anchoEtiqueta)
  doc.text(lineas[0], m + anchoEtiqueta, y)
  y += 5 * e

  for (let i = 1; i < lineas.length; i++) {
    y = saltoSiNoCabe(doc, y, 6 * e)
    doc.text(lineas[i], m + anchoEtiqueta, y)
    y += 5 * e
  }
  return y
}

/**
 * Recuadro destacado (alergias, avisos importantes).
 */
export function recuadro(doc, y, titulo, texto, { color = COLOR.alerta, fondo = COLOR.fondoAlerta } = {}) {
  const ancho = anchoUtil(doc)
  const m = cfg(doc).margen
  const e = cfg(doc).escala

  doc.setFontSize(fuente(doc, 9.5))
  const lineas = doc.splitTextToSize(String(texto), ancho - 10 * e)
  const alto = (10 + lineas.length * 4.5) * e

  y = saltoSiNoCabe(doc, y, alto + 4 * e)

  doc.setFillColor(...fondo)
  doc.setDrawColor(...color)
  doc.roundedRect(m, y - 4 * e, ancho, alto, 1.5, 1.5, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...color)
  doc.text(titulo, m + 4 * e, y + 2 * e)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLOR.texto)
  doc.text(lineas, m + 4 * e, y + 8 * e)

  return y + alto + 3 * e
}

/**
 * Tabla. Devuelve la Y final.
 */
export function tabla(doc, y, head, body, opciones = {}) {
  if (!body || body.length === 0) return y

  const m = cfg(doc).margen
  const e = cfg(doc).escala

  autoTable(doc, {
    startY: y,
    head: [head],
    body,
    margin: { left: m, right: m, bottom: 20 * e },
    styles: {
      font: 'helvetica',
      fontSize: fuente(doc, 8.5),
      cellPadding: 2 * e,
      textColor: COLOR.texto,
      lineColor: COLOR.linea,
      lineWidth: 0.1,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: opciones.colorCabecera || COLOR.primario,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: fuente(doc, 8.5),
    },
    alternateRowStyles: { fillColor: [248, 249, 250] },
    ...opciones,
  })

  return doc.lastAutoTable.finalY + 6 * e
}

/**
 * Marca las secciones escritas por un modelo de lenguaje. El médico tiene que
 * poder distinguir de un vistazo qué es ficha oficial y qué es salida de IA.
 */
export function selloIA(doc, y, { provider, model, fecha } = {}) {
  const partes = []
  if (provider) partes.push(provider)
  if (model) partes.push(model)
  const detalle = partes.length > 0 ? partes.join(' · ') : 'modelo no registrado'
  const cuando = fecha ? ` el ${formatearFecha(fecha)}` : ''

  return recuadro(
    doc,
    y,
    'Contenido generado por inteligencia artificial',
    `Este apartado lo ha redactado un modelo de lenguaje (${detalle})${cuando} a partir de los datos introducidos `
    + 'por el paciente y de los prospectos disponibles. No es una valoración clínica, puede contener errores y no '
    + 'sustituye el criterio de un profesional sanitario.',
    { color: COLOR.ia, fondo: COLOR.fondoIa }
  )
}

export function saltoSiNoCabe(doc, y, alto) {
  const e = cfg(doc).escala
  if (y + alto > altoPagina(doc) - 20 * e) {
    doc.addPage()
    return 22 * e
  }
  return y
}

export function formatearFecha(fecha) {
  const d = fecha instanceof Date ? fecha : new Date(fecha)
  if (Number.isNaN(d.getTime())) return String(fecha)
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatearFechaHora(fecha) {
  const d = fecha instanceof Date ? fecha : new Date(fecha)
  if (Number.isNaN(d.getTime())) return String(fecha)
  return d.toLocaleString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

/**
 * Nombre de fichero estable y reconocible: medapp-<tipo>-<perfil>-<fecha>.pdf
 */
export function nombreFichero(tipo, perfil) {
  const limpio = (perfil || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
  const fecha = new Date().toISOString().slice(0, 10)
  return ['medapp', tipo, limpio, fecha].filter(Boolean).join('-') + '.pdf'
}

/**
 * Descarga el PDF.
 */
export function guardarPdf(doc, nombre) {
  doc.save(nombre)
}

/**
 * Comparte el PDF con otra app (correo, mensajería) si el dispositivo lo permite.
 * Devuelve false si no hay soporte, para poder caer en la descarga.
 */
export async function compartirPdf(doc, nombre, titulo = 'Informe de MedApp') {
  try {
    const blob = doc.output('blob')
    const file = new File([blob], nombre, { type: 'application/pdf' })
    if (!navigator.canShare || !navigator.canShare({ files: [file] })) return false
    await navigator.share({ files: [file], title: titulo })
    return true
  } catch (e) {
    // El usuario puede cancelar el diálogo de compartir: no es un error.
    if (e?.name === 'AbortError') return true
    return false
  }
}
