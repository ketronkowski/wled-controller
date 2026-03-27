import { useState } from 'react'
import type { WledState } from '../../types/wled'
import type { ControlPayload } from '../../types/wled'
import { ColorPicker } from './ColorPicker'
import { EffectSelector } from './EffectSelector'
import { PaletteSelector } from './PaletteSelector'
import styles from './ControlPanel.module.css'

type RGB = [number, number, number]

interface Props {
  state: WledState
  effects: string[]
  fxData: string[]
  palettes: string[]
  onCommand: (payload: ControlPayload) => void
  sending?: boolean
}

type Tab = 'colors' | 'effects' | 'palettes'

export function ControlPanel({ state, effects, fxData, palettes, onCommand, sending }: Props) {
  const [tab, setTab] = useState<Tab>('colors')
  const seg = state.seg[state.mainseg] ?? state.seg[0]

  if (!seg) return <div className={styles.empty}>No segment data</div>

  const colors = (seg.col ?? [[0,0,0],[0,0,0],[0,0,0]]) as [RGB, RGB, RGB]

  return (
    <div className={styles.panel}>
      {/* Power + Brightness */}
      <div className={styles.topBar}>
        <button
          className={`${styles.powerBtn} ${state.on ? styles.on : styles.off}`}
          onClick={() => onCommand({ on: !state.on })}
          disabled={sending}
        >
          ⏻
        </button>

        <div className={styles.brightnessRow}>
          <span className={styles.label}>Brightness</span>
          <input
            type="range" min={1} max={255} value={state.bri}
            onChange={e => onCommand({ bri: +e.target.value })}
            className={styles.slider}
            disabled={sending}
          />
          <span className={styles.val}>{state.bri}</span>
        </div>
      </div>

      {/* Tab switcher */}
      <div className={styles.tabs}>
        {(['colors', 'effects', 'palettes'] as Tab[]).map(t => (
          <button
            key={t}
            className={`${styles.tab} ${tab === t ? styles.activeTab : ''}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className={styles.content}>
        {tab === 'colors' && (
          <ColorPicker
            colors={colors}
            onChange={cols => onCommand({ col: cols })}
          />
        )}
        {tab === 'effects' && (
          <EffectSelector
            effects={effects}
            fxData={fxData}
            selectedFx={seg.fx}
            speed={seg.sx}
            intensity={seg.ix}
            c1={seg.c1}
            c2={seg.c2}
            c3={seg.c3}
            o1={seg.o1}
            o2={seg.o2}
            o3={seg.o3}
            onChange={params => onCommand(params)}
          />
        )}
        {tab === 'palettes' && (
          <PaletteSelector
            palettes={palettes}
            selected={seg.pal}
            onChange={pal => onCommand({ pal })}
          />
        )}
      </div>
    </div>
  )
}
