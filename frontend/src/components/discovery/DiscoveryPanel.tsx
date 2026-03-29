import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { discoveryApi } from '../../api/discovery'
import { controllersApi } from '../../api/controllers'
import { subnetsApi } from '../../api/subnets'
import type { DiscoveredDevice } from '../../types/wled'
import styles from './DiscoveryPanel.module.css'

export function DiscoveryPanel() {
  const qc = useQueryClient()
  const [manualIp, setManualIp] = useState('')
  const [selectedCidr, setSelectedCidr] = useState<string>('')

  const { data: subnets = [] } = useQuery({
    queryKey: ['subnets'],
    queryFn: subnetsApi.list,
  })

  const { data: status, refetch: refetchStatus } = useQuery({
    queryKey: ['discovery-status'],
    queryFn: discoveryApi.status,
    refetchInterval: d => (d.state.data?.scanning ? 1500 : false),
  })

  const { data: results } = useQuery({
    queryKey: ['discovery-results'],
    queryFn: discoveryApi.results,
    refetchInterval: status?.scanning ? 2000 : false,
  })

  const scan = useMutation({
    mutationFn: () => discoveryApi.scan(selectedCidr || undefined),
    onSuccess: () => {
      setTimeout(() => refetchStatus(), 500)
    },
  })

  const importDevices = useMutation({
    mutationFn: (devices: DiscoveredDevice[]) => discoveryApi.importDevices(devices),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['controllers'] }),
  })

  const addManual = useMutation({
    mutationFn: () => controllersApi.add(manualIp),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['controllers'] })
      setManualIp('')
    },
  })

  const selectedSubnet = subnets.find(s => s.cidr === selectedCidr)
  const hint = selectedCidr
    ? `Actively probes every host in ${selectedCidr}.`
    : 'Scans the local subnet via mDNS and UDP broadcast.'

  return (
    <div className={styles.panel}>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Auto-Discover</h3>

        {subnets.length > 0 && (
          <select
            className={styles.subnetSelect}
            value={selectedCidr}
            onChange={e => setSelectedCidr(e.target.value)}
          >
            <option value="">All interfaces (mDNS/UDP)</option>
            {subnets.map(s => (
              <option key={s.id} value={s.cidr}>
                {s.name} — {s.cidr}
              </option>
            ))}
          </select>
        )}

        <p className={styles.hint}>{hint}</p>

        <button
          className={styles.scanBtn}
          onClick={() => scan.mutate()}
          disabled={status?.scanning || scan.isPending}
        >
          {status?.scanning
            ? `🔍 Scanning${selectedSubnet ? ` ${selectedSubnet.name}` : ''}...`
            : 'Start Scan'}
        </button>
      </div>

      {results && results.length > 0 && (
        <div className={styles.section}>
          <div className={styles.resultsHeader}>
            <h4 className={styles.sectionTitle}>Found {results.length} device(s)</h4>
            <button
              className={styles.importAllBtn}
              onClick={() => importDevices.mutate(results)}
              disabled={importDevices.isPending}
            >
              Import All
            </button>
          </div>
          {results.map(d => (
            <div key={d.ip} className={styles.device}>
              <div>
                <span className={styles.dname}>{d.name}</span>
                <span className={styles.dmeta}>{d.ip} · {d.ledCount} LEDs · v{d.firmware}</span>
              </div>
              <button
                className={styles.importBtn}
                onClick={() => importDevices.mutate([d])}
                disabled={importDevices.isPending}
              >
                Import
              </button>
            </div>
          ))}
        </div>
      )}

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Add by IP</h3>
        <div className={styles.manualRow}>
          <input
            value={manualIp}
            onChange={e => setManualIp(e.target.value)}
            placeholder="192.168.x.x"
            onKeyDown={e => e.key === 'Enter' && manualIp && addManual.mutate()}
          />
          <button
            className={styles.addBtn}
            onClick={() => addManual.mutate()}
            disabled={!manualIp || addManual.isPending}
          >
            {addManual.isPending ? 'Adding...' : 'Add'}
          </button>
        </div>
        {addManual.isError && (
          <p className={styles.error}>Failed: {String(addManual.error)}</p>
        )}
      </div>
    </div>
  )
}
