import { motion } from 'framer-motion'
import type { Trinket } from '../types'
import { useDraggable } from '@dnd-kit/core'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'

type Props = {
  trinkets: Trinket[]
  selectedId: string | null
  onSelect: (id: string | null) => void
}

type PeekState = { trinket: Trinket; x: number; y: number }

export function TrinketTray({ trinkets, selectedId, onSelect }: Props) {
  const [mounted, setMounted] = useState(false)
  const [peek, setPeek] = useState<PeekState | null>(null)
  const holdRef = useRef<number | null>(null)
  const originRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    setMounted(true)
    return () => {
      if (holdRef.current) window.clearTimeout(holdRef.current)
    }
  }, [])

  const endPeek = useCallback(() => {
    if (holdRef.current) {
      window.clearTimeout(holdRef.current)
      holdRef.current = null
    }
    originRef.current = null
    setPeek(null)
  }, [])

  const startPeek = useCallback((trinket: Trinket, event: ReactPointerEvent<HTMLButtonElement>) => {
    if (holdRef.current) window.clearTimeout(holdRef.current)
    originRef.current = { x: event.clientX, y: event.clientY }
    const target = event.currentTarget
    holdRef.current = window.setTimeout(() => {
      const rect = target.getBoundingClientRect()
      const midX = rect.left + rect.width / 2
      const top = rect.top - 20
      const safeX = Math.min(Math.max(midX, 90), window.innerWidth - 90)
      const safeY = Math.min(Math.max(top, 90), window.innerHeight - 140)
      setPeek({ trinket, x: safeX, y: safeY })
    }, 320)
  }, [])

  const maybeCancelOnMove = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    const origin = originRef.current
    if (!origin) return
    const diffX = Math.abs(event.clientX - origin.x)
    const diffY = Math.abs(event.clientY - origin.y)
    if (diffX > 10 || diffY > 10) {
      endPeek()
    }
  }, [endPeek])

  if (trinkets.length === 0) {
    return (
      <div className="py-6 text-center text-sm opacity-70">
        No stickers found. Clear the search or pick a different tag.
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2">
        {trinkets.map((t) => {
          const active = selectedId === t.id
          return (
            <DraggableChip
              key={t.id}
              active={active}
              onClick={() => onSelect(active ? null : t.id)}
              id={t.id}
              price={t.price}
              name={t.name}
              icon={t.icon}
              onPeekStart={(event) => startPeek(t, event)}
              onPeekMove={maybeCancelOnMove}
              onPeekEnd={endPeek}
            />
          )
        })}
      </div>
      {mounted && peek
        ? createPortal(
          <div className="trinket-peek" style={{ top: `${peek.y}px`, left: `${peek.x}px` }}>
            {peek.trinket.icon ? (
              <img src={peek.trinket.icon} alt="" aria-hidden />
            ) : (
              <div className="sticker mb-2" aria-hidden>
                <span className="w-12 h-12 grid place-items-center rounded-full border border-black bg-white text-base font-black">
                  {peek.trinket.name[0]}
                </span>
              </div>
            )}
            <h4>{peek.trinket.name}</h4>
            <div className="price">${peek.trinket.price.toFixed(2)}</div>
            {peek.trinket.tags && peek.trinket.tags.length > 0 ? (
              <div className="tags">{peek.trinket.tags.join(' • ')}</div>
            ) : null}
          </div>,
          document.body
        )
        : null}
    </>
  )
}

function DraggableChip({ id, name, price, icon, active, onClick, onPeekStart, onPeekMove, onPeekEnd }: {
  id: string
  name: string
  price: number
  icon?: string
  active: boolean
  onClick: () => void
  onPeekStart: (event: ReactPointerEvent<HTMLButtonElement>) => void
  onPeekMove: (event: ReactPointerEvent<HTMLButtonElement>) => void
  onPeekEnd: () => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `trinket:${id}` })
  useEffect(() => {
    if (isDragging) onPeekEnd()
  }, [isDragging, onPeekEnd])
  return (
    <motion.button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      onPointerDown={onPeekStart}
      onPointerUp={onPeekEnd}
      onPointerLeave={onPeekEnd}
      onPointerCancel={onPeekEnd}
      onPointerMove={onPeekMove}
      className={`chip justify-between wonky min-h-[44px] py-2 sm:py-1 ${active ? 'bg-yellow-200' : ''} ${isDragging ? 'opacity-60' : ''}`}
      title={`$${price.toFixed(2)}`}
      style={{ touchAction: 'pan-y', ['--r' as any]: `${(Math.random() * 4 - 2).toFixed(2)}deg` }}
    >
      <span className="inline-flex items-center gap-2">
        <img src={icon ?? `/icons/${id}.svg`} alt="" className="w-5 h-5" />
        <span className="font-semibold">{name}</span>
      </span>
      <span className="text-xs opacity-70">${price.toFixed(2)}</span>
    </motion.button>
  )
}
