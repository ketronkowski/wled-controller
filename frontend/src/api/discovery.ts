import { apiClient } from './client'
import type { Controller, DiscoveredDevice } from '../types/wled'

export const discoveryApi = {
  scan: (cidr?: string) => apiClient.post<{ status: string }>('/discovery/scan', { cidr }).then(r => r.data),
  status: () => apiClient.get<{ scanning: boolean }>('/discovery/status').then(r => r.data),
  results: () => apiClient.get<DiscoveredDevice[]>('/discovery/results').then(r => r.data),
  importDevices: (devices: DiscoveredDevice[]) =>
    apiClient.post<Controller[]>('/discovery/import', devices).then(r => r.data),
}
