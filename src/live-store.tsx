import {useCallback,useEffect,useState,type ReactNode} from 'react';
import {StoreContext,type Store,type ActionResult,type CreateTask} from './store';
import type {Product,Task,Order,CartItem,Penalty,PaymentSettings,CustomSelection,CustomPriceOverride,CustomTypeId,CreateOrderInput,GivingArticle,FulfillmentStatus,TaskStatus,User} from './types';
import {supabase,command,readableError,uploadToBucket} from './lib/backend';

const fallbackPayment:PaymentSettings={bankName:'',accountHolder:'',accountNumber:'',paypalEmail:'',whatsappNumber:'6282317422632'};
const cartKey='cocioco.cart.live.v1',wishlistKey='cocioco.wishlist.live.v1';
function localLoad<T>(key:string,fallback:T):T{try{const val=JSON.parse(localStorage.getItem(key)||'null');return val??fallback;}catch{return fallback;}}
const milliseconds=(iso:string|null|undefined)=>iso?new Date(iso).getTime():0;
const toProduct=(r:any):Product=>({id:r.id,slug:r.slug,name:r.name,category:r.category,collection:r.collection,price:r.price,
 image:r.image,badge:r.badge||undefined,color:r.color,description:r.description,includes:r.includes||[],stock:r.stock,
 published:r.published,digitalAssetPath:r.digital_asset_path||undefined});
const toArticle=(r:any):GivingArticle=>({id:r.id,slug:r.slug,title:r.title,category:r.category,excerpt:r.excerpt,
 content:r.content,cover:r.cover,coverTone:r.cover_tone,published:r.published,kind:r.kind,
 createdAt:milliseconds(r.created_at),updatedAt:milliseconds(r.updated_at)});
const toTask=(r:any):Task=>({id:r.id,title:r.title,category:r.category,description:r.description,reward:r.reward,
 durationHours:r.duration_hours,status:r.status,art:r.art,tone:r.tone,skills:r.skills||[],deliverables:r.deliverables||[],
 postedAt:milliseconds(r.created_at),assignedTo:r.assigned_to||undefined,assigneeName:r.assigned_name||undefined,
 claimedAt:r.claimed_at?milliseconds(r.claimed_at):undefined,deadlineAt:r.deadline_at?milliseconds(r.deadline_at):undefined,
 brief:'',submissions:[],payoutStatus:r.payout_status,paidAt:r.paid_at?milliseconds(r.paid_at):undefined});
const toOrder=(r:any,events:any[]):Order=>({
 id:r.id,total:r.total_idr,amountDue:Number(r.amount_due),currency:r.currency,country:r.country,fxRate:Number(r.fx_rate),
 fxSource:r.fx_source,fxAsOf:r.fx_as_of,at:milliseconds(r.created_at),items:r.items||[],lines:r.lines||[],
 payment:r.payment_method,paymentStatus:r.payment_status,fulfillmentStatus:r.fulfillment_status,
 courier:r.courier||'',trackingNumber:r.tracking_number||'',customerName:r.customer_name,email:r.email,phone:r.phone,
 address:r.address,collectorAlias:r.collector_alias||undefined,leaderboardOptIn:r.leaderboard_opt_in,linkedTaskId:r.linked_task_id||undefined,
 trackingEvents:events.filter(e=>e.order_id===r.id).map(e=>({id:e.id,status:e.status,note:e.note,at:milliseconds(e.created_at)}))
});

export function LiveStoreProvider({children}:{children:ReactNode}){
 const [user,setUser]=useState<User|null>(null);
 const [loading,setLoading]=useState(true),[error,setError]=useState('');
 const [products,setProducts]=useState<Product[]>([]);
 const [tasks,setTasks]=useState<Task[]>([]),[orders,setOrders]=useState<Order[]>([]),[penalties,setPenalties]=useState<Penalty[]>([]);
 const [paymentSettings,setPaymentSettings]=useState<PaymentSettings>(fallbackPayment);
 const [customPrices,setCustomPrices]=useState<Record<string,CustomPriceOverride>>({});
 const [givingArticles,setGivingArticles]=useState<GivingArticle[]>([]);
 const [creatorLeaders,setCreatorLeaders]=useState<NonNullable<Store['creatorLeaders']>>([]);
 const [collectorLeaders,setCollectorLeaders]=useState<NonNullable<Store['collectorLeaders']>>([]);
 const [designerApplicants,setDesignerApplicants]=useState<NonNullable<Store['designerApplicants']>>([]);
 const [cart,setCart]=useState<CartItem[]>(()=>localLoad(cartKey,[]));
 const [wishlist,setWishlist]=useState<string[]>(()=>localLoad(wishlistKey,[]));
 useEffect(()=>{try{localStorage.setItem(cartKey,JSON.stringify(cart));}catch{}},[cart]);
 useEffect(()=>{try{localStorage.setItem(wishlistKey,JSON.stringify(wishlist));}catch{}},[wishlist]);

 const refresh=useCallback(async()=>{
  if(!supabase)return;
  const {data:{user:authUser}}=await supabase.auth.getUser();
  const results=await Promise.all([
    supabase.from('products').select('*').order('name'),supabase.from('tasks').select('*').order('created_at',{ascending:false}),
    supabase.from('custom_prices').select('*'),supabase.from('shop_settings').select('*').eq('id',1).maybeSingle(),
    supabase.from('giving_articles').select('*').order('created_at',{ascending:false}),
    supabase.rpc('cocioco_leaderboards',{p_period:'all'})
  ]);
  const [prodRes,taskRes,priceRes,settingRes,articlesRes,ranksRes]=results;
  for(const r of results){if(r.error)throw new Error(r.error.message);}
  setProducts((prodRes.data||[]).map(toProduct));
  const nextTasks=(taskRes.data||[]).map(toTask);
  setCustomPrices(Object.fromEntries((priceRes.data||[]).map((p:any)=>[p.id,{base:p.base,designFee:p.design_fee}])));
  if(settingRes.data){const s=settingRes.data;setPaymentSettings({bankName:s.bank_name,accountNumber:s.account_number,
   accountHolder:s.account_holder,paypalEmail:s.paypal_email,whatsappNumber:s.whatsapp_number});}
  setGivingArticles((articlesRes.data||[]).map(toArticle));
  setCreatorLeaders(ranksRes.data?.creators||[]);setCollectorLeaders(ranksRes.data?.collectors||[]);
  if(authUser){
   const {data:profile,error:pError}=await supabase.from('profiles').select('*').eq('id',authUser.id).single();
   if(pError||!profile)throw new Error('Your profile is not ready. Please refresh after email verification.');
   const currentUser:User={id:profile.id,name:profile.name,email:profile.email,role:profile.role,joinedAt:milliseconds(profile.created_at),
      showEarningsOnLeaderboard:profile.show_earnings_on_leaderboard,designerApproved:profile.designer_approved,designerRequested:profile.designer_requested};
   setUser(currentUser);
   const privateQueries=await Promise.all([
     supabase.from('orders').select('*').order('created_at',{ascending:false}).limit(300),
     supabase.from('order_events').select('*').order('created_at',{ascending:false}).limit(1500),
     supabase.from('penalties').select('*').order('created_at',{ascending:false}).limit(200),
     supabase.from('task_briefs').select('*'),
     supabase.from('task_submissions').select('*').order('submitted_at',{ascending:false}).limit(300),
     profile.role==='admin'?supabase.from('profiles').select('id,name,email,role,designer_requested,designer_approved').order('created_at',{ascending:false}).limit(300):Promise.resolve({data:[],error:null})
   ]);
   for(const r of privateQueries)if(r.error)throw new Error(r.error.message);
   const [orderRes,eventRes,penRes,briefRes,submitRes,usersRes]=privateQueries;
   const events=eventRes.data||[];
   setOrders((orderRes.data||[]).map((r:any)=>toOrder(r,events)));
   setPenalties((penRes.data||[]).map((r:any)=>({id:r.id,userId:r.designer_id,taskId:r.task_id,at:milliseconds(r.created_at),
      level:r.level,hours:r.hours,until:r.suspended_until?milliseconds(r.suspended_until):null})));
   const briefMap=new Map<string,{brief:string;assets:{path:string;name:string}[]}>((briefRes.data||[]).map((r:any)=>[r.task_id,r]));
   const subMap=new Map<string,any[]>();
   (submitRes.data||[]).forEach((r:any)=>subMap.set(r.task_id,[...(subMap.get(r.task_id)||[]),{by:r.designer_id,
     name:r.file_name,size:r.file_size,submittedAt:milliseconds(r.submitted_at),path:r.file_path}]));
   setTasks(nextTasks.map((t:Task)=>({...t,brief:briefMap.get(t.id)?.brief||'',assets:briefMap.get(t.id)?.assets||[],
      submissions:subMap.get(t.id)||[]})));
   setDesignerApplicants((usersRes.data||[]) as NonNullable<Store['designerApplicants']>);
  }else{
   setUser(null);setOrders([]);setPenalties([]);setDesignerApplicants([]);setTasks(nextTasks);
  }
  setError('');setLoading(false);
 },[]);
 useEffect(()=>{
   let active=true;
   const load=()=>refresh().catch(e=>{if(active){setLoading(false);setError(readableError(e));}});
   load();const {data:{subscription}}=supabase!.auth.onAuthStateChange((_event)=>{
      // Schedule refresh outside Auth's synchronous callback to avoid auth client deadlock.
      window.setTimeout(()=>{if(active)load();},0);
   });
   const timer=window.setInterval(()=>{if(active&&document.visibilityState==='visible')load();},30000);
   return()=>{active=false;subscription.unsubscribe();window.clearInterval(timer);};
 },[refresh]);
 const reply=async(task:()=>Promise<unknown>,success:string):Promise<ActionResult>=>{
  try{await task();await refresh();return {ok:true,message:success};}catch(e){return{ok:false,message:readableError(e)};}
 };
 const addCart=(id:string,qty=1)=>{setCart(s=>s.some(x=>x.productId===id)?s.map(x=>x.productId===id?{...x,quantity:Math.min(20,x.quantity+qty)}:x):[...s,{productId:id,quantity:Math.max(1,qty)}]);};
 const addCustomToCart=(selection:CustomSelection,quantity:number)=>setCart(s=>[...s,{productId:'custom',lineId:crypto.randomUUID(),custom:selection,quantity:Math.min(100,Math.max(1,quantity))}]);
 const setCartQuantity=(id:string,qty:number)=>setCart(s=>qty<1?s.filter(x=>(x.lineId||x.productId)!==id):s.map(x=>(x.lineId||x.productId)===id?{...x,quantity:Math.min(100,qty)}:x));
 const removeCart=(id:string)=>setCart(s=>s.filter(x=>(x.lineId||x.productId)!==id));
 const toggleWishlist=(id:string)=>setWishlist(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);
 const placeOrder=async(input:CreateOrderInput):Promise<Order>=>{
  const result=await command<{orderId:string}>('createOrder',{...input,cart,discount:0,promoCode:''});
  await refresh();
  setCart([]);
  // Fetch newly created order independently; refresh state updates asynchronously.
  const {data,error}=await supabase!.from('orders').select('*').eq('id',result.orderId).single();
  if(error||!data)throw new Error('Order created, but it could not be retrieved. Check My Orders before trying again.');
  return toOrder(data,[]);
 };
 const claimTask=(id:string)=>reply(()=>command('claimTask',{id}),`Task ${id} claimed — your timer is running.`);
 const submitTask=async(id:string,file:File):Promise<ActionResult>=>{
  if(!user)return{ok:false,message:'Sign in first'};
  if(file.size>20971520||file.size<1)return{ok:false,message:'Max file size is 20 MB'};
  return reply(async()=>{
   const path=await uploadToBucket('cocioco-task-submissions',`${user.id}/${id}`,file,20971520);
   await command('submitTask',{id,path,name:file.name,size:file.size});
  },'Project submitted to COCIOCO for review.');
 };
 const updatePaymentSettings=async(settings:PaymentSettings)=>{await command('updateSettings',{...settings});await refresh();};
 const setOrderPaymentStatus=async(id:string,status:Order['paymentStatus'])=>{await command('setPaymentStatus',{id,status});await refresh();};
 const updateOrderTracking=(id:string,status:FulfillmentStatus,note:string,courier:string,trackingNumber:string)=>reply(
   ()=>command('updateTracking',{id,status,note,courier,trackingNumber}),'Tracking status updated for all customers.');
 const upsertGivingArticle=(a:GivingArticle,confirmed?:boolean)=>reply(()=>command('upsertArticle',{...a,confirmedRealActivity:confirmed===true}),'Gives Back article saved.');
 const deleteGivingArticle=(id:string)=>reply(()=>command('deleteArticle',{id}),'Article deleted.');
 const updateCustomPrice=(id:CustomTypeId,v:CustomPriceOverride)=>reply(()=>command('updateCustomPrice',{id,...v}),'Custom pricing updated.');
 const setCreatorEarningsVisibility=(visible:boolean)=>{void reply(()=>command('setCreatorEarningsVisibility',{visible}),'');};
 
const createTask = async (input: CreateTask): Promise<ActionResult> => {
  const { files = [], ...taskData } = input;

  for (const file of files) {
    if (!/\.(pdf|png|jpg|jpeg|zip|svg)$/i.test(file.name)) {
      return { ok: false, message: `Unsupported file: ${file.name}` };
    }
    if (file.size < 1 || file.size > 20971520) {
      return { ok: false, message: `${file.name} must be under 20 MB.` };
    }
  }

  let createdId: string | null = null;

  try {
    const result = await command<{ id: string }>('createTask', taskData);
    createdId = result.id;
    if (!createdId) throw new Error('Task ID was not returned.');

    for (const file of files) {
      const path = await uploadToBucket(
        'cocioco-task-assets',
        createdId,
        file,
        20971520
      );

      await command('attachTaskAsset', {
        id: createdId,
        path,
        name: file.name
      });
    }

    await refresh();

    return {
      ok: true,
      message: 'Commission published with private attachments.'
    };
  } catch (error) {
    if (createdId) {
      await refresh().catch(() => {});
      return {
        ok: false,
        message: `Task ${createdId} was created, but some attachments failed: ${readableError(error)}. Check Manage tasks and use Add asset. Do not publish again.`
      };
    }

    return { ok: false, message: readableError(error) };
  }
};

const saveTaskReview = (
  id: string,
  decision: 'approved' | 'revision',
  note: string
): Promise<ActionResult> =>
  reply(
    () => command('saveTaskReview', { id, decision, note }),
    decision === 'approved'
      ? 'Work approved. Payout awaiting processing.'
      : 'Revision requested and feedback saved.'
  );

 const setTaskStatus=async(id:string,status:TaskStatus)=>{await command('setTaskStatus',{id,status});await refresh();};
 const resetPenalties=async(id?:string)=>{if(!id)throw new Error('Select one designer to reset.');await command('resetPenalties',{id});await refresh();};
 const logout=()=>{void supabase!.auth.signOut().finally(()=>setUser(null));};
 const approveDesigner=(id:string)=>reply(()=>command('approveDesigner',{id}),'Designer approved!');
 const upsertProduct=(p:Product & {published?:boolean;digitalAssetPath?:string})=>reply(()=>command('upsertProduct',p),'Product saved to live catalog.');
 const markPaid=(id:string)=>reply(()=>command('markPaid',{id}),'Commission payout recorded as paid.');
 const store:Store={backendMode:'live',loading,error,products,creatorLeaders,collectorLeaders,designerApplicants,
  user,tasks,orders,penalties,cart,wishlist,paymentSettings,customPrices,givingArticles,refresh,approveDesigner,upsertProduct,markPaid,
  loginDemo:()=>{},registerDemo:()=>{},logout,claimTask,submitTask,addCart,setCartQuantity,addCustomToCart,removeCart,toggleWishlist,
  placeOrder,updatePaymentSettings,setOrderPaymentStatus,updateOrderTracking,upsertGivingArticle,deleteGivingArticle,
  updateCustomPrice,setCreatorEarningsVisibility,createTask,setTaskStatus,saveTaskReview,resetPenalties,simulateExpiry:()=>{},resetDemo:()=>{}
 };
 return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}
