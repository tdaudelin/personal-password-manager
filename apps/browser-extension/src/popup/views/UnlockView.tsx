import { useState } from 'react'
import { sendMessage } from '../messaging'

interface Props {
  onUnlocked: () => void
}

export default function UnlockView({ onUnlocked }: Props) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password || loading) return
    setLoading(true)
    setError(undefined)
    const res = await sendMessage({ type: 'UNLOCK', masterPassword: password })
    setLoading(false)
    if (res.type === 'ERROR') {
      setError(res.message)
      setPassword('')
    } else {
      onUnlocked()
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Unlock Vault</h2>
      <label>
        Master password
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
      </label>
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={!password || loading}>
        {loading ? 'Unlocking…' : 'Unlock'}
      </button>
    </form>
  )
}
