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

  it('inactive slots are NOT rendered', () => {
    renderPicker(SLOT1_INACTIVE)
    expect(screen.queryByRole('button', { name: /Bg/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Cs/ })).not.toBeInTheDocument()
  })

  it('only active slots are rendered', () => {
    renderPicker(SLOT1_INACTIVE)
    expect(screen.getByRole('button', { name: /Fx/ })).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(1)
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

  it('uses custom labels from colorSlots and hides inactive slot', () => {
    const custom: [ColorSlotConfig, ColorSlotConfig, ColorSlotConfig] = [
      { active: true, label: 'Foreground' },
      { active: true, label: 'Background' },
      { active: false, label: 'Tertiary' },
    ]
    renderPicker(custom)
    expect(screen.getByRole('button', { name: /Foreground/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Background/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Tertiary/ })).not.toBeInTheDocument()
  })
})
