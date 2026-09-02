import React from 'react';
import { motion, useInView, type Variants } from 'framer-motion';
import { fadeInUp } from './config.js';

interface RevealProps {
  children: React.ReactNode;
  variants?: Variants;
  /** Fraction of element visible before triggering. */
  threshold?: number;
  /** Once: don't re-trigger on scroll back. */
  once?: boolean;
  delay?: number;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export const Reveal: React.FC<RevealProps> = ({
  children,
  variants = fadeInUp,
  threshold = 0.15,
  once = true,
  delay,
  className,
  as = 'div',
}) => {
  const ref = React.useRef<HTMLElement>(null);
  const inView = useInView(ref, { once, amount: threshold });

  const MotionEl = motion[as as keyof typeof motion] as typeof motion.div;

  return (
    <MotionEl
      ref={ref as React.Ref<HTMLDivElement>}
      className={className}
      variants={variants}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      transition={delay ? { delay } : undefined}
    >
      {children}
    </MotionEl>
  );
};
