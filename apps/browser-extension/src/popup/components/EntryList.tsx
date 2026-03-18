import type { VaultEntry, LoginEntry, SecureNoteEntry } from '@ppm/shared'

interface Props {
  entries: VaultEntry[]
  onEdit: (entry: VaultEntry) => void
  onDelete: (id: string) => void
}

export default function EntryList({ entries, onEdit, onDelete }: Props) {
  const logins = entries.filter((e): e is LoginEntry => e.type === 'login')
  const notes = entries.filter((e): e is SecureNoteEntry => e.type === 'note')

  if (entries.length === 0) {
    return <p className="empty">No entries yet. Add one to get started.</p>
  }

  return (
    <div className="entry-list">
      {logins.length > 0 && (
        <section>
          <h3>Logins</h3>
          {logins.map((entry) => (
            <div key={entry.id} className="entry-row">
              <div className="entry-info">
                <span className="entry-title">{entry.title}</span>
                {entry.url && (
                  <span className="entry-subtitle">{entry.url}</span>
                )}
              </div>
              <div className="entry-actions">
                <button type="button" onClick={() => onEdit(entry)}>
                  Edit
                </button>
                <button type="button" onClick={() => onDelete(entry.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </section>
      )}
      {notes.length > 0 && (
        <section>
          <h3>Secure Notes</h3>
          {notes.map((entry) => (
            <div key={entry.id} className="entry-row">
              <div className="entry-info">
                <span className="entry-title">{entry.title}</span>
              </div>
              <div className="entry-actions">
                <button type="button" onClick={() => onEdit(entry)}>
                  Edit
                </button>
                <button type="button" onClick={() => onDelete(entry.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
