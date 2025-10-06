import { motion } from 'framer-motion'
import { clsx } from 'clsx'

type Theme = 'light' | 'dark'

type Props = {
  theme: Theme
  onToggle: (next: Theme) => void
}

export function ThemeToggle({ theme, onToggle }: Props) {
  const next = theme === 'light' ? 'dark' : 'light'
  const isDark = theme === 'dark'

  return (
    <motion.button
      type="button"
      className={clsx('chip theme-toggle', isDark && 'chip--active')}
      whileTap={{ scale: 0.96 }}
      onClick={() => onToggle(next)}
      aria-pressed={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="inline-flex items-center gap-2">
        <span aria-hidden>{isDark ? '🌙' : '☀️'}</span>
        <span className="font-semibold">{isDark ? 'Dark' : 'Light'} mode</span>
      </span>
    </motion.button>
  )
}

export type { Theme }
