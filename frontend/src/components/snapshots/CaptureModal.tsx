import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { snapshotsApi } from '../../api/snapshots'
import styles from './CaptureModal.module.css'

interface Props {
  scopeType: 'controller' | 'group'
  scopeId: string
  scopeName: string
  onClose: () => void
}

export function CaptureModal({ scopeType, scopeId, scopeName, onClose }: Props) {
  const qc = useQueryClient()
  const [name, setName] = useState(`${scopeName} — ${new Date().toLocaleDateString()}`)
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      snapshotsApi.capture({
        name: name.trim(),
        description: description.trim() || undefined,
        scopeType,
        scopeId,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['snapshots'] })
      onClose()
    },
  })

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Capture Snapshot</h2>

        <div className={styles.field}>
          <label className={styles.label}>Name</label>
          <input
            className={styles.input}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Living Room — Pre-Party"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Description (optional)</label>
          <textarea
            className={styles.textarea}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What state is being captured?"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Tags (optional, comma-separated)</label>
          <input
            className={styles.input}
            value={tags}
            onChange={e => setTags(e.target.value)}
            placeholder="party, christmas, blue"
          />
          <span className={styles.hint}>Tags help you find snapshots later.</span>
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button
            className={styles.saveBtn}
            disabled={!name.trim() || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? 'Capturing…' : 'Capture'}
          </button>
        </div>
      </div>
    </div>
  )
}
