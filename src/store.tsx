import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { CartItem, Order, Penalty, Task, TaskStatus, User } from './types';
import { initialTasks, products } from './data';

type ActionResult = { ok: boolean; message: string };
type DemoState = { user: User | null; tasks: Task[]; penalties: Penalty[]; cart: CartItem[]; wishlist: string[]; orders: Order[] };
type CreateTask = { title: string; category: string; description: string; reward: number; brief: string };
type Store = DemoState & {
  loginDemo: (role: 'designer' | 'admin') => void;
  registerDemo: (name: string, email: string) => void;
  logout: () => void;
  claimTask: (id: string) => ActionResult;
  submitTask: (id: string, file: File) => ActionResult;
  addCart: (id: string, quantity?: number) => void;
  setCartQuantity: (id: string, qty: number) => void;
  removeCart: (id: string) => void;
  toggleWishlist: (id: string) => void;
  placeOrder: (data: { customerName: string; email: string; address: string; payment: string; discount: number }) => Order;
  createTask: (task: CreateTask) => ActionResult;
  setTaskStatus: (id: string, status: TaskStatus) => void;
  resetPenalties: (userId?: string) => void;
  simulateExpiry: (id: string) => void;
  resetDemo: () => void;
};
const StoreContext = createContext<Store | null>(null);
const KEY = 'cocioco.shop.demo.v1';
function blank(): DemoState { return { user: null, tasks: initialTasks, penalties: [], cart: [], wishlist: [], orders: [] }; }
function load(): DemoState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const state = JSON.parse(raw) as DemoState;
      if (Array.isArray(state.tasks) && Array.isArray(state.cart)) return state;
    }
  } catch { /* private browsing / invalid cache */ }
  return blank();
}
const uid = () => typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(load);
  const { user, tasks, penalties, cart, wishlist, orders } = state;
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage unavailable */ } }, [state]);

  const expireTasks = useCallback(() => {
    const time = Date.now();
    setState(s => {
      const expired = s.tasks.filter(t => t.status === 'in_progress' && t.deadlineAt && t.deadlineAt <= time && t.assignedTo);
      if (!expired.length) return s;
      const nextPenalties = [...s.penalties];
      for (const task of expired) {
        if (!task.assignedTo || nextPenalties.some(p => p.taskId === task.id && p.userId === task.assignedTo)) continue;
        const level = Math.min(5, nextPenalties.filter(p => p.userId === task.assignedTo).length + 1);
        const hours = level >= 5 ? 0 : 8 * 2 ** (level - 1);
        nextPenalties.push({ id: uid(), userId: task.assignedTo, taskId: task.id, at: time, level, hours, until: level >= 5 ? null : time + hours * 3600000 });
      }
      return {
        ...s,
        penalties: nextPenalties,
        tasks: s.tasks.map(t => expired.some(e => e.id === t.id) ? { ...t, status: 'available' as const, assignedTo: undefined, assigneeName: undefined, claimedAt: undefined, deadlineAt: undefined } : t),
      };
    });
  }, []);
  useEffect(() => { expireTasks(); const interval = window.setInterval(expireTasks, 5000); return () => window.clearInterval(interval); }, [expireTasks]);

  const loginDemo = useCallback((role: 'designer' | 'admin') => {
    setState(s => ({ ...s, user: role === 'designer' ? { id: 'demo-designer', name: 'cocoberry', email: 'designer@demo.cocioco', role, joinedAt: Date.now() - 86400000 * 14 } : { id: 'demo-admin', name: 'COCIOCO Team', email: 'admin@demo.cocioco', role, joinedAt: Date.now() - 86400000 * 100 } }));
  }, []);
  const registerDemo = useCallback((name: string, email: string) => { setState(s => ({ ...s, user: { id: `user-${uid()}`, name: name.trim() || 'creativehuman', email: email.trim(), role: 'designer', joinedAt: Date.now() } })); }, []);
  const logout = useCallback(() => { setState(s => ({ ...s, user: null })); }, []);

  const claimTask = (id: string): ActionResult => {
    if (!user || user.role !== 'designer') return { ok: false, message: 'Sign in as a designer to claim this commission.' };
    if (penalties.some(p => p.userId === user.id && (p.until === null || p.until > Date.now()))) return { ok: false, message: 'Your account has an active commission suspension.' };
    const task = tasks.find(t => t.id === id);
    if (!task || task.status !== 'available') return { ok: false, message: 'This commission is no longer available.' };
    if (tasks.some(t => t.assignedTo === user.id && (t.status === 'in_progress' || t.status === 'revision'))) return { ok: false, message: 'Finish your current commission before claiming another.' };
    const now = Date.now();
    setState(s => ({ ...s, tasks: s.tasks.map(t => t.id === id && t.status === 'available' ? { ...t, status: 'in_progress' as const, assignedTo: user.id, assigneeName: user.name, claimedAt: now, deadlineAt: now + t.durationHours * 3600000 } : t) }));
    return { ok: true, message: `${id} claimed! Your 8-hour countdown starts now. Good luck!` };
  };

  const submitTask = (id: string, file: File): ActionResult => {
    if (!user) return { ok: false, message: 'Please log in first.' };
    const task = tasks.find(t => t.id === id);
    if (!task || task.assignedTo !== user.id || !['in_progress', 'revision'].includes(task.status)) return { ok: false, message: 'This task is not assigned to your account.' };
    if (task.status === 'in_progress' && task.deadlineAt && Date.now() >= task.deadlineAt) { expireTasks(); return { ok: false, message: 'Your original 8-hour deadline has passed.' }; }
    if (file.size > 20 * 1024 * 1024) return { ok: false, message: 'Demo file size limit is 20 MB.' };
    const submission = { name: file.name, size: file.size, submittedAt: Date.now(), by: user.id };
    setState(s => ({ ...s, tasks: s.tasks.map(t => t.id === id ? { ...t, status: 'under_review' as const, submissions: [...t.submissions, submission] } : t) }));
    return { ok: true, message: 'Submission recorded in this browser! In production, actual file storage must be connected.' };
  };

  const addCart = useCallback((id: string, quantity = 1) => setState(s => ({ ...s, cart: s.cart.some(i => i.productId === id) ? s.cart.map(i => i.productId === id ? { ...i, quantity: Math.min(20, i.quantity + quantity) } : i) : [...s.cart, { productId: id, quantity }] })), []);
  const setCartQuantity = useCallback((id: string, qty: number) => setState(s => ({ ...s, cart: qty < 1 ? s.cart.filter(i => i.productId !== id) : s.cart.map(i => i.productId === id ? { ...i, quantity: Math.min(20, qty) } : i) })), []);
  const removeCart = useCallback((id: string) => setState(s => ({ ...s, cart: s.cart.filter(i => i.productId !== id) })), []);
  const toggleWishlist = useCallback((id: string) => setState(s => ({ ...s, wishlist: s.wishlist.includes(id) ? s.wishlist.filter(x => x !== id) : [...s.wishlist, id] })), []);
  const placeOrder = (data: { customerName: string; email: string; address: string; payment: string; discount: number }): Order => {
    const subtotal = cart.reduce((sum, item) => sum + (products.find(p => p.id === item.productId)?.price || 0) * item.quantity, 0);
    const order: Order = { id: `CC-${Date.now().toString().slice(-8)}`, total: Math.round(subtotal * (1 - data.discount)), at: Date.now(), items: [...cart], customerName: data.customerName, email: data.email, address: data.address, payment: data.payment };
    setState(s => ({ ...s, orders: [order, ...s.orders], cart: [] }));
    return order;
  };
  const createTask = (input: CreateTask): ActionResult => {
    if (user?.role !== 'admin') return { ok: false, message: 'Admin access required.' };
    if (!input.title.trim() || input.reward < 1000) return { ok: false, message: 'Add a valid task title and reward.' };
    const task: Task = { id: `CO-${String(Math.floor(Math.random() * 899) + 100)}`, title: input.title.trim(), category: input.category || 'Design', description: input.description.trim(), reward: input.reward, durationHours: 8, status: 'available', postedAt: Date.now(), art: '/assets/elements.svg', tone: 'pink', skills: ['Creative Design', 'Figma'], deliverables: ['Editable source file', 'High-resolution export'], brief: input.brief, submissions: [] };
    setState(s => ({ ...s, tasks: [task, ...s.tasks] }));
    return { ok: true, message: 'New commission published to the board.' };
  };
  const setTaskStatus = useCallback((id: string, status: TaskStatus) => setState(s => ({ ...s, tasks: s.tasks.map(t => t.id === id ? { ...t, status, ...(status === 'available' ? { assignedTo: undefined, assigneeName: undefined, claimedAt: undefined, deadlineAt: undefined } : {}), ...(status === 'revision' ? { deadlineAt: Date.now() + 4 * 3600000 } : {}) } : t) })), []);
  const simulateExpiry = useCallback((id: string) => {
    setState(s => {
      const task = s.tasks.find(t => t.id === id);
      if (!task || task.status !== 'in_progress' || !task.assignedTo) return s;
      const now = Date.now();
      const level = Math.min(5, s.penalties.filter(p => p.userId === task.assignedTo).length + 1);
      const hours = level >= 5 ? 0 : 8 * 2 ** (level - 1);
      const penalty = { id: uid(), userId: task.assignedTo, taskId: task.id, level, hours, at: now, until: level >= 5 ? null : now + hours * 3600000 };
      return { ...s, penalties: [...s.penalties, penalty], tasks: s.tasks.map(t => t.id === id ? { ...t, status: 'available' as const, assignedTo: undefined, assigneeName: undefined, claimedAt: undefined, deadlineAt: undefined } : t) };
    });
  }, []);
  const resetPenalties = useCallback((userId?: string) => setState(s => ({ ...s, penalties: userId ? s.penalties.filter(p => p.userId !== userId) : [] })), []);
  const resetDemo = useCallback(() => setState(blank()), []);

  const value = useMemo<Store>(() => ({ user, tasks, penalties, cart, wishlist, orders, loginDemo, registerDemo, logout, claimTask, submitTask, addCart, setCartQuantity, removeCart, toggleWishlist, placeOrder, createTask, setTaskStatus, resetPenalties, simulateExpiry, resetDemo }), [user, tasks, penalties, cart, wishlist, orders, loginDemo, registerDemo, logout, addCart, setCartQuantity, removeCart, toggleWishlist, setTaskStatus, resetPenalties, simulateExpiry, resetDemo]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
export function useStore() { const ctx = useContext(StoreContext); if (!ctx) throw new Error('StoreProvider missing'); return ctx; }
