import { useMemo, useRef, useState } from 'react'
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

type QuickStart = {
  packId: string
  title: string
  description: string
  tip: string
  accent: string
}

const VIBE_FILTERS = [
  { id: 'all', label: 'All vibes' },
  { id: 'cozy', label: 'Cozy cute' },
  { id: 'sweet', label: 'Sweet treats' },
  { id: 'dreamy', label: 'Dreamy sparkle' },
  { id: 'bold', label: 'Bold + loud' },
  { id: 'minimal', label: 'Minimal lines' },
] as const

const PACK_VIBES: Record<string, string[]> = {
  kawaii_animals: ['cozy', 'sweet'],
  sweet_treats: ['sweet'],
  celestial_sparkle: ['dreamy'],
  emoji_mix: ['bold'],
  letters_numbers: ['minimal'],
}

const PACK_LIST = packs as Pack[]
const PACK_MAP = Object.fromEntries(PACK_LIST.map((pack) => [pack.id, pack])) as Record<string, Pack>

const FEATURE_CARDS = [
  {
    icon: '🧩',
    title: 'Drag & drop builder',
    detail: 'Snap trinkets into place with smart magnets, rotation nudges, and glitter overlays.',
  },
  {
    icon: '📊',
    title: 'Built-in analytics',
    detail: 'See which trinkets trend across designs so you can restock the right inventory faster.',
  },
  {
    icon: '💌',
    title: 'Share-ready exports',
    detail: 'Export crisp mockups sized for TikTok, Instagram, or direct-to-customer handoffs.',
  },
] as const

const QUICK_STARTS: QuickStart[] = [
  {
    packId: 'kawaii_animals',
    title: 'Pastel pet pals',
    description: 'Layer the panda over blush gradients, then sprinkle charms for cozy cottagecore energy.',
    tip: 'Toggle the sakura theme and add glitter for instant softness.',
    accent: '#f8c6dd',
  },
  {
    packId: 'celestial_sparkle',
    title: 'Midnight galaxy glow',
    description: 'Stack the moon and star charms, then offset planets for a balanced cosmic spread.',
    tip: 'Switch to the midnight theme and rotate stickers 15° for motion.',
    accent: '#c9d7ff',
  },
  {
    packId: 'emoji_mix',
    title: 'Chaotic text spam',
    description: 'Mix bold emoji faces with letters to spell secret messages or inside jokes.',
    tip: 'Use the matcha theme and shrink duplicate icons for contrast.',
    accent: '#ffe7b8',
  },
]

const FAQ_ITEMS = [
  {
    question: 'Can I mix trinkets from different packs?',
    answer: 'Yep! Start with any pack, then drag extras from the tray. Your layout stays saved while you explore.',
  },
  {
    question: 'How do I share my finished case?',
    answer: 'Open the checkout bar and export a high-res mockup or copy a shareable link to send to friends.',
  },
  {
    question: 'Does the builder work on mobile?',
    answer: 'Absolutely. Rotate your phone landscape for more space and follow the quick guide that appears.',
  },
] as const

export function LandingPage({ onChoose, theme, onToggleTheme, trinkets, onOpenAdmin }: { onChoose: (packId: string) => void; theme: Theme; onToggleTheme: (next: Theme) => void; trinkets: Trinket[]; onOpenAdmin?: () => void }) {
  const tMap = useMemo(
    () => Object.fromEntries(trinkets.map(t => [t.id, t])) as Record<string, Trinket>,
    [trinkets],
  )
  const packListRef = useRef<HTMLDivElement>(null)
  const heroStickerIds = ['kawaii-boba', 'star', 'heart', 'kawaii-panda', 'rainbow', 'sparkle', 'ice-cream', 'planet']
  const heroStickers = heroStickerIds.map((id) => tMap[id]?.icon).filter(Boolean) as string[]
  const packCount = PACK_LIST.length
  const totalTrinkets = trinkets.length
  const tagCount = useMemo(() => {
    const tags = new Set<string>()
    trinkets.forEach((t) => (t.tags ?? []).forEach((tag) => tags.add(tag)))
    return tags.size
  }, [trinkets])
  const featuredPack = PACK_LIST[0]
  const [activeVibe, setActiveVibe] = useState<(typeof VIBE_FILTERS)[number]['id']>('all')
  const [packSearch, setPackSearch] = useState('')

  const filteredPacks = useMemo(() => {
    const term = packSearch.trim().toLowerCase()
    return PACK_LIST.filter((pack) => {
      const matchesVibe = activeVibe === 'all' || (PACK_VIBES[pack.id] ?? []).includes(activeVibe)
      const matchesTerm =
        !term ||
        pack.name.toLowerCase().includes(term) ||
        pack.description.toLowerCase().includes(term) ||
        (PACK_VIBES[pack.id] ?? []).some((vibe) => vibe.includes(term))
      return matchesVibe && matchesTerm
    })
  }, [activeVibe, packSearch])

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
        <div className="landing-pack-filter">
          <div className="landing-pack-filter__search">
            <label className="sr-only" htmlFor="pack-search">
              Search packs
            </label>
            <input
              id="pack-search"
              value={packSearch}
              onChange={(event) => setPackSearch(event.target.value)}
              placeholder="Search by vibe or name"
              type="search"
            />
          </div>
          <div className="landing-pack-filter__chips" role="listbox" aria-label="Filter packs by vibe">
            {VIBE_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                className={clsx('chip', activeVibe === filter.id && 'chip--active')}
                onClick={() => setActiveVibe(filter.id)}
                aria-selected={activeVibe === filter.id}
                role="option"
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
        {filteredPacks.length === 0 ? (
          <p className="text-sm italic opacity-70">No packs match that vibe yet. Try clearing the filters.</p>
        ) : null}
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPacks.map((p) => (
            <motion.div key={p.id} whileHover={{ y: -2, rotate: -1 }} whileTap={{ scale: 0.98 }} transition={{ type: 'spring', stiffness: 300, damping: 18 }}>
              <PackCard pack={p} tMap={tMap} vibes={PACK_VIBES[p.id] ?? []} onChoose={() => onChoose(p.id)} />
            </motion.div>
          ))}
        </div>
      </section>

      <section className="paper p-5 sm:p-6 landing-highlight">
        <h2 className="font-semibold mb-3">Why makers love the lab</h2>
        <div className="landing-highlight__grid">
          {FEATURE_CARDS.map((card) => (
            <article key={card.title} className="landing-highlight__item">
              <span className="landing-highlight__icon" aria-hidden="true">
                {card.icon}
              </span>
              <h3 className="landing-highlight__title">{card.title}</h3>
              <p className="landing-highlight__body text-sm">{card.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="paper p-5 sm:p-6 landing-quick-starts">
        <div className="landing-quick-starts__header">
          <div>
            <h2 className="font-semibold mb-2">Quick-start combos</h2>
            <p className="text-sm opacity-75 max-w-xl">
              Jump in with a curated layout. Each combo loads the right pack and hints at how to style it like a pro.
            </p>
          </div>
          <button
            className="chip"
            type="button"
            onClick={() => featuredPack && onChoose(featuredPack.id)}
            disabled={!featuredPack}
          >
            Skip ahead to builder
          </button>
        </div>
        <div className="landing-quick-starts__grid">
          {QUICK_STARTS.map((combo) => {
            const pack = PACK_MAP[combo.packId]
            const previewIcons = pack?.trinkets?.map((id) => tMap[id]?.icon).filter(Boolean).slice(0, 5) as string[]
            return (
              <article key={combo.title} className="landing-quick-starts__card" style={{ ['--combo-accent' as any]: combo.accent }}>
                <div className="landing-quick-starts__badge">{PACK_VIBES[combo.packId]?.[0] ?? 'vibe'}</div>
                <h3 className="landing-quick-starts__title">{combo.title}</h3>
                <p className="landing-quick-starts__description text-sm">{combo.description}</p>
                <p className="landing-quick-starts__tip text-xs">
                  <span className="landing-quick-starts__tip-label">Pro tip</span>
                  {combo.tip}
                </p>
                <div className="landing-quick-starts__preview">
                  {previewIcons.map((src, index) => (
                    <img key={`${combo.packId}-${index}`} src={src} alt="" loading="lazy" />
                  ))}
                </div>
                <button className="tape-btn" type="button" onClick={() => onChoose(combo.packId)}>
                  Load this combo
                </button>
              </article>
            )
          })}
        </div>
      </section>

      <section className="paper p-5 sm:p-6 landing-faq">
        <h2 className="font-semibold mb-3">Frequently asked questions</h2>
        <div className="landing-faq__items">
          {FAQ_ITEMS.map((item) => (
            <details key={item.question} className="landing-faq__item">
              <summary>{item.question}</summary>
              <p className="text-sm opacity-80">{item.answer}</p>
            </details>
          ))}
        </div>
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

function PackCard({ pack, tMap, onChoose, vibes }: { pack: Pack; tMap: Record<string, Trinket>; onChoose: () => void; vibes: string[] }) {
  const icons = pack.trinkets.map(id => tMap[id]?.icon).filter(Boolean).slice(0, 4) as string[]
  return (
    <div className="paper p-4 flex flex-col pack-card">
      <div className="mb-3 space-y-1">
        <h3 className="font-bold wonky text-lg" style={{ ['--r' as any]: `${(Math.random()*2-1).toFixed(2)}deg` }}>{pack.name}</h3>
        {vibes.length ? (
          <div className="landing-pack-vibes">
            {vibes.map((vibe) => (
              <span key={vibe} className="landing-pack-vibes__chip">
                {vibe}
              </span>
            ))}
          </div>
        ) : null}
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
