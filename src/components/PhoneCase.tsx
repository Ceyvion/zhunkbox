import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import type { ReactNode } from 'react'

export function PhoneCase({ children }: { children: ReactNode }) {
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rx = useTransform(my, [-50, 50], [8, -8])
  const ry = useTransform(mx, [-50, 50], [-8, 8])
  const srx = useSpring(rx, { stiffness: 120, damping: 10 })
  const sry = useSpring(ry, { stiffness: 120, damping: 10 })

  function onMove(e: React.MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    mx.set(e.clientX - (rect.left + rect.width / 2))
    my.set(e.clientY - (rect.top + rect.height / 2))
  }

  function onLeave() {
    mx.set(0); my.set(0)
  }

  return (
    <motion.div
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ perspective: 1100, rotateX: srx, rotateY: sry }}
      className="flex justify-center"
    >
      <div className="relative w-full max-w-[480px] aspect-[9/16]">
        {/* Case body with pastel gradient, chunky outline, and soft bevel */}
        <motion.div
          initial={{ rotateZ: -8 }}
          animate={{ rotateZ: -8 }}
          className="case-shell"
        >
          {/* Camera notch */}
          <div className="case-notch" />

          {/* Inner lip with soft inner shadow */}
          <div className="case-lip" />

          {/* Inner work area with dotted guide and subtle fabric texture */}
          <div className="case-deck">
            {/* dotted grid background */}
            <div className="case-grid" />
            <div className="case-workspace">
              {children}
            </div>
          </div>

          {/* light glare */}
          <div className="case-glare" />
        </motion.div>
      </div>
    </motion.div>
  )
}
