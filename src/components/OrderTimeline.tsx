import { Check, Clock3, Truck, PackageCheck, MapPin } from 'lucide-react';
import type { FulfillmentStatus, Order } from '../types';

export const fulfillmentStages: {id:FulfillmentStatus; label:string;description:string}[]=[
  {id:'awaiting_payment',label:'Awaiting Payment',description:'Waiting for the transfer confirmation'},
  {id:'confirmed',label:'Order Confirmed',description:'Payment verified by COCIOCO'},
  {id:'design_review',label:'Design in Progress',description:'Your custom artwork is being prepared'},
  {id:'preparing',label:'Preparing Your Goodies',description:'Your order is in production or preparation'},
  {id:'packing',label:'Packed With Love',description:'Carefully packed and ready to go'},
  {id:'handed_to_courier',label:'Handed to Courier',description:'Your parcel has been handed to delivery service'},
  {id:'in_transit',label:'On Its Way',description:'Courier is delivering your parcel'},
  {id:'delivered',label:'Delivered!',description:'Package marked as delivered by COCIOCO'},
];
export const fulfillmentLabel=(id:FulfillmentStatus)=>fulfillmentStages.find(s=>s.id===id)?.label || (id==='cancelled'?'Cancelled':id);

export default function OrderTimeline({order}:{order:Order}){
  const hasCustomDesigner=(order.lines||[]).some(l=>l.custom?.designService==='designer')||(order.items||[]).some(l=>l.custom?.designService==='designer');
  const isDigitalOnly=(order.lines?.length?order.lines.every(l=>l.category==='digital'):false);
  const relevant=fulfillmentStages.filter(s=>isDigitalOnly?['awaiting_payment','confirmed','delivered'].includes(s.id):s.id!=='design_review'||hasCustomDesigner);
  const current=order.fulfillmentStatus||'awaiting_payment';
  const index=relevant.findIndex(s=>s.id===current);
  const events=order.trackingEvents||[{id:'legacy',status:'awaiting_payment' as FulfillmentStatus,note:'Order placed.',at:order.at}];
  const latest=events.at(-1);
  return <><div className="cx-tracking-overview"><div><span>STATUS UPDATED BY COCIOCO</span><strong>{fulfillmentLabel(current)}</strong><small>{latest?.note||'No new updates.'}</small></div><div className="cx-tracking-mark"><Truck size={34}/></div></div>
    {isDigitalOnly&&<div className="cx-note">Digital-only order — there is no physical parcel or courier tracking. Delivery/access requires separate fulfillment by COCIOCO.</div>}
    {current==='cancelled' ? <div className="cx-cancelled"><PackageCheck size={20}/> This order has been cancelled. Please contact the COCIOCO team for help.</div> : <ol className="cx-timeline">
      {relevant.map((stage,i)=>{const completed=index>=i;const isCurrent=current===stage.id;const matched=[...events].reverse().find(e=>e.status===stage.id);
        return <li className={`cx-timeline-row ${completed?'done':''} ${isCurrent?'current':''}`} key={stage.id}><div className="cx-timeline-bullet">{completed?<Check size={15}/>:<Clock3 size={14}/>}</div><div className="cx-timeline-text"><div><strong>{isDigitalOnly&&stage.id==='delivered'?'Digital Order Fulfilled':stage.label}</strong>{isCurrent&&<span className="cx-current-chip">CURRENT</span>}</div><p>{matched?.note||stage.description}</p>{matched&&<small>{new Date(matched.at).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'})}</small>}</div></li>;
      })}
    </ol>}
    {(order.courier||order.trackingNumber) && <div className="cx-tracking-courier"><MapPin size={18}/><div><strong>{order.courier||'Courier not specified'}</strong><span>Manual tracking number: {order.trackingNumber||'Not provided yet'}</span></div></div>}
    <div className="cx-no-live-tracking"><Clock3 size={16}/> These updates are entered by COCIOCO staff, not synchronized with the courier or GPS.</div>
  </>;
}
