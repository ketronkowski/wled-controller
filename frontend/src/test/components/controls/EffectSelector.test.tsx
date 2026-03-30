import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EffectSelector } from '../../../components/controls/EffectSelector'

const EFFECTS = ['Solid', 'Blink', 'Breathe', 'Rainbow', 'Fire 2012']

const defaultProps = {
  effects: EFFECTS,
  fxData: [],
  selectedFx: 0,
  speed: 128,
  intensity: 128,
  c1: 128,
  c2: 128,
  c3: 16,
  o1: false,
  o2: false,
  o3: false,
  onChange: vi.fn(),
}

describe('EffectSelector', () => {
  it('renders all effects when search is empty', () => {
    render(<EffectSelector {...defaultProps} />)
    EFFECTS.forEach(name => {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    })
  })

  it('filters effects by search query', async () => {
    render(<EffectSelector {...defaultProps} />)
    const input = screen.getByPlaceholderText('Search effects...')
    await userEvent.type(input, 'rain')
    expect(screen.getByRole('button', { name: 'Rainbow' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Solid' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Blink' })).not.toBeInTheDocument()
  })

  it('search is case-insensitive', async () => {
    render(<EffectSelector {...defaultProps} />)
    await userEvent.type(screen.getByPlaceholderText('Search effects...'), 'FIRE')
    expect(screen.getByRole('button', { name: 'Fire 2012' })).toBeInTheDocument()
  })

  it('shows no results when nothing matches', async () => {
    render(<EffectSelector {...defaultProps} />)
    await userEvent.type(screen.getByPlaceholderText('Search effects...'), 'zzznomatch')
    EFFECTS.forEach(name => {
      expect(screen.queryByRole('button', { name })).not.toBeInTheDocument()
    })
  })

  it('calls onChange with correct fx index when an effect is clicked', async () => {
    const onChange = vi.fn()
    render(<EffectSelector {...defaultProps} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Rainbow' }))
    expect(onChange).toHaveBeenCalledWith({ fx: 3 })
  })

  it('renders Speed and Intensity sliders', () => {
    render(<EffectSelector {...defaultProps} />)
    const sliders = screen.getAllByRole('slider')
    // At minimum: Speed + Intensity = 2 sliders
    expect(sliders.length).toBeGreaterThanOrEqual(2)
  })

  it('calls onChange with sx when speed slider changes', () => {
    const onChange = vi.fn()
    render(<EffectSelector {...defaultProps} onChange={onChange} />)
    const [speedSlider] = screen.getAllByRole('slider')
    fireEvent.change(speedSlider, { target: { value: '200' } })
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ sx: 200 }))
  })

  it('uses fxdata labels when provided', () => {
    // fxdata format: "name;SpeedLabel,IntensLabel;C1Label,C2Label,C3Label"
    const fxData = ['Solid', 'Blink;Rate,Duty;Hue,Sat,Val']
    render(<EffectSelector {...defaultProps} fxData={fxData} selectedFx={1} />)
    expect(screen.getByText('Rate')).toBeInTheDocument()
    expect(screen.getByText('Duty')).toBeInTheDocument()
  })

  it('falls back to default Speed/Intensity labels when fxdata is empty', () => {
    render(<EffectSelector {...defaultProps} fxData={[]} selectedFx={0} />)
    expect(screen.getByText('Speed')).toBeInTheDocument()
    expect(screen.getByText('Intensity')).toBeInTheDocument()
  })

  it('shows description panel when selected effect has a known description', () => {
    render(<EffectSelector {...defaultProps} effects={['Solid']} selectedFx={0} />)
    expect(screen.getByText(/All LEDs display the primary color/)).toBeInTheDocument()
  })

  it('shows the effect name in the description panel label', () => {
    render(<EffectSelector {...defaultProps} effects={['Solid']} selectedFx={0} />)
    expect(screen.getByText(/ℹ Solid/)).toBeInTheDocument()
  })

  it('does not show description panel when selected effect is not in the descriptions map', () => {
    render(<EffectSelector {...defaultProps} effects={['UnknownEffect999']} selectedFx={0} />)
    expect(screen.queryByText(/ℹ/)).not.toBeInTheDocument()
  })

  it('description updates when selected effect changes', () => {
    const { rerender } = render(
      <EffectSelector {...defaultProps} effects={['Solid', 'Rainbow']} selectedFx={0} />
    )
    expect(screen.getByText(/All LEDs display the primary color/)).toBeInTheDocument()

    rerender(
      <EffectSelector {...defaultProps} effects={['Solid', 'Rainbow']} selectedFx={1} />
    )
    expect(screen.queryByText(/All LEDs display the primary color/)).not.toBeInTheDocument()
    expect(screen.getByText(/Displays rainbow colors along the whole strip/)).toBeInTheDocument()
  })
})
