import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GroupDetail } from '../../../components/groups/GroupDetail'
import type { Group, Controller, LiveState } from '../../../types/wled'

vi.mock('../../../components/groups/GroupEditor', () => ({
  GroupEditor: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="group-editor">
      <button onClick={onClose}>Close Editor</button>
    </div>
  ),
}))

vi.mock('../../../components/controls/ControlPanel', () => ({
  ControlPanel: ({ fxData }: { fxData: string[] }) => (
    <div data-testid="control-panel" data-fxdata-len={fxData.length} />
  ),
}))

vi.mock('../../../components/snapshots/SnapshotList', () => ({
  SnapshotList: () => <div data-testid="snapshot-list" />,
}))

const FIXTURE_GROUP: Group = {
  id: 'grp1',
  name: 'Living Room',
  description: '',
  subnet: '192.168.5.0/24',
  members: [
    { type: 'CONTROLLER', id: 'ctrl1' },
    { type: 'CONTROLLER', id: 'ctrl2' },
  ],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

const FIXTURE_CONTROLLERS: Controller[] = [
  {
    id: 'ctrl1', ip: '192.168.5.10', name: 'Strip A', mac: 'aa:bb:cc:dd:ee:01',
    subnet: '192.168.5.0/24', firmware: '0.14.0', ledCount: 144, online: true,
    discoveredAt: '2026-01-01T00:00:00Z', lastSeenAt: '2026-01-01T00:00:00Z', addedManually: false,
    cachedState: null, cachedInfo: null,
  },
  {
    id: 'ctrl2', ip: '192.168.5.11', name: 'Strip B', mac: 'aa:bb:cc:dd:ee:02',
    subnet: '192.168.5.0/24', firmware: '0.14.0', ledCount: 60, online: false,
    discoveredAt: '2026-01-01T00:00:00Z', lastSeenAt: '2026-01-01T00:00:00Z', addedManually: false,
    cachedState: null, cachedInfo: null,
  },
]

const FIXTURE_LIVE_STATE: LiveState = {
  state: {
    on: true, bri: 200, transition: 7, ps: -1, pl: -1, mainseg: 0,
    seg: [{
      id: 0, start: 0, stop: 144, len: 144, grp: 1, spc: 0, of: 0,
      on: true, frz: false, bri: 255, cct: 127,
      col: [[255, 100, 0], [0, 0, 0], [0, 0, 0]],
      fx: 9, sx: 128, ix: 128, pal: 2,
      c1: 128, c2: 128, c3: 16,
      sel: true, rev: false, mi: false,
      o1: false, o2: false, o3: false, si: 0, m12: 0,
    }],
  },
  info: { ver: '0.14.0', name: 'Strip A', mac: 'aa:bb:cc:dd:ee:01', ip: '192.168.5.10',
    leds: { count: 144, maxseg: 10, seglc: [], lc: 144 },
    fxcount: 117, palcount: 56, wifi: { signal: -60 }, arch: 'esp32' },
  effects: ['Solid', 'Blink', 'Breathe'],
  palettes: ['Default', 'Rainbow'],
}

const FIXTURE_FXDATA = ['Solid', 'Blink;Rate,Duty', 'Breathe;Speed,Depth']

const mockGroupsApi = vi.hoisted(() => ({
  get: vi.fn(),
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  addMember: vi.fn(),
  removeMember: vi.fn(),
}))

const mockControllersApi = vi.hoisted(() => ({
  list: vi.fn(),
  liveState: vi.fn(),
  fxData: vi.fn(),
  get: vi.fn(),
  add: vi.fn(),
  delete: vi.fn(),
  refresh: vi.fn(),
}))

const mockControlApi = vi.hoisted(() => ({
  sendToGroup: vi.fn(),
  sendToController: vi.fn(),
}))

vi.mock('../../../api/groups', () => ({ groupsApi: mockGroupsApi }))
vi.mock('../../../api/controllers', () => ({ controllersApi: mockControllersApi }))
vi.mock('../../../api/control', () => ({ controlApi: mockControlApi }))

function renderDetail(groupId = 'grp1') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <GroupDetail groupId={groupId} />
    </QueryClientProvider>
  )
}

describe('GroupDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGroupsApi.get.mockResolvedValue(FIXTURE_GROUP)
    mockGroupsApi.removeMember.mockResolvedValue({ ...FIXTURE_GROUP, members: [] })
    mockControllersApi.list.mockResolvedValue(FIXTURE_CONTROLLERS)
    mockControllersApi.liveState.mockResolvedValue(FIXTURE_LIVE_STATE)
    mockControllersApi.fxData.mockResolvedValue(FIXTURE_FXDATA)
  })

  it('renders group name from query data', async () => {
    renderDetail()
    await waitFor(() => expect(screen.getByText('Living Room')).toBeInTheDocument())
  })

  it('renders member controller count', async () => {
    renderDetail()
    await waitFor(() => expect(screen.getByText(/2 controllers/)).toBeInTheDocument())
  })

  it('renders Edit Group button', async () => {
    renderDetail()
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Edit Group' })).toBeInTheDocument()
    )
  })

  it('clicking Edit Group renders GroupEditor', async () => {
    renderDetail()
    await waitFor(() => screen.getByRole('button', { name: 'Edit Group' }))
    await userEvent.click(screen.getByRole('button', { name: 'Edit Group' }))
    expect(screen.getByTestId('group-editor')).toBeInTheDocument()
  })

  it('closing GroupEditor removes it from the DOM', async () => {
    renderDetail()
    await waitFor(() => screen.getByRole('button', { name: 'Edit Group' }))
    await userEvent.click(screen.getByRole('button', { name: 'Edit Group' }))
    expect(screen.getByTestId('group-editor')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Close Editor' }))
    expect(screen.queryByTestId('group-editor')).not.toBeInTheDocument()
  })

  it('does not render warning banner when no failures', async () => {
    renderDetail()
    await waitFor(() => screen.getByText('Living Room'))
    expect(screen.queryByText(/offline/)).not.toBeInTheDocument()
  })

  it('passes fxData from query to ControlPanel', async () => {
    renderDetail()
    await waitFor(() => {
      const panel = screen.getByTestId('control-panel')
      expect(panel.getAttribute('data-fxdata-len')).toBe(String(FIXTURE_FXDATA.length))
    })
  })

  it('passes empty fxData to ControlPanel when no member is online', async () => {
    const offlineControllers = FIXTURE_CONTROLLERS.map(c => ({ ...c, online: false }))
    mockControllersApi.list.mockResolvedValue(offlineControllers)
    renderDetail()
    await waitFor(() => {
      const panel = screen.getByTestId('control-panel')
      expect(panel.getAttribute('data-fxdata-len')).toBe('0')
    })
  })

  it('renders a remove button for each member controller', async () => {
    renderDetail()
    await waitFor(() => {
      const removeBtns = screen.getAllByRole('button', { name: '✕' })
      expect(removeBtns).toHaveLength(FIXTURE_CONTROLLERS.length)
    })
  })

  it('clicking remove button calls removeMember with correct controller id', async () => {
    renderDetail()
    await waitFor(() => screen.getAllByRole('button', { name: '✕' }))
    const [firstRemove] = screen.getAllByRole('button', { name: '✕' })
    await userEvent.click(firstRemove)
    await waitFor(() =>
      expect(mockGroupsApi.removeMember).toHaveBeenCalledWith('grp1', 'ctrl1')
    )
  })
})
