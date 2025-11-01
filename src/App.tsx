import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { SlotMap, SlotStyleMap, StickerStyle, Trinket } from './types'
import packs from './data/packs.json'
import { AdminPage } from './components/AdminPage'
import { loadDesign, saveDesign, resetDesign, loadStyles, saveStyles, resetStyles, defaultStyle, normalizeStyle } from './lib/storage'
import { useHistory } from './hooks/useHistory'
import {
  recordCheckoutStart,
  recordCheckoutSubmit,
  recordCheckoutUnlocked,
  recordGlitterToggle,
  recordMove,
  recordPlacement,
  recordRandomize,
  recordRemoval,
  recordReset,
  type RemovalMethod,
} from './lib/builderMetrics'
import { BuilderCanvas } from './components/BuilderCanvas'
import { TrinketTray } from './components/TrinketTray'
import { CheckoutBar } from './components/CheckoutBar'
import { FloatingToolbar } from './components/FloatingToolbar'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { clsx } from 'clsx'
import ReactCanvasConfetti from 'react-canvas-confetti'
import { GlitterOverlay } from './components/GlitterOverlay'
import { PhoneCase } from './components/PhoneCase'
import { CutoutTitle } from './components/CutoutTitle'
import { LandingPage } from './components/LandingPage'
import { MobileGuide } from './components/MobileGuide'
import { Coachmarks } from './components/Coachmarks'
import { Modal } from './components/Modal'
import { HelpModal } from './components/HelpModal'
import { Toasts, type Toast } from './components/Toasts'
import { ThemeToggle, type Theme } from './components/ThemeToggle'
import { bundledCatalog, normalizeCatalogResponse, type CatalogData } from './lib/catalog'
import html2canvas from 'html2canvas'

type Route = { page: 'landing' | 'builder' | 'admin'; pack?: string }

const THEME_KEY = 'zhunk_theme'

function isTheme(value: string | null): value is Theme {
  return (
    value === 'light' ||
    value === 'dark' ||
    value === 'sakura' ||
    value === 'matcha' ||
    value === 'coquette' ||
    value === 'midnight'
  )
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  try {
    const stored = window.localStorage.getItem(THEME_KEY)
    if (isTheme(stored)) return stored
  } catch {}
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function parseHash(): Route {
  const h = window.location.hash || '#/'
  const [path, query = ''] = h.slice(1).split('?')
  const params = new URLSearchParams(query)
  if (path === '/builder') {
    return { page: 'builder', pack: params.get('pack') || undefined }
  }
  if (path === '/admin') {
    return { page: 'admin' }
  }
  return { page: 'landing' }
}

function navigate(to: string) {
  window.location.hash = to
}

function App() {
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme())
  const [route, setRoute] = useState<Route>(() => parseHash())
  const [catalogData, setCatalogData] = useState<CatalogData>(() => bundledCatalog)
  const [catalogStatus, setCatalogStatus] = useState<'idle' | 'loading' | 'error'>('idle')

  const loadCatalog = useCallback(async () => {
    try {
      setCatalogStatus('loading')
      const res = await fetch('/api/catalog', { credentials: 'include' })
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`)
      const payload = await res.json()
      const normalized = normalizeCatalogResponse(payload)
      setCatalogData(normalized)
      setCatalogStatus('idle')
      return normalized
    } catch (error) {
      console.warn('Failed to fetch catalog from API, continuing with bundled data.', error)
      setCatalogStatus('error')
      return null
    }
  }, [])

  useEffect(() => {
    loadCatalog()
  }, [loadCatalog])
  useEffect(() => {
    function onHash() { setRoute(parseHash()) }
    window.addEventListener('hashchange', onHash)
    if (!window.location.hash) navigate('#/')
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = theme
    root.style.colorScheme = theme
  }, [theme])

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key === THEME_KEY && isTheme(event.newValue)) {
        setTheme(event.newValue)
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    if (!window.matchMedia) return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    function onChange(e: MediaQueryListEvent) {
      try {
        const stored = localStorage.getItem(THEME_KEY)
        if (!isTheme(stored)) {
          setTheme(e.matches ? 'dark' : 'light')
        }
      } catch {}
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const handleThemeToggle = useCallback((next: Theme) => {
    setTheme(next)
    try { localStorage.setItem(THEME_KEY, next) } catch {}
  }, [])

  const allTrinkets = catalogData.trinkets as Trinket[]
  const activePack = (packs as any[]).find((p) => p.id === route.pack)
  const trinkets = useMemo(() => {
    if (route.page !== 'builder') return allTrinkets
    if (!activePack) return allTrinkets
    const set = new Set(activePack.trinkets as string[])
    return allTrinkets.filter(t => set.has(t.id))
  }, [route, activePack, allTrinkets])
  const trinketMap = useMemo(() => Object.fromEntries(trinkets.map(t => [t.id, t])), [trinkets])
  const casePrice = catalogData.casePrice
  const MAX_BUDGET = 100
  const SLOT_COUNT = 20
  const cols = 4
  const rows = Math.ceil(SLOT_COUNT / cols)
  const slotCount = SLOT_COUNT

  const slotsHistory = useHistory<SlotMap>(loadDesign(slotCount), 50)
  const stylesHistory = useHistory<SlotStyleMap>(loadStyles(), 50)
  const slots = slotsHistory.state
  const slotStyles = stylesHistory.state
  const setSlots = slotsHistory.set
  const setSlotStyles = stylesHistory.set
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeSlot, setActiveSlot] = useState<number | null>(null)
  const [glitter, setGlitter] = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [coachOpen, setCoachOpen] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastSeq = useRef(1)
  const confettiRef = useRef<import('canvas-confetti').CreateTypes | null>(null)
  const [query, setQuery] = useState('')
  const allTags = useMemo(() => Array.from(new Set(trinkets.flatMap(t => t.tags ?? []))).sort(), [trinkets])
  const [activeTag, setActiveTag] = useState<string>('')
  const [trayOpen, setTrayOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    try {
      const stored = window.localStorage.getItem('tray_open')
      if (stored === '0') return false
      if (stored === '1') return true
    } catch {}
    return window.matchMedia('(min-width: 640px)').matches
  })
  useEffect(() => {
    try { localStorage.setItem('tray_open', trayOpen ? '1' : '0') } catch {}
  }, [trayOpen])

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    if (route.page !== 'builder') return

    function handleKeyDown(e: KeyboardEvent) {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const mod = isMac ? e.metaKey : e.ctrlKey

      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        slotsHistory.undo()
        stylesHistory.undo()
        pushToast('Undo', 'info')
      } else if (mod && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        slotsHistory.redo()
        stylesHistory.redo()
        pushToast('Redo', 'info')
      } else if (e.key === 'p' && mod) {
        e.preventDefault()
        setPreviewMode(v => !v)
      } else if (e.key === 'Escape' && previewMode) {
        e.preventDefault()
        setPreviewMode(false)
      } else if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault()
        setHelpOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [route.page, slotsHistory, stylesHistory])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  useEffect(() => {
    saveDesign(slots)
  }, [slots])

  useEffect(() => {
    saveStyles(slotStyles)
  }, [slotStyles])

  function pushToast(text: string, variant: Toast['variant'] = 'info') {
    const id = toastSeq.current++
    const t: Toast = { id, text, variant }
    setToasts((prev) => [...prev, t].slice(-3))
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id))
    }, 2200)
  }

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
    const previous = slots[index] ?? null
    setSlots((prev) => ({ ...prev, [index]: id }))
    setActiveSlot(id ? index : null)
    setSlotStyles((prev) => {
      const next = { ...prev }
      if (id) next[index] = defaultStyle()
      else delete next[index]
      return next
    })
    if (id) {
      recordPlacement({ index, trinketId: id, replacedId: previous, method: 'tap' })
      const name = trinkets.find(t => t.id === id)?.name ?? id
      pushToast(`Placed ${name}`, 'success')
    } else if (previous) {
      recordRemoval({ index, trinketId: previous, method: 'tap' })
    }
  }

  function onReset() {
    const cleared: SlotMap = {}
    for (let i = 0; i < slotCount; i++) cleared[i] = null
    setSlots(cleared)
    resetDesign()
    setSlotStyles({})
    resetStyles()
    setActiveSlot(null)
    slotsHistory.reset(cleared)
    stylesHistory.reset({})
    recordReset(slotCount)
    pushToast('Cleared design')
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
    recordRandomize({ inPack, count })
    pushToast(`Randomized ${count} ${inPack ? 'from pack' : 'stickers'}`, 'success')
  }

  function onCheckout() {
    recordCheckoutStart({
      total,
      placedCount,
      items,
      packId: activePack?.id ?? null,
      budget: MAX_BUDGET,
    })
    setCheckoutOpen(true)
  }

  const fireConfetti = useCallback((mode: 'unlock' | 'glitter') => {
    const confetti = confettiRef.current
    if (!confetti) return
    const palette = ['#fbbf24', '#f472b6', '#38bdf8', '#4ade80', '#e879f9']
    const base = {
      disableForReducedMotion: true,
      colors: palette,
    }
    if (mode === 'unlock') {
      confetti({
        ...base,
        particleCount: 140,
        spread: 70,
        startVelocity: 34,
        decay: 0.9,
        scalar: 0.9,
        origin: { y: 0.58 },
        shapes: ['circle', 'square'],
      })
      setTimeout(() => {
        confetti({
          ...base,
          particleCount: 70,
          spread: 110,
          decay: 0.86,
          scalar: 1.15,
          ticks: 200,
          origin: { y: 0.5 },
          shapes: ['star'],
        })
      }, 90)
      setTimeout(() => {
        confetti({
          ...base,
          particleCount: 40,
          spread: 45,
          scalar: 0.75,
          startVelocity: 22,
          origin: { y: 0.62 },
          gravity: 0.6,
          drift: 0.6,
          shapes: ['circle'],
        })
      }, 160)
      return
    }
    confetti({
      ...base,
      particleCount: 50,
      spread: 75,
      startVelocity: 18,
      decay: 0.92,
      origin: { y: 0.42 },
      scalar: 0.7,
      shapes: ['circle', 'star'],
    })
  }, [])

  // Gate unlock confetti
  useEffect(() => {
    const unlocked = placedCount >= 3
    if (unlocked && !isUnlocked) {
      setIsUnlocked(true)
      fireConfetti('unlock')
      recordCheckoutUnlocked(placedCount)
    }
    if (!unlocked && isUnlocked) setIsUnlocked(false)
  }, [placedCount, isUnlocked, fireConfetti])

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
        const destBefore = slots[idxTo] ?? null
        const fromIndex = draggingFromIndex
        if (fromIndex != null && fromIndex === idxTo) {
          setActiveSlot(idxTo)
        } else if (fromIndex != null && fromIndex !== idxTo) {
          setSlots((prev) => {
            const next = { ...prev }
            const from = fromIndex
            const destVal = next[idxTo] ?? null
            next[idxTo] = draggingId
            next[from] = destVal
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
            return next
          })
          recordMove({ from: fromIndex, to: idxTo, trinketId: draggingId, replacedId: destBefore })
        } else if (fromIndex == null) {
          setSlots((prev) => {
            const next = { ...prev }
            next[idxTo] = draggingId
            setSlotStyles((s) => {
              const ns: SlotStyleMap = { ...s }
              ns[idxTo] = defaultStyle()
              return ns
            })
            setActiveSlot(idxTo)
            return next
          })
          recordPlacement({ index: idxTo, trinketId: draggingId, replacedId: destBefore, method: 'drag' })
        }
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

  function removeAt(index: number, method: RemovalMethod = 'tap') {
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
      const name = trinkets.find(t => t.id === removed)?.name ?? removed
      pushToast(`Removed ${name}`)
    }
    if (removed) {
      recordRemoval({ index, trinketId: removed, method })
    }
    setActiveSlot(null)
  }

  function bringToFront(index: number) {
    const maxZ = Math.max(...Object.values(slotStyles).map(s => s.zIndex ?? 0))
    updateStyle(index, { zIndex: maxZ + 1 })
    pushToast('Brought to front', 'info')
  }

  function sendToBack(index: number) {
    const minZ = Math.min(...Object.values(slotStyles).map(s => s.zIndex ?? 0))
    updateStyle(index, { zIndex: minZ - 1 })
    pushToast('Sent to back', 'info')
  }

  function duplicateSticker(index: number) {
    const id = slots[index]
    const style = slotStyles[index]
    if (!id) return

    // Find first empty slot
    const emptySlot = Object.keys(slots).find(k => !slots[Number(k)])
    if (!emptySlot) {
      pushToast('No empty slots available', 'error')
      return
    }

    const emptyIndex = Number(emptySlot)
    setSlots((prev) => ({ ...prev, [emptyIndex]: id }))
    setSlotStyles((prev) => ({
      ...prev,
      [emptyIndex]: { ...style, zIndex: (style.zIndex ?? 0) + 1 },
    }))
    pushToast('Sticker duplicated', 'success')
  }

  async function exportAsImage() {
    const caseElement = document.getElementById('case-area')
    if (!caseElement) {
      pushToast('Could not find case to export', 'error')
      return
    }

    try {
      pushToast('Generating image...', 'info')
      const canvas = await html2canvas(caseElement, {
        backgroundColor: null,
        scale: 2,
        logging: false,
        useCORS: true,
      })

      canvas.toBlob((blob) => {
        if (!blob) {
          pushToast('Export failed', 'error')
          return
        }

        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `zhunk-case-${Date.now()}.png`
        link.click()
        URL.revokeObjectURL(url)
        pushToast('Image downloaded!', 'success')
      }, 'image/png')
    } catch (error) {
      console.error('Export failed:', error)
      pushToast('Export failed', 'error')
    }
  }

  if (route.page === 'admin') {
    return (
      <div className="min-h-full p-4 sm:p-6">
        <AdminPage
          catalog={catalogData}
          catalogStatus={catalogStatus}
          onReloadCatalog={loadCatalog}
          onNavigateHome={() => navigate('#/')}
        />
      </div>
    )
  }

  if (route.page === 'landing') {
    return (
      <div className="min-h-full p-4 sm:p-6">
        <LandingPage
          theme={theme}
          onToggleTheme={handleThemeToggle}
          onChoose={(id) => navigate(`#/builder?pack=${id}`)}
          trinkets={catalogData.trinkets}
          onOpenAdmin={() => navigate('#/admin')}
        />
      </div>
    )
  }

  return (
    <div className="min-h-full p-4 sm:p-6 relative overflow-hidden">
      <GlitterOverlay enabled={glitter} />
      <ReactCanvasConfetti onInit={({ confetti }) => (confettiRef.current = confetti)} style={{ position: 'fixed', pointerEvents: 'none', inset: 0 }} />

      {previewMode ? (
        <div className="preview-mode">
          <button
            className="preview-exit"
            onClick={() => setPreviewMode(false)}
            title="Exit Preview (ESC or Ctrl+P)"
          >
            ✕ Exit Preview
          </button>
          <div className="preview-case-container">
            <PhoneCase>
              <div>
                <BuilderCanvas
                  cols={cols}
                  rows={rows}
                  slots={slots}
                  slotStyles={slotStyles}
                  selectedId={null}
                  activeSlot={null}
                  onSelectSlot={() => {}}
                  onPlace={() => {}}
                  onRemove={() => {}}
                  onStyleChange={() => {}}
                  trinketMap={trinketMap}
                />
              </div>
            </PhoneCase>
          </div>
        </div>
      ) : (
        <>
          <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CutoutTitle text="The Zhunk Box — DIY Case Lab" />
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <ThemeToggle theme={theme} onToggle={handleThemeToggle} />
              {activePack ? (
                <span className="chip chip--active">Pack: {activePack.name}</span>
              ) : null}
              <button className="chip" onClick={() => navigate('#/')}>← Packs</button>
              <span className="text-xs opacity-50 font-mono">v1.0.0</span>
            </div>
          </header>

      <main className="grid gap-4 sm:gap-6 md:grid-cols-[1fr_340px]">
        <section className="paper builder-mat order-1 md:order-1 p-4 sm:p-6">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-semibold">Builder</h2>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <button
                className="chip"
                onClick={() => {
                  slotsHistory.undo()
                  stylesHistory.undo()
                  pushToast('Undo', 'info')
                }}
                disabled={!slotsHistory.canUndo}
                title="Undo (Ctrl+Z)"
              >
                ↶ Undo
              </button>
              <button
                className="chip"
                onClick={() => {
                  slotsHistory.redo()
                  stylesHistory.redo()
                  pushToast('Redo', 'info')
                }}
                disabled={!slotsHistory.canRedo}
                title="Redo (Ctrl+Y)"
              >
                ↷ Redo
              </button>
              <button id="btn-randomize" className="chip" title="Fill a few slots with random stickers (from this pack if selected)" onClick={onRandomize}>Randomize</button>
              <button className="chip" onClick={onReset}>Reset</button>
              <button className="chip" onClick={() => setPreviewMode(true)} title="Preview (Ctrl+P)">👁 Preview</button>
              <button className="chip" onClick={exportAsImage} title="Export as Image">⤓ Export</button>
              <button className="chip" onClick={() => setHelpOpen(true)} title="Help & Shortcuts (?)">? Help</button>
              <label className="chip cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="mr-1"
                  checked={glitter}
                  onChange={(e) => {
                    setGlitter(e.target.checked)
                    if (e.target.checked) fireConfetti('glitter')
                    recordGlitterToggle(e.target.checked)
                  }}
                />
                Glitter
              </label>
            </div>
          </div>

          {/* Guidance: rich mobile tip + subtle desktop text */}
          <MobileGuide selectedId={selectedId} packName={activePack?.name} suspend={coachOpen || checkoutOpen} />
          <div className="hidden sm:block mb-3 text-sm opacity-70">
            {selectedId
              ? 'Tip: Tap a slot to place your selected sticker. Drag to move; tap again for controls.'
              : 'Tip: Pick a sticker from the tray, then tap a slot to place it. Drag to move; tap again for controls.'}
            {activePack ? ' Randomize uses only the current pack.' : ''}
          </div>

          {/* Onboarding coachmarks (only when a pack is active) */}
          <Coachmarks enabled={Boolean(activePack)} onOpenChange={setCoachOpen} />

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
                <div className={clsx('chip wonky', 'chip--active scale-110')} style={{ ['--r' as any]: `${(Math.random() * 4 - 2).toFixed(2)}deg` }}>
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

        <aside className="space-y-4 order-2 md:order-2">
          <section id="tray" className="paper tray-mat p-3 sm:p-5 sm:sticky sm:top-2 sm:z-30">
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
                  className="chip w-full focus:outline-none"
                />
              </div>
              <div className="flex flex-wrap gap-2 mb-3 tag-cloud">
                <button className={clsx('chip', activeTag === '' && 'chip--active')} onClick={() => setActiveTag('')}>All</button>
                {allTags.map(tag => (
                  <button key={tag} className={clsx('chip', activeTag === tag && 'chip--active')} onClick={() => setActiveTag(tag)}>
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

      <Modal
        open={checkoutOpen}
        title="Review Your Design"
        onClose={() => setCheckoutOpen(false)}
        footer={
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button className="chip" onClick={() => setCheckoutOpen(false)}>← Keep editing</button>
            <button
              className="tape-btn"
              onClick={() => {
                setCheckoutOpen(false)
                recordCheckoutSubmit({
                  total,
                  placedCount,
                  items,
                  packId: activePack?.id ?? null,
                  budget: MAX_BUDGET,
                })
                pushToast('Checkout complete! 🎉', 'success')
              }}
            >
              Proceed to Checkout · ${total.toFixed(2)}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Design preview thumbnail */}
          <div className="checkout-preview">
            <div className="checkout-preview-case">
              <PhoneCase>
                <div>
                  <BuilderCanvas
                    cols={cols}
                    rows={rows}
                    slots={slots}
                    slotStyles={slotStyles}
                    selectedId={null}
                    activeSlot={null}
                    onSelectSlot={() => {}}
                    onPlace={() => {}}
                    onRemove={() => {}}
                    onStyleChange={() => {}}
                    trinketMap={trinketMap}
                  />
                </div>
              </PhoneCase>
            </div>
          </div>

          {/* Order summary */}
          <div className="checkout-summary">
            <h3 className="font-semibold mb-2">Order Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Phone Case</span>
                <span>${casePrice.toFixed(2)}</span>
              </div>
              {items.length > 0 && (
                <div className="space-y-1">
                  {items.map(({ id, qty }) => {
                    const trinket = trinketMap[id]
                    const itemTotal = (trinket?.price ?? 0) * qty
                    return (
                      <div key={id} className="flex justify-between text-sm opacity-90">
                        <span className="flex items-center gap-2">
                          {trinket?.icon && (
                            <img src={trinket.icon} alt="" className="w-4 h-4" />
                          )}
                          {trinket?.name ?? id} × {qty}
                        </span>
                        <span>${itemTotal.toFixed(2)}</span>
                      </div>
                    )
                  })}
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="checkout-stats">
            <div className="checkout-stat">
              <div className="text-2xl font-bold">{placedCount}</div>
              <div className="text-xs opacity-70">Stickers</div>
            </div>
            <div className="checkout-stat">
              <div className="text-2xl font-bold">${(MAX_BUDGET - total).toFixed(0)}</div>
              <div className="text-xs opacity-70">Budget Left</div>
            </div>
            {activePack && (
              <div className="checkout-stat">
                <div className="text-sm font-bold">{activePack.name}</div>
                <div className="text-xs opacity-70">Pack Used</div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />

      <Toasts toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter(t => t.id !== id))} />

      {activeSlot !== null && slots[activeSlot] && slotStyles[activeSlot] && (
        <FloatingToolbar
          slotIndex={activeSlot}
          style={slotStyles[activeSlot]}
          onStyleChange={updateStyle}
          onDuplicate={() => duplicateSticker(activeSlot)}
          onDelete={() => removeAt(activeSlot, 'toolbar')}
          onBringToFront={() => bringToFront(activeSlot)}
          onSendToBack={() => sendToBack(activeSlot)}
        />
      )}
        </>
      )}
    </div>
  )
}

export default App
