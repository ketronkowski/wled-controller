import type { Controller } from '../../types/wled'
import { StatusBadge } from '../common/StatusBadge'
import styles from './ControllerCard.module.css'

interface Props {
  controller: Controller
  selected?: boolean
  onClick: () => void
}

export function ControllerCard({ controller, selected, onClick }: Props) {
  return (
    <button className={`${styles.card} ${selected ? styles.selected : ''}`} onClick={onClick}>
      <div className={styles.header}>
        <span className={styles.name}>{controller.name}</span>
        <StatusBadge online={controller.online} />
      </div>
      <div className={styles.meta}>
        <span>{controller.ip}</span>
        <span>{controller.ledCount} LEDs</span>
      </div>
      <div className={styles.subnet}>{controller.subnet}</div>
    </button>
  )
}
