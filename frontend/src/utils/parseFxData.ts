export interface ColorSlotConfig {
  active: boolean
  label: string
}

export interface FxDataParsed {
  speedLabel: string
  intensityLabel: string
  c1: { show: boolean; label: string }
  c2: { show: boolean; label: string }
  c3: { show: boolean; label: string }
  o1: { show: boolean; label: string }
  o2: { show: boolean; label: string }
  o3: { show: boolean; label: string }
  colorSlots: [ColorSlotConfig, ColorSlotConfig, ColorSlotConfig]
}

const DEFAULT_COLOR_LABELS = ['Fx', 'Bg', 'Cs'] as const

function resolveSlider(val: string | undefined, defaultLabel: string): { show: boolean; label: string } {
  if (val === undefined || val === '') return { show: false, label: defaultLabel }
  if (val === '!') return { show: true, label: defaultLabel }
  return { show: true, label: val }
}

function defaultParsed(): FxDataParsed {
  return {
    speedLabel: 'Speed',
    intensityLabel: 'Intensity',
    c1: { show: false, label: 'Custom 1' },
    c2: { show: false, label: 'Custom 2' },
    c3: { show: false, label: 'Custom 3' },
    o1: { show: false, label: 'Option 1' },
    o2: { show: false, label: 'Option 2' },
    o3: { show: false, label: 'Option 3' },
    colorSlots: [
      { active: true, label: 'Fx' },
      { active: true, label: 'Bg' },
      { active: true, label: 'Cs' },
    ],
  }
}

export function parseFxData(raw: string): FxDataParsed {
  if (!raw) return defaultParsed()

  const parts = raw.split(';')
  const head = parts[0] ?? ''
  const atIdx = head.indexOf('@')

  let sliders: string[]
  let colorPart: string
  let optPart: string

  if (atIdx >= 0) {
    // New format (WLED 0.14+): Name@s0,s1,s2,s3,s4;col0,col1,col2;pal;flags;meta
    sliders = head.slice(atIdx + 1).split(',')
    colorPart = parts[1] ?? ''
    optPart = ''
  } else {
    // Old format (<0.14): Name;s0,s1;c1,c2,c3;o1,o2,o3
    sliders = (parts[1] ?? '').split(',')
    colorPart = ''
    optPart = parts[3] ?? ''
  }

  const speedResolved = resolveSlider(sliders[0], 'Speed')
  const speedLabel = speedResolved.show ? speedResolved.label : 'Speed'

  const intensResolved = resolveSlider(sliders[1], 'Intensity')
  const intensityLabel = intensResolved.show ? intensResolved.label : 'Intensity'

  let c1: { show: boolean; label: string }
  let c2: { show: boolean; label: string }
  let c3: { show: boolean; label: string }

  if (atIdx >= 0) {
    c1 = resolveSlider(sliders[2], 'Custom 1')
    c2 = resolveSlider(sliders[3], 'Custom 2')
    c3 = resolveSlider(sliders[4], 'Custom 3')
  } else {
    const cParts = (parts[2] ?? '').split(',')
    c1 = resolveSlider(cParts[0], 'Custom 1')
    c2 = resolveSlider(cParts[1], 'Custom 2')
    c3 = resolveSlider(cParts[2], 'Custom 3')
  }

  const opts = optPart.split(',')
  const o1 = resolveSlider(opts[0], 'Option 1')
  const o2 = resolveSlider(opts[1], 'Option 2')
  const o3 = resolveSlider(opts[2], 'Option 3')

  let colorSlots: [ColorSlotConfig, ColorSlotConfig, ColorSlotConfig]
  if (atIdx >= 0) {
    const cols = colorPart.split(',')
    colorSlots = [0, 1, 2].map(i => {
      const val = cols[i]
      return {
        active: val !== undefined && val !== '',
        label: val === '!' ? DEFAULT_COLOR_LABELS[i] : (val || DEFAULT_COLOR_LABELS[i]),
      }
    }) as [ColorSlotConfig, ColorSlotConfig, ColorSlotConfig]
  } else {
    // Old format has no color slot info — default all 3 active
    colorSlots = DEFAULT_COLOR_LABELS.map(label => ({ active: true, label })) as [ColorSlotConfig, ColorSlotConfig, ColorSlotConfig]
  }

  return { speedLabel, intensityLabel, c1, c2, c3, o1, o2, o3, colorSlots }
}
