import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
// Note: 'Discover Devices' appears in both the modal h2 and the empty-state button,
// so we query by role/testid where specificity is needed.
import { AppShell } from '../../../components/layout/AppShell'

vi.mock('../../../components/layout/Sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar" />,
}))
vi.mock('../../../components/controllers/ControllerDetail', () => ({
  ControllerDetail: ({ controllerId }: { controllerId: string }) => (
    <div data-testid="controller-detail">{controllerId}</div>
  ),
}))
vi.mock('../../../components/groups/GroupDetail', () => ({
  GroupDetail: ({ groupId }: { groupId: string }) => (
    <div data-testid="group-detail">{groupId}</div>
  ),
}))
vi.mock('../../../components/discovery/DiscoveryPanel', () => ({
  DiscoveryPanel: () => <div data-testid="discovery-panel" />,
}))
vi.mock('../../../components/subnets/SubnetSettingsPanel', () => ({
  SubnetSettingsPanel: () => <div data-testid="subnet-settings-panel" />,
}))

const mockStore = vi.hoisted(() => ({
  selection: null as { kind: string; id: string } | null,
  discoveryOpen: false,
  setDiscoveryOpen: vi.fn(),
  settingsOpen: false,
  setSettingsOpen: vi.fn(),
}))

vi.mock('../../../store/uiStore', () => ({
  useUiStore: () => mockStore,
}))

describe('AppShell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStore.selection = null
    mockStore.discoveryOpen = false
    mockStore.settingsOpen = false
  })

  it('shows empty state when nothing is selected', () => {
    render(<AppShell />)
    expect(screen.getByText(/Select a controller or group/)).toBeInTheDocument()
  })

  it('shows ControllerDetail when controller is selected', () => {
    mockStore.selection = { kind: 'controller', id: 'ctrl1' }
    render(<AppShell />)
    expect(screen.getByTestId('controller-detail')).toBeInTheDocument()
    expect(screen.queryByText(/Select a controller/)).not.toBeInTheDocument()
  })

  it('shows GroupDetail when group is selected', () => {
    mockStore.selection = { kind: 'group', id: 'grp1' }
    render(<AppShell />)
    expect(screen.getByTestId('group-detail')).toBeInTheDocument()
    expect(screen.queryByText(/Select a controller/)).not.toBeInTheDocument()
  })

  it('does not show SubnetSettingsPanel when settingsOpen is false', () => {
    render(<AppShell />)
    expect(screen.queryByTestId('subnet-settings-panel')).not.toBeInTheDocument()
  })

  it('renders SubnetSettingsPanel in modal when settingsOpen is true', () => {
    mockStore.settingsOpen = true
    render(<AppShell />)
    expect(screen.getByTestId('subnet-settings-panel')).toBeInTheDocument()
    expect(screen.getByText('Subnet Settings')).toBeInTheDocument()
  })

  it('does not show DiscoveryPanel when discoveryOpen is false', () => {
    render(<AppShell />)
    expect(screen.queryByTestId('discovery-panel')).not.toBeInTheDocument()
  })

  it('renders DiscoveryPanel in modal when discoveryOpen is true', () => {
    mockStore.discoveryOpen = true
    render(<AppShell />)
    expect(screen.getByTestId('discovery-panel')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Discover Devices' })).toBeInTheDocument()
  })

  it('clicking settings modal close button calls setSettingsOpen(false)', async () => {
    mockStore.settingsOpen = true
    render(<AppShell />)
    // The ✕ button inside the modal (distinct from header buttons)
    const closeBtn = screen.getByRole('button', { name: '✕' })
    await userEvent.click(closeBtn)
    expect(mockStore.setSettingsOpen).toHaveBeenCalledWith(false)
  })

  it('clicking settings modal backdrop calls setSettingsOpen(false)', () => {
    mockStore.settingsOpen = true
    render(<AppShell />)
    // Traverse: ✕ button → modalHeader → modalContent → modalOverlay
    const closeBtn = screen.getByRole('button', { name: '✕' })
    const overlay = closeBtn.parentElement!.parentElement!.parentElement!
    fireEvent.click(overlay)
    expect(mockStore.setSettingsOpen).toHaveBeenCalledWith(false)
  })

  it('clicking discovery modal backdrop calls setDiscoveryOpen(false)', () => {
    mockStore.discoveryOpen = true
    render(<AppShell />)
    // Find the discovery modal's close button and traverse to overlay
    const closeBtn = screen.getByRole('button', { name: '✕' })
    const overlay = closeBtn.parentElement!.parentElement!.parentElement!
    fireEvent.click(overlay)
    expect(mockStore.setDiscoveryOpen).toHaveBeenCalledWith(false)
  })

  it('main area shows controller detail while settings modal is open simultaneously', () => {
    mockStore.selection = { kind: 'controller', id: 'ctrl1' }
    mockStore.settingsOpen = true
    render(<AppShell />)
    expect(screen.getByTestId('controller-detail')).toBeInTheDocument()
    expect(screen.getByTestId('subnet-settings-panel')).toBeInTheDocument()
  })
})
