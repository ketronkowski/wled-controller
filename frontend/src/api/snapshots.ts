import { apiClient } from './client'
import type { Snapshot } from '../types/wled'

export const snapshotsApi = {
  list: () => apiClient.get<Snapshot[]>('/snapshots').then(r => r.data),
  get: (id: string) => apiClient.get<Snapshot>(`/snapshots/${id}`).then(r => r.data),
  capture: (params: {
    name: string
    description?: string
    scopeType: 'controller' | 'group'
    scopeId: string
    tags?: string[]
  }) => apiClient.post<Snapshot>('/snapshots', { ...params, tags: params.tags ?? [] }).then(r => r.data),
  delete: (id: string) => apiClient.delete(`/snapshots/${id}`),
  restore: (id: string) =>
    apiClient.post<Record<string, string>>(`/snapshots/${id}/restore`).then(r => r.data),
}
