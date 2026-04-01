import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { controllersApi } from '../../api/controllers'
import { controlApi } from '../../api/control'
import type { ControlPayload } from '../../types/wled'
import { ControlPanel } from '../controls/ControlPanel'
import { StatusBadge } from '../common/StatusBadge'
import { SnapshotList } from '../snapshots/SnapshotList'
import styles from './ControllerDetail.module.css'

interface Props {
  controllerId: string
}

export function ControllerDetail({ controllerId }: Props) {
  const qc = useQueryClient()

  const { data: liveState, isLoading } = useQuery({
    queryKey: ['controller-state', controllerId],
    queryFn: () => controllersApi.liveState(controllerId),
    refetchInterval: 5000,
  })

  const { data: controller } = useQuery({
    queryKey: ['controllers'],
    queryFn: controllersApi.list,
    select: list => list.find(c => c.id === controllerId),
  })

  const { data: fxData = [] } = useQuery({
    queryKey: ['controller-fxdata', controllerId],
    queryFn: () => controllersApi.fxData(controllerId),
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const sendCmd = useMutation({
    mutationFn: (payload: ControlPayload) => controlApi.sendToController(controllerId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['controller-state', controllerId] }),
  })

  if (isLoading) return <div className={styles.loading}>Loading...</div>
  if (!liveState) return <div className={styles.error}>Cannot reach device</div>

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>{controller?.name ?? controllerId}</h2>
          <div className={styles.meta}>
            <span>{controller?.ip}</span>
            <span>v{liveState.info.ver}</span>
            <span>{liveState.info.leds.count} LEDs</span>
            {controller && <StatusBadge online={controller.online} />}
          </div>
        </div>
      </div>

      <ControlPanel
        state={liveState.state}
        effects={liveState.effects}
        fxData={fxData}
        palettes={liveState.palettes}
        onCommand={sendCmd.mutate}
        sending={sendCmd.isPending}
        controllerId={controllerId}
      />

      <SnapshotList
        scopeType="controller"
        scopeId={controllerId}
        scopeName={controller?.name ?? controllerId}
      />
    </div>
  )
}
