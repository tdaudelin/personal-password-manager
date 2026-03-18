import { useState } from 'react'
import { sendMessage } from '../messaging'

interface Props {
  onSetupComplete: () => void
}

export default function SetupView({ onSetupComplete }: Props) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [hint, setHint] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)

  const mismatch = confirm.length > 0 && password !== confirm
  const canSubmit = password.length > 0 && password === confirm && !loading

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError(undefined)
    const res = await sendMessage({
      type: 'SETUP',
      masterPassword: password,
    })
    setLoading(false)
    if (res.type === 'ERROR') {
      setError(res.message)
    } else {
      onSetupComplete()
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create Master Password</h2>
      <p className="warning">
        If you forget your master password and have not set up a recovery key,
        your vault cannot be recovered. Recovery key setup is available in Phase
        4 settings.
      </p>
      <label>
        Master password
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
      </label>
      <label>
        Confirm password
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </label>
      {mismatch && <p className="error">Passwords do not match</p>}
      <label>
        Hint (optional)
        <input
          type="text"
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          placeholder="Something to remind you…"
        />
      </label>
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={!canSubmit}>
        {loading ? 'Creating…' : 'Create Vault'}
      </button>
    </form>
  )
}
