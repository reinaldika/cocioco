import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Product, CartItem, CreateOrderInput, CustomPriceOverride, CustomSelection, CustomTypeId, FulfillmentStatus, GivingArticle, Order, PaymentSettings, Penalty, Task, TaskStatus, User } from './types';
import { quotePrice } from './pricing';
import { initialTasks, products as sampleProducts } from './data';
import { liveConfigured } from './lib/backend';
import { LiveStoreProvider } from './live-store';
import { cartTotal, resolveCartLine } from './custom';
import { initialGivingArticles } from './giving';

export type ActionResult = { ok: boolean; message: string };
export type DemoState = { user: User | null; tasks: Task[]; penalties: Penalty[]; cart: CartItem[]; wishlist: string[]; orders: Order[]; paymentSettings: PaymentSettings; customPrices:Record<string,CustomPriceOverride>;givingArticles:GivingArticle[] };
export type CreateTask = { title: string; category: string; description: string; reward: number; brief: string;orderId?:string };
export type Store = DemoState & {
  backendMode:'demo'|'live';loading?:boolean;error?:string;products:Product[];
  creatorLeaders?:Array<{id:string;alias:string;projects:number;earnings:number;earningsPublic:boolean}>;
  collectorLeaders?:Array<{id:string;alias:string;orders:number;points:number}>;
  designerApplicants?:Array<{id:string;name:string;email:string;designer_requested:boolean;designer_approved:boolean;role:string}>;
  refresh?:()=>Promise<void>;
  approveDesigner?:(id:string)=>Promise<ActionResult>;
  upsertProduct?:(product:Product & {published?:boolean;digitalAssetPath?:string})=>Promise<ActionResult>;
  markPaid?:(id:string)=>Promise<ActionResult>;
  loginDemo: (role: 'designer' | 'admin') => void;
  registerDemo: (name: string, email: string) => void;
  logout: () => void;
  claimTask: (id: string) => ActionResult | Promise<ActionResult>;
  submitTask: (id: string, file: File) => ActionResult | Promise<ActionResult>;
  addCart: (id: string, quantity?: number) => void;
  setCartQuantity: (id: string, qty: number) => void;
  addCustomToCart: (selection: CustomSelection, quantity:number) => void;
  removeCart: (id: string) => void;
  toggleWishlist: (id: string) => void;
  placeOrder: (data: CreateOrderInput) => Order | Promise<Order>;
  updatePaymentSettings: (data: PaymentSettings) => void | Promise<void>;
  setOrderPaymentStatus: (id: string, status: Order['paymentStatus']) => void | Promise<void>;
  updateOrderTracking: (id:string,status:FulfillmentStatus,note:string,courier:string,trackingNumber:string)=>ActionResult | Promise<ActionResult>;
  upsertGivingArticle: (article:GivingArticle,confirmed?:boolean)=>ActionResult | Promise<ActionResult>;
  deleteGivingArticle: (id:string)=>ActionResult | Promise<ActionResult>;
  updateCustomPrice: (id:CustomTypeId,values:CustomPriceOverride)=>ActionResult | Promise<ActionResult>;
  setCreatorEarningsVisibility:(visible:boolean)=>void;
  createTask: (task: CreateTask) => ActionResult | Promise<ActionResult>;
  setTaskStatus: (id: string, status: TaskStatus) => void | Promise<void>;
  saveTaskReview?: (
  id: string,
  decision: 'approved' | 'revision',
  note: string
) => ActionResult | Promise<ActionResult>;
  resetPenalties: (userId?: string) => void | Promise<void>;
  simulateExpiry: (id: string) => void;
  resetDemo: () => void;
};
export const StoreContext = createContext<Store | null>(null);
const KEY = 'cocioco.shop.demo.v1';
// The mobile number is provided by the shop owner. Bank/PayPal destinations MUST be filled in by them.
const defaultPaymentSettings: PaymentSettings = { bankName: '', accountNumber: '', accountHolder: '', paypalEmail: '', whatsappNumber: '6282317422632' };
function blank(): DemoState { return { user: null, tasks: initialTasks, penalties: [], cart: [], wishlist: [], orders: [], paymentSettings: {...defaultPaymentSettings},customPrices:{},givingArticles:initialGivingArticles }; }
function load(): DemoState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const state = JSON.parse(raw) as DemoState;
      if (Array.isArray(state.tasks) && Array.isArray(state.cart)) return { ...blank(), ...state, paymentSettings: { ...defaultPaymentSettings, ...state.paymentSettings },givingArticles:Array.isArray(state.givingArticles)?state.givingArticles:initialGivingArticles,customPrices:state.customPrices||{} };
    }
  } catch { /* private browsing / invalid cache */ }
  return blank();
}
const uid = () => typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
export function DemoStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(load);
  const { user, tasks, penalties, cart, wishlist, orders, paymentSettings, customPrices, givingArticles } = state;
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
  const addCustomToCart = useCallback((custom:CustomSelection,quantity:number)=>setState(s=>({ ...s,cart:[...s.cart,{productId:'custom',lineId:uid(),quantity:Math.max(1,Math.min(100,quantity)),custom}] })),[]);
  const setCartQuantity = useCallback((id: string, qty: number) => setState(s => ({ ...s, cart: qty < 1 ? s.cart.filter(i => (i.lineId||i.productId) !== id) : s.cart.map(i => (i.lineId||i.productId) === id ? { ...i, quantity: Math.min(100, qty) } : i) })), []);
  const removeCart = useCallback((id: string) => setState(s => ({ ...s, cart: s.cart.filter(i => (i.lineId||i.productId) !== id) })), []);
  const toggleWishlist = useCallback((id: string) => setState(s => ({ ...s, wishlist: s.wishlist.includes(id) ? s.wishlist.filter(x => x !== id) : [...s.wishlist, id] })), []);
  const placeOrder = (data: CreateOrderInput): Order => {
    // The cart has already been selected; the server must enforce stock, prices and FX in Phase B.
    const subtotal = cartTotal(cart,customPrices);
    const lines=cart.map(i=>resolveCartLine(i,customPrices)).filter((line):line is NonNullable<typeof line>=>Boolean(line));
    const totalIDR = Math.round(subtotal * (1 - data.discount));
    const currency: Order['currency'] = data.country === 'ID' ? 'IDR' : 'USD';
    const order: Order = {
      id: `CC-${Date.now().toString(36).toUpperCase()}`,
      total: totalIDR,
      amountDue: quotePrice(totalIDR, data.country, data.fxRate),
      currency,
      country: data.country,
      fxRate: data.fxRate,
      fxAsOf: data.fxAsOf,
      fxSource: data.country === 'ID' ? 'none' : data.fxSource,
      at: Date.now(), items: [...cart],lines,
      fulfillmentStatus:'awaiting_payment',trackingEvents:[{id:uid(),status:'awaiting_payment',at:Date.now(),note:'Order created. Awaiting payment verification.'}],
      collectorAlias:data.leaderboardOptIn?(data.collectorAlias||'Cutie Collector').trim().slice(0,24):undefined,leaderboardOptIn:Boolean(data.leaderboardOptIn),
      customerName: data.customerName.trim(), email: data.email.trim(),
      phone: data.phone.trim(), address: data.address.trim(),
      payment: data.country === 'ID' ? 'bank_transfer' : 'paypal_manual',
      paymentStatus: 'awaiting_payment',
    };
    setState(s => ({ ...s, orders: [order, ...s.orders], cart: [] }));
    return order;
  };
  const updatePaymentSettings = useCallback((settings: PaymentSettings) => {
    setState(s => ({ ...s, paymentSettings: {
      bankName: settings.bankName.trim(), accountHolder: settings.accountHolder.trim(),
      accountNumber: settings.accountNumber.trim(), paypalEmail: settings.paypalEmail.trim(),
      whatsappNumber: settings.whatsappNumber.replace(/[^0-9]/g, ''),
    } }));
  }, []);
  const setOrderPaymentStatus = useCallback((id: string, status: Order['paymentStatus']) => {
    setState(s => ({ ...s, orders: s.orders.map(o => {
      if(o.id!==id)return o;
      if(status==='verified' && o.paymentStatus!=='verified') {
        return { ...o,paymentStatus:status,fulfillmentStatus:'confirmed' as const,trackingEvents:[...(o.trackingEvents||[]),{id:uid(),status:'confirmed' as const,at:Date.now(),note:'Payment verified by COCIOCO admin.'}] };
      }
      return {...o,paymentStatus:status};
    }) }));
  }, []);
  const updateOrderTracking=(id:string,status:FulfillmentStatus,note:string,courier:string,trackingNumber:string):ActionResult=>{
    if(user?.role!=='admin')return {ok:false,message:'Admin preview login required.'};
    const order=orders.find(o=>o.id===id);
    if(!order)return {ok:false,message:'Order not found.'};
    if(status!=='awaiting_payment'&&status!=='cancelled'&&order.paymentStatus!=='verified')return {ok:false,message:'Verify payment before starting fulfillment.'};
    setState(s=>({...s,orders:s.orders.map(o=>o.id===id ? {...o,fulfillmentStatus:status,courier:courier.trim().slice(0,80),trackingNumber:trackingNumber.trim().slice(0,100),trackingEvents:[...(o.trackingEvents||[]),{id:uid(),at:Date.now(),status,note:note.trim().slice(0,350)||'Status updated by COCIOCO.'}]}:o)}));
    return {ok:true,message:`Order ${id} tracking updated.`};
  };
  const upsertGivingArticle=(article:GivingArticle):ActionResult=>{
    if(user?.role!=='admin')return {ok:false,message:'Admin preview login required.'};
    if(article.title.trim().length<5||article.excerpt.trim().length<10||article.content.trim().length<30)return {ok:false,message:'Please add a meaningful title, excerpt and article body.'};
    const allowedCover=/^\/assets\/[a-z0-9-]+\.svg$/.test(article.cover)||/^https:\/\/[^\s]+$/.test(article.cover);
    const clean={...article,title:article.title.trim(),excerpt:article.excerpt.trim(),content:article.content.trim(),cover:allowedCover?article.cover:'/assets/photocards.svg',updatedAt:Date.now()};
    setState(s=>({...s,givingArticles:s.givingArticles.some(a=>a.id===article.id)?s.givingArticles.map(a=>a.id===article.id?clean:a):[clean,...s.givingArticles]}));
    return {ok:true,message:article.published?'Article published in Gives Back.':'Article saved as draft.'};
  };
  const deleteGivingArticle=(id:string):ActionResult=>{
    if(user?.role!=='admin')return {ok:false,message:'Admin preview login required.'};
    setState(s=>({...s,givingArticles:s.givingArticles.filter(a=>a.id!==id)}));
    return {ok:true,message:'Article removed from this browser.'};
  };
  const updateCustomPrice=(id:CustomTypeId,values:CustomPriceOverride):ActionResult=>{
    if(user?.role!=='admin')return {ok:false,message:'Admin preview login required.'};
    if(!Number.isFinite(values.base)||!Number.isFinite(values.designFee)||values.base<1000||values.designFee<0)return {ok:false,message:'Use valid nonnegative prices.'};
    setState(s=>({...s,customPrices:{...s.customPrices,[id]:{base:Math.round(values.base),designFee:Math.round(values.designFee)}}}));
    return {ok:true,message:'Custom price updated in local preview.'};
  };
  const setCreatorEarningsVisibility=useCallback((visible:boolean)=>setState(s=>({...s,user:s.user?{...s.user,showEarningsOnLeaderboard:visible}:null})),[]);
  const createTask = (input: CreateTask): ActionResult => {
    if (user?.role !== 'admin') return { ok: false, message: 'Admin access required.' };
    if (!input.title.trim() || input.reward < 1000) return { ok: false, message: 'Add a valid task title and reward.' };
    if(input.orderId){ const origin=orders.find(o=>o.id===input.orderId);
      if(!origin || origin.paymentStatus!=='verified' || origin.linkedTaskId || !(origin.lines||[]).some(l=>l.custom?.designService==='designer'))return {ok:false,message:'Custom order must be verified, unlinked, and request design service.'};
    }
    const task: Task = { id: `CO-${String(Math.floor(Math.random() * 899) + 100)}`, title: input.title.trim(), category: input.category || 'Design', description: input.description.trim(), reward: input.reward, durationHours: 8, status: 'available', postedAt: Date.now(), art: '/assets/elements.svg', tone: 'pink', skills: ['Creative Design', 'Figma'], deliverables: ['Editable source file', 'High-resolution export'], brief: input.brief, submissions: [] };
    setState(s => ({ ...s, tasks: [task, ...s.tasks],orders:input.orderId?s.orders.map(o=>o.id===input.orderId?{...o,linkedTaskId:task.id}:o):s.orders }));
    return { ok: true, message: 'New commission published to the board.' };
  };
  const setTaskStatus = useCallback((id: string, status: TaskStatus) => setState(s => ({ ...s, tasks: s.tasks.map(t => t.id === id ? { ...t, status, ...(status === 'available' ? { assignedTo: undefined, assigneeName: undefined, claimedAt: undefined, deadlineAt: undefined } : {}), ...(status === 'revision' ? { deadlineAt: Date.now() + 4 * 3600000 } : {}) } : t) })), []); 
  const saveTaskReview = (
    id: string,
    decision: 'approved' | 'revision',
    note: string
  ): ActionResult => {
    if (user?.role !== 'admin') {
      return { ok: false, message: 'Admin access required.' };
    }

    const task = tasks.find(t => t.id === id);
    if (!task || task.status !== 'under_review' || !task.submissions.length) {
      return { ok: false, message: 'No submission available for review.' };
    }

    const feedback = note.trim();
    if (decision === 'revision' && !feedback) {
      return { ok: false, message: 'Revision notes are required.' };
    }
    if (feedback.length > 2000) {
      return { ok: false, message: 'Review notes are too long.' };
    }

    const now = Date.now();
    const reviewerId = user.id;
    const submissionAt = task.submissions[task.submissions.length - 1].submittedAt;

    setState(s => ({
      ...s,
      tasks: s.tasks.map(t => {
        if (t.id !== id || t.status !== 'under_review') return t;

        return {
          ...t,
          status: decision === 'approved' ? 'completed' as const : 'revision' as const,
          reviewHistory: [
            ...(t.reviewHistory ?? []),
            { decision, note: feedback, reviewerId, reviewedAt: now, submissionAt }
          ],
          ...(decision === 'approved'
            ? { approvedAt: now, payoutStatus: 'pending' as const, deadlineAt: undefined }
            : { deadlineAt: now + 4 * 3600000 })
        };
      })
    }));

    return {
      ok: true,
      message: decision === 'approved'
        ? 'Work approved. Payout is pending manual processing.'
        : 'Revision requested and review notes recorded.'
    };
  };
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

  const value:Store={backendMode:'demo',products:sampleProducts, user,tasks,penalties,cart,wishlist,orders,paymentSettings,customPrices,givingArticles,loginDemo,registerDemo,logout,claimTask,submitTask,addCart,addCustomToCart,setCartQuantity,removeCart,toggleWishlist,placeOrder,updatePaymentSettings,setOrderPaymentStatus,updateOrderTracking,upsertGivingArticle,deleteGivingArticle,updateCustomPrice,setCreatorEarningsVisibility,createTask,setTaskStatus,saveTaskReview,resetPenalties,simulateExpiry,resetDemo };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
export function StoreProvider({children}:{children:ReactNode}) {return liveConfigured?<LiveStoreProvider>{children}</LiveStoreProvider>:<DemoStoreProvider>{children}</DemoStoreProvider>;}
export function useStore() { const ctx = useContext(StoreContext); if (!ctx) throw new Error('StoreProvider missing'); return ctx; }
