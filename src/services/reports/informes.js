/**
 * Informes en PDF.
 *
 * Cada función recibe los datos ya cargados y devuelve un documento jsPDF,
 * sin tocar la base de datos ni el estado de la app.
 */
import {
  nuevoDocumento, cabecera, pie, seccion, subtitulo, parrafo, dato, recuadro, tabla, selloIA,
  formatearFecha, formatearFechaHora, COLOR,
} from './pdf.js'

function avisoPie(perfil) {
  const fuente = esMascota(perfil) ? 'CIMAVet (AEMPS)' : 'CIMA (AEMPS)'
  const quien = esMascota(perfil) ? 'la persona responsable del animal' : 'el propio paciente'
  return `Documento generado por ${quien} con MedApp a partir de datos de ${fuente} `
    + 'y de la información introducida manualmente. No es un documento clínico.'
}

// --- Extracción de datos del medicamento ---

export function principioActivo(med) {
  return med?.data?.vtm?.nombre || med?.data?.pactivos || ''
}

export function formaFarmaceutica(med) {
  const ff = med?.data?.formaFarmaceutica
  if (!ff) return ''
  return typeof ff === 'object' ? ff.nombre : String(ff)
}

export function viasAdministracion(med) {
  const vias = med?.data?.viasAdministracion
  if (!Array.isArray(vias) || vias.length === 0) return ''
  return vias.map(v => (typeof v === 'object' ? v.nombre : String(v))).join(', ')
}

export function pauta(med) {
  const p = med?.posologia
  if (!p) return 'No indicada'
  const partes = []
  if (p.dosis) partes.push(p.dosis)
  if (p.frecuencia) partes.push(p.frecuencia)
  if (p.duracion) partes.push(`durante ${p.duracion}`)
  if (p.via_administracion) partes.push(`vía ${p.via_administracion}`)
  const linea = partes.join(' · ')
  return p.notas ? `${linea}${linea ? '. ' : ''}${p.notas}` : (linea || 'No indicada')
}

function periodo(med) {
  const desde = med?.fechaInicio ? formatearFecha(med.fechaInicio) : null
  const hasta = med?.fechaFin ? formatearFecha(med.fechaFin) : null
  if (desde && hasta) return `${desde} a ${hasta}`
  if (desde) return `Desde ${desde}`
  if (hasta) return `Hasta ${hasta}`
  return 'No indicado'
}

function esMascota(perfil) {
  return !!perfil?.esMascota
}

function lineaPaciente(usuario, perfil) {
  const nombre = usuario?.nombre || 'Perfil sin nombre'
  if (esMascota(perfil)) {
    return `${nombre} (${perfil.tipoMascota || 'mascota'})`
  }
  return nombre
}

function datosPaciente(doc, y, perfil) {
  const partes = []
  if (perfil?.edad) partes.push(`${perfil.edad} años`)
  if (perfil?.peso) partes.push(`${perfil.peso} kg`)
  if (perfil?.altura) partes.push(`${perfil.altura} cm`)
  if (perfil?.genero) partes.push(perfil.genero)
  if (partes.length > 0) y = dato(doc, y, 'Datos', partes.join(' · '))
  return y
}

// --- 1. Informe de medicación ---

/**
 * Informe principal: el que se lleva a la consulta.
 */
export function informeMedicacion({ usuario, perfil, medicamentos = [], analisis = null, opciones = {} } = {}) {
  const op = {
    perfil: true,
    alergias: true,
    suspendidos: false,
    interacciones: false,
    alternativas: false,
    notas: '',
    ...opciones,
  }

  const veterinario = esMascota(perfil)
  const doc = nuevoDocumento({ titulo: veterinario ? 'Informe veterinario' : 'Informe de medicación' })

  let y = cabecera(doc, {
    titulo: veterinario ? 'Informe veterinario' : 'Informe de medicación',
    subtitulo: veterinario ? 'Tratamiento actual del animal' : 'Tratamiento actual del paciente',
    paciente: lineaPaciente(usuario, perfil),
  })

  const activos = medicamentos.filter(m => m.activo !== false)
  const suspendidos = medicamentos.filter(m => m.activo === false)

  // Perfil
  if (op.perfil) {
    y = seccion(doc, y, veterinario ? 'Datos del animal' : 'Datos del paciente')
    y = datosPaciente(doc, y, perfil)
    if (perfil?.enfermedades_cronicas?.length) {
      y = dato(doc, y, 'Condiciones crónicas', perfil.enfermedades_cronicas.join(', '))
    }
    if (perfil?.peculiaridades?.length) {
      y = dato(doc, y, 'Otras particularidades', perfil.peculiaridades.join(', '))
    }
    y += 2
  }

  // Alergias: siempre destacadas
  if (op.alergias && perfil?.alergias?.length) {
    y = recuadro(doc, y, 'Alergias a medicamentos', perfil.alergias.join(', '))
    y += 2
  }

  // Medicación activa
  y = seccion(doc, y, `Tratamiento activo (${activos.length})`)
  if (activos.length === 0) {
    y = parrafo(doc, y, 'No hay ningún tratamiento activo registrado.', { color: COLOR.suave })
  } else {
    y = tabla(
      doc, y,
      ['Medicamento', 'Principio activo', 'Indicación', 'Pauta', 'Periodo'],
      activos.map(m => [
        m.name || '',
        principioActivo(m),
        (m.enfermedades || []).join(', ') || '-',
        pauta(m),
        periodo(m),
      ]),
      { columnStyles: { 0: { cellWidth: 38 }, 3: { cellWidth: 45 }, 4: { cellWidth: 26 } } }
    )
  }

  // Medicación suspendida
  if (op.suspendidos && suspendidos.length > 0) {
    y = seccion(doc, y, `Tratamientos suspendidos (${suspendidos.length})`)
    y = tabla(
      doc, y,
      ['Medicamento', 'Principio activo', 'Indicación', 'Periodo'],
      suspendidos.map(m => [
        m.name || '',
        principioActivo(m),
        (m.enfermedades || []).join(', ') || '-',
        periodo(m),
      ]),
      { colorCabecera: COLOR.suave }
    )
  }

  // Análisis de IA (opcional)
  if ((op.interacciones || op.alternativas) && analisis) {
    y = seccionesAnalisis(doc, y, analisis, op)
  }

  // Notas del paciente
  if (op.notas) {
    y = seccion(doc, y, 'Notas para el profesional')
    y = parrafo(doc, y, op.notas)
  }

  pie(doc, { aviso: avisoPie(perfil) })
  return doc
}

/**
 * Bloques de interacciones y alternativas, marcados como salida de IA.
 */
function seccionesAnalisis(doc, y, analisis, op, titulo = 'Análisis de interacciones') {
  const detalle = analisis.detalle || analisis
  const ai = detalle?._ai

  y = seccion(doc, y, titulo, { ia: true })
  y = selloIA(doc, y, {
    provider: ai?.providerName || ai?.provider,
    model: ai?.model,
    fecha: analisis.fecha || ai?.timestamp,
  })

  if (detalle?.resumen) {
    y = dato(doc, y, 'Resumen', detalle.resumen)
  }
  if (detalle?.severidad) {
    y = dato(doc, y, 'Severidad global', capitalizar(detalle.severidad))
  }
  y += 2

  if (op.interacciones !== false) {
    if (detalle?.interacciones?.length) {
      y = subtitulo(doc, y, 'Interacciones entre medicamentos')
      y = tabla(
        doc, y,
        ['Medicamentos', 'Severidad', 'Interacción', 'Recomendación'],
        detalle.interacciones.map(i => [
          (i.medicamentos || []).join(' + '),
          capitalizar(i.severidad || ''),
          i.tipo || '',
          i.recomendacion || '',
        ]),
        { colorCabecera: COLOR.ia, columnStyles: { 1: { cellWidth: 20 } } }
      )
    }

    if (detalle?.contraindicaciones_enfermedad?.length) {
      y = subtitulo(doc, y, 'Contraindicaciones por condición del paciente')
      y = tabla(
        doc, y,
        ['Medicamento', 'Condición', 'Motivo'],
        detalle.contraindicaciones_enfermedad.map(c => [c.medicamento || '', c.enfermedad || '', c.detalle || '']),
        { colorCabecera: COLOR.ia }
      )
    }

    if (detalle?.contraindicaciones_alergia?.length) {
      y = subtitulo(doc, y, 'Contraindicaciones por alergia')
      y = tabla(
        doc, y,
        ['Medicamento', 'Alergia', 'Motivo'],
        detalle.contraindicaciones_alergia.map(c => [c.medicamento || '', c.alergia || '', c.detalle || '']),
        { colorCabecera: COLOR.alerta }
      )
    }

    if (detalle?.observaciones_posologia?.length) {
      y = subtitulo(doc, y, 'Observaciones sobre la pauta')
      y = tabla(
        doc, y,
        ['Medicamento', 'Valoración', 'Observación'],
        detalle.observaciones_posologia.map(o => [o.medicamento || '', etiquetaPosologia(o.tipo), o.observacion || '']),
        { colorCabecera: COLOR.ia, columnStyles: { 1: { cellWidth: 24 } } }
      )
    }
  }

  if (op.alternativas && detalle?.alternativas?.length) {
    y = seccion(doc, y, 'Alternativas sugeridas', { ia: true })
    y = parrafo(
      doc, y,
      'Sugerencias de sustitución propuestas por el modelo. Se incluyen para que el profesional las valore, '
      + 'nunca para cambiar el tratamiento por cuenta propia.',
      { color: COLOR.suave }
    )
    y = tabla(
      doc, y,
      ['Actual', 'Alternativa', 'Perfil de riesgo', 'Motivo', 'Riesgos de la alternativa'],
      detalle.alternativas.map(a => [
        a.medicamento_original || '',
        a.alternativa || '',
        etiquetaComparativa(a.comparativa),
        a.beneficio || a.problema || '',
        (a.riesgos || []).join('; ') || 'No indicados',
      ]),
      { colorCabecera: COLOR.ia, columnStyles: { 2: { cellWidth: 24 } } }
    )
  }

  return y
}

// --- 2. Tarjeta de urgencias ---

/**
 * Media hoja para llevar en la cartera: sin IA, solo lo esencial.
 */
export function tarjetaUrgencias({ usuario, perfil, medicamentos = [] } = {}) {
  const doc = nuevoDocumento({ formato: 'a6', titulo: 'Tarjeta de medicación' })
  const activos = medicamentos.filter(m => m.activo !== false)

  let y = cabecera(doc, {
    titulo: 'Tarjeta de medicación',
    subtitulo: 'Información de urgencia',
    paciente: lineaPaciente(usuario, perfil),
  })

  y = datosPaciente(doc, y, perfil)

  if (perfil?.alergias?.length) {
    y = recuadro(doc, y, 'ALERGIAS', perfil.alergias.join(', '))
  } else {
    y = dato(doc, y, 'Alergias', 'Ninguna registrada')
  }

  if (perfil?.enfermedades_cronicas?.length) {
    y = dato(doc, y, 'Crónicas', perfil.enfermedades_cronicas.join(', '))
  }

  y = seccion(doc, y, 'Medicación actual')
  y = tabla(
    doc, y,
    ['Medicamento', 'Pauta'],
    activos.map(m => [
      `${m.name}${principioActivo(m) ? `\n${principioActivo(m)}` : ''}`,
      pauta(m),
    ]),
    { columnStyles: { 0: { cellWidth: 44 } } }
  )

  pie(doc, { aviso: esMascota(perfil) ? 'Datos facilitados por la persona responsable del animal.' : 'Datos facilitados por el propio paciente.' })
  return doc
}

// --- 3. Informe de un análisis de interacciones ---

export function informeInteracciones({ usuario, perfil, analisis, medNames = [] } = {}) {
  const doc = nuevoDocumento({ titulo: 'Informe de interacciones' })
  const detalle = analisis?.detalle || analisis

  let y = cabecera(doc, {
    titulo: 'Análisis de interacciones',
    subtitulo: 'Revisión asistida por IA',
    paciente: lineaPaciente(usuario, perfil),
    fecha: analisis?.fecha ? new Date(analisis.fecha) : new Date(),
  })

  if (analisis?.fecha) {
    y = dato(doc, y, 'Fecha del análisis', formatearFechaHora(analisis.fecha))
  }
  if (medNames.length > 0) {
    y = dato(doc, y, 'Medicamentos analizados', medNames.join(', '))
  }
  if (perfil?.alergias?.length) {
    y = dato(doc, y, 'Alergias declaradas', perfil.alergias.join(', '))
  }
  if (perfil?.enfermedades_cronicas?.length) {
    y = dato(doc, y, 'Condiciones crónicas', perfil.enfermedades_cronicas.join(', '))
  }
  y += 2

  y = seccionesAnalisis(doc, y, analisis, { interacciones: true, alternativas: true }, 'Resultado del análisis')

  pie(doc, { aviso: avisoPie(perfil) })
  return doc
}

// --- 4. Ficha de un medicamento ---

export function fichaMedicamento({ usuario, perfil, medicamento, consultasPosologia = [] } = {}) {
  const doc = nuevoDocumento({ titulo: `Ficha de ${medicamento?.name || 'medicamento'}` })

  let y = cabecera(doc, {
    titulo: 'Ficha de medicamento',
    subtitulo: medicamento?.name || '',
    paciente: lineaPaciente(usuario, perfil),
  })

  y = seccion(doc, y, 'Datos del medicamento')
  y = dato(doc, y, 'Nombre', medicamento?.name)
  y = dato(doc, y, 'Principio activo', principioActivo(medicamento) || 'No disponible')
  y = dato(doc, y, 'Laboratorio', medicamento?.data?.labtitular)
  y = dato(doc, y, 'Nº de registro (AEMPS)', medicamento?.data?.nregistro)
  y = dato(doc, y, 'Forma farmacéutica', formaFarmaceutica(medicamento))
  y = dato(doc, y, 'Vía de administración', viasAdministracion(medicamento))
  y = dato(doc, y, 'Dosis', medicamento?.data?.dosis)
  y = dato(doc, y, 'Requiere receta', medicamento?.data?.receta ? 'Sí' : 'No')
  y += 2

  y = seccion(doc, y, 'Tratamiento')
  y = dato(doc, y, 'Estado', medicamento?.activo === false ? 'Suspendido' : 'Activo')
  y = dato(doc, y, 'Periodo', periodo(medicamento))
  y = dato(doc, y, 'Indicación registrada', (medicamento?.enfermedades || []).join(', ') || 'No indicada')
  y = dato(doc, y, 'Pauta', pauta(medicamento))

  if (consultasPosologia.length > 0) {
    y = seccion(doc, y, 'Consultas de posología', { ia: true })
    const ultima = consultasPosologia[0]
    y = selloIA(doc, y, {
      provider: ultima?.parsed?._ai?.providerName || ultima?.parsed?._ai?.provider,
      model: ultima?.parsed?._ai?.model,
      fecha: ultima?.fecha,
    })
    y = tabla(
      doc, y,
      ['Fecha', 'Dosis', 'Frecuencia', 'Duración', 'Notas'],
      consultasPosologia.slice(0, 10).map(c => [
        c.fecha ? formatearFecha(c.fecha) : '',
        c.parsed?.dosis || '',
        c.parsed?.frecuencia || '',
        c.parsed?.duracion || '',
        c.parsed?.notas || '',
      ]),
      { colorCabecera: COLOR.ia, columnStyles: { 0: { cellWidth: 22 } } }
    )

    const advertencias = consultasPosologia[0]?.parsed?.advertencias
    if (advertencias?.length) {
      y = parrafo(doc, y, `Advertencias: ${advertencias.join(' ')}`)
    }
  }

  pie(doc, { aviso: avisoPie(perfil) })
  return doc
}

// --- Helpers ---

function capitalizar(texto) {
  if (!texto) return ''
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function etiquetaPosologia(tipo) {
  switch (tipo) {
    case 'excesiva': return 'Excesiva'
    case 'insuficiente': return 'Insuficiente'
    case 'precaucion': return 'Precaución'
    case 'adecuada': return 'Adecuada'
    default: return capitalizar(tipo || '')
  }
}

function etiquetaComparativa(comp) {
  switch (comp) {
    case 'menos_nociva': return 'Menos nociva'
    case 'similar': return 'Riesgo similar'
    case 'distinto_perfil': return 'Otros efectos'
    default: return 'Sin valorar'
  }
}
