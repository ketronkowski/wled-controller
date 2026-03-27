import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { snapshotsApi } from '../../api/snapshots'
import type { Snapshot } from '../../types/wled'
import { CaptureModal } from './CaptureModal'
import { RestoreModal } from './RestoreModal'
import styles from './SnapshotList.module.css'

interface Props {
  scopeType: 'controller' | 'group'
  scopeId: string
  scopeName: string
}

export function SnapshotList({ scopeType, scopeId, scopeName }: Props) {
  const qc = useQueryClient()
  const [showCapture, setShowCapture] = useState(false)
  const [restoreTarget, setRestoreTarget] = useState<Snapshot | null>(null)

  const { data: snapshots = [] } = useQuery({
    queryKey: ['snapshots'],
    queryFn: snapshotsApi.list,
  })

  const scoped = snapshots.filter(s => s.scope.type === scopeType && s.scope.id === scopeId)

  const deleteMutation = useMutation({
    mutationFn: snapshotsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['snapshots'] }),
  })

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    })

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.title}>Snapshots ({scoped.length})</span>
        <button className={styles.captureBtn} onClick={() => setShowCapture(true)}>
          Capture
        </button>
      </div>

      {scoped.length === 0 && (
        <p className={styles.empty}>No snapshots yet. Capture one to save the current device state.</p>
      )}

      {scoped.map(snap => (
        <div key={snap.id} className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardName}>{snap.name}</span>
            <div className={styles.cardActions}>
              <button className={styles.restoreBtn} onClick={() => setRestoreTarget(snap)}>
                Restore
              </button>
              <button
                className={styles.deleteBtn}
                onClick={() => deleteMutation.mutate(snap.id)}
              >
                ✕
              </button>
            </div>
          </div>
          {snap.description && <p className={styles.cardDesc}>{snap.description}</p>}
          <span className={styles.cardMeta}>
            {snap.controllers.length} controller{snap.controllers.length !== 1 ? 's' : ''} · {fmt(snap.capturedAt)}
          </span>
          {snap.tags.length > 0 && (
            <div className={styles.tags}>
              {snap.tags.map(t => <span key={t} className={styles.tag}>{t}</span>)}
            </div>
          )}
        </div>
      ))}

      {showCapture && (
        <CaptureModal
          scopeType={scopeType}
          scopeId={scopeId}
          scopeName={scopeName}
          onClose={() => setShowCapture(false)}
        />
      )}

      {restoreTarget && (
        <RestoreModal
          snapshot={restoreTarget}
          onClose={() => setRestoreTarget(null)}
        />
      )}
    </div>
  )
}
