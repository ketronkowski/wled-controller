import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SnapshotList } from '../../../components/snapshots/SnapshotList'
import type { Snapshot } from '../../../types/wled'

// vi.hoisted ensures the object is available before vi.mock hoisting runs
const mockSnapshotsApi = vi.hoisted(() => ({
  list: vi.fn(),
  capture: vi.fn(),
  delete: vi.fn().mockResolvedValue(undefined),
  get: vi.fn(),
  restore: vi.fn(),
}))

vi.mock('../../../api/snapshots', () => ({
  snapshotsApi: mockSnapshotsApi,
}))

const FIXTURE_SNAPSHOTS: Snapshot[] = [
  {
    id: 'snap1',
    name: 'Living Room — Party',
    description: 'Pre-party setup',
    scope: { type: 'controller', id: 'ctrl123' },
    controllers: [
      { controllerId: 'ctrl123', controllerIp: '192.168.5.54', controllerName: 'Octa1',
        state: {} as never, info: {} as never, effects: [], palettes: [] },
    ],
    capturedAt: '2026-01-15T20:00:00Z',
    tags: ['party'],
  },
  {
    id: 'snap2',
    name: 'Other Controller Snapshot',
    scope: { type: 'controller', id: 'other-ctrl' },
    controllers: [],
    capturedAt: '2026-01-16T10:00:00Z',
    tags: [],
  },
]

function renderList(scopeId = 'ctrl123') {
  mockSnapshotsApi.list.mockResolvedValue(FIXTURE_SNAPSHOTS)
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <SnapshotList scopeType="controller" scopeId={scopeId} scopeName="Octa1" />
    </QueryClientProvider>
  )
}

describe('SnapshotList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows empty state message when no snapshots exist', async () => {
    mockSnapshotsApi.list.mockResolvedValue([])
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={client}>
        <SnapshotList scopeType="controller" scopeId="ctrl123" scopeName="Octa1" />
      </QueryClientProvider>
    )
    await waitFor(() => {
      expect(screen.getByText(/No snapshots yet/)).toBeInTheDocument()
    })
  })

  it('renders snapshot card for matching scope', async () => {
    renderList()
    await waitFor(() => {
      expect(screen.getByText('Living Room — Party')).toBeInTheDocument()
    })
  })

  it('does not render snapshot from a different scope', async () => {
    renderList('ctrl123')
    await waitFor(() => {
      expect(screen.queryByText('Other Controller Snapshot')).not.toBeInTheDocument()
    })
  })

  it('shows snapshot description when present', async () => {
    renderList()
    await waitFor(() => {
      expect(screen.getByText('Pre-party setup')).toBeInTheDocument()
    })
  })

  it('shows tags', async () => {
    renderList()
    await waitFor(() => {
      expect(screen.getByText('party')).toBeInTheDocument()
    })
  })

  it('shows correct snapshot count in header', async () => {
    renderList()
    await waitFor(() => {
      expect(screen.getByText('Snapshots (1)')).toBeInTheDocument()
    })
  })

  it('Capture button opens CaptureModal', async () => {
    renderList()
    await waitFor(() => screen.getByRole('button', { name: 'Capture' }))
    await userEvent.click(screen.getByRole('button', { name: 'Capture' }))
    expect(screen.getByText('Capture Snapshot')).toBeInTheDocument()
  })

  it('Restore button opens RestoreModal', async () => {
    renderList()
    await waitFor(() => screen.getByRole('button', { name: 'Restore' }))
    await userEvent.click(screen.getByRole('button', { name: 'Restore' }))
    expect(screen.getByText(/Restore "Living Room — Party"/)).toBeInTheDocument()
  })
})
