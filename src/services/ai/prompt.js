/**
 * Prompts para los diferentes análisis farmacológicos con IA.
 */

/**
 * Prompt para consulta de posología recomendada de un medicamento.
 */
export function buildPosologiaPrompt(medicamento, prospectos, perfil) {
  const nombre = medicamento.nombre || medicamento.name || 'Desconocido'
  const pa = medicamento.vtm?.nombre || medicamento.pactivos || ''
  const forma = typeof medicamento.formaFarmaceutica === 'object'
    ? medicamento.formaFarmaceutica?.nombre
    : medicamento.formaFarmaceutica || ''

  const perfilParts = []
  if (perfil.esMascota) {
    perfilParts.push(`TIPO DE PACIENTE: Mascota (${perfil.tipoMascota || 'no especificado'})`)
  }
  if (perfil.edad) perfilParts.push(`EDAD: ${perfil.edad} años`)
  if (perfil.peso) perfilParts.push(`PESO: ${perfil.peso} kg`)
  if (perfil.altura) perfilParts.push(`ALTURA: ${perfil.altura} cm`)
  if (perfil.genero) perfilParts.push(`GÉNERO: ${perfil.genero}`)
  if (perfil.enfermedades_cronicas?.length > 0) {
    perfilParts.push(`ENFERMEDADES CRÓNICAS: ${perfil.enfermedades_cronicas.join(', ')}`)
  }
  if (perfil.alergias?.length > 0) {
    perfilParts.push(`ALERGIAS: ${perfil.alergias.join(', ')}`)
  }
  if (perfil.peculiaridades?.length > 0) {
    perfilParts.push(`PECULIARIDADES: ${perfil.peculiaridades.join(', ')}`)
  }

  let prospectosSection = ''
  if (prospectos.length > 0) {
    prospectosSection = '\nPROSPECTO DEL MEDICAMENTO:\n' + prospectos.map(p =>
      `--- ${p.nombre} ---\n${p.texto}\n`
    ).join('\n')
  }

  const contexto = perfil.esMascota
    ? 'Eres un asistente veterinario experto en farmacología animal. Recomienda la posología adecuada del siguiente medicamento veterinario para el paciente.'
    : 'Eres un asistente farmacéutico experto. Recomienda la posología adecuada del siguiente medicamento para el paciente.'

  return `${contexto}

MEDICAMENTO: ${nombre}${pa ? ` (Principio activo: ${pa})` : ''}${forma ? ` — Forma: ${forma}` : ''}

PERFIL DEL PACIENTE:
${perfilParts.join('\n')}
${prospectosSection}
Basándote en la ficha técnica del medicamento, el prospecto disponible y el perfil del paciente, recomienda la posología más adecuada.

Responde EXCLUSIVAMENTE en formato JSON con esta estructura:
{
  "dosis": "dosis recomendada (ej: 500 mg, 1 comprimido, 5 ml)",
  "frecuencia": "frecuencia recomendada (ej: Cada 8 horas)",
  "duracion": "duración recomendada o null si depende del caso",
  "via_administracion": "oral, tópica, etc.",
  "notas": "instrucciones adicionales (con/sin comida, momento del día, etc.)",
  "advertencias": ["lista de advertencias relevantes para este paciente"],
  "resumen": "frase corta de 1-2 líneas con la recomendación principal"
}

Sé preciso y basa tu recomendación en evidencia farmacológica. Si el medicamento no es adecuado para el perfil del paciente, indícalo claramente en las advertencias.`
}

export function buildPrompt(medicamentos, enfermedades, prospectos, perfil = null) {
  const medList = medicamentos.map((m, i) => {
    const nombre = m.name || m.data?.nombre || 'Desconocido'
    const pa = m.data?.vtm?.nombre || m.data?.pactivos || ''
    let line = `${i + 1}. ${nombre}${pa ? ` (Principio activo: ${pa})` : ''}`
    if (m.posologia) {
      const pos = m.posologia
      const parts = []
      if (pos.dosis) parts.push(pos.dosis)
      if (pos.frecuencia) parts.push(pos.frecuencia)
      if (pos.duracion) parts.push(`durante ${pos.duracion}`)
      if (pos.notas) parts.push(`(${pos.notas})`)
      if (parts.length > 0) line += ` — Posología: ${parts.join(' ')}`
    }
    return line
  }).join('\n')

  const enfList = enfermedades.length > 0
    ? enfermedades.join(', ')
    : 'No especificadas'

  // Sección del perfil del paciente
  let perfilSection = ''
  if (perfil) {
    const parts = []
    if (perfil.esMascota) {
      parts.push(`TIPO DE PACIENTE: Mascota (${perfil.tipoMascota || 'no especificado'})`)
      parts.push('IMPORTANTE: Analiza las interacciones teniendo en cuenta que es un animal, no un humano. Las dosis, metabolismo y contraindicaciones pueden variar según la especie.')
    }
    if (perfil.edad) {
      parts.push(`EDAD: ${perfil.edad} años`)
    }
    if (perfil.peso) {
      parts.push(`PESO: ${perfil.peso} kg`)
    }
    if (perfil.altura) {
      parts.push(`ALTURA: ${perfil.altura} cm`)
    }
    if (perfil.genero) {
      parts.push(`GÉNERO: ${perfil.genero}`)
    }
    if (perfil.enfermedades_cronicas?.length > 0) {
      parts.push(`ENFERMEDADES CRÓNICAS DEL PACIENTE: ${perfil.enfermedades_cronicas.join(', ')}`)
    }
    if (perfil.alergias?.length > 0) {
      parts.push(`ALERGIAS A MEDICAMENTOS: ${perfil.alergias.join(', ')}`)
    }
    if (perfil.peculiaridades?.length > 0) {
      parts.push(`OTRAS PECULIARIDADES: ${perfil.peculiaridades.join(', ')}`)
    }
    if (parts.length > 0) {
      perfilSection = '\n\nPERFIL DEL PACIENTE:\n' + parts.join('\n')
    }
  }

  let prospectosSection = ''
  if (prospectos.length > 0) {
    prospectosSection = '\nPROSPECTOS DISPONIBLES:\n' + prospectos.map(p =>
      `--- ${p.nombre} ---\n${p.texto}\n`
    ).join('\n')
  }

  const hasPosologia = medicamentos.some(m => m.posologia)

  const contexto = perfil?.esMascota
    ? 'Eres un asistente veterinario experto en farmacología animal. Analiza las posibles interacciones entre los siguientes medicamentos veterinarios.'
    : 'Eres un asistente farmacéutico experto. Analiza las posibles interacciones entre los siguientes medicamentos que un paciente toma simultáneamente.'

  const instruccionPosologia = hasPosologia
    ? '\nSi se indica posología, evalúa si la dosis y frecuencia son adecuadas según el perfil del paciente (edad, peso, género, enfermedades crónicas). Indica si alguna dosis parece excesiva, insuficiente o requiere precaución.'
    : ''

  const schemaPosologia = hasPosologia ? `,
  "observaciones_posologia": [
    {
      "medicamento": "nombre",
      "observacion": "descripción de la observación sobre la dosis",
      "tipo": "adecuada" | "excesiva" | "insuficiente" | "precaucion"
    }
  ]` : ''

  return `${contexto}${instruccionPosologia}

MEDICAMENTOS:
${medList}

ENFERMEDADES/SÍNTOMAS DEL PACIENTE:
${enfList}
${perfilSection}
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
  ],
  "contraindicaciones_alergia": [
    {
      "medicamento": "nombre",
      "alergia": "nombre de la alergia",
      "detalle": "por qué está contraindicado por la alergia"
    }
  ]${schemaPosologia}
}

Si no hay interacciones ni contraindicaciones, devuelve severidad "ninguna", resumen indicándolo, y arrays vacíos.${hasPosologia ? ' Si no hay observaciones sobre la posología, devuelve el array vacío.' : ''}
Sé preciso y basa tu análisis en evidencia farmacológica.`
}
