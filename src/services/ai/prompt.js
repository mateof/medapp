/**
 * Prompt compartido para análisis de interacciones farmacológicas.
 * Usado por todos los proveedores de IA.
 */

export function buildPrompt(medicamentos, enfermedades, prospectos) {
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
