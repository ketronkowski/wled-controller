import { useState, useMemo } from 'react'
import styles from './EffectSelector.module.css'
import { WLED_EFFECT_DESCRIPTIONS } from '../../data/wledEffectDescriptions'
import { parseFxData } from '../../utils/parseFxData'

interface Props {
  effects: string[]
  fxData: string[]
  selectedFx: number
  speed: number
  intensity: number
  c1: number
  c2: number
  c3: number
  o1: boolean
  o2: boolean
  o3: boolean
  onChange: (params: {
    fx?: number
    sx?: number
    ix?: number
    c1?: number
    c2?: number
    c3?: number
    o1?: boolean
    o2?: boolean
    o3?: boolean
  }) => void
}

export function EffectSelector({
  effects,
  fxData,
  selectedFx,
  speed,
  intensity,
  c1, c2, c3,
  o1, o2, o3,
  onChange,
}: Props) {
  const [search, setSearch] = useState('')

  const selectedEffectName = effects[selectedFx]
  const description = selectedEffectName ? WLED_EFFECT_DESCRIPTIONS[selectedEffectName] : undefined

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return effects
      .map((name, i) => ({ name, i }))
      .filter(({ name }) => name.toLowerCase().includes(q))
  }, [effects, search])

  const params = useMemo(() => parseFxData(fxData[selectedFx] ?? ''), [fxData, selectedFx])

  return (
    <div className={styles.wrapper}>
      <input
        className={styles.search}
        placeholder="Search effects..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div className={styles.list}>
        {filtered.map(({ name, i }) => (
          <button
            key={i}
            className={`${styles.item} ${selectedFx === i ? styles.selected : ''}`}
            onClick={() => onChange({ fx: i })}
          >
            {name}
          </button>
        ))}
      </div>

      <div className={styles.sliders}>
        <label className={styles.sliderRow}>
          <span>{params.speedLabel}</span>
          <input
            type="range" min={0} max={255} value={speed}
            onChange={e => onChange({ sx: +e.target.value })}
          />
          <span className={styles.val}>{speed}</span>
        </label>

        <label className={styles.sliderRow}>
          <span>{params.intensityLabel}</span>
          <input
            type="range" min={0} max={255} value={intensity}
            onChange={e => onChange({ ix: +e.target.value })}
          />
          <span className={styles.val}>{intensity}</span>
        </label>

        {params.c1.show && (
          <label className={styles.sliderRow}>
            <span>{params.c1.label}</span>
            <input
              type="range" min={0} max={255} value={c1}
              onChange={e => onChange({ c1: +e.target.value })}
            />
            <span className={styles.val}>{c1}</span>
          </label>
        )}

        {params.c2.show && (
          <label className={styles.sliderRow}>
            <span>{params.c2.label}</span>
            <input
              type="range" min={0} max={255} value={c2}
              onChange={e => onChange({ c2: +e.target.value })}
            />
            <span className={styles.val}>{c2}</span>
          </label>
        )}

        {params.c3.show && (
          <label className={styles.sliderRow}>
            <span>{params.c3.label}</span>
            <input
              type="range" min={0} max={255} value={c3}
              onChange={e => onChange({ c3: +e.target.value })}
            />
            <span className={styles.val}>{c3}</span>
          </label>
        )}

        <div className={styles.checkboxes}>
          {[
            { show: params.o1.show, label: params.o1.label, val: o1, key: 'o1' as const },
            { show: params.o2.show, label: params.o2.label, val: o2, key: 'o2' as const },
            { show: params.o3.show, label: params.o3.label, val: o3, key: 'o3' as const },
          ].filter(x => x.show).map(({ label, val, key }) => (
            <label key={key} className={styles.checkbox}>
              <input
                type="checkbox" checked={val}
                onChange={e => onChange({ [key]: e.target.checked })}
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {description && (
        <div className={styles.effectInfo}>
          <span className={styles.effectInfoLabel}>ℹ {selectedEffectName}</span>
          <p className={styles.effectInfoText}>{description}</p>
        </div>
      )}
    </div>
  )
}
