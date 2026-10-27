import { createClient } from '@supabase/supabase-js';
export const liveConfigured = Boolean(false); // QA sandbox only
export const supabase=liveConfigured?createClient(
 import.meta.env.VITE_SUPABASE_URL as string,import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
 {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}
):null;

export async function command<T=unknown>(action:string,data:Record<string,unknown>):Promise<T>{
 if(!supabase)throw new Error('Supabase connection not configured');
 const {data:sessionData,error:sessionError}=await supabase.auth.getSession();
 if(sessionError||!sessionData.session)throw new Error('Please sign in first.');
 const response=await fetch('/api/command',{method:'POST',headers:{
  'Content-Type':'application/json','Authorization':`Bearer ${sessionData.session.access_token}`
 },body:JSON.stringify({action,data})});
 const result=await response.json() as {ok?:boolean;data?:T;error?:string};
 if(!response.ok||!result.ok)throw new Error(result.error||`COCIOCO API error (${response.status})`);
 return result.data as T;
}
export function readableError(error:unknown){return error instanceof Error?error.message:'Operation failed. Please try again.';}
export async function uploadToBucket(bucket:string,prefix:string,file:File,maxBytes:number):Promise<string>{
 if(!supabase)throw new Error('Supabase connection not configured');
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)throw new Error('Please sign in before uploading files.');
 if(file.size>maxBytes||file.size===0)throw new Error(`File must be under ${Math.round(maxBytes/1048576)} MB.`);
 const safe=file.name.toLowerCase().replace(/[^a-z0-9._-]/g,'_').slice(0,90);
 const path=`${prefix}/${crypto.randomUUID()}-${safe}`;
 const {error}=await supabase.storage.from(bucket).upload(path,file,{upsert:false,cacheControl:'3600'});
 if(error)throw new Error(error.message);
 return path;
}
export async function getPrivateDownload(bucket:string,path:string):Promise<string>{
 if(!supabase)throw new Error('Supabase connection not configured');
 const {data,error}=await supabase.storage.from(bucket).createSignedUrl(path,120);
 if(error||!data?.signedUrl)throw new Error(error?.message||'File unavailable');
 return data.signedUrl;
}
