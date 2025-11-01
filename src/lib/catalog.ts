import catalog from '../data/catalog.json'
import type { Trinket } from '../types'

export type CatalogData = {
  casePrice: number
  trinkets: Trinket[]
}

export const bundledCatalog: CatalogData = {
  casePrice: typeof catalog.casePrice === 'number' ? catalog.casePrice : 18,
  trinkets: (Array.isArray(catalog.trinkets) ? catalog.trinkets : []) as Trinket[],
}

export function normalizeCatalogResponse(data: unknown): CatalogData {
  if (!data || typeof data !== 'object') return bundledCatalog
  const raw = data as Record<string, unknown>
  const casePrice =
    typeof raw.casePrice === 'number' && Number.isFinite(raw.casePrice) && raw.casePrice > 0
      ? raw.casePrice
      : bundledCatalog.casePrice
  const rawTrinkets = Array.isArray(raw.trinkets) ? raw.trinkets : []
  const trinkets: Trinket[] = []
  for (const candidate of rawTrinkets) {
    if (!candidate || typeof candidate !== 'object') continue
    const record = candidate as Record<string, unknown>
    const id = String(record.id ?? '').trim()
    const name = String(record.name ?? '').trim()
    const price = Number(record.price)
    if (!id || !name || !Number.isFinite(price)) continue
    const iconValue = typeof record.icon === 'string' && record.icon.trim() !== '' ? record.icon.trim() : undefined
    const tagsValue = Array.isArray(record.tags)
      ? record.tags.map((tag) => String(tag).trim()).filter(Boolean)
      : undefined
    const next: Trinket = { id, name, price }
    if (iconValue) next.icon = iconValue
    if (tagsValue && tagsValue.length > 0) next.tags = tagsValue
    trinkets.push(next)
  }
  return {
    casePrice,
    trinkets: trinkets.length > 0 ? trinkets : bundledCatalog.trinkets,
  }
}
