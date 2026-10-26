import { useEffect,useState,type FormEvent } from 'react';
import { Info, Save, SlidersHorizontal } from 'lucide-react';
import { customTypes } from '../custom';
import { useStore } from '../store';
import { useToast } from './Toast';
import { money } from '../data';
import type { CustomPriceOverride, CustomTypeId } from '../types';

function CustomPriceRow({type}:{type:typeof customTypes[number]}){
  const {customPrices,updateCustomPrice}=useStore();const toast=useToast();
  const [form,setForm]=useState<CustomPriceOverride>({base:customPrices[type.id]?.base??type.base,designFee:customPrices[type.id]?.designFee??type.designFee});
  useEffect(()=>setForm({base:customPrices[type.id]?.base??type.base,designFee:customPrices[type.id]?.designFee??type.designFee}),[customPrices[type.id]?.base,customPrices[type.id]?.designFee,type.base,type.designFee]);
  const save=async(e:FormEvent)=>{e.preventDefault();const res=await updateCustomPrice(type.id as CustomTypeId,form);toast(res.message,!res.ok);};
  return <form onSubmit={save} className="cx-admin-price-line"><img src={type.image} alt=""/><div className="cx-admin-price-heading"><strong>{type.name}</strong><small>From {money(customPrices[type.id]?.base??type.base)} · Design {money(customPrices[type.id]?.designFee??type.designFee)}</small></div><label>Base IDR<input type="number" min="1000" required value={form.base} onChange={e=>setForm({...form,base:Number(e.target.value)})}/></label><label>Design fee IDR<input type="number" min="0" required value={form.designFee} onChange={e=>setForm({...form,designFee:Number(e.target.value)})}/></label><button type="submit" className="cx-btn-outline"><Save size={16}/> Save</button></form>;
}
export default function AdminCustomPricing(){const {backendMode}=useStore();return <section><div className="dash-section-title"><div><span className="eyebrow">ADJUSTABLE CUSTOM SHOP</span><h2>Custom <em>pricing.</em></h2></div><SlidersHorizontal size={32}/></div><p className="cx-admin-intro">Manage the base merchandise prices and one-time designer-service fee for the custom configurator. Individual size, material, and finish surcharges are currently defined in the source; this panel edits live base prices and designer fees.</p><div className="cx-admin-price-list">{customTypes.map(type=><CustomPriceRow key={type.id} type={type}/>)}</div><div className="cx-note"><Info size={18}/><span>{backendMode==='live'?'Base and designer-fee updates are saved to COCIOCO database. Already-placed orders retain the prices quoted at checkout.':'Preview only: changes affect this browser. Connect Supabase to save pricing centrally.'}</span></div></section>}
