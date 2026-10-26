import type { Product, CartItem, CustomSelection, CustomPriceOverride, OrderLine } from './types';
import { products } from './data';

export type Choice = { id: string; label: string; extra: number };
export type MerchType = { id: CustomSelection['typeId']; name: string; subtitle: string; image: string; tint: string; base: number; designFee: number; sizes: Choice[]; materials: Choice[]; finishes: Choice[]; turnaround: string };

export const customTypes: MerchType[] = [
  { id:'collection-book',name:'Collection Book',subtitle:'A home for your favorite little memories.',image:'/assets/binder.svg',tint:'#e7d5ff',base:299000,designFee:160000,turnaround:'Estimated 7–14 days after artwork approval',sizes:[{id:'a6',label:'A6 · 12 × 16 cm',extra:0},{id:'a5',label:'A5 · 15 × 21 cm',extra:65000},{id:'b5',label:'B5 · 18 × 25 cm',extra:110000}],materials:[{id:'pvc',label:'Premium PVC cover',extra:0},{id:'hardcover',label:'Rigid hardcover',extra:55000},{id:'pu',label:'Soft PU leather',extra:90000}],finishes:[{id:'matte',label:'Soft matte',extra:0},{id:'glossy',label:'Glossy',extra:20000},{id:'hologram',label:'Holographic',extra:45000}] },
  { id:'card-holder',name:'Card Holder',subtitle:'Your pocket-sized personality.',image:'/assets/cardholder.svg',tint:'#ffd4e8',base:149000,designFee:110000,turnaround:'Estimated 5–10 days after artwork approval',sizes:[{id:'standard',label:'Standard · 6 × 9 cm',extra:0},{id:'large',label:'Large · 8 × 11 cm',extra:28000}],materials:[{id:'acrylic',label:'Acrylic + strap',extra:0},{id:'vegan-leather',label:'Vegan leather',extra:45000}],finishes:[{id:'glossy',label:'Glossy',extra:0},{id:'matte',label:'Matte',extra:15000},{id:'glitter',label:'Glitter effect',extra:30000}] },
  { id:'keychain',name:'Keychain',subtitle:'Tiny charm, very big main-character energy.',image:'/assets/keychain.svg',tint:'#f5d0fa',base:99000,designFee:95000,turnaround:'Estimated 5–10 days after artwork approval',sizes:[{id:'small',label:'Small · 4 cm',extra:0},{id:'medium',label:'Medium · 6 cm',extra:16000},{id:'large',label:'Large · 8 cm',extra:32000}],materials:[{id:'acrylic',label:'Clear acrylic',extra:0},{id:'metal',label:'Metal charm',extra:50000}],finishes:[{id:'standard',label:'Standard',extra:0},{id:'epoxy',label:'Epoxy dome',extra:23000},{id:'glitter',label:'Glitter',extra:28000}] },
  { id:'photocard-set',name:'Photocard Set',subtitle:'Keep the memories, customize every detail.',image:'/assets/photocards.svg',tint:'#eaf3ad',base:159000,designFee:130000,turnaround:'Estimated 5–12 days after artwork approval',sizes:[{id:'kpop',label:'K-pop · 55 × 85 mm',extra:0},{id:'square',label:'Square · 75 × 75 mm',extra:25000},{id:'large',label:'Large · 70 × 100 mm',extra:35000}],materials:[{id:'300gsm',label:'300 gsm art card',extra:0},{id:'400gsm',label:'400 gsm luxury card',extra:26000}],finishes:[{id:'matte',label:'Matte lamination',extra:0},{id:'gloss',label:'Gloss lamination',extra:15000},{id:'holo',label:'Holographic lamination',extra:38000}] },
];
export const merch = (id: CustomSelection['typeId']) => customTypes.find(t=>t.id===id) || customTypes[0];
export const defaultSelection = (typeId: CustomSelection['typeId']): CustomSelection => {
  const t = merch(typeId);
  return { typeId, sizeId:t.sizes[0].id,materialId:t.materials[0].id,finishId:t.finishes[0].id,designService:'upload',notes:'',artworkName:'' };
};
export const getOption = (opts: Choice[], id: string) => opts.find(x=>x.id===id) || opts[0];
export function customQuote(selection: CustomSelection, quantity: number, prices: Record<string,CustomPriceOverride> = {}) {
  const t=merch(selection.typeId);
  const size=getOption(t.sizes,selection.sizeId),material=getOption(t.materials,selection.materialId),finish=getOption(t.finishes,selection.finishId);
  const base=prices[t.id]?.base ?? t.base;
  const designFee=selection.designService==='designer' ? (prices[t.id]?.designFee ?? t.designFee) : 0;
  const rawUnit=base+size.extra+material.extra+finish.extra;
  const discount=quantity>=10?.12:quantity>=5?.07:0;
  const unitPrice=Math.round(rawUnit*(1-discount));
  return {type:t,size,material,finish,base,rawUnit,unitPrice,designFee,quantityDiscount:discount,total:unitPrice*Math.max(1,quantity)+designFee};
}
export function resolveCartLine(item: CartItem, prices: Record<string,CustomPriceOverride> = {}, catalog: Product[] = products): OrderLine | null {
  if(item.custom) {
    const q=customQuote(item.custom,item.quantity,prices);
    return { key:item.lineId || item.productId,name:`Custom ${q.type.name}`,image:q.type.image,quantity:item.quantity,category:'custom',unitPrice:q.unitPrice,designFee:q.designFee,total:q.total,custom:item.custom,detail:`${q.size.label} · ${q.material.label} · ${q.finish.label} · ${item.custom.designService==='designer'?'Designer requested':'Own artwork'}` };
  }
  const p=catalog.find(x=>x.id===item.productId);
  return p? {key:item.lineId||item.productId,name:p.name,image:p.image,quantity:item.quantity,category:p.category,unitPrice:p.price,designFee:0,total:p.price*item.quantity,detail:p.collection}:null;
}
export function cartTotal(cart:CartItem[],prices:Record<string,CustomPriceOverride>={},catalog:Product[]=products){return cart.reduce((total,item)=>total+(resolveCartLine(item,prices,catalog)?.total??0),0);}
export function isPhysicalLine(item:CartItem,catalog:Product[]=products){ return Boolean(item.custom || catalog.find(p=>p.id===item.productId)?.category==='physical'); }
