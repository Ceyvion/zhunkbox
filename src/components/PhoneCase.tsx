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
        {/* Case body with subtle gradient + dramatic tilt */}
        <motion.div initial={{ rotateZ: -8 }} animate={{ rotateZ: -8 }} className="absolute inset-0 rounded-[40px] border-2 border-black bg-gradient-to-br from-[#fffefb] to-[#f6f3ef] shadow-[14px_14px_0_#000]">
          {/* Camera notch */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-4 rounded-full bg-black/10"/>

          {/* Inner lip */}
          <div className="absolute inset-[18px] rounded-[34px] border-2 border-black/20" />

          {/* Inner work area with dashed guide and dot grid */}
          <div className="absolute inset-[22px] rounded-[32px] border-2 border-dashed border-black/40 p-3 overflow-hidden">
            {/* dotted grid background */}
            <div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(#000 0.8px, transparent 0.8px)', backgroundSize: '18px 18px', backgroundPosition: '9px 9px' }} />
            <div className="relative">
              {children}
            </div>
          </div>

          {/* light glare */}
          <div className="pointer-events-none absolute inset-0 rounded-[40px]" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.0) 40%)', mixBlendMode: 'screen' }} />
        </motion.div>
      </div>
    </motion.div>
  )
}
