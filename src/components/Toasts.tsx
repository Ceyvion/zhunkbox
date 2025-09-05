import { AnimatePresence, motion } from 'framer-motion'

export type Toast = { id: number; text: string; variant?: 'info' | 'success' | 'error' }

export function Toasts({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="toasts" aria-live="polite" aria-atomic="true">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className={`toast ${t.variant ?? 'info'}`}
            role="status"
          >
            <span>{t.text}</span>
            <button className="chip px-2 py-0 h-7" onClick={() => onDismiss(t.id)} aria-label="Dismiss">✕</button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

