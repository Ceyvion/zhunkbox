import { motion } from 'framer-motion'
import { clsx } from 'clsx'

type Theme = 'light' | 'dark' | 'sakura' | 'matcha' | 'coquette' | 'midnight'

const THEME_ORDER: Theme[] = ['light', 'dark', 'sakura', 'matcha', 'coquette', 'midnight']

const THEME_META: Record<Theme, { label: string; icon: string; activeClass?: string }> = {
  light: { label: 'Light', icon: '☀️' },
  dark: { label: 'Dark', icon: '🌙', activeClass: 'chip--active' },
  sakura: { label: 'Sakura', icon: '🌸', activeClass: 'chip--active' },
  matcha: { label: 'Matcha', icon: '🍵', activeClass: 'chip--active' },
  coquette: { label: 'Coquette', icon: '🎀', activeClass: 'chip--active' },
  midnight: { label: 'Midnight', icon: '💫', activeClass: 'chip--active' },
}

type Props = {
  theme: Theme
  onToggle: (next: Theme) => void
}

export function ThemeToggle({ theme, onToggle }: Props) {
  const idx = THEME_ORDER.indexOf(theme)
  const next = THEME_ORDER[(idx + 1) % THEME_ORDER.length]
  const meta = THEME_META[theme]

  return (
    <motion.button
      type="button"
      className={clsx('chip theme-toggle', meta.activeClass)}
      whileTap={{ scale: 0.96 }}
      onClick={() => onToggle(next)}
      aria-label={`Theme: ${meta.label}. Click to switch.`}
      title={`Theme: ${meta.label}. Click to switch.`}
    >
      <span className="inline-flex items-center gap-2">
        <span aria-hidden>{meta.icon}</span>
        <span className="font-semibold">{meta.label}</span>
      </span>
    </motion.button>
  )
}

export type { Theme }
