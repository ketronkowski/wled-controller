import { apiClient } from './client'
import type { Controller, LiveState } from '../types/wled'

export const controllersApi = {
  list: () => apiClient.get<Controller[]>('/controllers').then(r => r.data),
  get: (id: string) => apiClient.get<Controller>(`/controllers/${id}`).then(r => r.data),
  add: (ip: string) => apiClient.post<Controller>('/controllers', { ip }).then(r => r.data),
  delete: (id: string) => apiClient.delete(`/controllers/${id}`),
  liveState: (id: string) => apiClient.get<LiveState>(`/controllers/${id}/state`).then(r => r.data),
  fxData: (id: string) => apiClient.get<string[]>(`/controllers/${id}/fxdata`).then(r => r.data),
  refresh: (id: string) => apiClient.post<Controller>(`/controllers/${id}/refresh`).then(r => r.data),
  palx: (id: string) => apiClient.get<Record<string, Array<number[] | string>>>(`/controllers/${id}/palx`).then(r => r.data),
}
