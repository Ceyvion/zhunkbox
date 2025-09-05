import { motion } from 'framer-motion'
import type { Trinket } from '../types'
import { useDraggable } from '@dnd-kit/core'

type Props = {
  trinkets: Trinket[]
  selectedId: string | null
  onSelect: (id: string | null) => void
}

export function TrinketTray({ trinkets, selectedId, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2">
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
          />
        )
      })}
    </div>
  )
}

function DraggableChip({ id, name, price, icon, active, onClick }: { id: string; name: string; price: number; icon?: string; active: boolean; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `trinket:${id}` })
  return (
    <motion.button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`chip justify-between wonky py-2 sm:py-1 ${active ? 'bg-yellow-200' : ''} ${isDragging ? 'opacity-60' : ''}`}
      title={`$${price.toFixed(2)}`}
      style={{ ['--r' as any]: `${(Math.random() * 4 - 2).toFixed(2)}deg` }}
    >
      <span className="inline-flex items-center gap-2">
        <img src={icon ?? `/icons/${id}.svg`} alt="" className="w-5 h-5" />
        <span className="font-semibold">{name}</span>
      </span>
      <span className="text-xs opacity-70">${price.toFixed(2)}</span>
    </motion.button>
  )
}
