import { track } from './analytics'

export type PlacementMethod = 'tap' | 'drag' | 'swap'
export type RemovalMethod = 'tap' | 'controls' | 'toolbar'

export function recordPlacement(args: {
  index: number
  trinketId: string
  replacedId?: string | null
  method: PlacementMethod
}) {
  track('trinket_add', {
    index: args.index,
    trinketId: args.trinketId,
    replacedId: args.replacedId,
    method: args.method,
  })
}

export function recordRemoval(args: {
  index: number
  trinketId: string
  method: RemovalMethod
}) {
  track('trinket_remove', {
    index: args.index,
    trinketId: args.trinketId,
    method: args.method,
  })
}

export function recordMove(args: {
  from: number
  to: number
  trinketId: string
  replacedId?: string | null
}) {
  track('trinket_move', {
    from: args.from,
    to: args.to,
    trinketId: args.trinketId,
    replacedId: args.replacedId,
  })
}

export function recordRandomize(args: { count: number; inPack: boolean }) {
  track('randomize', {
    count: args.count,
    inPack: args.inPack,
  })
}

export function recordReset(slotCount: number) {
  track('design_reset', { slotCount })
}

export function recordGlitterToggle(enabled: boolean) {
  track('glitter_toggle', { enabled })
}

export function recordCheckoutUnlocked(placedCount: number) {
  track('checkout_unlocked', { placedCount })
}

export function recordCheckoutStart(args: {
  total: number
  placedCount: number
  items: ReadonlyArray<{ id: string; qty: number }>
  packId?: string | null
  budget: number
}) {
  track('checkout_start', {
    total: args.total,
    placedCount: args.placedCount,
    items: args.items,
    packId: args.packId,
    budget: args.budget,
  })
}

export function recordCheckoutSubmit(args: {
  total: number
  placedCount: number
  items: ReadonlyArray<{ id: string; qty: number }>
  packId?: string | null
  budget: number
}) {
  track('checkout_submit', {
    total: args.total,
    placedCount: args.placedCount,
    items: args.items,
    packId: args.packId,
    budget: args.budget,
  })
}
