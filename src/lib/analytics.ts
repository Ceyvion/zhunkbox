
export type AnalyticsEventPayloads = {
  trinket_add: {
    index: number
    trinketId: string
    replacedId?: string | null
    method: 'tap' | 'drag' | 'swap'
  }
  trinket_remove: {
    index: number
    trinketId: string
    method: 'tap' | 'controls'
  }
  trinket_move: {
    from: number
    to: number
    trinketId: string
    replacedId?: string | null
  }
  randomize: {
    count: number
    inPack: boolean
  }
  design_reset: {
    slotCount: number
  }
  glitter_toggle: {
    enabled: boolean
  }
  checkout_unlocked: {
    placedCount: number
  }
  checkout_start: {
    total: number
    placedCount: number
    items: ReadonlyArray<{ id: string; qty: number }>
    packId?: string | null
    budget: number
  }
  checkout_submit: {
    total: number
    placedCount: number
    items: ReadonlyArray<{ id: string; qty: number }>
    packId?: string | null
    budget: number
  }
}

export type AnalyticsEventName = keyof AnalyticsEventPayloads

export type AnalyticsEvent<E extends AnalyticsEventName = AnalyticsEventName> = {
  name: E
  payload: AnalyticsEventPayloads[E]
  timestamp: number
}

export type AnalyticsSink = (event: AnalyticsEvent) => void

type PayloadArgs<E extends AnalyticsEventName> = AnalyticsEventPayloads[E] extends undefined
  ? []
  : [AnalyticsEventPayloads[E]]

const sinks = new Set<AnalyticsSink>()
const history: AnalyticsEvent[] = []

function defaultSink(event: AnalyticsEvent) {
  history.push(event)
  if (typeof window !== 'undefined') {
    const w = window as typeof window & { __zhunkEvents?: AnalyticsEvent[] }
    if (!w.__zhunkEvents) w.__zhunkEvents = []
    w.__zhunkEvents.push(event)
  }
  if (typeof process !== 'undefined' && process?.env?.ZHUNK_ANALYTICS_DEBUG === '1') {
    if (typeof console !== 'undefined' && typeof console.debug === 'function') {
      console.debug('[analytics]', event.name, event.payload)
    }
  }
}

sinks.add(defaultSink)

export function track<E extends AnalyticsEventName>(name: E, ...args: PayloadArgs<E>) {
  const payload = (args[0] ?? undefined) as AnalyticsEventPayloads[E]
  const event: AnalyticsEvent<E> = {
    name,
    payload,
    timestamp: Date.now(),
  }
  sinks.forEach((sink) => sink(event))
}

export function addAnalyticsSink(sink: AnalyticsSink) {
  sinks.add(sink)
  return () => sinks.delete(sink)
}

export function getAnalyticsHistory(): AnalyticsEvent[] {
  return [...history]
}

export function clearAnalyticsHistory() {
  history.length = 0
}
