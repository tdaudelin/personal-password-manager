export interface LoginEntry {
  id: string
  type: 'login'
  title: string
  url: string
  username: string
  password: string
  notes: string
  createdAt: string
  updatedAt: string
}

export interface SecureNoteEntry {
  id: string
  type: 'note'
  title: string
  body: string
  createdAt: string
  updatedAt: string
}

export type VaultEntry = LoginEntry | SecureNoteEntry

export type NewEntry = Omit<VaultEntry, 'id' | 'createdAt' | 'updatedAt'>

export interface EncryptedVault {
  version: number
  kdf: 'argon2id' | 'pbkdf2'
  salt: string
  iv: string
  ciphertext: string
  hint?: string
}

// Outgoing from popup (requests)
export type VaultRequest =
  | { type: 'SETUP'; masterPassword: string }
  | { type: 'UNLOCK'; masterPassword: string }
  | { type: 'LOCK' }
  | { type: 'GET_STATUS' }
  | { type: 'GET_ENTRIES' }
  | { type: 'ADD_ENTRY'; entry: NewEntry }
  | { type: 'UPDATE_ENTRY'; entry: VaultEntry }
  | { type: 'DELETE_ENTRY'; id: string }

// Responses from background
export type VaultResponse =
  | { type: 'OK' }
  | { type: 'STATUS'; state: 'UNINITIALIZED' | 'LOCKED' | 'UNLOCKED' }
  | { type: 'ENTRIES'; entries: VaultEntry[] }
  | { type: 'ERROR'; message: string }
  | { type: 'LOCKED' }
