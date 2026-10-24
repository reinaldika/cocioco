import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, CircleAlert, X } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
type Notice = { id: number; message: string; error: boolean };
const Ctx = createContext<((message: string, error?: boolean) => void) | null>(null);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Notice[]>([]);
  const notify = useCallback((message: string, error = false) => setItems(x => [...x, { id: Date.now() + Math.random(), message, error }]), []);
  useEffect(() => { if (!items.length) return; const timer = setTimeout(() => setItems(x => x.slice(1)), 4400); return () => clearTimeout(timer); }, [items]);
  return <Ctx.Provider value={notify}>{children}<div className="toast-stack" aria-live="polite"><AnimatePresence>{items.map(item => <motion.div key={item.id} className={`toast ${item.error ? 'toast-error' : ''}`} initial={{ opacity: 0, y: 20, scale: .95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: 70 }}><span>{item.error ? <CircleAlert size={18} /> : <CheckCircle2 size={18} />}</span><span>{item.message}</span><button aria-label="Dismiss notification" onClick={() => setItems(x => x.filter(i => i.id !== item.id))}><X size={16}/></button></motion.div>)}</AnimatePresence></div></Ctx.Provider>;
}
export function useToast() { const fn = useContext(Ctx); if (!fn) throw new Error('ToastProvider missing'); return fn; }
