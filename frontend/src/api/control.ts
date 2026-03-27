import { apiClient } from './client'
import type { Controller, ControlPayload, GroupControlResult } from '../types/wled'

export const controlApi = {
  sendToController: (id: string, payload: ControlPayload) =>
    apiClient.post<Controller>(`/control/controller/${id}`, payload).then(r => r.data),

  sendToGroup: (id: string, payload: ControlPayload) =>
    apiClient
      .post<GroupControlResult>(`/control/group/${id}`, payload, {
        validateStatus: status => status < 600,
      })
      .then(r => r.data),
}
