import { beforeEach, describe, expect, it } from 'vitest'
import { useUiStore } from '../../store/uiStore'

// Reset store state before each test
beforeEach(() => {
  useUiStore.setState({
    selection: null,
    discoveryOpen: false,
    snapshotsOpen: false,
  })
})

describe('uiStore', () => {
  it('starts with no selection and panels closed', () => {
    const state = useUiStore.getState()
    expect(state.selection).toBeNull()
    expect(state.discoveryOpen).toBe(false)
    expect(state.snapshotsOpen).toBe(false)
  })

  it('selects a controller', () => {
    useUiStore.getState().select({ kind: 'controller', id: 'abc123' })
    expect(useUiStore.getState().selection).toEqual({ kind: 'controller', id: 'abc123' })
  })

  it('selects a group', () => {
    useUiStore.getState().select({ kind: 'group', id: 'grp456' })
    expect(useUiStore.getState().selection).toEqual({ kind: 'group', id: 'grp456' })
  })

  it('clears selection by passing null', () => {
    useUiStore.getState().select({ kind: 'controller', id: 'abc123' })
    useUiStore.getState().select(null)
    expect(useUiStore.getState().selection).toBeNull()
  })

  it('opens and closes discoveryOpen', () => {
    useUiStore.getState().setDiscoveryOpen(true)
    expect(useUiStore.getState().discoveryOpen).toBe(true)
    useUiStore.getState().setDiscoveryOpen(false)
    expect(useUiStore.getState().discoveryOpen).toBe(false)
  })

  it('opens and closes snapshotsOpen', () => {
    useUiStore.getState().setSnapshotsOpen(true)
    expect(useUiStore.getState().snapshotsOpen).toBe(true)
    useUiStore.getState().setSnapshotsOpen(false)
    expect(useUiStore.getState().snapshotsOpen).toBe(false)
  })
})
