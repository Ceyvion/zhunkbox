import { useEffect, useMemo, useState } from 'react'

type Step = {
  key: string
  selector: string
  title: string
  body: string
}

export function Coachmarks({ enabled }: { enabled: boolean }) {
  const [open, setOpen] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)

  const steps: Step[] = useMemo(() => [
    {
      key: 'tray',
      selector: '#tray',
      title: 'Pick a sticker',
      body: 'Choose from the tray. Search and filter help you find a vibe.',
    },
    {
      key: 'case',
      selector: '#case-area',
      title: 'Place on the case',
      body: 'Tap a slot to place. Drag to move. Tap again to tweak.',
    },
    {
      key: 'randomize',
      selector: '#btn-randomize',
      title: 'Feeling lucky?',
      body: 'Randomize fills with stickers from this pack only.',
    },
  ], [])

  useEffect(() => {
    if (!enabled) return
    try {
      const seen = localStorage.getItem('coach_v1_done') === '1'
      if (!seen) {
        setOpen(true)
      }
    } catch {}
  }, [enabled])

  useEffect(() => {
    if (!open) return
    const sel = steps[stepIndex]?.selector
    if (!sel) return
    function update() {
      const el = document.querySelector(sel) as HTMLElement | null
      if (!el) { setRect(null); return }
      const r = el.getBoundingClientRect()
      setRect(r)
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open, stepIndex, steps])

  function next() {
    if (stepIndex < steps.length - 1) setStepIndex(stepIndex + 1)
    else done()
  }
  function skip() { done() }
  function done() {
    setOpen(false)
    try { localStorage.setItem('coach_v1_done', '1') } catch {}
  }

  if (!open || !enabled) return null

  const step = steps[stepIndex]

  // Position tooltip below target (or above if near bottom)
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 800
  const placeAbove = rect ? rect.bottom + 140 > viewportH : false
  const tipStyle: React.CSSProperties = rect ? {
    position: 'fixed',
    left: Math.max(12, Math.min(rect.left + rect.width / 2 - 140, window.innerWidth - 280 - 12)),
    top: placeAbove ? Math.max(12, rect.top - 96) : Math.min(rect.bottom + 12, viewportH - 132),
    width: 280,
    zIndex: 60,
  } : {}

  return (
    <div className="coach-overlay" role="dialog" aria-label="Onboarding coachmarks">
      <button className="coach-scrim" aria-label="Dismiss" onClick={skip} />
      {rect ? (
        <div
          className="coach-spot"
          style={{ left: rect.left - 8, top: rect.top - 8, width: rect.width + 16, height: rect.height + 16 }}
          aria-hidden
        />
      ) : null}
      <div className="paper coach-tip" style={tipStyle}>
        <div className="text-xs opacity-70">Step {stepIndex + 1} of {steps.length}</div>
        <div className="font-bold mb-1">{step.title}</div>
        <div className="text-sm mb-2">{step.body}</div>
        <div className="flex gap-2 justify-end">
          <button className="chip" onClick={skip}>Skip</button>
          <button className="tape-btn" onClick={next}>{stepIndex < steps.length - 1 ? 'Next' : 'Done'}</button>
        </div>
      </div>
    </div>
  )
}

