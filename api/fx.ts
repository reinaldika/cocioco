import type { Request,Response } from '../server/server';
import { send,errorText } from '../server/server';
import {usdIdr} from '../server/fx';
export default async function handler(req:Request,res:Response){
 if(req.method!=='GET')return send(res,405,{error:'Method not allowed'});
 try{const rate=await usdIdr();send(res,200,{usdToIdr:rate.rate,source:'api',asOf:rate.asOf,fetchedAt:Date.now()});}
 catch(e){send(res,503,{error:errorText(e)});}
}
