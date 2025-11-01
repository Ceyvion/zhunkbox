import type { SlotMap, SlotStyleMap, StickerStyle } from '../types'

const KEY = 'zhunk-design-v1'
const KEY_STYLES = 'zhunk-design-styles-v1'

export function loadDesign(slotCount: number): SlotMap {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return empty(slotCount)
    const parsed = JSON.parse(raw) as SlotMap
    // Normalize to fixed length
    const slots: SlotMap = {}
    for (let i = 0; i < slotCount; i++) {
      slots[i] = parsed[i] ?? null
    }
    return slots
  } catch {
    return empty(slotCount)
  }
}

export function saveDesign(slots: SlotMap) {
  try {
    localStorage.setItem(KEY, JSON.stringify(slots))
  } catch {
    // ignore
  }
}

export function resetDesign() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}

export function loadStyles(): SlotStyleMap {
  try {
    const raw = localStorage.getItem(KEY_STYLES)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as SlotStyleMap
    // basic validation
    const out: SlotStyleMap = {}
    for (const [k, v] of Object.entries(parsed)) {
      const idx = Number(k)
      if (!Number.isFinite(idx) || !v) continue
      out[idx] = normalizeStyle(v as StickerStyle)
    }
    return out
  } catch {
    return {}
  }
}

export function saveStyles(styles: SlotStyleMap) {
  try {
    localStorage.setItem(KEY_STYLES, JSON.stringify(styles))
  } catch {
    // ignore
  }
}

export function resetStyles() {
  try {
    localStorage.removeItem(KEY_STYLES)
  } catch {
    // ignore
  }
}

export function defaultStyle(): StickerStyle {
  return { scale: 1, rotate: 0, depth: 1.2, zIndex: 0 }
}

export function normalizeStyle(s: Partial<StickerStyle>): StickerStyle {
  const d = defaultStyle()
  const scale = clamp(s.scale ?? d.scale, 0.6, 1.6)
  const rotate = Math.max(-180, Math.min(180, s.rotate ?? d.rotate))
  const depth = clamp(s.depth ?? d.depth, 0, 3)
  const zIndex =
    typeof s.zIndex === 'number' && Number.isFinite(s.zIndex) ? s.zIndex : d.zIndex
  return { scale, rotate, depth, zIndex }
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function empty(slotCount: number): SlotMap {
  const s: SlotMap = {}
  for (let i = 0; i < slotCount; i++) s[i] = null
  return s
}
