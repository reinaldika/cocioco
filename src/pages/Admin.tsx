import AdminProducts from '../components/AdminProducts';
import AdminDesigners from '../components/AdminDesigners';
import AdminTaskAsset from '../components/AdminTaskAsset';
import {getPrivateDownload,readableError} from '../lib/backend';
import { Link, useNavigate } from 'react-router-dom';
import { useState, type FormEvent } from 'react';
import { ArrowRight, ArrowUpRight, Check, ClipboardList, Coins, LayoutDashboard, LogOut, Plus, RotateCcw, Settings, ShoppingBag, Sparkles, Users, X } from 'lucide-react';
import { useStore } from '../store';
import { money, statusLabel } from '../data';
import type { Order, TaskStatus } from '../types';
import AdminOrderCard from '../components/AdminOrderCard';
import AdminCustomPricing from '../components/AdminCustomPricing';
import AdminGivingArticles from '../components/AdminGivingArticles';
import PaymentSettingsPanel from '../components/PaymentSettingsPanel';
import { useToast } from '../components/Toast';
export default function Admin() {
  const { user, tasks, penalties, orders, logout, createTask, setTaskStatus, resetDemo, simulateExpiry, markPaid,saveTaskReview,backendMode } = useStore(); const navigate=useNavigate(); const toast=useToast();
  const [tab,setTab]=useState<'overview'|'tasks'|'designers'|'orders'|'payments'|'custompricing'|'giving'|'products'>('overview'); const [open,setOpen]=useState(false);
    const [reviewTaskId, setReviewTaskId] = useState<string | null>(null);
  const [form,setForm]=useState<{title:string;category:string;description:string;reward:number;brief:string;orderId?:string}>({title:'',category:'Merchandise',description:'',reward:150000,brief:''});
  const counts={available:tasks.filter(t=>t.status==='available').length,progress:tasks.filter(t=>t.status==='in_progress').length,review:tasks.filter(t=>t.status==='under_review').length,completed:tasks.filter(t=>t.status==='completed').length};
  const [reviewNote, setReviewNote] = useState('');
const reviewTask = tasks.find(t => t.id === reviewTaskId);
  if(user?.role!=='admin')return <div className="container page-section empty-state"><div></div><h1>Staff-only space!</h1><p>This dashboard is for the COCIOCO team. Only a verified COCIOCO administrator can access this area.</p><Link className="btn btn-black" to="/auth">Sign in <ArrowRight size={18}/></Link></div>;
  const create=async(e:FormEvent)=>{e.preventDefault();const result=await createTask(form);toast(result.message,!result.ok);if(result.ok){setOpen(false);setForm({title:'',category:'Merchandise',description:'',reward:150000,brief:''});setTab('tasks');}};
  const prepareOrderTask=(order:Order)=>{
    const custom=order.lines?.find(line=>line.custom?.designService==='designer');if(!custom)return;
    setForm({title:`Custom ${custom.name.replace('Custom ','')} · ${order.id}`,category:'Merchandise',description:`Customer-requested original artwork for ${custom.name.toLowerCase()}.`,reward:0,orderId:order.id,brief:`CUSTOM PROJECT FROM VERIFIED ORDER ${order.id}\nItem: ${custom.name}\nSpecifications: ${custom.detail}\nCustomer direction: ${custom.custom?.notes||'Discuss creative direction with admin'}\nCustomer artwork filename: ${custom.custom?.artworkName||'None'} (private storage, available to admin; do not forward to designer without customer consent)\nPlease confirm requirements with admin; never share customer contact information with contributors.\nProduction handoff: prepare editable design files and preview for COCIOCO review.`});
    setOpen(true);
    toast('Add a fair designer reward, check the brief, and publish this task. No automatic assignment yet.');
  };
  const changeStatus=async(id:string,status:TaskStatus)=>{try{await setTaskStatus(id,status);toast(`Task ${id} moved to ${statusLabel[status]}.`);}catch(e){toast(readableError(e),true);}};
const handleReview = async (decision: 'approved' | 'revision') => {
  if (backendMode !== 'demo' || !saveTaskReview || !reviewTask) {
    toast('Review actions are not enabled in live mode yet.', true);
    return;
  }

  if (decision === 'revision' && !reviewNote.trim()) {
    toast('Please write revision feedback first.', true);
    return;
  }

  if (decision === 'approved' &&
      !window.confirm('Approve this work? This will mark the payout as pending, not paid.')) {
    return;
  }

  try {
    const result = await saveTaskReview(reviewTask.id, decision, reviewNote);
    toast(result.message, !result.ok);

    if (result.ok) {
      setReviewTaskId(null);
      setReviewNote('');
    }
  } catch (error) {
    toast(readableError(error), true);
  }
};

  return <div className="container dashboard-page admin-page"><div className="dashboard-hero admin-hero"><div><span className="eyebrow"> COCIOCO OPERATIONS</span><h1>Creator control <em>room.</em></h1><p>Keep creative chaos organized. You're in charge today! ♡</p></div><div className="dashboard-hero-decoration"> <span>♥</span></div></div><div className="dashboard-layout"><aside className="dashboard-sidebar"><div className="dashboard-user"><div className="avatar admin-avatar">C</div><div><strong>COCIOCO Team</strong><span>{backendMode==='live'?'ADMIN WORKSPACE':'DEMO ADMIN'}</span></div></div><div className="dash-nav">{[{id:'overview',text:'Overview',icon:LayoutDashboard},{id:'tasks',text:'Manage tasks',icon:ClipboardList},{id:'designers',text:'Designers & penalties',icon:Users},{id:'orders',text:'Orders & tracking',icon:ShoppingBag},{id:'products',text:'Shop products',icon:ShoppingBag},{id:'custompricing',text:'Custom pricing',icon:Coins},{id:'giving',text:'Giving articles',icon:Sparkles},{id:'payments',text:'Payment settings',icon:Settings}].map(item=><button key={item.id} className={tab===item.id?'active':''} onClick={()=>setTab(item.id as typeof tab)}><item.icon size={18}/>{item.text}<ArrowUpRight size={15} className="dash-nav-arrow"/></button>)}<Link to="/commissions"><Sparkles size={18}/>View public board <ArrowUpRight size={15}/></Link></div><button className="sign-out" onClick={()=>{logout();navigate('/')}}><LogOut size={17}/> Sign out</button></aside><div className="dashboard-content">
  {tab==='overview'&&<><div className="admin-stats"><div><span>OPEN COMMISSIONS</span><strong>{counts.available}</strong><small> Ready to claim</small></div><div><span>IN PROGRESS</span><strong>{counts.progress}</strong><small>♥ Being created</small></div><div><span>NEEDS REVIEW</span><strong>{counts.review}</strong><small>✦ Take a look</small></div><div><span>COMPLETED</span><strong>{counts.completed}</strong><small>✓ Approved</small></div></div><div className="dash-section-title"><div><span className="eyebrow">AT A GLANCE</span><h2>Today's <em>overview.</em></h2></div><button className="btn btn-purple btn-sm" onClick={()=>setOpen(true)}><Plus size={17}/> Publish task</button></div><h3 className="mini-section-heading">SUBMISSIONS AWAITING REVIEW</h3>{tasks.filter(t=>t.status==='under_review').length?tasks.filter(t=>t.status==='under_review').map(t=><div className="review-card" key={t.id}><img src={t.art} alt=""/><div><small>{t.id} · @{t.assigneeName}</small><strong>{t.title}</strong><span>{t.submissions.at(-1)?.name || 'No filename recorded'}</span></div><div className="review-actions"><button onClick={()=>{   setReviewNote('');   setReviewTaskId(t.id); }}><ArrowUpRight size={16}/> Review submission</button><button onClick={()=>setReviewTaskId(t.id)}><RotateCcw size={16}/> Revision</button></div></div>):<div className="dashboard-empty"><Check size={36}/><h3>You're all caught up!</h3><p>No submissions waiting for review right now.</p></div>}<div className="admin-tip"><Settings size={19}/> {backendMode==='live'?'Admin actions here are saved to COCIOCO’s connected database and visible to authorized users.':'This is a browser-based demo. Connect Supabase to enable shared live data.'}</div></>}
  {tab==='tasks'&&<><div className="dash-section-title"><div><span className="eyebrow">STAY IN CONTROL</span><h2>Task <em>management.</em></h2></div><button className="btn btn-purple btn-sm" onClick={()=>setOpen(true)}><Plus size={17}/> New task</button></div><div className="admin-task-list">{tasks.map(t=><div className="admin-task-item" key={t.id}><img src={t.art} alt=""/><div className="admin-task-info"><small>{t.id} · {t.category}</small><strong>{t.title}</strong><span>{money(t.reward)} · {statusLabel[t.status]}</span></div><div className="admin-task-buttons">{backendMode==='demo'&&t.status==='in_progress' && <button onClick={()=>{simulateExpiry(t.id);toast(`Simulated an expired claim for ${t.id}.`);}}>Test expiry</button>}{t.status==='under_review' && <button onClick={()=>setReviewTaskId(t.id)} className="admin-approve"><ArrowUpRight size={15}/> Review submission</button>}{t.status==='under_review' && <button onClick={()=>setReviewTaskId(t.id)}><RotateCcw size={15}/> Revision</button>}{t.status!=='available' && <button onClick={()=>changeStatus(t.id,'available')}>Reopen</button>}{t.status==='available' && <button onClick={()=>changeStatus(t.id,'cancelled')}>Cancel</button>}{backendMode==='live'&&<AdminTaskAsset id={t.id}/>}
 {backendMode==='live'&&t.status==='completed'&&t.payoutStatus!=='paid'&&markPaid&&<button onClick={async()=>{const r=await markPaid(t.id);toast(r.message,!r.ok);}}>Mark paid</button>}
 {backendMode==='live'&&t.status==='under_review'&&t.submissions.at(-1)?.path&&<button onClick={async()=>{try{window.open(await getPrivateDownload('cocioco-task-submissions',t.submissions.at(-1)!.path!),'_blank','noopener,noreferrer');}catch(e){toast(readableError(e),true);}}}>Open submitted file</button>}
 <Link to={`/commissions/${t.id}`} aria-label={`View ${t.title}`}><ArrowUpRight size={18}/></Link></div></div>)}</div></>}
  {tab==='designers'&& (backendMode==='live'?<AdminDesigners/>:<><div className="dash-section-title"><h2>Designer care</h2></div><p>Demo penalties: {penalties.length}</p></>)}
  {tab==='orders'&&<><div className="dash-section-title"><div><span className="eyebrow">THE GOODIE DEPARTMENT</span><h2>Orders & <em>tracking.</em></h2></div><ShoppingBag size={31}/></div><div className="earning-banner"><small>{backendMode==='live'?'DATABASE ORDERS · PRODUCT VALUE IN IDR':'LOCAL DEMO ORDERS · PRODUCT VALUE IN IDR'}</small><strong>{money(orders.reduce((sum,o)=>sum+o.total,0))}</strong><span>{backendMode==='live'?'Customer orders and manual courier updates are persisted in the COCIOCO database.':'Orders and courier statuses are local to this browser.'}</span></div>{orders.length ? <div className="cx-admin-order-list">{orders.map(o=><AdminOrderCard key={o.id} order={o} onPrepareTask={prepareOrderTask}/>)}</div>:<div className="dashboard-empty"><ShoppingBag size={44}/><h3>No orders yet!</h3><p>Place a demo checkout through the shop or custom studio and then manage its status here.</p></div>}<div className="cx-note">{backendMode==='live'?'Only verified administrators can approve payments and edit delivery statuses. Customers must sign in to see their order.':'To test: checkout in this browser, then use demo admin to verify and update tracking.'}</div>{backendMode==='demo'&&<button className="btn btn-outline" onClick={()=>{if(window.confirm('Reset all local demo data?')){resetDemo();toast('Demo data reset.');navigate('/');}}}>Reset entire demo <RotateCcw size={17}/></button>}</>}
  {tab==='products'&&backendMode==='live'&&<AdminProducts/>}
  {tab==='custompricing'&&<AdminCustomPricing/>}
  {tab==='giving'&&<AdminGivingArticles/>}
  {tab==='payments' && <PaymentSettingsPanel/>}
  </div></div>
{reviewTask && (
  <div
    className="modal-overlay"
    onClick={() => setReviewTaskId(null)}
  >
    <div
      className="admin-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-submission-title"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="modal-close"
        aria-label="Close review"
        onClick={() => setReviewTaskId(null)}
      >
        <X size={20} />
      </button>

      <h2 id="review-submission-title">Review submission</h2>

      <p><strong>{reviewTask.title}</strong></p>
      <p>Designer: {reviewTask.assigneeName || 'Unassigned'}</p>
      <p>
        Submitted file: {reviewTask.submissions.at(-1)?.name || 'No file recorded'}
      </p>

      {backendMode === 'live' && reviewTask.submissions.at(-1)?.path ? (
        <button
          type="button"
          className="btn btn-purple"
          onClick={async () => {
            try {
              const path = reviewTask.submissions.at(-1)?.path;
              if (!path) return;
              const url = await getPrivateDownload(
                'cocioco-task-submissions',
                path
              );
              window.open(url, '_blank', 'noopener,noreferrer');
            } catch (error) {
              toast(readableError(error), true);
            }
          }}
        >
          Open submitted file
        </button>
      ) : (
        <p>
          {backendMode === 'demo'
            ? 'Demo mode: actual submitted files are not stored.'
            : 'No accessible submitted file is available.'}
        </p>
      )}

      <label htmlFor="review-note">Review notes</label>
      <textarea
        id="review-note"
        rows={4}
        value={reviewNote}
        onChange={(e) => setReviewNote(e.target.value)}
        placeholder="Write your feedback here..."
      />

      

{backendMode === 'demo' ? (
  <div
    className="admin-modal-buttons"
    style={{
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'stretch',
      gap: 12,
      marginTop: 20
    }}
  >
    <button
      type="button"
      className="btn btn-outline"
      style={{
        flex: '1 1 170px',
        minWidth: 0,
        whiteSpace: 'normal'
      }}
      onClick={() => void handleReview('revision')}
    >
      <RotateCcw size={16} />
      Request Revision
    </button>

    <button
      type="button"
      className="btn btn-purple"
      style={{
        flex: '1 1 170px',
        minWidth: 0,
        whiteSpace: 'normal'
      }}
      onClick={() => void handleReview('approved')}
    >
      <Check size={16} />
      Approve Work
    </button>
  </div>
) : (
  <p>Live review actions are not enabled yet.</p>
)}

    </div>
  </div>
)}
{open&&<div className="modal-overlay" onClick={()=>setOpen(false)}><div role="dialog" aria-modal="true" aria-labelledby="new-task-title" className="admin-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" aria-label="Close task form" onClick={()=>setOpen(false)}><X size={20}/></button><span className="eyebrow"> {form.orderId?`CUSTOM ORDER ${form.orderId}`:'A BRAND NEW OPPORTUNITY'}</span><h2 id="new-task-title">Publish a <em>commission.</em></h2><form onSubmit={create}><label>Task title<input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. Summer Sticker Collection" /></label><label>Category<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}><option>Merchandise</option><option>Social Media</option><option>Illustration</option><option>Typography</option><option>Packaging</option><option>Digital Assets</option></select></label><label>Short description<input required value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="A sentence about the deliverable" /></label><label>Commission reward (IDR) · set by admin<input required min={1000} type="number" value={form.reward} onChange={e=>setForm({...form,reward:Number(e.target.value)})} /></label><label>Full private brief<textarea required rows={4} value={form.brief} onChange={e=>setForm({...form,brief:e.target.value})} placeholder="Include creative direction, references and delivery details" /></label><div className="admin-modal-buttons"><button className="btn btn-outline" type="button" onClick={()=>setOpen(false)}>Cancel</button><button className="btn btn-black" type="submit"><Coins size={17}/> Publish now <ArrowRight size={17}/></button></div></form></div></div>}</div>;
}
