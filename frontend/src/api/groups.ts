import { apiClient } from './client'
import type { Group } from '../types/wled'

export const groupsApi = {
  list: () => apiClient.get<Group[]>('/groups').then(r => r.data),
  get: (id: string) => apiClient.get<Group>(`/groups/${id}`).then(r => r.data),
  create: (name: string, description?: string) =>
    apiClient.post<Group>('/groups', { name, description }).then(r => r.data),
  update: (id: string, name: string, description?: string) =>
    apiClient.put<Group>(`/groups/${id}`, { name, description }).then(r => r.data),
  delete: (id: string) => apiClient.delete(`/groups/${id}`),
  addMember: (groupId: string, memberId: string, type: 'CONTROLLER' | 'GROUP') =>
    apiClient.post<Group>(`/groups/${groupId}/members`, { id: memberId, type }).then(r => r.data),
  removeMember: (groupId: string, memberId: string) =>
    apiClient.delete<Group>(`/groups/${groupId}/members/${memberId}`).then(r => r.data),
}
