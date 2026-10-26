import {useState,type FormEvent} from 'react';
import {Link,useNavigate,useSearchParams} from 'react-router-dom';
import {ArrowLeft,ArrowRight,CheckCircle2,LockKeyhole,Mail,UserRound} from 'lucide-react';
import {supabase,readableError} from '../lib/backend';
import {useStore} from '../store';

export default function LiveAuth(){
 const {user}=useStore();const navigate=useNavigate();const [params]=useSearchParams();
 const redirect=params.get('redirect');
 const next=redirect?.startsWith('/')&&!redirect.startsWith('//')?redirect:'/dashboard';
 const [mode,setMode]=useState<'login'|'signup'>('login');
 const [role,setRole]=useState<'customer'|'designer'>('customer');
 const [name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState('');
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 async function submit(event:FormEvent){
  event.preventDefault();if(!supabase)return;
  setBusy(true);setError('');setNotice('');
  try{
   if(mode==='login'){
    const {error}=await supabase.auth.signInWithPassword({email,password});
    if(error)throw error;
    navigate(next,{replace:true});
   }else{
    const {data,error}=await supabase.auth.signUp({email,password,options:{data:{name,wants_designer:role==='designer'}}});
    if(error)throw error;
    if(data.session){navigate(next,{replace:true});}
    else setNotice('Account created! Please check your inbox and confirm your email. Then return to sign in.');
   }
  }catch(e){setError(readableError(e));}finally{setBusy(false);}
 }
 if(user)return <div className="container page-section empty-state"><CheckCircle2 size={42}/><h1>Welcome back, {user.name}!</h1><p>Signed in as {user.role}{user.designerRequested&&!user.designerApproved?' · designer application pending':''}.</p><Link className="btn btn-black" to={user.role==='admin'?'/admin':'/dashboard'}>Go to my account <ArrowRight size={18}/></Link></div>;
 return <div className="container auth-page"><div className="auth-left"><Link className="auth-back" to="/"><ArrowLeft size={16}/> Back to COCIOCO</Link>
 <span className="eyebrow">CREATIVITY LOOKS GOOD ON YOU</span><h1>One little account.<br/><em>So much magic.</em></h1>
 <p>Shop collectibles, track deliveries, customize your merchandise, and join the COCIOCO creative community.</p>
 <div className="auth-art"><img src="/assets/elements.svg" alt="Colorful illustrated stickers"/><span>SHOP · CREATE · EARN</span></div></div>
 <div className="auth-right"><div className="auth-form-head"><span className="auth-heart"><UserRound size={24}/></span><h2>{mode==='login'?'Welcome back!':'Join the creative club!'}</h2><p>Real account security powered by Supabase Auth.</p></div>
 <div className="cx-switch" style={{marginBottom:22}}><button className={mode==='login'?'active':''} onClick={()=>setMode('login')}>Sign in</button><button className={mode==='signup'?'active':''} onClick={()=>setMode('signup')}>Create account</button></div>
 <form className="auth-form" onSubmit={submit}>
 {mode==='signup'&&<><label>Creative name<input required minLength={2} maxLength={80} value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. pixelbunny"/></label>
 <label>I'm joining as<select value={role} onChange={e=>setRole(e.target.value as typeof role)}><option value="customer">Customer / collector</option><option value="designer">Freelance designer (requires admin approval)</option></select></label></>}
 <label>Email address<input required type="email" autoComplete="email" maxLength={180} value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label>
 <label>Password<input required type="password" autoComplete={mode==='signup'?'new-password':'current-password'} minLength={8} value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters"/></label>
 {error&&<p className="cx-form-error" role="alert">{error}</p>}
 {notice&&<div className="cx-note" role="status"><Mail size={18}/>{notice}</div>}
 <button className="btn btn-black" type="submit" disabled={busy}><LockKeyhole size={17}/>{busy?'Processing...':mode==='login'?'Sign in securely':'Create my account'} <ArrowRight size={18}/></button>
 </form><p className="auth-disclaimer"><LockKeyhole size={15}/> Designer access is reviewed by the COCIOCO owner. Admin roles are never created through public signup.</p></div></div>;
}
