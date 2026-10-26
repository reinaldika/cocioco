import {useState} from 'react';
import {CheckCircle2,ShieldAlert,Users} from 'lucide-react';
import {useStore} from '../store';
import {useToast} from './Toast';
export default function AdminDesigners(){
 const {designerApplicants=[],approveDesigner,resetPenalties,penalties}=useStore();const toast=useToast();const [busy,setBusy]=useState('');
 async function approve(id:string){if(!approveDesigner)return;setBusy(id);
   try{const r=await approveDesigner(id);toast(r.message,!r.ok);}finally{setBusy('');}}
 async function reset(id:string){if(!window.confirm('Clear suspension history for this designer?'))return;setBusy(id);
  try{await resetPenalties(id);toast('Designer penalty history cleared.');}catch(e){toast(e instanceof Error?e.message:'Unable to reset',true);}finally{setBusy('');}}
 return <section><div className="dash-section-title"><div><span className="eyebrow">APPROVALS AND ACCOUNT SAFETY</span><h2>Designer <em>management.</em></h2></div><Users size={32}/></div>
 <div className="designer-summary"><ShieldAlert size={28}/><p>Designer claims are locked until a verified administrator approves their account. Suspensions escalate 8h, 16h, 32h, 64h, then permanent.</p></div>
 {designerApplicants.filter(p=>p.designer_requested||p.role==='designer').map(p=><article className="cx-paper-card cx-admin-designer" key={p.id}><div><strong>{p.name}</strong><small>{p.email}</small><span>{p.designer_approved?'Approved designer':'Awaiting review'} · {penalties.filter(x=>x.userId===p.id).length} strike(s)</span></div><div className="cx-account-actions">{!p.designer_approved&&p.designer_requested&&<button className="cx-btn-outline" disabled={busy===p.id} onClick={()=>approve(p.id)}><CheckCircle2 size={16}/> Approve</button>}{penalties.some(x=>x.userId===p.id)&&<button className="cx-btn-outline" disabled={busy===p.id} onClick={()=>reset(p.id)}><ShieldAlert size={16}/> Reset penalties</button>}</div></article>)}
 {!designerApplicants.some(p=>p.designer_requested||p.role==='designer')&&<p className="cx-note">No designer applications yet.</p>}
 </section>;
}
