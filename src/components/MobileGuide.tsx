import { useEffect, useState } from 'react'

export function MobileGuide({ selectedId, packName }: { selectedId: string | null; packName?: string }) {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try { return localStorage.getItem('mobile_guide_v1') === '1' } catch { return false }
  })

  useEffect(() => {
    // If user selects something, briefly show the relevant hint (unless dismissed)
    // No-op if dismissed
  }, [selectedId])

  if (dismissed) return null

  const msg = selectedId
    ? 'Tap a slot to place • Drag to move • Bottom bar for controls'
    : `Pick a sticker from the tray above, then tap a slot to place${packName ? ` • Randomize uses only ${packName}` : ''}`

  return (
    <div className="sm:hidden sticky top-2 z-40 px-1">
      <div className="tip-banner wonky" style={{ ['--r' as any]: '-0.6deg' }}>
        <span className="inline-flex items-center gap-2">
          <span aria-hidden>✨</span>
          <span className="font-semibold">Cute tip:</span>
          <span className="opacity-90">{msg}</span>
        </span>
        <button className="chip ml-2 px-2 py-0 h-7" onClick={() => { try { localStorage.setItem('mobile_guide_v1', '1') } catch {} ; setDismissed(true) }}>Got it</button>
      </div>
    </div>
  )
}

