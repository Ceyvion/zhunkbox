import { motion, AnimatePresence } from 'framer-motion'
import type { SlotMap, SlotStyleMap, StickerStyle, Trinket } from '../types'
import { useDroppable, useDraggable } from '@dnd-kit/core'

type Props = {
  cols: number
  rows: number
  slots: SlotMap
  slotStyles: SlotStyleMap
  selectedId: string | null
  activeSlot: number | null
  onSelectSlot: (index: number | null) => void
  onPlace: (index: number, id: string | null) => void
  onRemove: (index: number) => void
  onStyleChange: (index: number, partial: Partial<StickerStyle>) => void
  trinketMap: Record<string, Trinket>
}

export function BuilderCanvas({ cols, rows, slots, slotStyles, selectedId, activeSlot, onSelectSlot, onPlace, onRemove, onStyleChange, trinketMap }: Props) {

  return (
    <div>
      <div className="mb-3 text-sm opacity-70">Place at least 3 trinkets to unlock checkout.</div>
      <div
        className="grid gap-2 sm:gap-3 justify-center"
        role="grid"
        aria-label="Sticker slots"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: rows * cols }).map((_, i) => (
          <Slot
            key={i}
            index={i}
            value={slots[i] ?? null}
            style={slotStyles[i]}
            selectedId={selectedId}
            active={activeSlot === i}
            onSelect={onSelectSlot}
            onPlace={onPlace}
            onRemove={onRemove}
            onStyleChange={onStyleChange}
            trinket={slots[i] ? trinketMap[slots[i] as string] : undefined}
          />
        ))}
      </div>
    </div>
  )
}

function Slot({ index, value, style, selectedId, active, onSelect, onPlace, onRemove, onStyleChange, trinket }: {
  index: number
  value: string | null
  style?: StickerStyle
  selectedId: string | null
  active: boolean
  onSelect: (i: number | null) => void
  onPlace: (index: number, id: string | null) => void
  onRemove: (index: number) => void
  onStyleChange: (index: number, partial: Partial<StickerStyle>) => void
  trinket?: Trinket
}) {
  const filled = Boolean(value)
  const label = value ?? 'Empty'
  const { isOver, setNodeRef } = useDroppable({ id: `slot:${index}` })

  function handleClick() {
    if (selectedId) {
      onPlace(index, selectedId)
      return
    }
    if (filled) {
      onRemove(index)
      return
    }
    onSelect(index)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  return (
    <motion.div
      ref={setNodeRef}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`slot ${filled ? 'slot--filled' : 'slot--empty'} ${active ? 'slot--active' : ''} ${isOver ? 'slot--over' : ''}`}
      aria-label={`Slot ${index} ${filled ? `with ${label}` : 'empty'}`}
      role="button"
      tabIndex={0}
      aria-pressed={active}
      title={filled ? 'Click to remove, or use edit to tweak' : 'Click to place selected'}
    >
      <AnimatePresence mode="popLayout">
        {filled ? (
          <>
            {!active ? (
              <button
                type="button"
                className="slot-edit"
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect(index)
                }}
                onKeyDown={(e) => e.stopPropagation()}
                aria-label={`Edit ${label}`}
                title="Edit sticker"
              >
                Edit
              </button>
            ) : null}
            <DraggableTrinket key={label} index={index} label={label} trinket={trinket} style={style} />
            {active ? (
              <Controls
                index={index}
                style={style}
                onStyleChange={onStyleChange}
                onRemove={onRemove}
                onClose={() => onSelect(null)}
              />
            ) : null}
            {active ? (
              <ControlsMobile
                index={index}
                style={style}
                onStyleChange={onStyleChange}
                onRemove={onRemove}
                onClose={() => onSelect(null)}
              />
            ) : null}
          </>
        ) : (
          <motion.span key="empty" className="opacity-60 text-[10px] sm:text-xs">Tap to place</motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function DraggableTrinket({ index, label, trinket, style }: { index: number; label: string; trinket?: Trinket; style?: StickerStyle }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `slotitem:${index}` })
  const scale = style?.scale ?? 1
  const rotate = style?.rotate ?? 0
  const depth = style?.depth ?? 1.2

  // Build 2.5D drop-shadow filter from depth
  const d1 = Math.round(2 * depth)
  const d2 = Math.round(4 * depth)
  const filter = `drop-shadow(${d1}px ${d1}px 0 #000) drop-shadow(${d2}px ${d2}px 0 #000)`
  return (
    <motion.div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      initial={{ scale: 0.2, rotate: -10, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      exit={{ scale: 0.2, rotate: 10, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={`flex flex-col items-center ${isDragging ? 'opacity-60' : ''}`}
    >
      <div className="sticker mb-1" style={{ transform: `scale(${scale}) rotate(${rotate}deg)`, filter }}>
        {trinket?.icon ? (
          <img src={trinket.icon} alt={trinket.name} className="w-12 h-12 sm:w-14 sm:h-14" />
        ) : (
          <span className="w-12 h-12 sm:w-14 sm:h-14 grid place-items-center rounded-full border border-black bg-white text-base font-black">{trinket?.name?.[0] ?? label[0]}</span>
        )}
      </div>
      <span className="text-[10px] sm:text-[11px] font-semibold wonky" style={{ ['--r' as any]: `${(Math.random() * 4 - 2).toFixed(2)}deg` }}>{trinket?.name ?? label}</span>
    </motion.div>
  )
}

function Controls({ index, style, onStyleChange, onRemove, onClose }: {
  index: number
  style?: StickerStyle
  onStyleChange: (i: number, partial: Partial<StickerStyle>) => void
  onRemove: (i: number) => void
  onClose: () => void
}) {
  const s = style ?? { scale: 1, rotate: 0, depth: 1.2 }
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -6 }}
      className="hidden sm:flex absolute -top-2 -right-2 z-10 bg-white border border-black shadow-[3px_3px_0_#000] rounded-lg p-2 gap-1"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <CtrlButton label="Rotate -15°" onClick={() => onStyleChange(index, { rotate: s.rotate - 15 })}>↺</CtrlButton>
      <CtrlButton label="Rotate +15°" onClick={() => onStyleChange(index, { rotate: s.rotate + 15 })}>↻</CtrlButton>
      <CtrlButton label="Smaller" onClick={() => onStyleChange(index, { scale: s.scale - 0.1 })}>−</CtrlButton>
      <CtrlButton label="Bigger" onClick={() => onStyleChange(index, { scale: s.scale + 0.1 })}>＋</CtrlButton>
      <CtrlButton label="Depth −" onClick={() => onStyleChange(index, { depth: Math.max(0, (s.depth ?? 1.2) - 0.2) })}>⬇︎</CtrlButton>
      <CtrlButton label="Depth +" onClick={() => onStyleChange(index, { depth: (s.depth ?? 1.2) + 0.2 })}>⬆︎</CtrlButton>
      <CtrlButton label="Delete" onClick={() => onRemove(index)}>✕</CtrlButton>
      <CtrlButton label="Close" onClick={onClose}>⤫</CtrlButton>
    </motion.div>
  )
}

function CtrlButton({ children, onClick, label }: { children: any; onClick: () => void; label: string }) {
  return (
    <button
      className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-black bg-white hover:bg-yellow-100 text-xs"
      title={label}
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function ControlsMobile({ index, style, onStyleChange, onRemove, onClose }: {
  index: number
  style?: StickerStyle
  onStyleChange: (i: number, partial: Partial<StickerStyle>) => void
  onRemove: (i: number) => void
  onClose: () => void
}) {
  const s = style ?? { scale: 1, rotate: 0, depth: 1.2 }
  function stop(e: any) { e.stopPropagation() }
  return (
    <div className="sm:hidden fixed left-0 right-0 bottom-0 z-50 px-2 pb-[calc(env(safe-area-inset-bottom,0)+8px)]" role="dialog" aria-label="Sticker controls" onClick={stop} onMouseDown={stop}>
      <div className="mx-auto max-w-[520px] paper rounded-t-xl rounded-b-none border-b-0 shadow-[0_-4px_0_#000] p-2 bg-white">
        <div className="flex items-center justify-between gap-1">
          <button className="chip w-10 h-10 p-0" aria-label="Rotate -15 degrees" onClick={() => onStyleChange(index, { rotate: s.rotate - 15 })}>↺</button>
          <button className="chip w-10 h-10 p-0" aria-label="Rotate +15 degrees" onClick={() => onStyleChange(index, { rotate: s.rotate + 15 })}>↻</button>
          <button className="chip w-10 h-10 p-0" aria-label="Smaller" onClick={() => onStyleChange(index, { scale: s.scale - 0.1 })}>−</button>
          <button className="chip w-10 h-10 p-0" aria-label="Bigger" onClick={() => onStyleChange(index, { scale: s.scale + 0.1 })}>＋</button>
          <button className="chip w-10 h-10 p-0" aria-label="Depth down" onClick={() => onStyleChange(index, { depth: Math.max(0, (s.depth ?? 1.2) - 0.2) })}>⬇︎</button>
          <button className="chip w-10 h-10 p-0" aria-label="Depth up" onClick={() => onStyleChange(index, { depth: (s.depth ?? 1.2) + 0.2 })}>⬆︎</button>
          <button className="chip w-10 h-10 p-0 bg-red-100" aria-label="Delete" onClick={() => onRemove(index)}>✕</button>
          <button className="chip w-10 h-10 p-0" aria-label="Close" onClick={onClose}>⤫</button>
        </div>
      </div>
    </div>
  )
}
