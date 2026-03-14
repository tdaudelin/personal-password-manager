import { argon2id } from 'hash-wasm'

export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16))
}

export function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(12))
}

export async function deriveKey(
  password: string,
  salt: Uint8Array,
): Promise<{ key: CryptoKey; kdf: 'argon2id' | 'pbkdf2' }> {
  try {
    const hashBytes = await argon2id({
      password,
      salt,
      parallelism: 1,
      iterations: 3,
      memorySize: 65536,
      hashLength: 32,
      outputType: 'binary',
    })
    const key = await crypto.subtle.importKey(
      'raw',
      hashBytes,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt'],
    )
    return { key, kdf: 'argon2id' }
  } catch {
    // WASM unavailable — fall back to PBKDF2
    return { key: await deriveKeyPbkdf2(password, salt), kdf: 'pbkdf2' }
  }
}

async function deriveKeyPbkdf2(
  password: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encrypt(
  key: CryptoKey,
  plaintext: string,
): Promise<{ iv: Uint8Array; ciphertext: ArrayBuffer }> {
  const iv = generateIV()
  const enc = new TextEncoder()
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext),
  )
  return { iv, ciphertext }
}

export async function decrypt(
  key: CryptoKey,
  iv: Uint8Array,
  ciphertext: ArrayBuffer,
): Promise<string> {
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext,
  )
  return new TextDecoder().decode(plaintext)
}
