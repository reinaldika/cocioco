import {useEffect,useState,type FormEvent,type ChangeEvent} from 'react';
import {PackagePlus,Save,Image,FileUp} from 'lucide-react';
import {useStore} from '../store';
import type {Product} from '../types';
import {useToast} from './Toast';
import {uploadToBucket,readableError} from '../lib/backend';

const blank:Product={id:'',slug:'',name:'',category:'physical',collection:'',price:79000,image:'/assets/keychain.svg',
 color:'#f9d3ee',description:'',includes:[],stock:10,published:false};
export default function AdminProducts(){
 const {products,upsertProduct}=useStore();const toast=useToast();
 const [editing,setEditing]=useState<Product|null>(null),[loading,setLoading]=useState(false);
 const [includesText,setIncludesText]=useState('');
 useEffect(()=>{if(editing)setIncludesText(editing.includes.join('\n'));},[editing?.id]);
 const start=(p:Product)=>{setEditing({...p});setIncludesText(p.includes.join('\n'));};
 async function save(e:FormEvent){
  e.preventDefault();if(!editing||!upsertProduct)return;
  setLoading(true);try{const result=await upsertProduct({...editing,includes:includesText.split('\n').map(x=>x.trim()).filter(Boolean)});
    toast(result.message,!result.ok);if(result.ok)setEditing(null);
  }finally{setLoading(false);}
 }
 async function uploadDigital(e:ChangeEvent<HTMLInputElement>){
  const file=e.target.files?.[0];if(!file||!editing?.id)return;
  setLoading(true);
  try{const path=await uploadToBucket('cocioco-digital-goods',editing.id,file,100*1024*1024);
      setEditing({...editing,digitalAssetPath:path});toast('Private digital asset uploaded. Save this product to publish the file path.');}
  catch(err){toast(readableError(err),true);}finally{setLoading(false);}
 }
 return <section className="cx-admin-products"><div className="dash-section-title"><div><span className="eyebrow">LIVE INVENTORY & CATALOG</span><h2>Goodies <em>department.</em></h2></div><button className="btn btn-purple btn-sm" onClick={()=>start(blank)}><PackagePlus size={17}/> New product</button></div>
 {editing?<form className="cx-article-editor" onSubmit={save}><div className="cx-editor-head"><h3>{editing.name||'New product'}</h3><button type="button" onClick={()=>setEditing(null)}>Cancel</button></div><div className="cx-editor-grid">
 <label>Product name<input required minLength={3} value={editing.name} onChange={e=>setEditing({...editing,name:e.target.value})}/></label>
 <label>URL slug<input required minLength={3} value={editing.slug} onChange={e=>setEditing({...editing,slug:e.target.value})}/></label>
 <label>Category<select value={editing.category} onChange={e=>setEditing({...editing,category:e.target.value as Product['category']})}><option value="physical">Physical</option><option value="digital">Digital</option></select></label>
 <label>Collection<input value={editing.collection} onChange={e=>setEditing({...editing,collection:e.target.value})}/></label>
 <label>Price IDR<input type="number" min="0" required value={editing.price} onChange={e=>setEditing({...editing,price:Number(e.target.value)})}/></label>
 <label>Stock<input type="number" min="0" required value={editing.stock} onChange={e=>setEditing({...editing,stock:Number(e.target.value)})}/></label>
 <label>Badge<input value={editing.badge||''} onChange={e=>setEditing({...editing,badge:e.target.value})}/></label>
 <label>Background color<input type="color" value={editing.color} onChange={e=>setEditing({...editing,color:e.target.value})}/></label>
 <label className="cx-full">Product image URL or /assets path<input required value={editing.image} onChange={e=>setEditing({...editing,image:e.target.value})}/></label>
 <label className="cx-full">Description<textarea rows={3} value={editing.description} onChange={e=>setEditing({...editing,description:e.target.value})}/></label>
 <label className="cx-full">What is included (one per line)<textarea rows={4} value={includesText} onChange={e=>setIncludesText(e.target.value)}/></label>
 {editing.category==='digital'&&editing.id&&<label className="cx-full"><FileUp size={17}/> Digital deliverable (private bucket; max 100 MB)<input type="file" onChange={uploadDigital}/><small>{editing.digitalAssetPath||'Save the product first, then upload the digital file and save again.'}</small></label>}
 <label className="cx-publish-check"><input type="checkbox" checked={editing.published!==false} onChange={e=>setEditing({...editing,published:e.target.checked})}/> Published on storefront</label>
 </div><button disabled={loading} className="btn btn-black" type="submit"><Save size={18}/>{loading?'Saving...':'Save product to database'}</button></form>:null}
 <div className="cx-admin-story-list">{products.map(p=><article className="cx-admin-story" key={p.id}><img src={p.image} alt=""/><div><span>{p.category.toUpperCase()} · STOCK {p.stock}</span><strong>{p.name}</strong><small>Rp{p.price.toLocaleString('id-ID')} · {p.slug}</small></div><button className="cx-btn-outline" onClick={()=>start(p)}><Image size={16}/> Edit</button></article>)}</div>
 </section>;
}
