import styles from './StatusBadge.module.css'

interface Props {
  online: boolean
}

export function StatusBadge({ online }: Props) {
  return (
    <span className={`${styles.badge} ${online ? styles.online : styles.offline}`}>
      {online ? 'Online' : 'Offline'}
    </span>
  )
}
