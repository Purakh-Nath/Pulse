import { useEffect, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  formatFn?: (n: number) => string;
}

export function AnimatedCounter({
  value,
  duration = 0.8,
  className,
  prefix = '',
  suffix = '',
  formatFn,
}: AnimatedCounterProps) {
  const spring = useSpring(value, {
    stiffness: 100,
    damping: 20,
    duration: duration * 1000,
  });

  const [display, setDisplay] = useState(value);

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useEffect(() => {
    const unsubscribe = spring.on('change', (v) => {
      setDisplay(Math.round(v));
    });
    return unsubscribe;
  }, [spring]);

  const formatted = formatFn ? formatFn(display) : display.toLocaleString();

  return (
    <motion.span className={className}>
      {prefix}
      {formatted}
      {suffix}
    </motion.span>
  );
}
