export type SlotId = number

export type SlotMap = Record<SlotId, string | null>

export type StickerStyle = {
  scale: number // 0.6 - 1.6
  rotate: number // degrees
  depth: number // 0 - 3 (2.5D drop-shadow intensity)
  zIndex: number
}

export type SlotStyleMap = Partial<Record<SlotId, StickerStyle>>

export type Trinket = {
  id: string
  name: string
  price: number
  icon?: string
  tags?: string[]
}
