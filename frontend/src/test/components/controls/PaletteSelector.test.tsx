import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PaletteSelector } from '../../../components/controls/PaletteSelector'

const PALETTES = ['Default', '* Random Cycle', '* Color 1', 'Rainbow', 'Forest']

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
    expect(onChange).toHaveBeenCalledWith(4)
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
})
