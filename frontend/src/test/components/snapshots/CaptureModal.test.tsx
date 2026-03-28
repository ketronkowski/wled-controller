import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CaptureModal } from '../../../components/snapshots/CaptureModal'

vi.mock('../../../api/snapshots', () => ({
  snapshotsApi: {
    capture: vi.fn().mockResolvedValue({ id: 'snap1', name: 'test' }),
    list: vi.fn().mockResolvedValue([]),
    delete: vi.fn(),
    get: vi.fn(),
    restore: vi.fn(),
  },
}))

function renderModal(onClose = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <CaptureModal
        scopeType="controller"
        scopeId="ctrl123"
        scopeName="Octa1"
        onClose={onClose}
      />
    </QueryClientProvider>
  )
}

describe('CaptureModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with name pre-filled from scopeName', () => {
    renderModal()
    const nameInput = screen.getByPlaceholderText('e.g. Living Room — Pre-Party')
    expect((nameInput as HTMLInputElement).value).toContain('Octa1')
  })

  it('Capture button is enabled when name is not empty', () => {
    renderModal()
    expect(screen.getByRole('button', { name: 'Capture' })).not.toBeDisabled()
  })

  it('Capture button is disabled when name is cleared', async () => {
    renderModal()
    const nameInput = screen.getByPlaceholderText('e.g. Living Room — Pre-Party')
    await userEvent.clear(nameInput)
    expect(screen.getByRole('button', { name: 'Capture' })).toBeDisabled()
  })

  it('Cancel button calls onClose', async () => {
    const onClose = vi.fn()
    renderModal(onClose)
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls snapshotsApi.capture with correct payload on submit', async () => {
    const { snapshotsApi } = await import('../../../api/snapshots')
    renderModal()

    const nameInput = screen.getByPlaceholderText('e.g. Living Room — Pre-Party')
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, 'My Snapshot')

    const tagsInput = screen.getByPlaceholderText('party, christmas, blue')
    await userEvent.type(tagsInput, 'smoke, test')

    await userEvent.click(screen.getByRole('button', { name: 'Capture' }))

    expect(snapshotsApi.capture).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'My Snapshot',
        scopeType: 'controller',
        scopeId: 'ctrl123',
        tags: ['smoke', 'test'],
      })
    )
  })

  it('clicking the overlay calls onClose', async () => {
    const onClose = vi.fn()
    renderModal(onClose)
    // The overlay is the parent element with the click handler
    const overlay = screen.getByText('Capture Snapshot').closest('div')!.parentElement!
    await userEvent.click(overlay)
    expect(onClose).toHaveBeenCalled()
  })
})
