/**
 * Cifrado con clave derivada de PIN.
 * Usa Web Crypto API (AES-256-GCM + PBKDF2) en contextos seguros (HTTPS/localhost).
 * Fallback software (XOR + key stretching) en HTTP sobre red local.
 * El campo `method` en los datos cifrados indica qué método se usó.
 */

const ITERATIONS = 100000
const hasSubtleCrypto = typeof crypto !== 'undefined' && !!crypto.subtle

function toBase64(buffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)))
}

function fromBase64(base64) {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
}

// ─── Web Crypto (contexto seguro) ───

async function deriveKey(pin, salt) {
    const encoder = new TextEncoder()
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(pin),
        'PBKDF2',
        false,
        ['deriveKey']
    )
    return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    )
}

async function webEncrypt(plaintext, pin) {
    const encoder = new TextEncoder()
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const key = await deriveKey(pin, salt)
    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoder.encode(plaintext)
    )
    return {
        method: 'webcrypto',
        ciphertext: toBase64(encrypted),
        salt: toBase64(salt),
        iv: toBase64(iv)
    }
}

async function webDecrypt(data, pin) {
    const salt = fromBase64(data.salt)
    const iv = fromBase64(data.iv)
    const ciphertext = fromBase64(data.ciphertext)
    const key = await deriveKey(pin, new Uint8Array(salt))
    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(iv) },
        key,
        ciphertext
    )
    return new TextDecoder().decode(decrypted)
}

// ─── Fallback software (contexto no seguro) ───

function softHash(data) {
    let h1 = 0x811c9dc5, h2 = 0x01000193, h3 = 0xdeadbeef, h4 = 0xcafebabe
    for (let i = 0; i < data.length; i++) {
        h1 = Math.imul(h1 ^ data[i], 0x01000193)
        h2 = Math.imul(h2 ^ data[i], 0x6c62272e)
        h3 = Math.imul(h3 ^ data[i], 0x5082edee)
        h4 = Math.imul(h4 ^ data[i], 0x105c9199)
    }
    return new Uint8Array([
        h1 & 0xff, (h1 >> 8) & 0xff, (h1 >> 16) & 0xff, (h1 >> 24) & 0xff,
        h2 & 0xff, (h2 >> 8) & 0xff, (h2 >> 16) & 0xff, (h2 >> 24) & 0xff,
        h3 & 0xff, (h3 >> 8) & 0xff, (h3 >> 16) & 0xff, (h3 >> 24) & 0xff,
        h4 & 0xff, (h4 >> 8) & 0xff, (h4 >> 16) & 0xff, (h4 >> 24) & 0xff,
    ])
}

function softDeriveStream(pin, salt, length) {
    const encoder = new TextEncoder()
    let seed = new Uint8Array([...encoder.encode(pin), ...new Uint8Array(salt)])
    for (let i = 0; i < 10000; i++) {
        const tmp = new Uint8Array(seed.length + 1)
        tmp.set(seed)
        tmp[seed.length] = i & 0xff
        seed = softHash(tmp)
    }
    const stream = new Uint8Array(length)
    for (let offset = 0; offset < length; offset += 16) {
        const counter = new Uint8Array(seed.length + 4)
        counter.set(seed)
        counter[seed.length] = (offset >> 24) & 0xff
        counter[seed.length + 1] = (offset >> 16) & 0xff
        counter[seed.length + 2] = (offset >> 8) & 0xff
        counter[seed.length + 3] = offset & 0xff
        const block = softHash(counter)
        for (let j = 0; j < 16 && offset + j < length; j++) {
            stream[offset + j] = block[j]
        }
    }
    return stream
}

function randomBytes(n) {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        return crypto.getRandomValues(new Uint8Array(n))
    }
    const bytes = new Uint8Array(n)
    for (let i = 0; i < n; i++) bytes[i] = Math.floor(Math.random() * 256)
    return bytes
}

function softEncrypt(plaintext, pin) {
    const encoder = new TextEncoder()
    const data = encoder.encode(plaintext)
    const salt = randomBytes(16)
    const stream = softDeriveStream(pin, salt, data.length)
    const encrypted = new Uint8Array(data.length)
    for (let i = 0; i < data.length; i++) {
        encrypted[i] = data[i] ^ stream[i]
    }
    // Checksum para verificar PIN
    const check = softDeriveStream(pin, salt, 4)
    return {
        method: 'fallback',
        ciphertext: toBase64(encrypted),
        salt: toBase64(salt),
        check: toBase64(check)
    }
}

function softDecrypt(data, pin) {
    const salt = fromBase64(data.salt)
    const ciphertext = new Uint8Array(fromBase64(data.ciphertext))
    // Verificar PIN con checksum
    if (data.check) {
        const expected = new Uint8Array(fromBase64(data.check))
        const actual = softDeriveStream(pin, salt, 4)
        if (expected.some((v, i) => v !== actual[i])) {
            throw new Error('PIN incorrecto')
        }
    }
    const stream = softDeriveStream(pin, salt, ciphertext.length)
    const decrypted = new Uint8Array(ciphertext.length)
    for (let i = 0; i < ciphertext.length; i++) {
        decrypted[i] = ciphertext[i] ^ stream[i]
    }
    return new TextDecoder().decode(decrypted)
}

// ─── API pública ───

/**
 * Cifra un texto con un PIN.
 * Usa Web Crypto si está disponible, fallback software en caso contrario.
 */
export async function encrypt(plaintext, pin) {
    if (hasSubtleCrypto) {
        return webEncrypt(plaintext, pin)
    }
    return softEncrypt(plaintext, pin)
}

/**
 * Descifra datos cifrados con un PIN.
 * Detecta el método usado automáticamente.
 */
export async function decrypt(data, pin) {
    const method = data.method || 'webcrypto'
    if (method === 'webcrypto') {
        if (!hasSubtleCrypto) {
            throw new Error('Estos datos se cifraron en un contexto seguro (HTTPS). Accede desde HTTPS o localhost para descifrarlos.')
        }
        return webDecrypt(data, pin)
    }
    return softDecrypt(data, pin)
}
