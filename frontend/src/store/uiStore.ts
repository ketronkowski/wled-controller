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
  settingsOpen: boolean
  setSettingsOpen: (open: boolean) => void
  selectedSubnet: string | null
  setSelectedSubnet: (cidr: string | null) => void
}

export const useUiStore = create<UiStore>(set => ({
  selection: null,
  select: selection => set({ selection }),
  discoveryOpen: false,
  setDiscoveryOpen: discoveryOpen => set({ discoveryOpen, settingsOpen: false }),
  snapshotsOpen: false,
  setSnapshotsOpen: snapshotsOpen => set({ snapshotsOpen }),
  settingsOpen: false,
  setSettingsOpen: settingsOpen => set({ settingsOpen, discoveryOpen: false }),
  selectedSubnet: null,
  setSelectedSubnet: selectedSubnet => set({ selectedSubnet }),
}))
