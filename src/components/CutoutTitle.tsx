import { motion } from 'framer-motion'

export function CutoutTitle({ text }: { text: string }) {
  const letters = text.split('')
  return (
    <motion.h1
      className="text-2xl sm:text-3xl font-black tracking-tight"
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.035 } } }}
    >
      {letters.map((ch, i) => (
        <motion.span
          key={i}
          className="inline-block mr-[1px]"
          variants={{ hidden: { y: -10, opacity: 0, rotate: -3 }, show: { y: 0, opacity: 1, rotate: (Math.random() * 6 - 3) } }}
        >
          {ch}
        </motion.span>
      ))}
    </motion.h1>
  )
}

