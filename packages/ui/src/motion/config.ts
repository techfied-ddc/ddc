import type { Transition, Variants } from 'framer-motion';

// Spring presets
export const spring = {
  snappy:  { type: 'spring', stiffness: 400, damping: 30 } satisfies Transition,
  smooth:  { type: 'spring', stiffness: 220, damping: 26 } satisfies Transition,
  gentle:  { type: 'spring', stiffness: 140, damping: 20 } satisfies Transition,
  bouncy:  { type: 'spring', stiffness: 500, damping: 24 } satisfies Transition,
} as const;

// Ease presets
export const ease = {
  standard: [0.2, 0, 0, 1] as [number, number, number, number],
  out:      [0, 0, 0.2, 1] as [number, number, number, number],
  in:       [0.4, 0, 1, 1] as [number, number, number, number],
  sharp:    [0.4, 0, 0.6, 1] as [number, number, number, number],
} as const;

// Reusable variant sets
export const fadeInUp: Variants = {
  hidden:  { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { ...spring.smooth, duration: 0.35 } },
};

export const fadeIn: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, ease: ease.out } },
};

export const scaleIn: Variants = {
  hidden:  { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: spring.snappy },
};

export const slideInRight: Variants = {
  hidden:  { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: spring.smooth },
};

export const staggerContainer: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
