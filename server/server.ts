import { createClient } from '@supabase/supabase-js';
import type { IncomingMessage, ServerResponse } from 'node:http';

export type Request = IncomingMessage & { body?: unknown; query?: Record<string,string> };
export type Response = ServerResponse;
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
export function adminDb() {
  if (!url || !key) throw new Error('COCIOCO backend is not configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel.');
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
export function send(res:Response,code:number,data:unknown) {
  res.statusCode=code;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.end(JSON.stringify(data));
}
export function reqBody(req:Request):Record<string,unknown> {
  const value=typeof req.body==='string'?JSON.parse(req.body):req.body;
  if(!value || typeof value!=='object' || Array.isArray(value)) throw new Error('JSON body must be an object');
  return value as Record<string,unknown>;
}
export async function caller(req:Request) {
  const token=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
  if(!token || token.length>10000) throw new Error('Please sign in with your COCIOCO account.');
  const db=adminDb();
  const {data:{user},error}=await db.auth.getUser(token);
  if(error||!user||!user.email) throw new Error('Session expired. Please sign in again.');
  const {data:profile,error:profileError}=await db.from('profiles').select('id,role,name,designer_approved,email').eq('id',user.id).single();
  if(profileError||!profile) throw new Error('Account profile unavailable.');
  return {db,user,profile};
}
export function assertAdmin(role:string) { if(role!=='admin') throw new Error('COCIOCO admin permissions required.'); }
export function asText(value:unknown,max=200) { return typeof value==='string'?value.trim().slice(0,max):''; }
export function asPositive(value:unknown,min=0,max=999999999) {
  if(typeof value!=='number'||!Number.isSafeInteger(value)||value<min||value>max) throw new Error('Invalid numeric input.');
  return Number(value);
}
export function errorText(error:unknown):string { return error instanceof Error?error.message:'Operation failed'; }
