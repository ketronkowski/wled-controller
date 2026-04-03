import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { WledState } from '../../types/wled'
import type { ControlPayload } from '../../types/wled'
import { ColorPicker } from './ColorPicker'
import { EffectSelector } from './EffectSelector'
import { PaletteSelector } from './PaletteSelector'
import { parseFxData } from '../../utils/parseFxData'
import { controllersApi } from '../../api/controllers'
import styles from './ControlPanel.module.css'

type RGB = [number, number, number]

interface Props {
  state: WledState
  effects: string[]
  fxData: string[]
  palettes: string[]
  onCommand: (payload: ControlPayload) => void
  sending?: boolean
  controllerId?: string
}

type Tab = 'colors' | 'effects' | 'palettes'

export function ControlPanel({ state, effects, fxData, palettes, onCommand, sending, controllerId }: Props) {
  const [tab, setTab] = useState<Tab>('colors')
  const seg = state.seg[state.mainseg] ?? state.seg[0]

  const { data: paletteColors } = useQuery({
    queryKey: ['palx', controllerId],
    queryFn: () => controllersApi.palx(controllerId!),
    enabled: !!controllerId,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })

  const [localFx, setLocalFx] = useState<number | null>(null)
  const [localPal, setLocalPal] = useState<number | null>(null)
  const [localColors, setLocalColors] = useState<[RGB, RGB, RGB] | null>(null)

  useEffect(() => { setLocalFx(null) }, [seg?.fx])
  useEffect(() => { setLocalPal(null) }, [seg?.pal])
  const colKey = JSON.stringify(seg?.col)
  useEffect(() => { setLocalColors(null) }, [colKey])

  const effectiveFx = localFx ?? seg?.fx ?? 0
  const effectivePal = localPal ?? seg?.pal ?? 0

  const effectParsed = useMemo(() => parseFxData(fxData[effectiveFx] ?? ''), [fxData, effectiveFx])

  if (!seg) return <div className={styles.empty}>No segment data</div>

  const colors = (seg.col ?? [[0,0,0],[0,0,0],[0,0,0]]) as [RGB, RGB, RGB]
  const effectiveColors = localColors ?? colors

  const handleCommand = (payload: ControlPayload) => {
    if (payload.fx !== undefined) setLocalFx(payload.fx)
    if (payload.pal !== undefined) setLocalPal(payload.pal)
    if (payload.col !== undefined) setLocalColors(payload.col as [RGB, RGB, RGB])
    onCommand(payload)
  }

  return (
    <div className={styles.panel}>
      {/* Power + Brightness */}
      <div className={styles.topBar}>
        <button
          className={`${styles.powerBtn} ${state.on ? styles.on : styles.off}`}
          onClick={() => handleCommand({ on: !state.on })}
          disabled={sending}
        >
          ⏻
        </button>

        <div className={styles.brightnessRow}>
          <span className={styles.label}>Brightness</span>
          <input
            type="range" min={1} max={255} value={state.bri}
            onChange={e => handleCommand({ bri: +e.target.value })}
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
            colors={effectiveColors}
            colorSlots={effectParsed.colorSlots}
            selectedPal={effectivePal}
            onChange={cols => handleCommand({ col: cols })}
          />
        )}
        {tab === 'effects' && (
          <EffectSelector
            effects={effects}
            fxData={fxData}
            selectedFx={effectiveFx}
            speed={seg.sx}
            intensity={seg.ix}
            c1={seg.c1}
            c2={seg.c2}
            c3={seg.c3}
            o1={seg.o1}
            o2={seg.o2}
            o3={seg.o3}
            onChange={params => handleCommand(params)}
          />
        )}
        {tab === 'palettes' && (
          <PaletteSelector
            palettes={palettes}
            selected={effectivePal}
            paletteColors={paletteColors}
            userColors={effectiveColors}
            onChange={pal => handleCommand({ pal })}
          />
        )}
      </div>
    </div>
  )
}
