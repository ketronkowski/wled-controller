import { describe, it, expect } from 'vitest'
import { WLED_EFFECT_DESCRIPTIONS } from '../../data/wledEffectDescriptions'

describe('WLED_EFFECT_DESCRIPTIONS', () => {
  it('contains an entry for "Solid"', () => {
    expect(WLED_EFFECT_DESCRIPTIONS['Solid']).toBeDefined()
  })

  it('contains an entry for "Blink"', () => {
    expect(WLED_EFFECT_DESCRIPTIONS['Blink']).toBeDefined()
  })

  it('contains an entry for "Rainbow"', () => {
    expect(WLED_EFFECT_DESCRIPTIONS['Rainbow']).toBeDefined()
  })

  it('no description is an empty string', () => {
    Object.values(WLED_EFFECT_DESCRIPTIONS).forEach(desc => {
      expect(desc).not.toBe('')
    })
  })

  it('no description is undefined or null', () => {
    Object.values(WLED_EFFECT_DESCRIPTIONS).forEach(desc => {
      expect(desc).toBeTruthy()
    })
  })

  it('has entries for at least 50 effects', () => {
    expect(Object.keys(WLED_EFFECT_DESCRIPTIONS).length).toBeGreaterThanOrEqual(50)
  })
})
