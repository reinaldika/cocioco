import {useState} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {ArrowRight,PackageCheck,ShoppingBag,Truck,LogOut,Paintbrush,LockKeyhole,FileDown} from 'lucide-react';
import {useStore} from '../store';
import {showCurrency} from '../pricing';
import {getPrivateDownload,readableError,command} from '../lib/backend';
import {useToast} from '../components/Toast';

export default function CustomerAccount(){
 const {user,orders,products,logout,backendMode,refresh}=useStore();const navigate=useNavigate(),toast=useToast();
 const [requesting,setRequesting]=useState(false);
 async function requestDesigner(){setRequesting(true);try{await command('requestDesigner',{});await refresh?.();toast('Designer application submitted to COCIOCO.');}catch(e){toast(readableError(e),true);}finally{setRequesting(false);}}
 if(!user)return <div className="container page-section empty-state"><LockKeyhole size={36}/><h2>Sign in to see your orders</h2><Link to="/auth" className="btn btn-black">Sign in</Link></div>;
 async function download(productId:string){
  const p=products.find(p=>p.id===productId);
  if(!p?.digitalAssetPath){toast('Digital files have not been uploaded by COCIOCO yet.',true);return;}
  try{const url=await getPrivateDownload('cocioco-digital-goods',p.digitalAssetPath);window.open(url,'_blank','noopener,noreferrer');}
  catch(e){toast(readableError(e),true);}
 }
 return <div className="container cx-page cx-customer-account"><section className="cx-track-hero"><div><span className="cx-kicker">MY COCIOCO ACCOUNT</span><h1>Hi, <em>{user.name}!</em></h1><p>Your little corner for orders, custom projects, and package journeys.</p></div><ShoppingBag size={70}/></section>
 {user.designerRequested&&!user.designerApproved&&<div className="cx-note"><PackageCheck size={20}/> Your designer application is waiting for admin approval. You can still shop and track orders.</div>}
 {backendMode==='live'&&!user.designerRequested&&!user.designerApproved&&<div className="cx-note"><Paintbrush size={20}/> Interested in paid creative commissions? <button className="cx-btn-outline" disabled={requesting} onClick={requestDesigner}>{requesting?'Submitting...':'Request designer access'}</button></div>}
 <div className="cx-account-actions"><Link className="btn btn-black" to="/shop"><ShoppingBag size={18}/> Shop more <ArrowRight size={17}/></Link><Link className="btn btn-outline" to="/custom"><Paintbrush size={18}/> Make something custom</Link><button className="btn btn-outline" onClick={()=>{logout();navigate('/')}}><LogOut size={18}/> Sign out</button></div>
 <div className="cx-ranking-title"><div><span className="cx-kicker">YOUR REAL ORDERS</span><h2>My <em>order history.</em></h2></div><Truck size={34}/></div>
 {orders.length?orders.map(o=><article key={o.id} className="cx-paper-card cx-my-order"><div><span className="cx-kicker">{o.id} · {new Date(o.at).toLocaleDateString('id-ID')}</span><h3>{showCurrency(o.amountDue,o.currency)}</h3><p>Payment: {o.paymentStatus.replaceAll('_',' ')} · Delivery: {(o.fulfillmentStatus||'awaiting_payment').replaceAll('_',' ')}</p><div className="cx-account-actions"><Link className="cx-btn-outline" to={`/track/${o.id}`}><Truck size={16}/> Track order</Link><Link className="cx-btn-outline" to={`/payment/${o.id}`}>Payment instructions <ArrowRight size={16}/></Link></div></div>
 {o.paymentStatus==='verified'&&o.items.filter(i=>products.some(p=>p.id===i.productId&&p.category==='digital')).map((i,idx)=><button className="cx-btn-outline" key={`${i.productId}-${idx}`} onClick={()=>download(i.productId)}><FileDown size={18}/> Download {products.find(p=>p.id===i.productId)?.name}</button>)}
 </article>):<div className="cx-empty-state"><PackageCheck size={44}/><h3>No orders yet, but so many cute things await!</h3><Link to="/shop" className="btn btn-purple">Shop the collections <ArrowRight size={17}/></Link></div>}
 </div>;
}
