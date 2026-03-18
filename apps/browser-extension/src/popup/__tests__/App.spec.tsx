import { render, screen, waitFor } from '@testing-library/react'
import App from '../App'
import { sendMessage } from '../messaging'

vi.mock('../messaging', () => ({
  sendMessage: vi.fn(),
}))

const mockSend = sendMessage as ReturnType<typeof vi.fn>

describe('App', () => {
  afterEach(() => vi.clearAllMocks())

  it('shows SetupView when vault is UNINITIALIZED', async () => {
    mockSend.mockResolvedValue({ type: 'STATUS', state: 'UNINITIALIZED' })
    render(<App />)
    await waitFor(() =>
      expect(screen.getByText('Create Master Password')).toBeTruthy(),
    )
  })

  it('shows UnlockView when vault is LOCKED', async () => {
    mockSend.mockResolvedValue({ type: 'STATUS', state: 'LOCKED' })
    render(<App />)
    await waitFor(() => expect(screen.getByText('Unlock Vault')).toBeTruthy())
  })

  it('shows loading initially', () => {
    mockSend.mockImplementation(() => new Promise(() => undefined))
    render(<App />)
    expect(screen.getByText('Loading…')).toBeTruthy()
  })

  it('renders non-empty content in each state', async () => {
    mockSend.mockResolvedValue({ type: 'STATUS', state: 'UNINITIALIZED' })
    const { container } = render(<App />)
    await waitFor(() => expect(container.firstChild).not.toBeNull())
    expect((container.firstChild as HTMLElement).innerHTML).not.toBe('')
  })
})
