import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'

type Props = {
  open: boolean
  title?: string
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
}

export function Modal({ open, title, onClose, children, footer }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Focus trap + restore
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    const card = document.querySelector('.modal-card') as HTMLElement | null
    const focusables = card?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    focusables && focusables[0]?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab' || !focusables || focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      prev && prev.focus()
    }
  }, [open])

  return (
    <AnimatePresence>
      {open ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <motion.button
            className="modal-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-label="Close"
          />
          <motion.div
            className="paper modal-card"
            role="document"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
          >
            <div className="modal-tape" aria-hidden />
            {title ? (
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg wonky" style={{ ['--r' as any]: '-0.7deg' }}>{title}</h3>
                <button className="chip" onClick={onClose}>Close</button>
              </div>
            ) : (
              <div className="flex justify-end mb-2">
                <button className="chip" onClick={onClose}>Close</button>
              </div>
            )}
            <div className="modal-body">
              {children}
            </div>
            {footer ? (
              <div className="mt-4 flex items-center justify-end gap-2">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
