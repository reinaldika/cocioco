import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowUpRight, Heart, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react';

import ProductCard from '../components/ProductCard';
import { useStore } from '../store';
import { Reveal } from '../components/Decor';

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const initialCategory = params.get('category') || 'all';
  const [query, setQuery] = useState(''); const [sort, setSort] = useState('featured');
  const { wishlist,products } = useStore();
  const category = ['all', 'physical', 'digital'].includes(initialCategory) ? initialCategory : 'all';
  const onlyFavorites = params.get('favorites') === '1';
  const changeCategory = (c: string) => { const p = new URLSearchParams(params); if (c === 'all') p.delete('category'); else p.set('category', c); p.delete('favorites'); setParams(p); };
  const listed = useMemo(() => {
    let result = products.filter(p => (category === 'all' || p.category === category) && (!onlyFavorites || wishlist.includes(p.id)) && `${p.name} ${p.collection} ${p.description}`.toLowerCase().includes(query.toLowerCase()));
    if (sort === 'low') result = [...result].sort((a,b) => a.price - b.price);
    if (sort === 'high') result = [...result].sort((a,b) => b.price - a.price);
    if (sort === 'name') result = [...result].sort((a,b) => a.name.localeCompare(b.name));
    return result;
  }, [category, onlyFavorites, wishlist, query, sort,products]);
  return <>
    <section className="container page-hero shop-hero"><div className="shop-hero-copy"><div className="eyebrow"> THE COCIOCO GOODS DEPARTMENT</div><h1>Goodies for your<br/><em>happy little world.</em></h1><p>From collectible cuteness to digital magic. Find the things that make your heart go <b>!!!</b></p><span className="page-hero-note">DESIGNED TO MAKE YOU SMILE ↗</span></div><div className="shop-hero-art"><img src="/assets/elements.svg" alt="Playful colorful digital graphics"/><span className="shop-sun">✷</span><span className="shop-mini-label">100% CUTE<br/>0% BORING</span></div></section>
    <section className="container catalog-section page-section"><Reveal><div className="catalog-title-row"><div><span className="eyebrow">YOUR NEXT FAVORITE THING ♡</span><h2>{onlyFavorites ? 'Your little loves.' : 'Shop the collection.'}</h2></div><div className="catalog-result">{listed.length} GOODIES FOUND <Sparkles size={18}/></div></div></Reveal>
      <div className="catalog-toolbar"><div className="tab-filters">{[{id:'all',label:'All goodies'},{id:'physical',label:'Physical goods'},{id:'digital',label:'Digital assets'}].map(t => <button type="button" className={`filter-tab ${category === t.id && !onlyFavorites ? 'is-active' : ''}`} key={t.id} onClick={() => changeCategory(t.id)}>{t.label}</button>)}<button type="button" className={`filter-tab ${onlyFavorites ? 'is-active' : ''}`} onClick={() => { const p = new URLSearchParams(params); p.delete('category'); if (onlyFavorites) p.delete('favorites'); else p.set('favorites','1'); setParams(p); }}><Heart size={16}/> Saved</button></div><div className="catalog-actions"><label className="search-control"><Search size={18}/><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search cute things..." aria-label="Search products" />{query && <button aria-label="Clear search" onClick={() => setQuery('')}><X size={15}/></button>}</label><label className="sort-control"><SlidersHorizontal size={16}/><select value={sort} onChange={e => setSort(e.target.value)} aria-label="Sort products"><option value="featured">Featured</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option><option value="name">Name A-Z</option></select></label></div></div>
      {listed.length ? <div className="product-grid catalog-grid">{listed.map(p => <ProductCard key={p.id} product={p}/>)}</div> : <div className="empty-state"><div>♡</div><h3>No goodies found (yet!)</h3><p>Try another search or take a look around.</p><button className="btn btn-purple" onClick={() => {setQuery(''); setParams({});}}>See all goodies <ArrowUpRight size={18}/></button></div>}
    </section>
    <section className="container shop-newsletter"><span> CREATIVE PEOPLE CLUB</span><h2>More cute things are coming.</h2><p>There's always something cooking in the COCIOCO universe.</p><div className="newsletter-note">GOOD THINGS TAKE A LITTLE ✨ MAGIC ✨</div></section>
  </>;
}
