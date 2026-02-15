/** Shared motion (framer-motion) variant configs for retro-futurism UI */

export const springTransition = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 24,
};

export const viewTransition = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: springTransition,
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: springTransition,
  },
};

export const messageVariants = {
  initial: { opacity: 0, x: -8, scale: 0.97 },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 400, damping: 28 },
  },
};

export const toastVariants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springTransition,
  },
  exit: {
    opacity: 0,
    y: 10,
    scale: 0.95,
    transition: { duration: 0.15 },
  },
};

export const pulseVariant = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: { duration: 2, repeat: Infinity },
  },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } },
};

export const hoverGlow = (color: string) => ({
  whileHover: {
    boxShadow: `0 0 20px ${color}`,
    borderColor: color,
    transition: { duration: 0.2 },
  },
});
