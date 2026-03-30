import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GroupEditor } from '../../../components/groups/GroupEditor'
import type { Group, Controller } from '../../../types/wled'

const FIXTURE_GROUP: Group = {
  id: 'grp1',
  name: 'Living Room',
  description: 'main strip',
  subnet: '192.168.5.0/24',
  members: [{ type: 'CONTROLLER', id: 'ctrl1' }],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

const EMPTY_GROUP: Group = {
  id: 'grp-new',
  name: 'New Group',
  description: '',
  subnet: '',
  members: [],
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
    subnet: '192.168.5.0/24', firmware: '0.14.0', ledCount: 60, online: true,
    discoveredAt: '2026-01-01T00:00:00Z', lastSeenAt: '2026-01-01T00:00:00Z', addedManually: false,
    cachedState: null, cachedInfo: null,
  },
]

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

vi.mock('../../../api/groups', () => ({ groupsApi: mockGroupsApi }))
vi.mock('../../../api/controllers', () => ({ controllersApi: mockControllersApi }))

function renderEditor(props: Partial<Parameters<typeof GroupEditor>[0]> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const onClose = vi.fn()
  const onCreated = vi.fn()
  render(
    <QueryClientProvider client={client}>
      <GroupEditor onClose={onClose} onCreated={onCreated} {...props} />
    </QueryClientProvider>
  )
  return { onClose, onCreated }
}

describe('GroupEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGroupsApi.list.mockResolvedValue([FIXTURE_GROUP])
    mockGroupsApi.create.mockResolvedValue(EMPTY_GROUP)
    mockGroupsApi.update.mockResolvedValue(FIXTURE_GROUP)
    mockGroupsApi.addMember.mockResolvedValue({ ...FIXTURE_GROUP, members: [...FIXTURE_GROUP.members, { type: 'CONTROLLER', id: 'ctrl2' }] })
    mockGroupsApi.removeMember.mockResolvedValue({ ...FIXTURE_GROUP, members: [] })
    mockControllersApi.list.mockResolvedValue(FIXTURE_CONTROLLERS)
  })

  it('renders "Create Group" title when no group prop is provided', () => {
    renderEditor()
    expect(screen.getByText('Create Group')).toBeInTheDocument()
  })

  it('renders "Edit Group" title when group prop is provided', () => {
    renderEditor({ group: FIXTURE_GROUP })
    expect(screen.getByText('Edit Group')).toBeInTheDocument()
  })

  it('Save button reads "Save & Continue" when creating a new group', () => {
    renderEditor()
    expect(screen.getByRole('button', { name: 'Save & Continue' })).toBeInTheDocument()
  })

  it('Save button reads "Save" when editing an existing group', () => {
    renderEditor({ group: FIXTURE_GROUP })
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
  })

  it('Add Controllers section is NOT visible before saving a new group', () => {
    renderEditor()
    expect(screen.queryByText('Add Controllers')).not.toBeInTheDocument()
  })

  it('Add Controllers section is visible immediately when editing an existing group', async () => {
    renderEditor({ group: FIXTURE_GROUP })
    await waitFor(() =>
      expect(screen.getByText('Add Controllers')).toBeInTheDocument()
    )
  })

  it('after successful create, Add Controllers section becomes visible', async () => {
    renderEditor()
    const nameInput = screen.getByPlaceholderText('Group name')
    await userEvent.type(nameInput, 'New Group')
    await userEvent.click(screen.getByRole('button', { name: 'Save & Continue' }))
    await waitFor(() =>
      expect(screen.getByText('Add Controllers')).toBeInTheDocument()
    )
  })

  it('after successful create, modal does NOT close', async () => {
    const { onClose } = renderEditor()
    const nameInput = screen.getByPlaceholderText('Group name')
    await userEvent.type(nameInput, 'New Group')
    await userEvent.click(screen.getByRole('button', { name: 'Save & Continue' }))
    await waitFor(() => screen.getByText('Add Controllers'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('after successful create, onCreated is called with the new group', async () => {
    const { onCreated } = renderEditor()
    const nameInput = screen.getByPlaceholderText('Group name')
    await userEvent.type(nameInput, 'New Group')
    await userEvent.click(screen.getByRole('button', { name: 'Save & Continue' }))
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(EMPTY_GROUP))
  })

  it('after successful edit, onClose IS called', async () => {
    const { onClose } = renderEditor({ group: FIXTURE_GROUP })
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('clicking Cancel calls onClose', async () => {
    const { onClose } = renderEditor()
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('clicking the backdrop calls onClose', () => {
    const { onClose } = renderEditor()
    // Traverse up: Cancel button → footer div → modal div → overlay div
    // Use fireEvent so e.target === e.currentTarget is satisfied on the overlay div
    const cancelBtn = screen.getByRole('button', { name: 'Cancel' })
    const overlay = cancelBtn.parentElement!.parentElement!.parentElement!
    fireEvent.click(overlay)
    expect(onClose).toHaveBeenCalled()
  })

  it('Add button calls addMember mutation with correct id and type', async () => {
    renderEditor({ group: FIXTURE_GROUP })
    // ctrl2 is not in the group, should appear as candidate
    await waitFor(() => screen.getByText('Strip B'))
    await userEvent.click(screen.getByRole('button', { name: '+ Add' }))
    await waitFor(() =>
      expect(mockGroupsApi.addMember).toHaveBeenCalledWith(
        FIXTURE_GROUP.id,
        'ctrl2',
        'CONTROLLER',
      )
    )
  })

  it('Remove button calls removeMember mutation with correct id', async () => {
    renderEditor({ group: FIXTURE_GROUP })
    await waitFor(() => screen.getByRole('button', { name: 'Remove' }))
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }))
    await waitFor(() =>
      expect(mockGroupsApi.removeMember).toHaveBeenCalledWith(FIXTURE_GROUP.id, 'ctrl1')
    )
  })
})
