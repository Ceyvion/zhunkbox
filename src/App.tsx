import { useEffect, useMemo, useRef, useState } from 'react'
import type { SlotMap, SlotStyleMap, StickerStyle, Trinket } from './types'
import catalog from './data/catalog.json'
import packs from './data/packs.json'
import { loadDesign, saveDesign, resetDesign, loadStyles, saveStyles, resetStyles, defaultStyle, normalizeStyle } from './lib/storage'
import { BuilderCanvas } from './components/BuilderCanvas'
import { TrinketTray } from './components/TrinketTray'
import { CheckoutBar } from './components/CheckoutBar'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { clsx } from 'clsx'
import ReactCanvasConfetti from 'react-canvas-confetti'
import { GlitterOverlay } from './components/GlitterOverlay'
import { PhoneCase } from './components/PhoneCase'
import { CutoutTitle } from './components/CutoutTitle'
import { LandingPage } from './components/LandingPage'
import { MobileGuide } from './components/MobileGuide'
import { Coachmarks } from './components/Coachmarks'

type Route = { page: 'landing' | 'builder'; pack?: string }

function parseHash(): Route {
  const h = window.location.hash || '#/'
  const [path, query = ''] = h.slice(1).split('?')
  const params = new URLSearchParams(query)
  if (path === '/builder') {
    return { page: 'builder', pack: params.get('pack') || undefined }
  }
  return { page: 'landing' }
}

function navigate(to: string) {
  window.location.hash = to
}

function App() {
  const [route, setRoute] = useState<Route>(() => parseHash())
  useEffect(() => {
    function onHash() { setRoute(parseHash()) }
    window.addEventListener('hashchange', onHash)
    if (!window.location.hash) navigate('#/')
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const allTrinkets = catalog.trinkets as Trinket[]
  const activePack = (packs as any[]).find((p) => p.id === route.pack)
  const trinkets = useMemo(() => {
    if (route.page !== 'builder') return allTrinkets
    if (!activePack) return allTrinkets
    const set = new Set(activePack.trinkets as string[])
    return allTrinkets.filter(t => set.has(t.id))
  }, [route, activePack, allTrinkets])
  const trinketMap = useMemo(() => Object.fromEntries(trinkets.map(t => [t.id, t])), [trinkets])
  const casePrice = catalog.casePrice
  const MAX_BUDGET = 100
  const maxPrice = useMemo(() => trinkets.reduce((m, t) => Math.max(m, t.price), 0), [trinkets])
  const allowedSlots = Math.max(12, Math.floor((MAX_BUDGET - casePrice) / maxPrice))
  const cols = 4
  const rows = Math.ceil(allowedSlots / cols)
  const slotCount = cols * rows

  const [slots, setSlots] = useState<SlotMap>(() => loadDesign(slotCount))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [slotStyles, setSlotStyles] = useState<SlotStyleMap>(() => loadStyles())
  const [activeSlot, setActiveSlot] = useState<number | null>(null)
  const [glitter, setGlitter] = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const confettiRef = useRef<import('canvas-confetti').CreateTypes | null>(null)
  const [query, setQuery] = useState('')
  const allTags = useMemo(() => Array.from(new Set(trinkets.flatMap(t => t.tags ?? []))).sort(), [trinkets])
  const [activeTag, setActiveTag] = useState<string>('')
  const [trayOpen, setTrayOpen] = useState(true)
  useEffect(() => {
    try {
      const v = localStorage.getItem('tray_open')
      if (v === '0') setTrayOpen(false)
    } catch {}
  }, [])
  useEffect(() => {
    try { localStorage.setItem('tray_open', trayOpen ? '1' : '0') } catch {}
  }, [trayOpen])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  useEffect(() => {
    saveDesign(slots)
  }, [slots])

  useEffect(() => {
    saveStyles(slotStyles)
  }, [slotStyles])

  // When pack changes, drop any placed trinkets not in the current pack
  useEffect(() => {
    const tset = new Set(trinkets.map(t => t.id))
    setSlots(prev => {
      let changed = false
      const next: SlotMap = { ...prev }
      for (const [k, v] of Object.entries(prev)) {
        if (v && !tset.has(v)) { next[Number(k)] = null; changed = true }
      }
      return changed ? next : prev
    })
  }, [trinkets])

  // Clear selection if it doesn't exist in current pack
  useEffect(() => {
    if (selectedId && !trinkets.some(t => t.id === selectedId)) {
      setSelectedId(null)
    }
  }, [trinkets, selectedId])

  const placedCount = useMemo(
    () => Object.values(slots).filter(Boolean).length,
    [slots]
  )

  const items = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const id of Object.values(slots)) {
      if (!id) continue
      counts[id] = (counts[id] ?? 0) + 1
    }
    return Object.entries(counts).map(([id, qty]) => ({ id, qty }))
  }, [slots])

  const filteredTrinkets = useMemo(() => {
    const q = query.trim().toLowerCase()
    return trinkets.filter(t => {
      const matchesQ = !q || t.name.toLowerCase().includes(q) || t.id.includes(q)
      const matchesTag = !activeTag || (t.tags ?? []).includes(activeTag)
      return matchesQ && matchesTag
    })
  }, [trinkets, query, activeTag])

  const total = useMemo(() => {
    let t = casePrice
    for (const { id, qty } of items) {
      const price = trinkets.find((t) => t.id === id)?.price ?? 0
      t += price * qty
    }
    return Number(t.toFixed(2))
  }, [items, casePrice, trinkets])

  function placeAt(index: number, id: string | null) {
    setSlots((prev) => ({ ...prev, [index]: id }))
    setActiveSlot(id ? index : null)
    setSlotStyles((prev) => {
      const next = { ...prev }
      if (id) next[index] = defaultStyle()
      else delete next[index]
      return next
    })
    console.log(id ? 'trinket_add' : 'trinket_remove', { index, id })
  }

  function onReset() {
    const cleared: SlotMap = {}
    for (let i = 0; i < slotCount; i++) cleared[i] = null
    setSlots(cleared)
    resetDesign()
    setSlotStyles({})
    resetStyles()
    setActiveSlot(null)
    console.log('reset')
  }

  function onRandomize() {
    const inPack = Boolean(activePack)
    const count = inPack ? Math.min(slotCount, trinkets.length) : Math.floor(slotCount * 0.4)
    const indices = [...Array(slotCount).keys()]
    // shuffle
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[indices[i], indices[j]] = [indices[j], indices[i]]
    }
    const chosen = indices.slice(0, count)
    const next: SlotMap = {}
    const nextStyle: SlotStyleMap = {}
    for (let i = 0; i < slotCount; i++) next[i] = null
    if (inPack) {
      // Use each item from the active pack once (up to slotCount)
      const pool = [...trinkets]
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[pool[i], pool[j]] = [pool[j], pool[i]]
      }
      pool.slice(0, count).forEach((t, i) => {
        const idx = chosen[i]
        next[idx] = t.id
        nextStyle[idx] = defaultStyle()
      })
    } else {
      for (const idx of chosen) {
        const tr = trinkets[Math.floor(Math.random() * trinkets.length)]
        next[idx] = tr.id
        nextStyle[idx] = defaultStyle()
      }
    }
    setSlots(next)
    setSlotStyles(nextStyle)
    setActiveSlot(null)
    console.log('randomize', { inPack, count })
  }

  function onCheckout() {
    const payload = {
      caseModel: 'iphone-15-pro',
      slots,
      items,
      total,
    }
    alert('Mock checkout payload:\n' + JSON.stringify(payload, null, 2))
    console.log('checkout_start', payload)
  }

  // Gate unlock confetti
  useEffect(() => {
    const unlocked = placedCount >= 3
    if (unlocked && !isUnlocked) {
      setIsUnlocked(true)
      // Fire confetti burst
      confettiRef.current && confettiRef.current({
        particleCount: 140,
        spread: 70,
        startVelocity: 35,
        decay: 0.88,
        origin: { y: 0.6 },
        scalar: 0.8,
      })
      console.log('checkout_unlocked')
    }
    if (!unlocked && isUnlocked) setIsUnlocked(false)
  }, [placedCount, isUnlocked])

  const [draggingFromIndex, setDraggingFromIndex] = useState<number | null>(null)

  function onDragStart(e: any) {
    const id = String(e.active.id)
    if (id.startsWith('trinket:')) setDraggingId(id.split(':')[1])
    if (id.startsWith('slotitem:')) {
      const idx = Number(id.split(':')[1])
      setDraggingFromIndex(idx)
      const current = slots[idx]
      if (current) setDraggingId(current)
    }
  }

  function onDragOver() {
    // highlight handled in children via dnd-kit over state if needed
  }

  function onDragEnd(e: any) {
    const overId = e.over?.id
    if (overId && String(overId).startsWith('slot:')) {
      const idxTo = Number(String(overId).split(':')[1])
      if (draggingId != null) {
        setSlots((prev) => {
          const next = { ...prev }
          if (draggingFromIndex != null && draggingFromIndex !== idxTo) {
            const from = draggingFromIndex
            const destVal = next[idxTo] ?? null
            next[idxTo] = draggingId
            next[from] = destVal
            // swap styles alongside items
            setSlotStyles((s) => {
              const ns: SlotStyleMap = { ...s }
              const fromStyle = ns[from]
              const toStyle = ns[idxTo]
              if (fromStyle) ns[idxTo] = fromStyle
              else delete ns[idxTo]
              if (toStyle) ns[from] = toStyle
              else delete ns[from]
              return ns
            })
            setActiveSlot(idxTo)
          } else {
            next[idxTo] = draggingId
            // move style from origin if applicable else default
            setSlotStyles((s) => {
              const ns: SlotStyleMap = { ...s }
              if (draggingFromIndex != null) {
                if (ns[draggingFromIndex]) {
                  ns[idxTo] = ns[draggingFromIndex]
                  delete ns[draggingFromIndex]
                } else {
                  ns[idxTo] = defaultStyle()
                }
              } else {
                ns[idxTo] = defaultStyle()
              }
              return ns
            })
            setActiveSlot(idxTo)
          }
          return next
        })
      }
    }
    setDraggingFromIndex(null)
    setDraggingId(null)
  }

  function updateStyle(index: number, partial: Partial<StickerStyle>) {
    setSlotStyles((prev) => {
      const current = prev[index] ?? defaultStyle()
      return { ...prev, [index]: normalizeStyle({ ...current, ...partial }) }
    })
  }

  function removeAt(index: number) {
    const removed = slots[index] ?? null
    setSlots((prev) => ({ ...prev, [index]: null }))
    setSlotStyles((prev) => {
      const next = { ...prev }
      delete next[index]
      return next
    })
    // Re-select the removed trinket so it's easy to place again
    if (removed && trinkets.some(t => t.id === removed)) {
      setSelectedId(removed)
    }
    setActiveSlot(null)
  }

  if (route.page === 'landing') {
    return (
      <div className="min-h-full p-4 sm:p-6">
        <LandingPage onChoose={(id) => navigate(`#/builder?pack=${id}`)} />
      </div>
    )
  }

  return (
    <div className="min-h-full p-4 sm:p-6 relative overflow-hidden">
      <GlitterOverlay enabled={glitter} />
      <ReactCanvasConfetti onInit={({ confetti }) => (confettiRef.current = confetti)} style={{ position: 'fixed', pointerEvents: 'none', inset: 0 }} />
      <header className="mb-4 flex items-center justify-between">
        <CutoutTitle text="The Zhunk Box — DIY Case Lab" />
        <div className="flex items-center gap-2">
          {activePack ? (
            <span className="chip bg-yellow-200">Pack: {activePack.name}</span>
          ) : null}
          <button className="chip" onClick={() => navigate('#/')}>← Packs</button>
          <span className="text-sm opacity-70">v0.2 prototype</span>
        </div>
      </header>

      <main className="grid gap-4 sm:gap-6 md:grid-cols-[1fr_340px]">
        <section className="paper p-4 sm:p-6 order-2 md:order-1">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Builder</h2>
            <div className="flex items-center gap-2">
              <button id="btn-randomize" className="chip" title="Fill a few slots with random stickers (from this pack if selected)" onClick={onRandomize}>Randomize</button>
              <button className="chip" onClick={onReset}>Reset</button>
              <label className="chip cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="mr-1"
                  checked={glitter}
                  onChange={(e) => {
                    setGlitter(e.target.checked)
                    if (e.target.checked && confettiRef.current) {
                      confettiRef.current({ particleCount: 60, spread: 60, origin: { y: 0.4 }, scalar: 0.7 })
                    }
                    console.log('glitter_toggle', { enabled: e.target.checked })
                  }}
                />
                Glitter
              </label>
            </div>
          </div>

          {/* Guidance: rich mobile tip + subtle desktop text */}
          <MobileGuide selectedId={selectedId} packName={activePack?.name} />
          <div className="hidden sm:block mb-3 text-sm opacity-70">
            {selectedId
              ? 'Tip: Tap a slot to place your selected sticker. Drag to move; tap again for controls.'
              : 'Tip: Pick a sticker from the tray, then tap a slot to place it. Drag to move; tap again for controls.'}
            {activePack ? ' Randomize uses only the current pack.' : ''}
          </div>

          {/* Onboarding coachmarks (only when a pack is active) */}
          <Coachmarks enabled={Boolean(activePack)} />

          <DndContext sensors={sensors} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}>
            <PhoneCase>
              <div id="case-area">
                <BuilderCanvas
                  cols={cols}
                  rows={rows}
                  slots={slots}
                  slotStyles={slotStyles}
                  selectedId={selectedId}
                  activeSlot={activeSlot}
                  onSelectSlot={setActiveSlot}
                  onPlace={placeAt}
                  onRemove={removeAt}
                  onStyleChange={updateStyle}
                  trinketMap={trinketMap}
                />
              </div>
            </PhoneCase>
            <DragOverlay dropAnimation={{ duration: 150 }}>
              {draggingId ? (
                <div className={clsx('chip wonky', 'bg-yellow-200 scale-110')} style={{ ['--r' as any]: `${(Math.random() * 4 - 2).toFixed(2)}deg` }}>
                  <span className="inline-flex items-center gap-2">
                    {trinketMap[draggingId]?.icon ? (
                      <img src={trinketMap[draggingId].icon!} alt="" className="w-5 h-5" />
                    ) : null}
                    <span className="font-semibold">{trinketMap[draggingId]?.name ?? draggingId}</span>
                  </span>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </section>

        <aside className="space-y-4 order-1 md:order-2">
          <section id="tray" className="paper p-4 sm:p-5 sticky top-2 md:static z-30">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h2 className="font-semibold">Sticker Tray</h2>
              <button
                className="chip sm:hidden"
                aria-expanded={trayOpen}
                aria-controls="tray-content"
                onClick={() => setTrayOpen(v => !v)}
              >
                {trayOpen ? 'Hide' : 'Show'}
              </button>
            </div>
            <div id="tray-content" className={`${trayOpen ? '' : 'hidden sm:block'}`}>
              <div className="mb-3 flex gap-2 items-center">
                <input
                  placeholder="Search"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="chip w-full bg-white focus:outline-none"
                />
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                <button className={`chip ${activeTag === '' ? 'bg-yellow-200' : ''}`} onClick={() => setActiveTag('')}>All</button>
                {allTags.map(tag => (
                  <button key={tag} className={`chip ${activeTag === tag ? 'bg-yellow-200' : ''}`} onClick={() => setActiveTag(tag)}>
                    {tag}
                  </button>
                ))}
              </div>
              <div className="max-h-[40vh] sm:max-h-[60vh] overflow-auto pr-1">
                <TrinketTray
                  trinkets={filteredTrinkets}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
              </div>
            </div>
          </section>

          <CheckoutBar
            placedCount={placedCount}
            minReq={3}
            total={total}
            budget={MAX_BUDGET}
            onCheckout={onCheckout}
          />
        </aside>
      </main>
    </div>
  )
}

export default App
