import { describe, it, expect } from 'vitest'
import {
  createEntry,
  updateEntry,
  deleteEntry,
  serializeVault,
  deserializeVault,
} from '../vault.js'
import type { VaultEntry, NewEntry } from '@mm/shared'

const loginData: NewEntry = {
  type: 'login',
  title: 'Example',
  url: 'https://example.com',
  username: 'user',
  password: 'pass',
  notes: '',
}

const noteData: NewEntry = {
  type: 'note',
  title: 'My Note',
  body: 'Secret content',
}

describe('createEntry', () => {
  it('adds a new login entry with id and timestamps', () => {
    const entries = createEntry([], loginData)
    expect(entries).toHaveLength(1)
    expect(entries[0].id).toBeTruthy()
    expect(entries[0].type).toBe('login')
    expect(entries[0].createdAt).toBeTruthy()
    expect(entries[0].updatedAt).toBeTruthy()
  })

  it('adds a new note entry', () => {
    const entries = createEntry([], noteData)
    expect(entries).toHaveLength(1)
    expect(entries[0].type).toBe('note')
  })

  it('does not mutate the original array', () => {
    const original: VaultEntry[] = []
    createEntry(original, loginData)
    expect(original).toHaveLength(0)
  })
})

describe('updateEntry', () => {
  it('updates an existing entry and sets updatedAt', () => {
    const entries = createEntry([], loginData)
    const entry = entries[0]
    const staleUpdatedAt = '2000-01-01T00:00:00.000Z'
    const updated = {
      ...entry,
      title: 'Updated',
      updatedAt: staleUpdatedAt,
    } as VaultEntry
    const result = updateEntry(entries, updated)
    expect(result[0].title).toBe('Updated')
    expect(result[0].updatedAt).not.toBe(staleUpdatedAt)
  })

  it('throws if entry id not found', () => {
    expect(() =>
      updateEntry([], {
        ...loginData,
        id: 'missing',
        createdAt: '',
        updatedAt: '',
      } as VaultEntry),
    ).toThrow('Entry not found: missing')
  })

  it('does not mutate the original array', () => {
    const entries = createEntry([], loginData)
    const entry = entries[0]
    const original = [...entries]
    updateEntry(entries, { ...entry, title: 'X' } as VaultEntry)
    expect(entries[0].title).toBe(original[0].title)
  })
})

describe('deleteEntry', () => {
  it('removes the entry with the given id', () => {
    const entries = createEntry([], loginData)
    const id = entries[0].id
    const result = deleteEntry(entries, id)
    expect(result).toHaveLength(0)
  })

  it('throws if id not found', () => {
    expect(() => deleteEntry([], 'nonexistent')).toThrow(
      'Entry not found: nonexistent',
    )
  })

  it('does not mutate the original array', () => {
    const entries = createEntry([], loginData)
    const id = entries[0].id
    deleteEntry(entries, id)
    expect(entries).toHaveLength(1)
  })
})

describe('serializeVault / deserializeVault', () => {
  it('roundtrip preserves all entries', () => {
    let entries: VaultEntry[] = []
    entries = createEntry(entries, loginData)
    entries = createEntry(entries, noteData)
    const json = serializeVault(entries)
    const result = deserializeVault(json)
    expect(result).toHaveLength(2)
    expect(result[0].type).toBe('login')
    expect(result[1].type).toBe('note')
  })

  it('throws on invalid JSON', () => {
    expect(() => deserializeVault('not json')).toThrow()
  })

  it('throws if root is not an array', () => {
    expect(() => deserializeVault('{}')).toThrow('Vault data must be an array')
  })

  it('throws if an entry is missing a required field', () => {
    const bad = JSON.stringify([{ id: '1', type: 'login', title: 'X' }])
    expect(() => deserializeVault(bad)).toThrow()
  })

  it('throws on unknown entry type', () => {
    const bad = JSON.stringify([
      { id: '1', type: 'unknown', title: 'X', createdAt: '', updatedAt: '' },
    ])
    expect(() => deserializeVault(bad)).toThrow('unknown type')
  })
})
