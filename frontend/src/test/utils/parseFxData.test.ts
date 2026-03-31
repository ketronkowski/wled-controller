import { describe, it, expect } from 'vitest'
import { parseFxData } from '../../utils/parseFxData'

describe('parseFxData', () => {
  it('returns safe defaults for empty string', () => {
    const r = parseFxData('')
    expect(r.speedLabel).toBe('Speed')
    expect(r.intensityLabel).toBe('Intensity')
    expect(r.colorSlots[0]).toEqual({ active: true, label: 'Fx' })
    expect(r.colorSlots[1]).toEqual({ active: true, label: 'Bg' })
    expect(r.colorSlots[2]).toEqual({ active: true, label: 'Cs' })
  })

  describe('old format (no @)', () => {
    it('parses speed and intensity labels', () => {
      const r = parseFxData('Blink;Rate,Duty')
      expect(r.speedLabel).toBe('Rate')
      expect(r.intensityLabel).toBe('Duty')
    })

    it('parses custom slider labels', () => {
      const r = parseFxData('MyFx;Speed,Intens;Hue,Sat,Val')
      expect(r.c1).toEqual({ show: true, label: 'Hue' })
      expect(r.c2).toEqual({ show: true, label: 'Sat' })
      expect(r.c3).toEqual({ show: true, label: 'Val' })
    })

    it('defaults all color slots to active', () => {
      const r = parseFxData('Solid;Speed,Intensity')
      expect(r.colorSlots[0].active).toBe(true)
      expect(r.colorSlots[1].active).toBe(true)
      expect(r.colorSlots[2].active).toBe(true)
    })

    it('uses default labels when sliders are absent', () => {
      const r = parseFxData('Solid')
      expect(r.speedLabel).toBe('Speed')
      expect(r.intensityLabel).toBe('Intensity')
    })
  })

  describe('new format (with @)', () => {
    it('parses ! as default Speed label', () => {
      const r = parseFxData('Blink@!,Duty cycle;!,!;!;01')
      expect(r.speedLabel).toBe('Speed')
      expect(r.intensityLabel).toBe('Duty cycle')
    })

    it('color slot ! means active with default label', () => {
      const r = parseFxData('Blink@!,Duty cycle;!,!;!;01')
      expect(r.colorSlots[0]).toEqual({ active: true, label: 'Fx' })
      expect(r.colorSlots[1]).toEqual({ active: true, label: 'Bg' })
      expect(r.colorSlots[2]).toEqual({ active: false, label: 'Cs' })
    })

    it('empty color slot means inactive', () => {
      // Fire 2012 — all colors empty → palette-driven
      const r = parseFxData('Fire 2012@Cooling,Spark rate,,2D Blur,Boost;;!;1;pal=35,sx=64,ix=160')
      expect(r.colorSlots[0].active).toBe(false)
      expect(r.colorSlots[1].active).toBe(false)
      expect(r.colorSlots[2].active).toBe(false)
    })

    it('custom color slot label', () => {
      const r = parseFxData('MyFx@!,!;Foreground,Background,Tertiary;!;01')
      expect(r.colorSlots[0]).toEqual({ active: true, label: 'Foreground' })
      expect(r.colorSlots[1]).toEqual({ active: true, label: 'Background' })
      expect(r.colorSlots[2]).toEqual({ active: true, label: 'Tertiary' })
    })

    it('parses c1/c2/c3 from slider positions 2,3,4', () => {
      const r = parseFxData('MyFx@!,!,Width,Height,Depth;!,!;!;01')
      expect(r.c1).toEqual({ show: true, label: 'Width' })
      expect(r.c2).toEqual({ show: true, label: 'Height' })
      expect(r.c3).toEqual({ show: true, label: 'Depth' })
    })

    it('empty slider token means hidden', () => {
      const r = parseFxData('MyFx@!,,;!;!;01')
      expect(r.intensityLabel).toBe('Intensity')
      expect(r.c1.show).toBe(false)
    })

    it('Solid single-color effect: only slot 0 active', () => {
      // "Solid@!;!;;!;1d" → slot0=active, slot1=empty=inactive, slot2=empty=inactive
      const r = parseFxData('Solid@!;!;;!;1d')
      expect(r.colorSlots[0]).toEqual({ active: true, label: 'Fx' })
      expect(r.colorSlots[1]).toEqual({ active: false, label: 'Bg' })
      expect(r.colorSlots[2]).toEqual({ active: false, label: 'Cs' })
    })
  })
})
