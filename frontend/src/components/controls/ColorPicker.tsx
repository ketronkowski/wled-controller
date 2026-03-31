import { useEffect, useRef, useState } from 'react'
import iro from '@jaames/iro'
import type { ColorSlotConfig } from '../../utils/parseFxData'
import styles from './ColorPicker.module.css'

type RGB = [number, number, number]

interface Props {
  colors: [RGB, RGB, RGB]
  colorSlots: [ColorSlotConfig, ColorSlotConfig, ColorSlotConfig]
  onChange: (colors: [RGB, RGB, RGB]) => void
}

export function ColorPicker({ colors, colorSlots, onChange }: Props) {
  const [activeSlot, setActiveSlot] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const pickerRef = useRef<iro.ColorPicker | null>(null)

  // Keep refs current so the iro event handler never reads stale closure values
  const activeSlotRef = useRef(activeSlot)
  const colorsRef = useRef(colors)
  const onChangeRef = useRef(onChange)
  useEffect(() => { activeSlotRef.current = activeSlot }, [activeSlot])
  useEffect(() => { colorsRef.current = colors }, [colors])
  useEffect(() => { onChangeRef.current = onChange }, [onChange])

  // If the active slot becomes inactive (effect changed), reset to first active slot
  useEffect(() => {
    const firstActive = colorSlots.findIndex(s => s.active)
    if (firstActive >= 0 && !colorSlots[activeSlot]?.active) {
      setActiveSlot(firstActive)
    }
  }, [colorSlots]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!containerRef.current) return
    const picker = iro.ColorPicker(containerRef.current, {
      width: 200,
      color: { r: colors[0][0], g: colors[0][1], b: colors[0][2] },
      layout: [
        { component: iro.ui.Wheel },
        { component: iro.ui.Slider, options: { sliderType: 'value' } },
      ],
      wheelLightness: false,
      borderWidth: 2,
      borderColor: '#404040',
    } as Parameters<typeof iro.ColorPicker>[1])

    // Use input:change (user interaction only) instead of color:change (fires on
    // programmatic set() too) to avoid a feedback loop when syncing the wheel to
    // the selected slot's color.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = (color: any) => {
      const newColors: [RGB, RGB, RGB] = [...colorsRef.current] as [RGB, RGB, RGB]
      newColors[activeSlotRef.current] = [color.red, color.green, color.blue]
      onChangeRef.current(newColors)
    }
    picker.on('input:change', handler)

    pickerRef.current = picker
    return () => {
      picker.off('input:change', handler)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync color wheel when active slot or colors change
  useEffect(() => {
    if (pickerRef.current) {
      const [r, g, b] = colors[activeSlot]
      pickerRef.current.color.set({ r, g, b })
    }
  }, [activeSlot, colors])

  const activeSlots = colorSlots.map((slot, i) => ({ slot, i })).filter(({ slot }) => slot.active)

  if (activeSlots.length === 0) {
    return (
      <div className={styles.paletteOnly}>
        This effect uses the palette — set colors via the Palettes tab.
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.tabs}>
        {activeSlots.map(({ slot, i }) => (
          <button
            key={i}
            className={`${styles.tab} ${activeSlot === i ? styles.active : ''}`}
            onClick={() => setActiveSlot(i)}
            title={slot.label}
          >
            <span
              className={styles.swatch}
              style={{ background: `rgb(${colors[i].join(',')})` }}
            />
            {slot.label}
          </button>
        ))}
      </div>
      <div ref={containerRef} className={styles.pickerContainer} />
    </div>
  )
}
