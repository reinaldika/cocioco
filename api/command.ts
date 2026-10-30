import type { Request, Response } from '../server/server.js';
import { adminDb, caller, send, reqBody, assertAdmin, asText, asPositive, errorText } from '../server/server.js';
import { usdIdr } from '../server/fx.js';
import { customQuote, customTypes } from '../src/custom.js';
import type { CustomSelection } from '../src/types.js';
import { countries } from '../src/countries.js';

function cleanSelection(raw:unknown):CustomSelection {
 if(!raw || typeof raw!=='object' || Array.isArray(raw))throw new Error('Invalid custom configuration');
 const sel=raw as Record<string,unknown>;
 const type=customTypes.find(t=>t.id===sel.typeId);
 if(!type||!type.sizes.some(t=>t.id===sel.sizeId)||!type.materials.some(t=>t.id===sel.materialId)||!type.finishes.some(t=>t.id===sel.finishId))throw new Error('Invalid custom size, material or finish.');
 if(sel.designService!=='designer'&&sel.designService!=='upload')throw new Error('Invalid design service');
 return {typeId:type.id,sizeId:String(sel.sizeId),materialId:String(sel.materialId),finishId:String(sel.finishId),
  designService:sel.designService,notes:asText(sel.notes,1500),artworkName:asText(sel.artworkName,180),
  artworkPath:asText(sel.artworkPath,600)};
}
async function createOrder(db:ReturnType<typeof adminDb>,uid:string,email:string,data:Record<string,unknown>) {
 const cart=data.cart;
 if(!Array.isArray(cart)||!cart.length||cart.length>40)throw new Error('Your cart is empty or too large.');
 const country=asText(data.country,2).toUpperCase();
 if(!countries.some(([code])=>code===country))throw new Error('Select an available checkout country.');
 const customerName=asText(data.customerName,100),phone=asText(data.phone,35),address=asText(data.address,1500);
 const checkoutToken=asText(data.checkoutToken,40);
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(checkoutToken))throw new Error('Invalid checkout request. Refresh the checkout page and retry.');
 if(customerName.length<2||phone.length<7)throw new Error('Provide your full name and contact number.');
 const {data:prior,error:priorErr}=await db.from('orders').select('id,amount_due,currency').eq('customer_id',uid).eq('checkout_token',checkoutToken).maybeSingle();
 if(priorErr)throw new Error('Could not verify checkout idempotency.');
 if(prior)return {orderId:prior.id,amountDue:Number(prior.amount_due),currency:prior.currency};
 const {data:products,error:prodError}=await db.from('products').select('*').eq('published',true);
 const {data:prices,error:priceError}=await db.from('custom_prices').select('*');
 if(prodError||priceError)throw new Error('Catalog unavailable.');
 const {data:paySettings,error:payError}=await db.from('shop_settings').select('*').eq('id',1).single();
 if(payError||!paySettings)throw new Error('Payment destinations are not available.');
 if(country==='ID'&&!(paySettings.bank_name&&paySettings.account_holder&&paySettings.account_number))throw new Error('COCIOCO has not configured an official bank transfer destination yet.');
 if(country!=='ID'&&!paySettings.paypal_email)throw new Error('COCIOCO has not configured an official PayPal destination yet.');
 const productMap=new Map<string,{id:string;name:string;category:'physical'|'digital';stock:number;image:string;price:number;collection:string;digital_asset_path?:string|null}>((products||[]).map(p=>[p.id,p]));
 const customPrices=Object.fromEntries((prices||[]).map(p=>[p.id,{base:p.base,designFee:p.design_fee}]));
 const validatedItems:Array<Record<string,unknown>>=[];
 const lines:Array<Record<string,unknown>>=[];
 for(const [index,raw] of cart.entries()){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('Invalid cart item');
  const item=raw as Record<string,unknown>;
  const quantity=asPositive(item.quantity,1,100);
  if(item.custom){
   const selection=cleanSelection(item.custom);
   if(selection.artworkPath){
    if(!selection.artworkPath.startsWith(`${uid}/`))throw new Error('Artwork file belongs to another account');
    const {data:asset,error:assetError}=await db.storage.from('cocioco-custom-art').info(selection.artworkPath);
    if(assetError||!asset)throw new Error('Artwork file could not be verified');
   }
   const q=customQuote(selection,quantity,customPrices);
   validatedItems.push({productId:'custom',quantity,lineId:`custom-${index}`,custom:selection});
   lines.push({key:`custom-${index}`,name:`Custom ${q.type.name}`,image:q.type.image,quantity,category:'custom',
    unitPrice:q.unitPrice,designFee:q.designFee,total:q.total,detail:`${q.size.label} · ${q.material.label} · ${q.finish.label}`,custom:selection});
  } else {
   const id=asText(item.productId,70);const prod=productMap.get(id);
   if(!prod)throw new Error(`A product is no longer available (${id}).`);
   if(prod.category==='digital'&&!prod.digital_asset_path)throw new Error(`${prod.name}: the downloadable file has not been prepared yet.`);
   if(prod.category==='physical'&&prod.stock<quantity)throw new Error(`${prod.name} is out of stock.`);
   validatedItems.push({productId:id,quantity});
   lines.push({key:id,name:prod.name,image:prod.image,quantity,category:prod.category,
    unitPrice:prod.price,designFee:0,total:prod.price*quantity,detail:prod.collection});
  }
 }
 if(lines.some(line=>line.category==='physical'||line.category==='custom')&&address.length<10)throw new Error('A full delivery address is required for merchandise.');
 // Never accept the amount or exchange rate supplied by the browser.
 const subtotal=lines.reduce((s,l)=>s+Number(l.total),0);
 if(!Number.isSafeInteger(subtotal)||subtotal<=0||subtotal>999999999)throw new Error('Order total is outside allowed limits.');
 // Promo codes are intentionally disabled until owner configures real eligibility rules.
 if(data.promoCode)throw new Error('Promo codes are not yet enabled for live checkout.');
 let fxRate=1,fxAsOf='',currency:'IDR'|'USD'='IDR';
 if(country!=='ID'){
  const rate=await usdIdr();fxRate=rate.rate;fxAsOf=rate.asOf;currency='USD';
 }
 const payable=currency==='USD'?Math.round(subtotal/fxRate*3*100)/100:subtotal;
 const optIn=data.leaderboardOptIn===true;
 const collectorAlias=optIn?asText(data.collectorAlias,24).replace(/[^a-zA-Z0-9_.-]/g,''):'';
 if(optIn&&collectorAlias.length<2)throw new Error('Choose a public collector nickname (2–24 characters).');
 const payload={customer_id:uid,checkout_token:checkoutToken,customer_name:customerName,email:email.toLowerCase(),phone,address,country,currency,
  fx_rate:fxRate,fx_source:currency==='USD'?'api':'none',fx_as_of:fxAsOf,total_idr:subtotal,amount_due:payable,
  payment_method:currency==='USD'?'paypal_manual':'bank_transfer',collector_alias:collectorAlias,leaderboard_opt_in:optIn};
 const {data:orderId,error}=await db.rpc('backend_create_order',{p_data:payload,p_items:validatedItems,p_lines:lines});
 if(error)throw new Error(error.message);
 return {orderId,amountDue:payable,currency};
}

export default async function handler(req:Request,res:Response) {
 if(req.method!=='POST')return send(res,405,{error:'Method not allowed'});
 try {
  const payload=reqBody(req);
  const action=asText(payload.action,60);
  const {db,user,profile}=await caller(req);
  const data=payload.data&&typeof payload.data==='object'&&!Array.isArray(payload.data)?payload.data as Record<string,unknown>:{};
  let result:unknown={ok:true};
  switch(action){
   case 'createOrder':{
    if(!user.email_confirmed_at)throw new Error('Please verify your email before ordering.');
    result=await createOrder(db,user.id,user.email!,data);break;
   }
   case 'claimTask':{
    if(profile.role!=='designer'||!profile.designer_approved)throw new Error('Your designer account must be approved first.');
    const {error}=await db.rpc('backend_claim_task',{p_task_id:asText(data.id,50),p_designer:user.id});
    if(error)throw new Error(error.message);break;
   }
   case 'submitTask':{
    const path=asText(data.path,650),id=asText(data.id,60);
    if(!path.startsWith(`${user.id}/${id}/`))throw new Error('This file is not in your authorized task folder.');
    const {data:file,error:fileError}=await db.storage.from('cocioco-task-submissions').info(path);
    if(fileError||!file)throw new Error('Uploaded file is missing');
    const {error}=await db.rpc('backend_submit_task',{p_task_id:id,p_designer:user.id,p_path:path,
      p_name:asText(data.name,255),p_size:asPositive(data.size,1,20971520)});
    if(error)throw new Error(error.message);break;
   }
   case 'setCreatorEarningsVisibility':{
    const {error}=await db.from('profiles').update({show_earnings_on_leaderboard:data.visible===true}).eq('id',user.id);
    if(error)throw new Error(error.message);break;
   }
   case 'requestDesigner':{
    const {error}=await db.from('profiles').update({designer_requested:true}).eq('id',user.id);
    if(error)throw new Error(error.message);break;
   }
   case 'approveDesigner':{
    assertAdmin(profile.role);
    const id=asText(data.id,40);if(!/^[0-9a-f-]{36}$/i.test(id))throw new Error('Invalid user');
    const {error}=await db.from('profiles').update({role:'designer',designer_approved:true,designer_requested:true}).eq('id',id).eq('designer_requested',true);
    if(error)throw new Error(error.message);break;
   }
   case 'setPaymentStatus':{
    assertAdmin(profile.role);
    const {error}=await db.rpc('backend_admin_payment',{p_order:asText(data.id,60),p_status:asText(data.status,40),p_actor:user.id});
    if(error)throw new Error(error.message);break;
   }
   case 'updateTracking':{
    assertAdmin(profile.role);
    const {error}=await db.rpc('backend_admin_tracking',{p_order:asText(data.id,60),p_status:asText(data.status,40),
      p_note:asText(data.note,350),p_courier:asText(data.courier,80),p_resi:asText(data.trackingNumber,100),p_actor:user.id});
    if(error)throw new Error(error.message);break;
   }
   case 'createTask':{
    assertAdmin(profile.role);
    if(asText(data.title,200).length<5)throw new Error('Task title needs at least 5 characters.');
    const params={title:asText(data.title,200),category:asText(data.category,80),description:asText(data.description,2000),
      reward:asPositive(data.reward,1000,100000000),brief:asText(data.brief,20000),order_id:asText(data.orderId,70)};
    const {data:id,error}=await db.rpc('backend_admin_create_task',{p_data:params,p_actor:user.id});
    if(error)throw new Error(error.message);result={id};break;
   }
    
case 'saveTaskReview': {
  assertAdmin(profile.role);

  const id = asText(data.id, 60);
  const decision = asText(data.decision, 20);
  const note = asText(data.note, 2000);

  if (!id) throw new Error('Task ID is required.');

  if (!['approved', 'revision'].includes(decision)) {
    throw new Error('Invalid review decision.');
  }

  if (decision === 'revision' && !note) {
    throw new Error('Revision feedback is required.');
  }

  const { error } = await db.rpc(
    'backend_admin_review_task',
    {
      p_task_id: id,
      p_actor: user.id,
      p_decision: decision,
      p_note: note
    }
  );

  if (error) throw new Error(error.message);

  result = {
    message: decision === 'approved'
      ? 'Work approved. Payout awaiting processing.'
      : 'Revision requested and feedback saved.'
  };

  break;
}
   case 'setTaskStatus':{
    assertAdmin(profile.role);
    const id=asText(data.id,60),status=asText(data.status,50);
    if(!['available','revision','completed','cancelled'].includes(status))throw new Error('Invalid task transition');
    const {data:old,error:findError}=await db.from('tasks').select('status,assigned_to').eq('id',id).single();
    if(findError||!old)throw new Error('Task not found');
    if(['available','cancelled'].includes(status)&&old.status==='completed')throw new Error('Approved work cannot be reopened without manual dispute resolution');
    if(status==='completed'&&old.status!=='under_review')throw new Error('Only submitted work may be approved');
    if(status==='revision'&&old.status!=='under_review')throw new Error('Only submitted work may request revision');
    const changes:Record<string,unknown>={status};
    if(status==='available'){Object.assign(changes,{assigned_to:null,assigned_name:null,claimed_at:null,deadline_at:null});}
    if(status==='revision')changes.deadline_at=null; // Revisions have no automatic missed-deadline penalty; admin agrees timeline with designer.
    if(status==='completed'){changes.payout_status='approved';changes.completed_at=new Date().toISOString();}
    const {error}=await db.from('tasks').update(changes).eq('id',id);
    if(error)throw new Error(error.message);break;
   }
   case 'markPaid':{
    assertAdmin(profile.role);
    const {error}=await db.from('tasks').update({payout_status:'paid',paid_at:new Date().toISOString()})
      .eq('id',asText(data.id,60)).eq('status','completed');if(error)throw new Error(error.message);break;
   }
   case 'resetPenalties':{
    assertAdmin(profile.role);
    const id=asText(data.id,40);let query=db.from('penalties').delete();
    if(id)query=query.eq('designer_id',id);
    else throw new Error('Specify a designer to reset, not everyone at once.');
    const {error}=await query;if(error)throw new Error(error.message);break;
   }
   case 'updateCustomPrice':{
    assertAdmin(profile.role);
    const id=asText(data.id,50);if(!customTypes.some(t=>t.id===id))throw new Error('Invalid custom type');
    const {error}=await db.from('custom_prices').update({base:asPositive(data.base,1000,100000000),design_fee:asPositive(data.designFee,0,100000000)}).eq('id',id);
    if(error)throw new Error(error.message);break;
   }
   case 'updateSettings':{
    assertAdmin(profile.role);
    const bank=asText(data.bankName,100),holder=asText(data.accountHolder,100),account=asText(data.accountNumber,60);
    const paypal=asText(data.paypalEmail,150),wa=asText(data.whatsappNumber,24).replace(/\D/g,'');
    if(paypal&& !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(paypal))throw new Error('Invalid PayPal email');
    if(wa.length<10||wa.length>15)throw new Error('Invalid WhatsApp number');
    const {error}=await db.from('shop_settings').update({bank_name:bank,account_number:account,account_holder:holder,paypal_email:paypal,whatsapp_number:wa,
      updated_at:new Date().toISOString()}).eq('id',1);
    if(error)throw new Error(error.message);break;
   }
   case 'upsertArticle':{
    assertAdmin(profile.role);
    const published=data.published===true,kind=data.kind==='activity'?'activity':'intro';
    if(published&&kind==='activity'&&data.confirmedRealActivity!==true)throw new Error('Confirm real-world activity before publication');
    const title=asText(data.title,300),excerpt=asText(data.excerpt,700),content=asText(data.content,20000);
    if(title.length<5||excerpt.length<10||content.length<30)throw new Error('Article is incomplete');
    const id=asText(data.id,75)||`news-${crypto.randomUUID().slice(0,8)}`;
    const slug=asText(data.slug,125).toLowerCase().replace(/[^a-z0-9-]/g,'-')||id;
    const row={id,slug,title,category:asText(data.category,70),excerpt,content,
      cover:asText(data.cover,800)||'/assets/photocards.svg',cover_tone:asText(data.coverTone,15),published,kind,updated_at:new Date().toISOString()};
    const {error}=await db.from('giving_articles').upsert(row,{onConflict:'id'});if(error)throw new Error(error.message);break;
   }
   case 'deleteArticle':{
    assertAdmin(profile.role);
    const {error}=await db.from('giving_articles').delete().eq('id',asText(data.id,75));
    if(error)throw new Error(error.message);break;
   }
   case 'upsertProduct':{
    assertAdmin(profile.role);
    const category=data.category==='digital'?'digital':'physical',name=asText(data.name,150),slug=asText(data.slug,160).toLowerCase().replace(/[^a-z0-9-]/g,'-');
    if(name.length<3||slug.length<3)throw new Error('Enter product name and URL slug.');
    const image=asText(data.image,1000);
    if(!image.startsWith('/assets/')&&!/^https:\/\/[^\s]+$/.test(image))throw new Error('Only HTTPS or built-in product images allowed');
    const includes=Array.isArray(data.includes)?data.includes.slice(0,15).map(s=>asText(s,150)):[];
    const row={id:asText(data.id,60)||`p-${crypto.randomUUID().slice(0,8)}`,name,slug,category,
      collection:asText(data.collection,100),price:asPositive(data.price,0,999999999),stock:asPositive(data.stock,0,999999),
      image,badge:asText(data.badge,40)||null,color:asText(data.color,20)||'#f9d3ee',
      description:asText(data.description,3000),includes,published:data.published!==false,
      digital_asset_path:asText(data.digitalAssetPath,600)||null,updated_at:new Date().toISOString()};
    if(row.digital_asset_path&&!row.digital_asset_path.startsWith(`${row.id}/`))throw new Error('Digital asset path must belong to product');
    const {error}=await db.from('products').upsert(row,{onConflict:'id'});if(error)throw new Error(error.message);result={id:row.id};break;
   }
   case 'attachTaskAsset':{
    assertAdmin(profile.role);
    const id=asText(data.id,60),path=asText(data.path,650);
    if(!path.startsWith(`${id}/`))throw new Error('Invalid asset folder');
    const {data:brief,error:briefError}=await db.from('task_briefs').select('assets').eq('task_id',id).single();
    if(briefError||!brief)throw new Error('Brief unavailable');
    const assets=[...(Array.isArray(brief.assets)?brief.assets:[]),{path,name:asText(data.name,250)}];
    const {error}=await db.from('task_briefs').update({assets}).eq('task_id',id);if(error)throw new Error(error.message);break;
   }
   default:throw new Error('Unknown COCIOCO operation');
  }
  send(res,200,{ok:true,data:result});
 }catch(error){
  const message=errorText(error);
  const authRelated=/sign in|session expired|profile unavailable/i.test(message);
  send(res,authRelated?401:/admin|permissions|approved|suspended/i.test(message)?403:400,{ok:false,error:message});
 }
}
