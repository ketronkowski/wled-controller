import { useEffect, useRef, useState } from 'react'
import iro from '@jaames/iro'
import styles from './ColorPicker.module.css'

type RGB = [number, number, number]

interface Props {
  colors: [RGB, RGB, RGB]
  onChange: (colors: [RGB, RGB, RGB]) => void
}

export function ColorPicker({ colors, onChange }: Props) {
  const [activeSlot, setActiveSlot] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const pickerRef = useRef<iro.ColorPicker | null>(null)

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = (color: any) => {
      const newColors: [RGB, RGB, RGB] = [...colors] as [RGB, RGB, RGB]
      newColors[activeSlot] = [color.red, color.green, color.blue]
      onChange(newColors)
    }
    picker.on('color:change', handler)

    pickerRef.current = picker
    return () => {
      picker.off('color:change', handler)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync color when slot or colors prop changes
  useEffect(() => {
    if (pickerRef.current) {
      const [r, g, b] = colors[activeSlot]
      pickerRef.current.color.set({ r, g, b })
    }
  }, [activeSlot, colors])

  const slotLabels = ['Primary', 'Secondary', 'Tertiary']

  return (
    <div className={styles.wrapper}>
      <div className={styles.tabs}>
        {slotLabels.map((label, i) => (
          <button
            key={i}
            className={`${styles.tab} ${activeSlot === i ? styles.active : ''}`}
            onClick={() => setActiveSlot(i)}
          >
            <span
              className={styles.swatch}
              style={{ background: `rgb(${colors[i].join(',')})` }}
            />
            {label}
          </button>
        ))}
      </div>
      <div ref={containerRef} className={styles.pickerContainer} />
    </div>
  )
}
