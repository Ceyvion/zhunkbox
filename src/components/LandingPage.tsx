import packs from '../data/packs.json'
import catalog from '../data/catalog.json'
import type { Trinket } from '../types'
import { clsx } from 'clsx'

type Pack = {
  id: string
  name: string
  description: string
  trinkets: string[]
}

export function LandingPage({ onChoose }: { onChoose: (packId: string) => void }) {
  const trinkets = catalog.trinkets as Trinket[]
  const tMap = Object.fromEntries(trinkets.map(t => [t.id, t])) as Record<string, Trinket>

  return (
    <div className="space-y-6">
      <header className="paper p-5 sm:p-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold wonky" style={{ ['--r' as any]: '-1.2deg' }}>The Zhunk Box — DIY Case Lab</h1>
          <p className="text-sm opacity-70">Pick a trinket pack to start designing your case.</p>
        </div>
        <div className="hidden sm:block">
          <span className="chip bg-yellow-200">New: cute tactile builder ✦</span>
        </div>
      </header>

      <section className="paper p-5 sm:p-6">
        <h2 className="font-semibold mb-4">Trinket packs</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(packs as Pack[]).map((p) => (
            <PackCard key={p.id} pack={p} tMap={tMap} onChoose={() => onChoose(p.id)} />
          ))}
        </div>
      </section>

      <section className="paper p-5 sm:p-6">
        <h3 className="font-semibold mb-2">How it works</h3>
        <ol className="list-decimal list-inside text-sm space-y-1">
          <li>Choose a pack that matches your vibe.</li>
          <li>Drag trinkets onto the case; rotate and resize for flair.</li>
          <li>Place at least 3 to unlock checkout; stay under budget.</li>
        </ol>
      </section>
    </div>
  )
}

function PackCard({ pack, tMap, onChoose }: { pack: Pack; tMap: Record<string, Trinket>; onChoose: () => void }) {
  const icons = pack.trinkets.map(id => tMap[id]?.icon).filter(Boolean).slice(0, 4) as string[]
  return (
    <div className="paper p-4 flex flex-col">
      <div className="mb-3">
        <h3 className="font-bold wonky text-lg" style={{ ['--r' as any]: `${(Math.random()*2-1).toFixed(2)}deg` }}>{pack.name}</h3>
        <p className="text-sm opacity-70">{pack.description}</p>
      </div>
      <div className="flex items-center gap-2 mb-4">
        <IconStack icons={icons} />
        <span className="text-xs opacity-70">{pack.trinkets.length} items</span>
      </div>
      <div className="mt-auto flex items-center justify-between gap-2">
        <button className="chip" onClick={onChoose}>Design with this pack</button>
        <div className="hidden sm:flex gap-1">
          {pack.trinkets.slice(0,6).map(id => (
            <img key={id} src={tMap[id]?.icon} alt="" className="w-6 h-6" />
          ))}
        </div>
      </div>
    </div>
  )
}

function IconStack({ icons }: { icons: string[] }) {
  return (
    <div className="relative h-14 w-28">
      {icons.map((src, i) => (
        <div key={src} className={clsx('sticker absolute', position(i))}>
          <img src={src} alt="" className="w-10 h-10" />
        </div>
      ))}
    </div>
  )
}

function position(i: number) {
  switch(i) {
    case 0: return 'left-1 top-1';
    case 1: return 'right-2 top-3';
    case 2: return 'left-6 bottom-1';
    default: return 'right-4 bottom-1';
  }
}

