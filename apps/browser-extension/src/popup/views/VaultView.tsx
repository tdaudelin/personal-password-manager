import { useState } from 'react'
import type { VaultEntry, NewEntry } from '@ppm/shared'
import EntryList from '../components/EntryList'
import EntryForm from '../components/EntryForm'
import { sendMessage } from '../messaging'

type EntryType = 'login' | 'note'

type Panel =
  | { kind: 'list' }
  | { kind: 'type-picker' }
  | { kind: 'create'; entryType: EntryType }
  | { kind: 'edit'; entry: VaultEntry }

interface Props {
  entries: VaultEntry[]
  onEntriesChange: (entries: VaultEntry[]) => void
  onLocked: () => void
}

export default function VaultView({
  entries,
  onEntriesChange,
  onLocked,
}: Props) {
  const [panel, setPanel] = useState<Panel>({ kind: 'list' })
  const [error, setError] = useState<string | undefined>()

  async function handleAdd(entry: NewEntry) {
    setError(undefined)
    const res = await sendMessage({ type: 'ADD_ENTRY', entry })
    if (res.type === 'ERROR') {
      setError(res.message)
      return
    }
    const listRes = await sendMessage({ type: 'GET_ENTRIES' })
    if (listRes.type === 'ENTRIES') onEntriesChange(listRes.entries)
    setPanel({ kind: 'list' })
  }

  async function handleUpdate(entry: VaultEntry) {
    setError(undefined)
    const res = await sendMessage({ type: 'UPDATE_ENTRY', entry })
    if (res.type === 'ERROR') {
      setError(res.message)
      return
    }
    const listRes = await sendMessage({ type: 'GET_ENTRIES' })
    if (listRes.type === 'ENTRIES') onEntriesChange(listRes.entries)
    setPanel({ kind: 'list' })
  }

  async function handleDelete(id: string) {
    setError(undefined)
    const res = await sendMessage({ type: 'DELETE_ENTRY', id })
    if (res.type === 'ERROR') {
      setError(res.message)
      return
    }
    const listRes = await sendMessage({ type: 'GET_ENTRIES' })
    if (listRes.type === 'ENTRIES') onEntriesChange(listRes.entries)
  }

  async function handleLock() {
    await sendMessage({ type: 'LOCK' })
    onLocked()
  }

  if (panel.kind === 'type-picker') {
    return (
      <div>
        <h2>Add Entry</h2>
        <p>Choose entry type:</p>
        <button
          type="button"
          onClick={() => setPanel({ kind: 'create', entryType: 'login' })}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => setPanel({ kind: 'create', entryType: 'note' })}
        >
          Secure Note
        </button>
        <button type="button" onClick={() => setPanel({ kind: 'list' })}>
          Cancel
        </button>
      </div>
    )
  }

  if (panel.kind === 'create') {
    return (
      <EntryForm
        mode="create"
        entryType={panel.entryType}
        onSave={handleAdd}
        onCancel={() => setPanel({ kind: 'list' })}
      />
    )
  }

  if (panel.kind === 'edit') {
    return (
      <EntryForm
        mode="edit"
        entry={panel.entry}
        onSave={handleUpdate}
        onCancel={() => setPanel({ kind: 'list' })}
      />
    )
  }

  return (
    <div>
      <div className="vault-header">
        <h2>Vault</h2>
        <div>
          <button
            type="button"
            onClick={() => setPanel({ kind: 'type-picker' })}
          >
            Add Entry
          </button>
          <button type="button" onClick={handleLock}>
            Lock
          </button>
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      <EntryList
        entries={entries}
        onEdit={(entry) => setPanel({ kind: 'edit', entry })}
        onDelete={handleDelete}
      />
    </div>
  )
}
