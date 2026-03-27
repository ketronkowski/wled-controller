import { useState, useMemo } from 'react'
import styles from './EffectSelector.module.css'

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

function parseFxData(raw: string) {
  // Format: "name;SliderLabel1,SliderLabel2;Custom1,Custom2,Custom3;opt1,opt2"
  // Or just "name" for simple effects
  const parts = raw.split(';')
  return {
    speed: parts[1]?.split(',')[0] || 'Speed',
    intensity: parts[1]?.split(',')[1] || 'Intensity',
    c1: parts[2]?.split(',')[0] || 'Custom 1',
    c2: parts[2]?.split(',')[1] || 'Custom 2',
    c3: parts[2]?.split(',')[2] || 'Custom 3',
    o1: parts[3]?.split(',')[0] || 'Option 1',
    o2: parts[3]?.split(',')[1] || 'Option 2',
    o3: parts[3]?.split(',')[2] || 'Option 3',
  }
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

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return effects
      .map((name, i) => ({ name, i }))
      .filter(({ name }) => name.toLowerCase().includes(q))
  }, [effects, search])

  const params = useMemo(() => {
    const raw = fxData[selectedFx] ?? ''
    return parseFxData(raw)
  }, [fxData, selectedFx])

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
          <span>{params.speed}</span>
          <input
            type="range" min={0} max={255} value={speed}
            onChange={e => onChange({ sx: +e.target.value })}
          />
          <span className={styles.val}>{speed}</span>
        </label>

        <label className={styles.sliderRow}>
          <span>{params.intensity}</span>
          <input
            type="range" min={0} max={255} value={intensity}
            onChange={e => onChange({ ix: +e.target.value })}
          />
          <span className={styles.val}>{intensity}</span>
        </label>

        {params.c1 && params.c1 !== '!' && (
          <label className={styles.sliderRow}>
            <span>{params.c1}</span>
            <input
              type="range" min={0} max={255} value={c1}
              onChange={e => onChange({ c1: +e.target.value })}
            />
            <span className={styles.val}>{c1}</span>
          </label>
        )}

        {params.c2 && params.c2 !== '!' && (
          <label className={styles.sliderRow}>
            <span>{params.c2}</span>
            <input
              type="range" min={0} max={255} value={c2}
              onChange={e => onChange({ c2: +e.target.value })}
            />
            <span className={styles.val}>{c2}</span>
          </label>
        )}

        {params.c3 && params.c3 !== '!' && (
          <label className={styles.sliderRow}>
            <span>{params.c3}</span>
            <input
              type="range" min={0} max={255} value={c3}
              onChange={e => onChange({ c3: +e.target.value })}
            />
            <span className={styles.val}>{c3}</span>
          </label>
        )}

        <div className={styles.checkboxes}>
          {[
            { label: params.o1, val: o1, key: 'o1' as const },
            { label: params.o2, val: o2, key: 'o2' as const },
            { label: params.o3, val: o3, key: 'o3' as const },
          ].filter(x => x.label && x.label !== '!').map(({ label, val, key }) => (
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
    </div>
  )
}
