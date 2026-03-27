import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { groupsApi } from '../../api/groups'
import { controllersApi } from '../../api/controllers'
import type { Group } from '../../types/wled'
import styles from './GroupEditor.module.css'

interface Props {
  group?: Group
  onClose: () => void
  onCreated?: (g: Group) => void
}

export function GroupEditor({ group, onClose, onCreated }: Props) {
  const qc = useQueryClient()
  const [name, setName] = useState(group?.name ?? '')
  const [description, setDescription] = useState(group?.description ?? '')

  const { data: controllers } = useQuery({
    queryKey: ['controllers'],
    queryFn: controllersApi.list,
  })

  const { data: groups } = useQuery({
    queryKey: ['groups'],
    queryFn: groupsApi.list,
  })

  const save = useMutation({
    mutationFn: async () => {
      if (group) {
        return groupsApi.update(group.id, name, description)
      }
      return groupsApi.create(name, description)
    },
    onSuccess: g => {
      qc.invalidateQueries({ queryKey: ['groups'] })
      onCreated?.(g)
      onClose()
    },
  })

  const addMember = useMutation({
    mutationFn: ({ id, type }: { id: string; type: 'CONTROLLER' | 'GROUP' }) =>
      groupsApi.addMember(group!.id, id, type),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['group', group?.id] }),
  })

  const removeMember = useMutation({
    mutationFn: (memberId: string) => groupsApi.removeMember(group!.id, memberId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['group', group?.id] }),
  })

  const currentMemberIds = new Set(group?.members.map(m => m.id) ?? [])

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>{group ? 'Edit Group' : 'Create Group'}</h3>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.form}>
          <label className={styles.fieldLabel}>Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Group name" />

          <label className={styles.fieldLabel}>Description</label>
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description" />
        </div>

        {group && (
          <div className={styles.members}>
            <h4 className={styles.sectionTitle}>Add Controllers</h4>
            <div className={styles.candidateList}>
              {controllers
                ?.filter(c => !currentMemberIds.has(c.id))
                .map(c => (
                  <div key={c.id} className={styles.candidate}>
                    <div>
                      <span className={styles.cname}>{c.name}</span>
                      <span className={styles.cip}>{c.ip}</span>
                    </div>
                    <button
                      className={styles.addBtn}
                      onClick={() => addMember.mutate({ id: c.id, type: 'CONTROLLER' })}
                      disabled={addMember.isPending}
                    >
                      + Add
                    </button>
                  </div>
                ))}
            </div>

            {group.members.length > 0 && (
              <>
                <h4 className={styles.sectionTitle}>Current Members</h4>
                {group.members.map(m => (
                  <div key={m.id} className={styles.candidate}>
                    <span>{m.type === 'CONTROLLER'
                      ? controllers?.find(c => c.id === m.id)?.name ?? m.id
                      : groups?.find(g => g.id === m.id)?.name ?? m.id
                    }</span>
                    <button
                      className={styles.removeBtn}
                      onClick={() => removeMember.mutate(m.id)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button
            className={styles.saveBtn}
            onClick={() => save.mutate()}
            disabled={!name.trim() || save.isPending}
          >
            {save.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
