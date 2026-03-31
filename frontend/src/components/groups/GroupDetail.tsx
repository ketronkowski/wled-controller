import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { groupsApi } from '../../api/groups'
import { controlApi } from '../../api/control'
import { controllersApi } from '../../api/controllers'
import type { ControlPayload, GroupControlResult } from '../../types/wled'
import { ControlPanel } from '../controls/ControlPanel'
import { SnapshotList } from '../snapshots/SnapshotList'
import { GroupEditor } from './GroupEditor'
import styles from './GroupDetail.module.css'
import { useState } from 'react'

interface Props {
  groupId: string
}

const EMPTY_STATE = {
  on: false, bri: 128, transition: 7, ps: -1, pl: -1, mainseg: 0,
  seg: [{ id: 0, start: 0, stop: 1, len: 1, grp: 1, spc: 0, of: 0, on: true, frz: false,
    bri: 255, cct: 127, col: [[0,0,0],[0,0,0],[0,0,0]] as [[number,number,number],[number,number,number],[number,number,number]],
    fx: 0, sx: 128, ix: 128, pal: 0, c1: 128, c2: 128, c3: 16,
    sel: true, rev: false, mi: false, o1: false, o2: false, o3: false, si: 0, m12: 0 }]
}

export function GroupDetail({ groupId }: Props) {
  const qc = useQueryClient()
  const [lastResult, setLastResult] = useState<GroupControlResult | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)

  const { data: group } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => groupsApi.get(groupId),
  })

  // Fetch first online controller in group to get effects/palettes
  const { data: controllers } = useQuery({
    queryKey: ['controllers'],
    queryFn: controllersApi.list,
  })

  const memberControllers = controllers?.filter(c =>
    group?.members.some(m => m.type === 'CONTROLLER' && m.id === c.id)
  ) ?? []
  const firstOnline = memberControllers.find(c => c.online)

  const { data: liveState } = useQuery({
    queryKey: ['controller-state', firstOnline?.id],
    queryFn: () => controllersApi.liveState(firstOnline!.id),
    enabled: !!firstOnline,
  })

  const { data: fxData = [] } = useQuery({
    queryKey: ['controller-fxdata', firstOnline?.id],
    queryFn: () => controllersApi.fxData(firstOnline!.id),
    enabled: !!firstOnline,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const sendCmd = useMutation({
    mutationFn: (payload: ControlPayload) => controlApi.sendToGroup(groupId, payload),
    onSuccess: result => {
      setLastResult(result)
      qc.invalidateQueries({ queryKey: ['controllers'] })
    },
  })

  const removeMember = useMutation({
    mutationFn: (controllerId: string) => groupsApi.removeMember(groupId, controllerId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['group', groupId] })
      qc.invalidateQueries({ queryKey: ['controllers'] })
    },
  })

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>{group?.name ?? 'Group'}</h2>
          <div className={styles.meta}>
            <span>{memberControllers.length} controllers</span>
            {group?.subnet && <span className={styles.subnet}>{group.subnet}</span>}
          </div>
        </div>
        <button className={styles.editBtn} onClick={() => setEditorOpen(true)}>
          Edit Group
        </button>
      </div>

      {lastResult && lastResult.failed.length > 0 && (
        <div className={styles.warning}>
          ⚠ {lastResult.failed.length} device(s) offline:{' '}
          {lastResult.failed.map(f => f.ip).join(', ')}
        </div>
      )}

      <ControlPanel
        state={liveState?.state ?? EMPTY_STATE}
        effects={liveState?.effects ?? []}
        fxData={fxData}
        palettes={liveState?.palettes ?? []}
        onCommand={sendCmd.mutate}
        sending={sendCmd.isPending}
      />

      <div className={styles.memberList}>
        <h4 className={styles.memberTitle}>Members</h4>
        {memberControllers.map(c => (
          <div key={c.id} className={styles.member}>
            <span className={styles.dot} style={{ background: c.online ? 'var(--online)' : 'var(--offline)' }} />
            <span>{c.name}</span>
            <span className={styles.ip}>{c.ip}</span>
            <button
              className={styles.removeBtn}
              onClick={() => removeMember.mutate(c.id)}
              disabled={removeMember.isPending}
              title="Remove from group"
            >✕</button>
          </div>
        ))}
      </div>

      <SnapshotList
        scopeType="group"
        scopeId={groupId}
        scopeName={group?.name ?? groupId}
      />

      {editorOpen && group && (
        <GroupEditor group={group} onClose={() => setEditorOpen(false)} />
      )}
    </div>
  )
}
