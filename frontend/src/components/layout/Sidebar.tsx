import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { controllersApi } from '../../api/controllers'
import { groupsApi } from '../../api/groups'
import { subnetsApi } from '../../api/subnets'
import { useUiStore } from '../../store/uiStore'
import { ControllerCard } from '../controllers/ControllerCard'
import { GroupEditor } from '../groups/GroupEditor'
import styles from './Sidebar.module.css'

export function Sidebar() {
  const { selection, select, setDiscoveryOpen, selectedSubnet, setSelectedSubnet } = useUiStore()
  const [showGroupEditor, setShowGroupEditor] = useState(false)
  const [tab, setTab] = useState<'controllers' | 'groups'>('controllers')

  const { data: controllers = [] } = useQuery({
    queryKey: ['controllers'],
    queryFn: controllersApi.list,
    refetchInterval: 10000,
  })

  const { data: groups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: groupsApi.list,
  })

  const { data: subnets = [] } = useQuery({
    queryKey: ['subnets'],
    queryFn: subnetsApi.list,
  })

  // Derive unique subnets present among controllers (for pill display)
  const controllerSubnets = Array.from(new Set(controllers.map(c => c.subnet).filter(Boolean)))

  // Map cidr → name from configured subnets
  const subnetName = (cidr: string) =>
    subnets.find(s => s.cidr === cidr)?.name ?? cidr

  const visibleControllers = selectedSubnet
    ? controllers.filter(c => c.subnet === selectedSubnet)
    : controllers

  // Group controllers by subnet when no filter active and multiple subnets exist
  const grouped = !selectedSubnet && controllerSubnets.length > 1
  const controllerGroups: Array<{ cidr: string; items: typeof controllers }> = grouped
    ? controllerSubnets.map(cidr => ({ cidr, items: controllers.filter(c => c.subnet === cidr) }))
    : [{ cidr: '', items: visibleControllers }]

  return (
    <aside className={styles.sidebar}>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'controllers' ? styles.activeTab : ''}`}
          onClick={() => setTab('controllers')}
        >
          Controllers ({controllers.length})
        </button>
        <button
          className={`${styles.tab} ${tab === 'groups' ? styles.activeTab : ''}`}
          onClick={() => setTab('groups')}
        >
          Groups ({groups.length})
        </button>
      </div>

      <div className={styles.content}>
        {tab === 'controllers' && (
          <>
            {controllerSubnets.length > 1 && (
              <div className={styles.subnetPills}>
                <button
                  className={`${styles.pill} ${selectedSubnet === null ? styles.pillActive : ''}`}
                  onClick={() => setSelectedSubnet(null)}
                >
                  All
                </button>
                {controllerSubnets.map(cidr => (
                  <button
                    key={cidr}
                    className={`${styles.pill} ${selectedSubnet === cidr ? styles.pillActive : ''}`}
                    onClick={() => setSelectedSubnet(selectedSubnet === cidr ? null : cidr)}
                    title={cidr}
                  >
                    {subnetName(cidr)}
                  </button>
                ))}
              </div>
            )}

            {controllerGroups.map(({ cidr, items }) => (
              <div key={cidr || 'all'}>
                {grouped && (
                  <div className={styles.subnetHeader}>
                    <span className={styles.subnetLabel}>{subnetName(cidr)}</span>
                    <span className={styles.subnetCidr}>{cidr}</span>
                  </div>
                )}
                {items.map(c => (
                  <ControllerCard
                    key={c.id}
                    controller={c}
                    selected={selection?.kind === 'controller' && selection.id === c.id}
                    onClick={() => select({ kind: 'controller', id: c.id })}
                  />
                ))}
              </div>
            ))}

            <button
              className={styles.addBtn}
              onClick={() => setDiscoveryOpen(true)}
            >
              + Discover / Add
            </button>
          </>
        )}

        {tab === 'groups' && (
          <>
            {groups.map(g => (
              <button
                key={g.id}
                className={`${styles.groupCard} ${selection?.kind === 'group' && selection.id === g.id ? styles.selected : ''}`}
                onClick={() => select({ kind: 'group', id: g.id })}
              >
                <span className={styles.groupName}>{g.name}</span>
                <span className={styles.groupMeta}>{g.members.length} members · {g.subnet || 'no subnet'}</span>
              </button>
            ))}
            <button
              className={styles.addBtn}
              onClick={() => setShowGroupEditor(true)}
            >
              + Create Group
            </button>
          </>
        )}
      </div>

      {showGroupEditor && (
        <GroupEditor
          onClose={() => setShowGroupEditor(false)}
          onCreated={g => select({ kind: 'group', id: g.id })}
        />
      )}
    </aside>
  )
}
