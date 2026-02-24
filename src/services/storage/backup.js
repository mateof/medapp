import { db } from '../db'

const BACKUP_VERSION = 1

export async function exportUsers(userIds) {
  const data = {
    version: BACKUP_VERSION,
    app: 'MedApp',
    exportDate: new Date().toISOString(),
    users: []
  }

  for (const userId of userIds) {
    const user = await db.usuarios.get(userId)
    if (!user) continue

    const medicamentos = await db.medicamentos.where('userId').equals(userId).toArray()
    const actividad = await db.actividad.where('userId').equals(userId).toArray()
    const interacciones = await db.interacciones.where('userId').equals(userId).toArray()

    const allSettings = await db.settings.toArray()
    const prefix = `user_${userId}_`
    const settings = allSettings
      .filter(s => s.key.startsWith(prefix))
      .map(s => ({ key: s.key.replace(prefix, ''), value: s.value }))

    // Strip internal IDs and userId from records
    const strip = ({ id, userId, ...rest }) => rest

    data.users.push({
      profile: {
        nombre: user.nombre,
        pin_check: user.pin_check,
        avatar: user.avatar,
        createdAt: user.createdAt
      },
      medicamentos: medicamentos.map(strip),
      actividad: actividad.map(strip),
      interacciones: interacciones.map(strip),
      settings
    })
  }

  return data
}

export function downloadBackup(data) {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const date = new Date().toISOString().slice(0, 10)
  const names = data.users.map(u => u.profile.nombre).join('_')
  const filename = `medapp_backup_${names}_${date}.json`

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function importBackup(jsonData) {
  if (!jsonData || jsonData.app !== 'MedApp' || jsonData.version !== BACKUP_VERSION) {
    throw new Error('Archivo de backup no válido')
  }

  const imported = []

  for (const userData of jsonData.users) {
    const newUserId = await db.usuarios.add({
      nombre: userData.profile.nombre,
      pin_check: userData.profile.pin_check,
      avatar: userData.profile.avatar,
      createdAt: userData.profile.createdAt
    })

    if (userData.medicamentos?.length) {
      await db.medicamentos.bulkAdd(
        userData.medicamentos.map(m => ({ ...m, userId: newUserId }))
      )
    }

    if (userData.actividad?.length) {
      await db.actividad.bulkAdd(
        userData.actividad.map(a => ({ ...a, userId: newUserId }))
      )
    }

    if (userData.interacciones?.length) {
      await db.interacciones.bulkAdd(
        userData.interacciones.map(i => ({ ...i, userId: newUserId }))
      )
    }

    if (userData.settings?.length) {
      await db.settings.bulkPut(
        userData.settings.map(s => ({
          key: `user_${newUserId}_${s.key}`,
          value: s.value
        }))
      )
    }

    imported.push({ id: newUserId, nombre: userData.profile.nombre })
  }

  return imported
}

export function readBackupFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        resolve(JSON.parse(e.target.result))
      } catch {
        reject(new Error('El archivo no es un JSON válido'))
      }
    }
    reader.onerror = () => reject(new Error('Error al leer el archivo'))
    reader.readAsText(file)
  })
}
