import {supabase} from '../lib/backend';
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Award, BadgeCheck, Crown, Gift, Heart, Info, Medal, Sparkles, Star, Trophy, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { money } from '../data';

type CreatorEntry={id:string;alias:string;projects:number;earnings:number;earningsPublic:boolean;isExample?:boolean};
type CollectorEntry={id:string;alias:string;orders:number;points:number;isExample?:boolean};
const creatorSamples:CreatorEntry[]=[{id:'sample1',alias:'pixelbunny',projects:48,earnings:8750000,earningsPublic:true,isExample:true},{id:'sample2',alias:'studiomochi',projects:36,earnings:6240000,earningsPublic:true,isExample:true},{id:'sample3',alias:'lilaccloud',projects:29,earnings:4890000,earningsPublic:true,isExample:true},{id:'sample4',alias:'sundaydraws',projects:17,earnings:0,earningsPublic:false,isExample:true}];
const collectorSamples:CollectorEntry[]=[{id:'samplec1',alias:'cherrycollector',orders:26,points:3450,isExample:true},{id:'samplec2',alias:'dreamybean',orders:21,points:2830,isExample:true},{id:'samplec3',alias:'museclub',orders:15,points:2020,isExample:true},{id:'samplec4',alias:'sweetpeach',orders:9,points:1260,isExample:true}];
const tier=(points:number)=>points>=2200?'Icon Collector':points>=900?'Dream Collector':'Cutie Collector';
const palette=['#f9d3ee','#ddccff','#e6f2a4','#fceaca'];

export default function Leaderboard(){
  const {tasks,orders,user,setCreatorEarningsVisibility,backendMode,creatorLeaders=[],collectorLeaders=[]}=useStore();
  const [tab,setTab]=useState<'creators'|'collectors'>('creators');
  const [view,setView]=useState<'samples'|'local'>(backendMode==='live'?'local':'samples');
  const [period,setPeriod]=useState<'all'|'month'>('all');
  const [liveRankings,setLiveRankings]=useState<{creators:typeof creatorLeaders;collectors:typeof collectorLeaders}|null>(null);
  useEffect(()=>{if(backendMode!=='live'||!supabase)return;let active=true;
    setLiveRankings(null);
    void supabase.rpc('cocioco_leaderboards',{p_period:period}).then(({data,error})=>{if(active&&!error&&data)setLiveRankings({creators:data.creators||[],collectors:data.collectors||[]});});
    return()=>{active=false;};},[period,backendMode,creatorLeaders.length,collectorLeaders.length]);
  const localCreators=useMemo(()=>{
    const grouped=new Map<string,CreatorEntry>();
    tasks.filter(t=>t.status==='completed'&&t.assignedTo&&(period==='all'||t.submissions.some(s=>s.submittedAt>Date.now()-30*86400000))).forEach(t=>{
      const key=t.assignedTo!,prev=grouped.get(key);
      grouped.set(key,{id:key,alias:t.assigneeName||'Creative contributor',projects:(prev?.projects||0)+1,earnings:(prev?.earnings||0)+t.reward,earningsPublic:key===user?.id?Boolean(user?.showEarningsOnLeaderboard):false});
    });
    return [...grouped.values()].sort((a,b)=>b.projects-a.projects||b.earnings-a.earnings);
  },[tasks,user,period]);
  const localCollectors=useMemo(()=>{
    const grouped=new Map<string,CollectorEntry>();
    orders.filter(o=>o.paymentStatus==='verified'&&o.leaderboardOptIn&&o.collectorAlias&&(period==='all'||o.at>Date.now()-30*86400000)).forEach(o=>{
      const key=o.collectorAlias!.toLowerCase(),prev=grouped.get(key);
      const count=o.lines?.reduce((s,l)=>s+l.quantity,0)||o.items.reduce((s,l)=>s+l.quantity,0);
      grouped.set(key,{id:key,alias:o.collectorAlias!,orders:(prev?.orders||0)+1,points:(prev?.points||0)+100+count*20});
    });
    return [...grouped.values()].sort((a,b)=>b.points-a.points);
  },[orders,period]);
  const creators:CreatorEntry[]=backendMode==='live'?(period==='all'?creatorLeaders:(liveRankings?.creators||[])):view==='samples'?creatorSamples:localCreators;
  const collectors:CollectorEntry[]=backendMode==='live'?(period==='all'?collectorLeaders:(liveRankings?.collectors||[])):view==='samples'?collectorSamples:localCollectors;
  return <div className="container cx-page cx-rankings"><section className="cx-rank-hero"><div><span className="cx-kicker">THE PEOPLE BEHIND THE MAGIC</span><h1>Our little <em>hall of fame.</em></h1><p>Celebrate the creators making cool things and the collectors keeping the magic going. All in one cute corner.</p><div className="cx-pills"><span><Trophy size={15}/> Creator Rankings</span><span><Crown size={15}/> Collectors Club</span></div></div><div className="cx-rank-hero-art"><motion.div animate={{rotate:[-8,5,-8]}} transition={{duration:7,repeat:Infinity}}><Trophy size={100} strokeWidth={1.4}/></motion.div><span>YOU'RE A STAR!</span></div></section>
    <div className="cx-rank-toolbar"><div className="cx-switch"><button className={tab==='creators'?'active':''} onClick={()=>setTab('creators')}><Award size={18}/> Top Designers</button><button className={tab==='collectors'?'active':''} onClick={()=>setTab('collectors')}><Heart size={18}/> Top Collectors</button></div><div className="cx-rank-filters">{backendMode==='demo'&&<select aria-label="Ranking data source" value={view} onChange={e=>setView(e.target.value as typeof view)}><option value="samples">Illustrative examples</option><option value="local">Local activity</option></select>}<select aria-label="Ranking time period" value={period} onChange={e=>setPeriod(e.target.value as typeof period)} disabled={backendMode==='demo'&&view==='samples'}><option value="all">All time</option><option value="month">Last 30 days</option></select></div></div>
    <div className="cx-example-warning"><Info size={18}/><span>{backendMode==='live'?'Verified COCIOCO activity from the live database. Designer earnings are private unless explicitly shared. Buyer rankings are opt-in only.':view==='samples'?'All names and scores are fictional illustrations.':'This leaderboard shows local demo activity only.'}</span></div>
    <AnimatePresence mode="wait"><motion.div key={`${tab}-${view}-${period}`} initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-12}} transition={{duration:.25}} className="cx-rank-content">
      {tab==='creators' ? <><div className="cx-ranking-title"><div><span className="cx-kicker">COLLECT GREAT WORK, CELEBRATE GREAT PEOPLE</span><h2>Creative <em>superstars.</em></h2><p>Ranked by approved project count. Earnings shown in IDR only for profiles that choose to share.</p></div><BadgeCheck size={38}/></div>{creators.length ? <div className="cx-leader-list">{creators.map((c,i)=><div className="cx-leader-row" key={c.id}><div className="cx-place" style={{background:palette[i%palette.length]}}>{i===0?<Crown size={23}/>:String(i+1).padStart(2,'0')}</div><div className="cx-leader-avatar" style={{background:palette[(i+1)%palette.length]}}>{c.alias.slice(0,2).toUpperCase()}</div><div className="cx-leader-identity"><strong>@{c.alias}</strong><span>{i===0?'Creative main character':i===1?'Superstar maker':'Original creator'} {c.isExample?'· SAMPLE':''}</span></div><div className="cx-leader-metric"><strong>{c.projects}</strong><span>Projects</span></div><div className="cx-leader-metric cx-earnings"><strong>{c.earningsPublic?money(c.earnings):'Private'}</strong><span>Approved earnings</span></div></div>)}</div>:<div className="cx-empty-state"><Users size={42}/><h3>No approved project data yet.</h3><p>Completed and approved commissions will appear here.</p><Link className="btn btn-outline" to="/commissions">Explore commissions <ArrowRight size={17}/></Link></div>}
      <div className="cx-rank-privacy"><ShieldHint/><div><strong>Your approved earnings, your choice.</strong><p>{backendMode==='live'?'Earnings are hidden by default. You control whether your approved earnings are visible to other visitors.':'In local demo, earnings are shared only when you opt in.'}</p>{user?.role==='designer'&&<label className="cx-optin"><input type="checkbox" checked={Boolean(user.showEarningsOnLeaderboard)} onChange={e=>setCreatorEarningsVisibility(e.target.checked)}/> Share my approved earnings publicly</label>}</div></div></>
      : <><div className="cx-ranking-title"><div><span className="cx-kicker">THE PEOPLE WHO KEEP US INSPIRED</span><h2>Collector <em>royalty.</em></h2><p>No spending amounts exposed. Recognition is based on verified purchases and optional collector participation.</p></div><Gift size={38}/></div>{collectors.length ? <div className="cx-leader-list">{collectors.map((c,i)=><div className="cx-leader-row" key={c.id}><div className="cx-place" style={{background:palette[i%palette.length]}}>{i===0?<Crown size={23}/>:String(i+1).padStart(2,'0')}</div><div className="cx-leader-avatar" style={{background:palette[(i+2)%palette.length]}}>{c.alias.slice(0,2).toUpperCase()}</div><div className="cx-leader-identity"><strong>@{c.alias}</strong><span>{tier(c.points)} {c.isExample?'· SAMPLE':''}</span></div><div className="cx-leader-metric"><strong>{c.orders}</strong><span>Orders</span></div><div className="cx-leader-metric cx-earnings"><strong>{c.points.toLocaleString('en-US')}</strong><span>Club points</span></div></div>)}</div>:<div className="cx-empty-state"><Gift size={42}/><h3>Be the first collector!</h3><p>Opt into Collectors Club at checkout to appear after payment verification.</p><Link className="btn btn-outline" to="/shop">Shop the cute <ArrowRight size={17}/></Link></div>}
      <div className="cx-club-tiers"><div><Medal size={25}/><strong>Cutie Collector</strong><span>Welcome to the club</span></div><div><Star size={25}/><strong>Dream Collector</strong><span>900+ club points</span></div><div><Crown size={25}/><strong>Icon Collector</strong><span>2,200+ club points</span></div></div><p className="cx-club-note">Club points: 100 per verified order + 20 per item. Rewards and redemption are not enabled yet.</p></>}
    </motion.div></AnimatePresence><div className="cx-mini-banner"><div><span className="cx-kicker">A WHOLE UNIVERSE OF CREATIVITY</span><h2>Make things. <em>Be seen.</em></h2><p>Your creativity deserves a stage; your participation deserves a little celebration.</p></div><Link className="btn btn-outline" to={tab==='creators'?'/commissions':'/shop'}>Explore COCIOCO <ArrowRight size={18}/></Link></div>
  </div>;
}
function ShieldHint(){return <div className="cx-shield-icon"><Sparkles size={25}/></div>}
