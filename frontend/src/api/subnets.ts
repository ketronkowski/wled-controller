import { apiClient } from './client'
import type { Subnet } from '../types/wled'

export const subnetsApi = {
  list: () => apiClient.get<Subnet[]>('/subnets').then(r => r.data),
  create: (name: string, cidr: string, enabled = true) =>
    apiClient.post<Subnet>('/subnets', { name, cidr, enabled }).then(r => r.data),
  update: (id: string, patch: Partial<Pick<Subnet, 'name' | 'cidr' | 'enabled'>>) =>
    apiClient.put<Subnet>(`/subnets/${id}`, patch).then(r => r.data),
  delete: (id: string) => apiClient.delete(`/subnets/${id}`),
}
