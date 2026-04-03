import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PaletteSelector } from '../../../components/controls/PaletteSelector'

const PALETTES = ['Default', '* Random Cycle', '* Color 1', '* Colors 1&2', '* Color 1&2&3', '* Colors Only', 'Rainbow', 'Forest']

const USER_COLORS: [[number,number,number],[number,number,number],[number,number,number]] = [
  [255, 0, 0],
  [0, 255, 0],
  [0, 0, 255],
]

describe('PaletteSelector', () => {
  it('renders all palettes', () => {
    render(<PaletteSelector palettes={PALETTES} selected={0} onChange={vi.fn()} />)
    PALETTES.forEach(name => {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    })
  })

  it('filters palettes by search', async () => {
    render(<PaletteSelector palettes={PALETTES} selected={0} onChange={vi.fn()} />)
    await userEvent.type(screen.getByPlaceholderText('Search palettes...'), 'rain')
    expect(screen.getByRole('button', { name: 'Rainbow' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Default' })).not.toBeInTheDocument()
  })

  it('calls onChange with correct palette index when clicked', async () => {
    const onChange = vi.fn()
    render(<PaletteSelector palettes={PALETTES} selected={0} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Forest' }))
    expect(onChange).toHaveBeenCalledWith(7)
  })

  it('calls onChange with 0 for the first palette', async () => {
    const onChange = vi.fn()
    render(<PaletteSelector palettes={PALETTES} selected={2} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Default' }))
    expect(onChange).toHaveBeenCalledWith(0)
  })

  it('renders an empty grid when nothing matches search', async () => {
    render(<PaletteSelector palettes={PALETTES} selected={0} onChange={vi.fn()} />)
    await userEvent.type(screen.getByPlaceholderText('Search palettes...'), 'zzz')
    PALETTES.forEach(name => {
      expect(screen.queryByRole('button', { name })).not.toBeInTheDocument()
    })
  })

  describe('dynamic palette swatches (user-color palettes)', () => {
    it('renders "c1" slot using userColors slot 0', () => {
      render(
        <PaletteSelector
          palettes={PALETTES}
          selected={0}
          paletteColors={{ '2': ['c1'] }}
          userColors={USER_COLORS}
          onChange={vi.fn()}
        />
      )
      const swatches = screen.getAllByTestId('palette-swatch')
      // palette index 2 is "* Color 1" — after sort: Default(0), then alphabetical
      // find the swatch whose button is "* Color 1"
      const btn = screen.getByRole('button', { name: '* Color 1' })
      const swatch = btn.querySelector('[data-testid="palette-swatch"]') as HTMLElement
      expect(swatch.style.background).toContain('rgb(255, 0, 0)')
      expect(swatch.style.background).not.toContain('rgb(128, 128, 128)')
    })

    it('renders "c1"/"c2" slots for Colors 1&2 palette', () => {
      render(
        <PaletteSelector
          palettes={PALETTES}
          selected={0}
          paletteColors={{ '3': ['c1', 'c1', 'c2', 'c2'] }}
          userColors={USER_COLORS}
          onChange={vi.fn()}
        />
      )
      const btn = screen.getByRole('button', { name: '* Colors 1&2' })
      const swatch = btn.querySelector('[data-testid="palette-swatch"]') as HTMLElement
      expect(swatch.style.background).toContain('rgb(255, 0, 0)')
      expect(swatch.style.background).toContain('rgb(0, 255, 0)')
    })

    it('renders all three color slots for Color 1&2&3 palette', () => {
      render(
        <PaletteSelector
          palettes={PALETTES}
          selected={0}
          paletteColors={{ '4': ['c3', 'c2', 'c1'] }}
          userColors={USER_COLORS}
          onChange={vi.fn()}
        />
      )
      const btn = screen.getByRole('button', { name: '* Color 1&2&3' })
      const swatch = btn.querySelector('[data-testid="palette-swatch"]') as HTMLElement
      expect(swatch.style.background).toContain('rgb(255, 0, 0)')
      expect(swatch.style.background).toContain('rgb(0, 255, 0)')
      expect(swatch.style.background).toContain('rgb(0, 0, 255)')
    })

    it('falls back to gray when userColors is not provided', () => {
      render(
        <PaletteSelector
          palettes={PALETTES}
          selected={0}
          paletteColors={{ '2': ['c1'] }}
          onChange={vi.fn()}
        />
      )
      const btn = screen.getByRole('button', { name: '* Color 1' })
      const swatch = btn.querySelector('[data-testid="palette-swatch"]') as HTMLElement
      expect(swatch.style.background).toContain('rgb(128, 128, 128)')
    })

    it('renders random palette without error', () => {
      render(
        <PaletteSelector
          palettes={PALETTES}
          selected={0}
          paletteColors={{ '1': ['r', 'r', 'r', 'r'] }}
          userColors={USER_COLORS}
          onChange={vi.fn()}
        />
      )
      const btn = screen.getByRole('button', { name: '* Random Cycle' })
      const swatch = btn.querySelector('[data-testid="palette-swatch"]') as HTMLElement
      // random palette renders some gradient (not transparent)
      expect(swatch.style.background).toMatch(/linear-gradient/)
    })

    it('renders static palette gradient unaffected', () => {
      render(
        <PaletteSelector
          palettes={PALETTES}
          selected={0}
          paletteColors={{ '6': [[0, 255, 0, 0], [255, 0, 255, 0]] }}
          userColors={USER_COLORS}
          onChange={vi.fn()}
        />
      )
      const btn = screen.getByRole('button', { name: 'Rainbow' })
      const swatch = btn.querySelector('[data-testid="palette-swatch"]') as HTMLElement
      expect(swatch.style.background).toContain('rgb(255, 0, 0)')
      expect(swatch.style.background).toContain('rgb(0, 255, 0)')
    })
  })
})
