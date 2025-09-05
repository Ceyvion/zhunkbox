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

  const msgLines = selectedId
    ? [
        'Tap a slot to place',
        'Drag to move',
        'Use the bottom bar to tweak',
      ]
    : [
        'Pick a sticker from the tray above',
        'Then tap a slot to place it',
        packName ? `Randomize uses only ${packName}` : '',
      ].filter(Boolean)

  return (
    <div className="sm:hidden sticky top-2 z-40 px-2">
      <div className="tip-banner wonky mx-auto max-w-[520px]" style={{ ['--r' as any]: '-0.6deg' }} aria-live="polite">
        <div className="flex items-center gap-2 mb-1">
          <span aria-hidden className="text-base">✨</span>
          <span className="font-semibold">Cute tip</span>
        </div>
        <div className="text-[13px] leading-snug">
          {msgLines.map((line, i) => (
            <div key={i} className="truncate whitespace-normal break-words">{line}</div>
          ))}
        </div>
        <div className="mt-2 flex justify-end">
          <button className="chip px-3 py-1 h-8 text-xs" onClick={() => { try { localStorage.setItem('mobile_guide_v1', '1') } catch {} ; setDismissed(true) }}>Got it</button>
        </div>
      </div>
    </div>
  )
}
