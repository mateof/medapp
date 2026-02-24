import { db } from '../db'
import { encrypt, decrypt } from '../crypto'

const PIN_CHECK_MARKER = 'MEDAPP_PIN_CHECK'

// --- User CRUD ---

export async function getAllUsers() {
  return await db.usuarios.toArray()
}

export async function getUserById(id) {
  return await db.usuarios.get(id)
}

export async function userNameExists(nombre, excludeId = null) {
  const normalized = nombre.trim().toLowerCase()
  const all = await db.usuarios.toArray()
  return all.some(u => u.nombre.toLowerCase() === normalized && u.id !== excludeId)
}

export async function createUser({ nombre, pin, avatar }) {
  if (await userNameExists(nombre)) {
    throw new Error('Ya existe un usuario con ese nombre')
  }
  const pinCheck = await encrypt(PIN_CHECK_MARKER, pin)
  return await db.usuarios.add({
    nombre,
    pin_check: pinCheck,
    avatar: avatar || null,
    createdAt: new Date().toISOString()
  })
}

export async function updateUser(id, updates) {
  await db.usuarios.update(id, updates)
}

export async function deleteUser(id) {
  await db.medicamentos.where('userId').equals(id).delete()
  await db.actividad.where('userId').equals(id).delete()
  await db.interacciones.where('userId').equals(id).delete()

  const allSettings = await db.settings.toArray()
  const prefix = `user_${id}_`
  const keysToDelete = allSettings.filter(s => s.key.startsWith(prefix)).map(s => s.key)
  if (keysToDelete.length > 0) {
    await db.settings.bulkDelete(keysToDelete)
  }

  await db.usuarios.delete(id)
}

// --- PIN Verification ---

export async function verifyPin(user, pin) {
  if (!user.pin_check) return false
  try {
    const decrypted = await decrypt(user.pin_check, pin)
    return decrypted === PIN_CHECK_MARKER
  } catch {
    return false
  }
}

export async function setPinForUser(userId, pin) {
  const pinCheck = await encrypt(PIN_CHECK_MARKER, pin)
  await db.usuarios.update(userId, { pin_check: pinCheck })
}

// --- Avatar Generation ---

export function generateInitialsAvatar(nombre, size = 128) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  const colors = ['#1e88e5', '#21c1d6', '#fc4b6c', '#7460ee', '#26c6da', '#ffb22b', '#f44336', '#4caf50']
  let hash = 0
  for (let i = 0; i < nombre.length; i++) {
    hash = nombre.charCodeAt(i) + ((hash << 5) - hash)
  }
  const bgColor = colors[Math.abs(hash) % colors.length]

  ctx.fillStyle = bgColor
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
  ctx.fill()

  const parts = nombre.trim().split(/\s+/)
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : nombre.substring(0, 2).toUpperCase()

  ctx.fillStyle = '#FFFFFF'
  ctx.font = `bold ${size * 0.4}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(initials, size / 2, size / 2)

  return canvas.toDataURL('image/png')
}

// --- Image Resize ---

export function resizeImage(file, maxSize = 256) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let w = img.width, h = img.height
        if (w > h) { h = (h / w) * maxSize; w = maxSize }
        else { w = (w / h) * maxSize; h = maxSize }
        canvas.width = w
        canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/png'))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}
