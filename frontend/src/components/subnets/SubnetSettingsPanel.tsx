import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { subnetsApi } from '../../api/subnets'
import type { Subnet } from '../../types/wled'
import styles from './SubnetSettingsPanel.module.css'

export function SubnetSettingsPanel() {
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [cidr, setCidr] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { data: subnets = [] } = useQuery({
    queryKey: ['subnets'],
    queryFn: subnetsApi.list,
  })

  const createMutation = useMutation({
    mutationFn: () => subnetsApi.create(name.trim(), cidr.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subnets'] })
      setName('')
      setCidr('')
      setError(null)
    },
    onError: (e: any) => setError(e.response?.data?.detail ?? e.message ?? 'Failed to add subnet'),
  })

  const toggleMutation = useMutation({
    mutationFn: (s: Subnet) => subnetsApi.update(s.id, { enabled: !s.enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subnets'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => subnetsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subnets'] }),
  })

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !cidr.trim()) return
    createMutation.mutate()
  }

  return (
    <div className={styles.panel}>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Discovery Subnets</h3>
        <p className={styles.hint}>
          Subnets listed here are scanned for WLED devices. The discovery worker
          creates one mDNS listener per subnet interface and performs an active
          HTTP scan of each /24 range. Leave empty to discover on all interfaces.
        </p>
      </div>

      {subnets.length > 0 && (
        <div className={styles.section}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>CIDR</th>
                <th>Active</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {subnets.map(s => (
                <tr key={s.id} className={!s.enabled ? styles.disabled : ''}>
                  <td>{s.name}</td>
                  <td className={styles.cidr}>{s.cidr}</td>
                  <td>
                    <button
                      className={`${styles.toggleBtn} ${s.enabled ? styles.enabled : styles.inactive}`}
                      onClick={() => toggleMutation.mutate(s)}
                      title={s.enabled ? 'Disable' : 'Enable'}
                    >
                      {s.enabled ? 'On' : 'Off'}
                    </button>
                  </td>
                  <td>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => deleteMutation.mutate(s.id)}
                      title="Remove subnet"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className={styles.section}>
        <h4 className={styles.subTitle}>Add Subnet</h4>
        <form className={styles.addForm} onSubmit={handleAdd}>
          <input
            className={styles.input}
            placeholder="Name (e.g. Living Room)"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <input
            className={styles.input}
            placeholder="CIDR (e.g. 192.168.5.0/24)"
            value={cidr}
            onChange={e => setCidr(e.target.value)}
          />
          <button
            type="submit"
            className={styles.addBtn}
            disabled={!name.trim() || !cidr.trim() || createMutation.isPending}
          >
            {createMutation.isPending ? 'Adding…' : 'Add'}
          </button>
        </form>
        {error && <p className={styles.error}>{error}</p>}
      </div>
    </div>
  )
}
