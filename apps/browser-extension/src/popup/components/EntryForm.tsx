import { useState } from 'react'
import type { VaultEntry, NewEntry } from '@ppm/shared'

type EntryType = 'login' | 'note'

interface CreateProps {
  mode: 'create'
  entryType: EntryType
  onSave: (entry: NewEntry) => void
  onCancel: () => void
}

interface EditProps {
  mode: 'edit'
  entry: VaultEntry
  onSave: (entry: VaultEntry) => void
  onCancel: () => void
}

type Props = CreateProps | EditProps

export default function EntryForm(props: Props) {
  const initial =
    props.mode === 'edit'
      ? props.entry
      : props.entryType === 'login'
        ? {
            type: 'login' as const,
            title: '',
            url: '',
            username: '',
            password: '',
            notes: '',
          }
        : { type: 'note' as const, title: '', body: '' }

  const [title, setTitle] = useState(initial.title)
  const [url, setUrl] = useState(initial.type === 'login' ? initial.url : '')
  const [username, setUsername] = useState(
    initial.type === 'login' ? initial.username : '',
  )
  const [password, setPassword] = useState(
    initial.type === 'login' ? initial.password : '',
  )
  const [notes, setNotes] = useState(
    initial.type === 'login' ? initial.notes : '',
  )
  const [body, setBody] = useState(initial.type === 'note' ? initial.body : '')
  const [showPassword, setShowPassword] = useState(false)

  const entryType = initial.type

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title) return

    if (entryType === 'login') {
      const data = {
        type: 'login' as const,
        title,
        url,
        username,
        password,
        notes,
      }
      if (props.mode === 'edit') {
        props.onSave({ ...props.entry, ...data })
      } else {
        props.onSave(data)
      }
    } else {
      const data = { type: 'note' as const, title, body }
      if (props.mode === 'edit') {
        props.onSave({ ...props.entry, ...data })
      } else {
        props.onSave(data)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3>
        {props.mode === 'create' ? 'New' : 'Edit'}{' '}
        {entryType === 'login' ? 'Login' : 'Secure Note'}
      </h3>
      <label>
        Title
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          required
        />
      </label>

      {entryType === 'login' && (
        <>
          <label>
            URL
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </label>
          <label>
            Username
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>
          <label>
            Password
            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>
          <label>
            Notes
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
        </>
      )}

      {entryType === 'note' && (
        <label>
          Body
          <textarea value={body} onChange={(e) => setBody(e.target.value)} />
        </label>
      )}

      <div className="form-actions">
        <button type="button" onClick={props.onCancel}>
          Cancel
        </button>
        <button type="submit" disabled={!title}>
          Save
        </button>
      </div>
    </form>
  )
}
