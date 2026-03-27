import { useState, useMemo } from 'react'
import styles from './PaletteSelector.module.css'

interface Props {
  palettes: string[]
  selected: number
  onChange: (pal: number) => void
}

export function PaletteSelector({ palettes, selected, onChange }: Props) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return palettes.map((name, i) => ({ name, i })).filter(({ name }) => name.toLowerCase().includes(q))
  }, [palettes, search])

  return (
    <div className={styles.wrapper}>
      <input
        className={styles.search}
        placeholder="Search palettes..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div className={styles.grid}>
        {filtered.map(({ name, i }) => (
          <button
            key={i}
            title={name}
            className={`${styles.item} ${selected === i ? styles.selected : ''}`}
            onClick={() => onChange(i)}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  )
}
