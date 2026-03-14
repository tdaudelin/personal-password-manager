import type {
  VaultEntry,
  NewEntry,
  LoginEntry,
  SecureNoteEntry,
} from '@ppm/shared'

export function createEntry(
  entries: VaultEntry[],
  data: NewEntry,
): VaultEntry[] {
  const now = new Date().toISOString()
  const entry = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  } as VaultEntry
  return [...entries, entry]
}

export function updateEntry(
  entries: VaultEntry[],
  updated: VaultEntry,
): VaultEntry[] {
  const index = entries.findIndex((e) => e.id === updated.id)
  if (index === -1) {
    throw new Error(`Entry not found: ${updated.id}`)
  }
  const next = [...entries]
  next[index] = { ...updated, updatedAt: new Date().toISOString() }
  return next
}

export function deleteEntry(entries: VaultEntry[], id: string): VaultEntry[] {
  const index = entries.findIndex((e) => e.id === id)
  if (index === -1) {
    throw new Error(`Entry not found: ${id}`)
  }
  return entries.filter((e) => e.id !== id)
}

export function serializeVault(entries: VaultEntry[]): string {
  return JSON.stringify(entries)
}

export function deserializeVault(json: string): VaultEntry[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error('Vault data is not valid JSON')
  }
  if (!Array.isArray(parsed)) {
    throw new Error('Vault data must be an array')
  }
  return parsed.map((item, i) => validateEntry(item, i))
}

function validateEntry(item: unknown, index: number): VaultEntry {
  if (typeof item !== 'object' || item === null) {
    throw new Error(`Entry at index ${index} is not an object`)
  }
  const obj = item as Record<string, unknown>

  const requiredCommon = ['id', 'type', 'title', 'createdAt', 'updatedAt']
  for (const field of requiredCommon) {
    if (typeof obj[field] !== 'string') {
      throw new Error(
        `Entry at index ${index} missing or invalid field: ${field}`,
      )
    }
  }

  if (obj['type'] === 'login') {
    return validateLoginEntry(obj, index)
  } else if (obj['type'] === 'note') {
    return validateNoteEntry(obj, index)
  } else {
    throw new Error(`Entry at index ${index} has unknown type: ${obj['type']}`)
  }
}

function validateLoginEntry(
  obj: Record<string, unknown>,
  index: number,
): LoginEntry {
  const loginFields = ['url', 'username', 'password', 'notes']
  for (const field of loginFields) {
    if (typeof obj[field] !== 'string') {
      throw new Error(
        `Login entry at index ${index} missing or invalid field: ${field}`,
      )
    }
  }
  return obj as unknown as LoginEntry
}

function validateNoteEntry(
  obj: Record<string, unknown>,
  index: number,
): SecureNoteEntry {
  if (typeof obj['body'] !== 'string') {
    throw new Error(
      `Note entry at index ${index} missing or invalid field: body`,
    )
  }
  return obj as unknown as SecureNoteEntry
}
