import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { snapshotsApi } from '../../api/snapshots'
import type { Snapshot } from '../../types/wled'
import styles from './RestoreModal.module.css'

interface Props {
  snapshot: Snapshot
  onClose: () => void
}

export function RestoreModal({ snapshot, onClose }: Props) {
  const [result, setResult] = useState<Record<string, string> | null>(null)

  const mutation = useMutation({
    mutationFn: () => snapshotsApi.restore(snapshot.id),
    onSuccess: data => setResult(data),
  })

  const succeeded = result
    ? Object.entries(result).filter(([, v]) => v === 'ok').length
    : 0
  const failed = result
    ? Object.entries(result).filter(([, v]) => v !== 'ok').length
    : 0

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && !mutation.isPending && onClose()}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Restore "{snapshot.name}"</h2>

        {!result && (
          <p className={styles.warning}>
            This will overwrite the current config and state on{' '}
            {snapshot.controllers.length === 1
              ? snapshot.controllers[0].controllerName
              : `${snapshot.controllers.length} controllers`}
            . Devices that are offline will be skipped.
          </p>
        )}

        {!result && (
          <div className={styles.controllers}>
            {snapshot.controllers.map(c => (
              <div key={c.controllerId} className={styles.controllerRow}>
                <span className={styles.dot} />
                {c.controllerName} ({c.controllerIp})
              </div>
            ))}
          </div>
        )}

        {result && (
          <div className={`${styles.results} ${failed > 0 ? styles.partial : styles.success}`}>
            {failed === 0
              ? `All ${succeeded} controller${succeeded !== 1 ? 's' : ''} restored successfully.`
              : `${succeeded} succeeded, ${failed} failed. Check that all devices are reachable.`}
          </div>
        )}

        <div className={styles.actions}>
          {result ? (
            <button className={styles.cancelBtn} onClick={onClose}>Close</button>
          ) : (
            <>
              <button className={styles.cancelBtn} onClick={onClose} disabled={mutation.isPending}>
                Cancel
              </button>
              <button
                className={styles.restoreBtn}
                disabled={mutation.isPending}
                onClick={() => mutation.mutate()}
              >
                {mutation.isPending ? 'Restoring…' : 'Restore'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
