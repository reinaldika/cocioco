import { useEffect, useState } from 'react';
import { formatRemaining } from '../data';
import { Clock3 } from 'lucide-react';
export default function Countdown({ until, className = '' }: { until?: number; className?: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  if (!until) return <span className={className}>08:00:00</span>;
  const soon = until - now < 60 * 60 * 1000;
  return <span className={`countdown ${soon ? 'countdown-urgent' : ''} ${className}`}><Clock3 size={15} strokeWidth={2.4} /> {formatRemaining(until - now)}</span>;
}
