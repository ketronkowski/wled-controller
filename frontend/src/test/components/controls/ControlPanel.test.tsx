import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ControlPanel } from '../../../components/controls/ControlPanel'
import type { WledState } from '../../../types/wled'

// iro.js requires canvas which jsdom doesn't support — mock the whole module
vi.mock('../../../components/controls/ColorPicker', () => ({
  ColorPicker: () => <div data-testid="color-picker-mock" />,
}))

function makeState(overrides: Partial<WledState> = {}): WledState {
  return {
    on: true,
    bri: 128,
    transition: 7,
    ps: -1,
    pl: -1,
    mainseg: 0,
    seg: [{
      id: 0, start: 0, stop: 144, len: 144,
      grp: 1, spc: 0, of: 0,
      on: true, frz: false, bri: 255, cct: 127,
      col: [[255, 100, 0], [0, 0, 0], [0, 0, 0]],
      fx: 9, sx: 128, ix: 128, pal: 2,
      c1: 128, c2: 128, c3: 16,
      sel: true, rev: false, mi: false,
      o1: false, o2: false, o3: false,
      si: 0, m12: 0,
    }],
    ...overrides,
  }
}

const EFFECTS = ['Solid', 'Blink', 'Rainbow']
const PALETTES = ['Default', 'Rainbow', 'Forest']

describe('ControlPanel', () => {
  it('renders the power button', () => {
    render(
      <ControlPanel
        state={makeState()}
        effects={EFFECTS}
        fxData={[]}
        palettes={PALETTES}
        onCommand={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: '⏻' })).toBeInTheDocument()
  })

  it('calls onCommand with on:false when device is on and power button clicked', async () => {
    const onCommand = vi.fn()
    render(
      <ControlPanel
        state={makeState({ on: true })}
        effects={EFFECTS}
        fxData={[]}
        palettes={PALETTES}
        onCommand={onCommand}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: '⏻' }))
    expect(onCommand).toHaveBeenCalledWith({ on: false })
  })

  it('calls onCommand with on:true when device is off and power button clicked', async () => {
    const onCommand = vi.fn()
    render(
      <ControlPanel
        state={makeState({ on: false })}
        effects={EFFECTS}
        fxData={[]}
        palettes={PALETTES}
        onCommand={onCommand}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: '⏻' }))
    expect(onCommand).toHaveBeenCalledWith({ on: true })
  })

  it('renders brightness slider with correct value', () => {
    render(
      <ControlPanel
        state={makeState({ bri: 200 })}
        effects={EFFECTS}
        fxData={[]}
        palettes={PALETTES}
        onCommand={vi.fn()}
      />
    )
    const slider = screen.getByRole('slider')
    expect(slider).toHaveValue('200')
  })

  it('shows Colors tab by default with ColorPicker', () => {
    render(
      <ControlPanel
        state={makeState()}
        effects={EFFECTS}
        fxData={[]}
        palettes={PALETTES}
        onCommand={vi.fn()}
      />
    )
    expect(screen.getByTestId('color-picker-mock')).toBeInTheDocument()
  })

  it('switches to Effects tab and shows effect list', async () => {
    render(
      <ControlPanel
        state={makeState()}
        effects={EFFECTS}
        fxData={[]}
        palettes={PALETTES}
        onCommand={vi.fn()}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: 'Effects' }))
    expect(screen.getByPlaceholderText('Search effects...')).toBeInTheDocument()
    EFFECTS.forEach(name => expect(screen.getByRole('button', { name })).toBeInTheDocument())
  })

  it('switches to Palettes tab and shows palette list', async () => {
    render(
      <ControlPanel
        state={makeState()}
        effects={EFFECTS}
        fxData={[]}
        palettes={PALETTES}
        onCommand={vi.fn()}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: 'Palettes' }))
    expect(screen.getByPlaceholderText('Search palettes...')).toBeInTheDocument()
    PALETTES.forEach(name => expect(screen.getByRole('button', { name })).toBeInTheDocument())
  })

  it('disables power button when sending', () => {
    render(
      <ControlPanel
        state={makeState()}
        effects={EFFECTS}
        fxData={[]}
        palettes={PALETTES}
        onCommand={vi.fn()}
        sending={true}
      />
    )
    expect(screen.getByRole('button', { name: '⏻' })).toBeDisabled()
  })

  it('shows empty state when no segment data', () => {
    render(
      <ControlPanel
        state={makeState({ seg: [] })}
        effects={EFFECTS}
        fxData={[]}
        palettes={PALETTES}
        onCommand={vi.fn()}
      />
    )
    expect(screen.getByText('No segment data')).toBeInTheDocument()
  })
})
