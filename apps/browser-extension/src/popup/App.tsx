import { useEffect, useState } from 'react'
import type { VaultEntry } from '@ppm/shared'
import { sendMessage } from './messaging'
import SetupView from './views/SetupView'
import UnlockView from './views/UnlockView'
import VaultView from './views/VaultView'

type AppState = 'loading' | 'UNINITIALIZED' | 'LOCKED' | 'UNLOCKED'

export default function App() {
  const [appState, setAppState] = useState<AppState>('loading')
  const [entries, setEntries] = useState<VaultEntry[]>([])

  useEffect(() => {
    sendMessage({ type: 'GET_STATUS' }).then((res) => {
      if (res.type === 'STATUS') {
        setAppState(res.state)
      }
    })
  }, [])

  async function handleUnlocked() {
    const res = await sendMessage({ type: 'GET_ENTRIES' })
    if (res.type === 'ENTRIES') setEntries(res.entries)
    setAppState('UNLOCKED')
  }

  if (appState === 'loading') {
    return <p>Loading…</p>
  }

  if (appState === 'UNINITIALIZED') {
    return <SetupView onSetupComplete={() => setAppState('LOCKED')} />
  }

  if (appState === 'LOCKED') {
    return <UnlockView onUnlocked={handleUnlocked} />
  }

  return (
    <VaultView
      entries={entries}
      onEntriesChange={setEntries}
      onLocked={() => {
        setEntries([])
        setAppState('LOCKED')
      }}
    />
  )
}
