import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ColorPicker } from '../../../components/controls/ColorPicker'
import type { ColorSlotConfig } from '../../../utils/parseFxData'

// iro.js uses canvas APIs not available in jsdom; mock it
vi.mock('@jaames/iro', () => ({
  default: {
    ColorPicker: vi.fn(() => ({
      on: vi.fn(),
      off: vi.fn(),
      color: { set: vi.fn() },
    })),
    ui: { Wheel: {}, Slider: {} },
  },
}))

type RGB = [number, number, number]

const DEFAULT_COLORS: [RGB, RGB, RGB] = [[255, 0, 0], [0, 255, 0], [0, 0, 255]]

const ALL_ACTIVE: [ColorSlotConfig, ColorSlotConfig, ColorSlotConfig] = [
  { active: true, label: 'Fx' },
  { active: true, label: 'Bg' },
  { active: true, label: 'Cs' },
]

const SLOT1_INACTIVE: [ColorSlotConfig, ColorSlotConfig, ColorSlotConfig] = [
  { active: true, label: 'Fx' },
  { active: false, label: 'Bg' },
  { active: false, label: 'Cs' },
]

function renderPicker(colorSlots = ALL_ACTIVE, onChange = vi.fn()) {
  render(
    <ColorPicker colors={DEFAULT_COLORS} colorSlots={colorSlots} onChange={onChange} />
  )
}

describe('ColorPicker', () => {
  it('renders slot labels from colorSlots prop', () => {
    renderPicker()
    expect(screen.getByRole('button', { name: /Fx/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Bg/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Cs/ })).toBeInTheDocument()
  })

  it('does NOT render hard-coded Primary / Secondary / Tertiary labels', () => {
    renderPicker()
    expect(screen.queryByText('Primary')).not.toBeInTheDocument()
    expect(screen.queryByText('Secondary')).not.toBeInTheDocument()
    expect(screen.queryByText('Tertiary')).not.toBeInTheDocument()
  })

  it('inactive slots have the inactive class', () => {
    renderPicker(SLOT1_INACTIVE)
    const bgBtn = screen.getByRole('button', { name: /Bg/ })
    const csBtn = screen.getByRole('button', { name: /Cs/ })
    expect(bgBtn.className).toMatch(/inactive/)
    expect(csBtn.className).toMatch(/inactive/)
  })

  it('active slots do NOT have the inactive class', () => {
    renderPicker(SLOT1_INACTIVE)
    const fxBtn = screen.getByRole('button', { name: /Fx/ })
    expect(fxBtn.className).not.toMatch(/inactive/)
  })

  it('inactive slots have descriptive title attribute', () => {
    renderPicker(SLOT1_INACTIVE)
    const bgBtn = screen.getByRole('button', { name: /Bg/ })
    expect(bgBtn.getAttribute('title')).toMatch(/not used by this effect/)
  })

  it('active slots have plain label as title', () => {
    renderPicker(ALL_ACTIVE)
    const fxBtn = screen.getByRole('button', { name: /Fx/ })
    expect(fxBtn.getAttribute('title')).toBe('Fx')
  })

  it('clicking a slot button selects that slot', async () => {
    renderPicker()
    const bgBtn = screen.getByRole('button', { name: /Bg/ })
    await userEvent.click(bgBtn)
    expect(bgBtn.className).toMatch(/active/)
  })

  it('uses custom labels from colorSlots', () => {
    const custom: [ColorSlotConfig, ColorSlotConfig, ColorSlotConfig] = [
      { active: true, label: 'Foreground' },
      { active: true, label: 'Background' },
      { active: false, label: 'Tertiary' },
    ]
    renderPicker(custom)
    expect(screen.getByRole('button', { name: /Foreground/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Background/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Tertiary/ })).toBeInTheDocument()
  })
})
