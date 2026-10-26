type Rate={rate:number;asOf:string};
let cache:{value:Rate;expires:number}|null=null;
export async function usdIdr():Promise<Rate> {
 if(cache&&Date.now()<cache.expires)return cache.value;
 const response=await fetch('https://open.er-api.com/v6/latest/USD',{signal:AbortSignal.timeout(9000)});
 if(!response.ok)throw new Error('Currency feed temporarily unavailable; try again later.');
 const data=await response.json() as {result?:string;rates?:{IDR?:number};time_last_update_utc?:string};
 const rate=data.rates?.IDR;
 if(data.result!=='success'||!rate||!Number.isFinite(rate)||rate<1000||rate>100000)throw new Error('Currency provider returned an invalid USD/IDR rate.');
 const value={rate,asOf:data.time_last_update_utc||new Date().toISOString()};
 cache={value,expires:Date.now()+30*60*1000};return value;
}
