import { useMemo, useRef } from 'react'
import packs from '../data/packs.json'
import type { Trinket } from '../types'
import { clsx } from 'clsx'
import { motion } from 'framer-motion'
import { ThemeToggle, type Theme } from './ThemeToggle'

type Pack = {
  id: string
  name: string
  description: string
  trinkets: string[]
}

export function LandingPage({ onChoose, theme, onToggleTheme, trinkets, onOpenAdmin }: { onChoose: (packId: string) => void; theme: Theme; onToggleTheme: (next: Theme) => void; trinkets: Trinket[]; onOpenAdmin?: () => void }) {
  const tMap = useMemo(
    () => Object.fromEntries(trinkets.map(t => [t.id, t])) as Record<string, Trinket>,
    [trinkets],
  )
  const packListRef = useRef<HTMLDivElement>(null)
  const heroStickerIds = ['kawaii-boba', 'star', 'heart', 'kawaii-panda', 'rainbow', 'sparkle', 'ice-cream', 'planet']
  const heroStickers = heroStickerIds.map((id) => tMap[id]?.icon).filter(Boolean) as string[]
  const packCount = (packs as Pack[]).length
  const totalTrinkets = trinkets.length
  const tagCount = useMemo(() => {
    const tags = new Set<string>()
    trinkets.forEach((t) => (t.tags ?? []).forEach((tag) => tags.add(tag)))
    return tags.size
  }, [trinkets])
  const featuredPack = (packs as Pack[])[0]

  function handleStartDesign() {
    if (packListRef.current) {
      packListRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    if (featuredPack) onChoose(featuredPack.id)
  }

  return (
    <div className="space-y-6">
      <section className="landing-hero paper p-5 sm:p-8 lg:p-10">
        <div className="landing-hero__top">
          <div className="landing-hero__controls">
            {onOpenAdmin ? (
              <button type="button" className="chip" onClick={onOpenAdmin}>
                Inventory
              </button>
            ) : null}
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          </div>
        </div>
        <div className="landing-hero__grid">
          <div className="landing-hero__copy">
            <span className="hero-pill">Welcome to the DIY Case Lab</span>
            <h1 className="landing-hero__title">Design your dream phone case in minutes</h1>
            <p className="landing-hero__subtitle">
              Mix playful trinket packs, layer stickers like a pro, and preview your build before you ever hit checkout.
            </p>
            <div className="landing-hero__actions">
              <button className="tape-btn tape-btn--lg" onClick={handleStartDesign}>
                Start designing
              </button>
              <button
                className="chip"
                type="button"
                onClick={() => packListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              >
                Browse packs
              </button>
            </div>
            <div className="landing-hero__metrics">
              <Metric label="Curated packs" value={packCount.toString()} />
              <Metric label="Hand-drawn trinkets" value={totalTrinkets.toString()} />
              <Metric label="Aesthetic styles" value={`${tagCount}+`} />
            </div>
            <div className="landing-hero__steps">
              {[
                { title: 'Pick a pack', detail: 'Choose the vibe that fits your mood.' },
                { title: 'Drag & style', detail: 'Drop stickers onto the case, rotate, resize, and layer.' },
                { title: 'Share or shop', detail: 'Export a mockup or head to checkout once it’s perfect.' },
              ].map((item, i) => (
                <StepCard key={item.title} index={i + 1} title={item.title} detail={item.detail} />
              ))}
            </div>
          </div>
          <div className="landing-hero__preview">
            <div className="landing-hero__preview-frame">
              <div className="landing-hero__preview-case">
                {heroStickers.map((src, i) => (
                  <motion.div
                    key={`${src}-${i}`}
                    className={clsx('landing-hero__sticker', `landing-hero__sticker--${i}`)}
                    initial={{ y: 0 }}
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 3.5 + i * 0.25, ease: 'easeInOut', delay: i * 0.1 }}
                  >
                    <img src={src} alt="" loading="lazy" />
                  </motion.div>
                ))}
              </div>
              <div className="landing-hero__preview-caption">
                Layer stickers, try glitter, and see your case in real time.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="paper p-5 sm:p-6" ref={packListRef}>
        <h2 className="font-semibold mb-4">Trinket packs</h2>
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(packs as Pack[]).map((p) => (
            <motion.div key={p.id} whileHover={{ y: -2, rotate: -1 }} whileTap={{ scale: 0.98 }} transition={{ type: 'spring', stiffness: 300, damping: 18 }}>
              <PackCard pack={p} tMap={tMap} onChoose={() => onChoose(p.id)} />
            </motion.div>
          ))}
        </div>
      </section>

      <section className="paper p-5 sm:p-6">
        <h3 className="font-semibold mb-2">Lab perks</h3>
        <ul className="space-y-2 text-sm">
          <li>✨ Export polished mockups to share with friends or your shop.</li>
          <li>🧪 Track which trinkets are trending with the built-in analytics.</li>
          <li>🎨 Swap themes, toggle glitter, and remix packs without losing progress.</li>
        </ul>
      </section>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="landing-hero__metric">
      <span className="landing-hero__metric-value">{value}</span>
      <span className="landing-hero__metric-label">{label}</span>
    </div>
  )
}

function StepCard({ index, title, detail }: { index: number; title: string; detail: string }) {
  return (
    <div className="landing-step">
      <span className="landing-step__number">{index}</span>
      <div>
        <p className="landing-step__title">{title}</p>
        <p className="landing-step__detail">{detail}</p>
      </div>
    </div>
  )
}

function PackCard({ pack, tMap, onChoose }: { pack: Pack; tMap: Record<string, Trinket>; onChoose: () => void }) {
  const icons = pack.trinkets.map(id => tMap[id]?.icon).filter(Boolean).slice(0, 4) as string[]
  return (
    <div className="paper p-4 flex flex-col pack-card">
      <div className="mb-3">
        <h3 className="font-bold wonky text-lg" style={{ ['--r' as any]: `${(Math.random()*2-1).toFixed(2)}deg` }}>{pack.name}</h3>
        <p className="text-sm opacity-70">{pack.description}</p>
      </div>
      <div className="flex items-center gap-2 mb-4">
        <IconStack icons={icons} />
        <span className="text-xs opacity-70">{pack.trinkets.length} items</span>
      </div>
      <div className="mt-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        <button className="tape-btn w-full sm:w-auto" onClick={onChoose}>Design with this pack</button>
        <div className="hidden sm:flex gap-1">
          {pack.trinkets.slice(0,6).map(id => (
            <img key={id} src={tMap[id]?.icon} alt="" className="w-6 h-6" loading="lazy" />
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
