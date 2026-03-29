export interface WledSegment {
  id: number
  start: number
  stop: number
  len: number
  grp: number
  spc: number
  of: number
  on: boolean
  frz: boolean
  bri: number
  cct: number
  col: [[number, number, number], [number, number, number], [number, number, number]]
  fx: number
  sx: number
  ix: number
  pal: number
  c1: number
  c2: number
  c3: number
  sel: boolean
  rev: boolean
  mi: boolean
  o1: boolean
  o2: boolean
  o3: boolean
  si: number
  m12: number
}

export interface WledState {
  on: boolean
  bri: number
  transition: number
  ps: number
  pl: number
  mainseg: number
  seg: WledSegment[]
}

export interface WledInfo {
  ver: string
  name: string
  mac: string
  ip: string
  leds: {
    count: number
    maxseg: number
    seglc: number[]
    lc: number
  }
  fxcount: number
  palcount: number
  wifi: { signal: number }
  arch: string
}

export interface Controller {
  id: string
  ip: string
  name: string
  mac: string
  subnet: string
  firmware: string
  ledCount: number
  discoveredAt: string
  lastSeenAt: string
  addedManually: boolean
  online: boolean
  cachedState: WledState | null
  cachedInfo: WledInfo | null
}

export interface GroupMember {
  type: 'CONTROLLER' | 'GROUP'
  id: string
}

export interface Group {
  id: string
  name: string
  description?: string
  subnet: string
  members: GroupMember[]
  createdAt: string
  updatedAt: string
}

export interface SnapshotControllerData {
  controllerId: string
  controllerIp: string
  controllerName: string
  state: WledState
  info: WledInfo
  effects: string[]
  palettes: string[]
}

export interface Snapshot {
  id: string
  name: string
  description?: string
  scope: { type: string; id: string }
  controllers: SnapshotControllerData[]
  capturedAt: string
  tags: string[]
}

export interface ControlPayload {
  on?: boolean
  bri?: number
  transition?: number
  ps?: number
  pl?: number
  fx?: number
  pal?: number
  col?: [[number, number, number], [number, number, number], [number, number, number]]
  sx?: number
  ix?: number
  seg?: Partial<WledSegment>[]
}

export interface DiscoveredDevice {
  ip: string
  name: string
  mac: string
  firmware: string
  ledCount: number
}

export interface LiveState {
  state: WledState
  info: WledInfo
  effects: string[]
  palettes: string[]
}

export interface Subnet {
  id: string
  name: string
  cidr: string
  enabled: boolean
  createdAt: string
}

export interface GroupControlResult {
  succeeded: Array<{ controllerId: string; ip: string }>
  failed: Array<{ controllerId: string; ip: string; reason: string }>
}
