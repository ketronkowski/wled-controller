import { useUiStore } from '../../store/uiStore'
import { Sidebar } from './Sidebar'
import { ControllerDetail } from '../controllers/ControllerDetail'
import { GroupDetail } from '../groups/GroupDetail'
import { DiscoveryPanel } from '../discovery/DiscoveryPanel'
import { SubnetSettingsPanel } from '../subnets/SubnetSettingsPanel'
import styles from './AppShell.module.css'

export function AppShell() {
  const { selection, discoveryOpen, setDiscoveryOpen, settingsOpen, setSettingsOpen } = useUiStore()

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>💡</span>
          <span className={styles.logoText}>WLED Controller</span>
        </div>
        <div className={styles.headerActions}>
          <button
            className={`${styles.headerBtn} ${settingsOpen ? styles.active : ''}`}
            onClick={() => setSettingsOpen(!settingsOpen)}
          >
            ⚙ Subnets
          </button>
          <button
            className={`${styles.headerBtn} ${discoveryOpen ? styles.active : ''}`}
            onClick={() => setDiscoveryOpen(!discoveryOpen)}
          >
            {discoveryOpen ? '✕ Close' : '🔍 Discover'}
          </button>
        </div>
      </header>

      <div className={styles.body}>
        <Sidebar />

        <main className={styles.main}>
          {settingsOpen ? (
            <div className={styles.panelWrapper}>
              <h2 className={styles.panelTitle}>Subnet Settings</h2>
              <SubnetSettingsPanel />
            </div>
          ) : discoveryOpen ? (
            <div className={styles.panelWrapper}>
              <h2 className={styles.panelTitle}>Discover Devices</h2>
              <DiscoveryPanel />
            </div>
          ) : selection?.kind === 'controller' ? (
            <div className={styles.panelWrapper}>
              <ControllerDetail controllerId={selection.id} />
            </div>
          ) : selection?.kind === 'group' ? (
            <div className={styles.panelWrapper}>
              <GroupDetail groupId={selection.id} />
            </div>
          ) : (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>💡</div>
              <p>Select a controller or group from the sidebar to get started.</p>
              <button
                className={styles.discoverBtn}
                onClick={() => setDiscoveryOpen(true)}
              >
                Discover Devices
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
