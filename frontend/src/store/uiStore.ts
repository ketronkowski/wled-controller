import { create } from 'zustand'

type Selection =
  | { kind: 'controller'; id: string }
  | { kind: 'group'; id: string }
  | null

interface UiStore {
  selection: Selection
  select: (sel: Selection) => void
  discoveryOpen: boolean
  setDiscoveryOpen: (open: boolean) => void
  snapshotsOpen: boolean
  setSnapshotsOpen: (open: boolean) => void
}

export const useUiStore = create<UiStore>(set => ({
  selection: null,
  select: selection => set({ selection }),
  discoveryOpen: false,
  setDiscoveryOpen: discoveryOpen => set({ discoveryOpen }),
  snapshotsOpen: false,
  setSnapshotsOpen: snapshotsOpen => set({ snapshotsOpen }),
}))
