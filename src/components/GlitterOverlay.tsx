import { useEffect, useRef } from 'react'

export function GlitterOverlay({ enabled }: { enabled: boolean }) {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const raf = useRef<number | null>(null)
  const particles = useRef<Array<{ x: number; y: number; r: number; t: number; s: number }>>([])

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let w = (canvas.width = window.innerWidth)
    let h = (canvas.height = window.innerHeight)
    const onResize = () => {
      w = canvas.width = window.innerWidth
      h = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', onResize)

    function seed() {
      const arr: typeof particles.current = []
      const count = Math.max(80, Math.floor((w * h) / 25000))
      for (let i = 0; i < count; i++) {
        arr.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.8 + 0.4,
          t: Math.random() * Math.PI * 2,
          s: 0.4 + Math.random() * 1.2,
        })
      }
      particles.current = arr
    }
    seed()

    const draw = () => {
      if (!enabled) {
        ctx.clearRect(0, 0, w, h)
        raf.current = requestAnimationFrame(draw)
        return
      }
      ctx.clearRect(0, 0, w, h)
      for (const p of particles.current) {
        p.t += 0.02 * p.s
        const twinkle = 0.5 + 0.5 * Math.sin(p.t * 3)
        ctx.beginPath()
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3)
        g.addColorStop(0, `rgba(255,255,255,${0.9 * twinkle})`)
        g.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = g
        ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2)
        ctx.fill()
        // slow drift
        p.x += Math.cos(p.t) * 0.2
        p.y += Math.sin(p.t * 0.8) * 0.15
        // wrap
        if (p.x < -5) p.x = w + 5
        if (p.x > w + 5) p.x = -5
        if (p.y < -5) p.y = h + 5
        if (p.y > h + 5) p.y = -5
      }
      raf.current = requestAnimationFrame(draw)
    }
    raf.current = requestAnimationFrame(draw)
    return () => {
      window.removeEventListener('resize', onResize)
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [enabled])

  return (
    <canvas
      ref={ref}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', mixBlendMode: 'screen', opacity: enabled ? 1 : 0, transition: 'opacity 200ms' }}
    />
  )
}

