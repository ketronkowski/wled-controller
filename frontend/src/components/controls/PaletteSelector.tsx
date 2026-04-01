import { useState, useMemo, useEffect, useRef } from 'react'
import styles from './PaletteSelector.module.css'

interface Props {
  palettes: string[]
  selected: number
  paletteColors?: Record<string, Array<number[] | string>>
  userColors?: [[number,number,number],[number,number,number],[number,number,number]]
  onChange: (pal: number) => void
}

function genGradientCss(
  stops: Array<number[] | string>,
  userColors: [[number,number,number],[number,number,number],[number,number,number]] | undefined
): string {
  if (!stops || stops.length === 0) return 'transparent'
  // Ensure at least 2 stops for a gradient
  const s = stops.length === 1 ? [stops[0], stops[0]] : stops
  const parts: string[] = []
  s.forEach((e, j) => {
    let r: number, g: number, b: number, pos: number
    if (Array.isArray(e) && typeof e[0] === 'number' && e.length === 4) {
      pos = Math.round((e[0] as number) / 255 * 100)
      r = e[1] as number; g = e[2] as number; b = e[3] as number
    } else if (e === 'r') {
      pos = Math.round(j / s.length * 100)
      r = g = b = 140  // gray placeholder for random
    } else if (Array.isArray(e) && e[0] === 'c') {
      // user color reference: ["c", colorIndex1Based]
      const idx = (e[1] as number) - 1
      const uc = userColors?.[idx] ?? [128, 128, 128] as [number,number,number]
      r = uc[0]; g = uc[1]; b = uc[2]
      pos = Math.round(j / s.length * 100)
    } else {
      r = g = b = 128; pos = Math.round(j / s.length * 100)
    }
    parts.push(`rgb(${r},${g},${b}) ${pos}%`)
  })
  return `linear-gradient(to right, ${parts.join(', ')})`
}

export function PaletteSelector({ palettes, selected, paletteColors, userColors, onChange }: Props) {
  const [search, setSearch] = useState('')
  const selectedItemRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    selectedItemRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selected])

  const sortedPalettes = useMemo(() => {
    if (palettes.length === 0) return []
    const def = { name: palettes[0], i: 0 }
    const rest = palettes
      .slice(1)
      .map((name, j) => ({ name, i: j + 1 }))
      .sort((a, b) => a.name.localeCompare(b.name))
    return [def, ...rest]
  }, [palettes])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return sortedPalettes.filter(({ name }) => name.toLowerCase().includes(q))
  }, [sortedPalettes, search])

  return (
    <div className={styles.wrapper}>
      <input
        className={styles.search}
        placeholder="Search palettes..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div className={styles.list}>
        {filtered.map(({ name, i }) => {
          const stops = paletteColors?.[String(i)]
          const gradientStyle = stops ? genGradientCss(stops, userColors) : undefined
          return (
            <button
              key={i}
              ref={selected === i ? selectedItemRef : undefined}
              title={name}
              className={`${styles.item} ${selected === i ? styles.selected : ''}`}
              onClick={() => onChange(i)}
            >
              <span className={styles.paletteName}>{name}</span>
              <span
                className={styles.swatch}
                data-testid="palette-swatch"
                style={gradientStyle ? { background: gradientStyle } : undefined}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
