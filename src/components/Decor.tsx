import type { CSSProperties, ReactNode } from 'react';
import { motion } from 'framer-motion';

export function Spark({ className = '', style, color = '#d9ef82' }: { className?: string; style?: CSSProperties; color?: string }) {
  return <motion.span aria-hidden="true" className={`spark-shape ${className}`} style={{ color, ...style }} animate={{ rotate: [0, 15, -10, 0] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}>✳</motion.span>;
}
export function PixelHeart({ className = '' }: { className?: string }) {
  return <span aria-hidden="true" className={`pixel-heart ${className}`}>♥</span>;
}
export function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return <motion.div className={className} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .15 }} transition={{ duration: .65, delay, ease: [0.2, 0.9, 0.2, 1] }}>{children}</motion.div>;
}
export function WavyBadge({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`wavy-badge ${className}`}>{children}</span>;
}
