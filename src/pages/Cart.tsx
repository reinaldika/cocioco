import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Globe2, Info, LockKeyhole, Minus, Plus, RefreshCw, ShoppingBag, Trash2 } from 'lucide-react';
import { money } from '../data';
import { cartTotal, isPhysicalLine, resolveCartLine } from '../custom';
import { useStore } from '../store';
import { useToast } from '../components/Toast';
import { countries, countryName, isInternational } from '../countries';
import { DEMO_USD_TO_IDR, INTERNATIONAL_MULTIPLIER, loadUsdIdr, quotePrice, showCurrency, type FxQuote } from '../pricing';

export default function Cart() {
  const { cart, setCartQuantity, removeCart, placeOrder,customPrices,products,user,backendMode } = useStore();
  const toast = useToast();
  const navigate = useNavigate();
  const [placing,setPlacing]=useState(false);
  const [checkoutToken,setCheckoutToken]=useState(()=>crypto.randomUUID());
  const [fxError,setFxError]=useState('');
  const [coupon, setCoupon] = useState('');
  const [couponActive, setCouponActive] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [country, setCountry] = useState('');
  const [fx, setFx] = useState<FxQuote>({ usdToIdr: DEMO_USD_TO_IDR, source:'demo', asOf:'', fetchedAt:0 });
  const [fxLoading, setFxLoading] = useState(false);
  const [fxRefresh, setFxRefresh] = useState(0);
  const [form, setForm] = useState({ customerName:'', email:'', phone:'', address:'' });
  const [clubOptIn,setClubOptIn]=useState(false);
  const [collectorAlias,setCollectorAlias]=useState('');
  const hasPhysicalItems = cart.some(i=>isPhysicalLine(i,products));
  const international = isInternational(country);
  const currency = international ? 'USD' : 'IDR';
  const subtotalIDR = cartTotal(cart,customPrices,products);
  const discountedIDR = Math.round(subtotalIDR * (couponActive ? .9 : 1));
  const payable = quotePrice(discountedIDR, country, fx.usdToIdr);
  const fmt = (idr: number) => showCurrency(quotePrice(idr, country, fx.usdToIdr), currency);

  useEffect(() => {
    if (!international) return;
    const controller = new AbortController();
    setFxLoading(true);
    loadUsdIdr(controller.signal, fxRefresh > 0).then(rate => { if (!controller.signal.aborted) {setFx(rate);setFxError('');} })
      .catch(() => {if(!controller.signal.aborted)setFxError('Live FX service unavailable. International checkout is temporarily disabled.');})
      .finally(() => { if (!controller.signal.aborted) setFxLoading(false); });
    return () => controller.abort();
  }, [international, fxRefresh]);

  function applyCode() {
    if(backendMode==='live'){toast('Promo codes are not yet activated for verified live orders.',true);return;}
    if (coupon.toUpperCase().trim() === 'COCIO10') {
      setCouponActive(true);
      toast('Promo COCIO10 applied! Your cart just got cuter.');
    } else toast('That code is not valid. Try COCIO10!', true);
  }
  async function place(e: FormEvent) {
    e.preventDefault();
    if (!cart.length || !country || fxLoading || placing) return;
    if(backendMode==='live'&&!user){navigate('/auth?redirect=%2Fcart');return;}
    if(backendMode==='live'&&international&&(fx.source!=='api'||fxError)){toast('An updated FX quote is required to place an international order.',true);return;}
    setPlacing(true);
    try{const result = await placeOrder({ ...form, email:backendMode==='live'?user?.email||form.email:form.email,country,checkoutToken, discount: couponActive ? .1 : 0,
      fxRate: international ? fx.usdToIdr : 1,
      fxSource: international ? fx.source : 'none', fxAsOf: international ? fx.asOf : '',collectorAlias,leaderboardOptIn:clubOptIn,
    });
    setCheckoutToken(crypto.randomUUID());
    navigate(`/payment/${result.id}`);
    }catch(e){toast(e instanceof Error?e.message:'Unable to place order',true);}finally{setPlacing(false);}
  }
  return <div className="container cart-page page-section">
    <div className="cart-heading"><span className="eyebrow">YOUR COLLECTION IN PROGRESS</span><h1>Your happy <em>little bag.</em></h1><p>Good taste looks good on you ♡</p></div>
    {cart.length ? <div className="cart-grid">
      <div className="cart-items">
        <div className="cart-column-head"><span>YOUR GOODIES ({cart.reduce((s,i)=>s+i.quantity,0)})</span><Link to="/shop">Keep shopping <ArrowRight size={15}/></Link></div>
        {cart.map(item => {const line=resolveCartLine(item,customPrices,products);if(!line)return null;return <div className="cart-line" key={line.key}>
          <img src={line.image} alt={line.name} style={{background:item.custom?'#e6d2ff':'#f6dcf0'}}/>
          <div className="cart-line-details"><span className="cart-collection">{line.category==='custom'?'CUSTOM STUDIO':line.category==='digital'?'DIGITAL DOWNLOAD':'COCIOCO COLLECTION'}</span>
            {line.category==='custom'?<Link to="/custom" className="cart-item-title">{line.name}</Link>:<Link to={`/shop/${products.find(p=>p.id===item.productId)?.slug||''}`} className="cart-item-title">{line.name}</Link>}
            <small className="cx-cart-detail">{line.detail}</small>
            <strong>{country ? fmt(line.total) : money(line.total)}</strong>
            {line.designFee>0&&<small className="conversion-hint">Includes one-time designer-service fee {money(line.designFee)}</small>}
            {international && <small className="conversion-hint">International price = IDR ÷ FX × 3</small>}
            <div className="cart-line-bottom"><div className="qty-control"><button aria-label={`Decrease ${line.name} quantity`} onClick={()=>setCartQuantity(line.key,item.quantity-1)}><Minus size={15}/></button><span>{item.quantity}</span><button aria-label={`Increase ${line.name} quantity`} onClick={()=>setCartQuantity(line.key,item.quantity+1)}><Plus size={15}/></button></div><button className="remove-btn" onClick={()=>removeCart(line.key)}><Trash2 size={16}/> Remove</button></div>
          </div>
        </div>})}
        <div className="cart-reassurance"><Globe2 size={20}/><div><b>Your world, your currency.</b><p>Choose a destination to see local or international prices before proceeding.</p></div></div>
      </div>
      <aside className="cart-summary">
        <div className="summary-top"><span>THE ORDER DETAILS</span><span className="simple-circle" aria-hidden="true"/></div>
        <h2>Almost yours!</h2>
        <div className="country-picker"><label htmlFor="checkout-country"><Globe2 size={16}/> Shipping / billing country <span className="required-dot">*</span></label>
          <select required id="checkout-country" value={country} onChange={e=>{setCountry(e.target.value);setCheckout(false);}}>
            <option value="">Select your country first</option>
            {countries.map(([code,name])=><option key={code} value={code}>{name}</option>)}
          </select>
          {country && <span className="country-note">{international ? 'International order · prices displayed in USD' : 'Indonesia order · prices displayed in IDR'}</span>}
        </div>
        <div className="summary-row"><span>Subtotal</span><strong>{fmt(subtotalIDR)}</strong></div>
        {couponActive && <div className="summary-row discount-row"><span>COCIO10 discount (10%)</span><strong>-{fmt(subtotalIDR-discountedIDR)}</strong></div>}
        <div className="summary-row"><span>Shipping</span><span>Quoted separately*</span></div>
        {fxError&&<p className="cx-form-error">{fxError}</p>}
        {international && <div className="fx-note"><div className="fx-note-top"><strong>{fxLoading ? 'Fetching USD / IDR rate…' : fx.source === 'api' ? 'Latest published USD / IDR rate' : 'Demo FX estimate — API unavailable'}</strong>
            <button type="button" aria-label="Refresh USD to IDR exchange rate" title="Refresh rate" onClick={()=>setFxRefresh(v=>v+1)} disabled={fxLoading}><RefreshCw size={15} className={fxLoading ? 'fx-spinning' : ''}/></button></div>
            <div className="fx-rate">1 USD = {money(fx.usdToIdr)} IDR</div>
            <p>International price = IDR ÷ {fx.usdToIdr.toLocaleString('en-US')} × {INTERNATIONAL_MULTIPLIER}. Daily indicative FX, not a bank's live settlement rate.</p>
            {fx.source==='api' && <span className="fx-asof">Rate published: {fx.asOf}</span>}
            <a href="https://www.exchangerate-api.com" target="_blank" rel="noreferrer" className="fx-attribution">Rates by Exchange Rate API ↗</a>
          </div>}
        <div className="coupon-row"><input placeholder="Have a code?" aria-label="Promo code" value={coupon} onChange={e=>setCoupon(e.target.value)}/><button onClick={applyCode}>Apply</button></div>
        <div className="summary-total"><span>Estimated total</span><strong>{showCurrency(payable,currency)}</strong></div>
        <div className="shipping-disclaimer"><Info size={16}/><span>*Shipping, customs and payment fees are not included; confirm applicable charges with COCIOCO before paying.</span></div>
        {!checkout ? <button className="btn btn-black summary-checkout" disabled={!country || fxLoading} onClick={()=>setCheckout(true)}>{!country ? 'Choose country to continue' : 'Continue to checkout'} <ArrowRight size={18}/></button>
        : <form className="checkout-form" onSubmit={place}>
          <div className="checkout-step-heading"><CheckCircle2 size={18}/> Delivering to {countryName(country)}</div>
          <label>Full name<input value={form.customerName} required maxLength={100} onChange={e=>setForm({...form,customerName:e.target.value})} placeholder="Your full name" /></label>
          <label>Email address<input value={backendMode==='live'?user?.email||'':form.email} type="email" required readOnly={backendMode==='live'} maxLength={150} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@email.com" /></label>
          <label>WhatsApp number<input value={form.phone} type="tel" required maxLength={30} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="e.g. +62 812…" /></label>
          <label>{hasPhysicalItems ? 'Delivery address (required)' : 'Address / order note (optional)'}<textarea value={form.address} required={hasPhysicalItems} onChange={e=>setForm({...form,address:e.target.value})} placeholder={hasPhysicalItems ? 'Street, city, postal code, country' : 'Anything you want us to know'} rows={3}/></label>
          <div className="cx-club-checkbox"><label><input type="checkbox" checked={clubOptIn} onChange={e=>setClubOptIn(e.target.checked)}/><span>Join the optional <strong>COCIOCO Collectors Club</strong> leaderboard (verified orders only, no spending amounts shown).</span></label>{clubOptIn&&<input placeholder="Public collector nickname" required maxLength={24} value={collectorAlias} onChange={e=>setCollectorAlias(e.target.value.replace(/[^a-zA-Z0-9_.-]/g,''))}/>}</div>
          <div className="checkout-route-note"><LockKeyhole size={18}/><span>Next: {international ? 'PayPal transfer instructions (USD)' : 'Indonesian bank transfer instructions (IDR)'}. Payment proof is sent manually through WhatsApp.</span></div>
          <button type="submit" disabled={placing||Boolean(fxError&&international)} className="btn btn-black summary-checkout">{placing?'Securing your order...':'Go to payment details'} <ArrowRight size={18}/></button>
          <button type="button" className="back-checkout" onClick={()=>setCheckout(false)}>Back to bag summary</button>
        </form>}
        <div className="summary-foot"><LockKeyhole size={15}/> {backendMode==='live'?'SECURE ORDER RECORD · MANUAL PAYMENT VERIFICATION':'PHASE A PREVIEW — NO LIVE PAYMENT VERIFICATION'}</div>
      </aside>
    </div> : <div className="cart-empty"><div className="cart-empty-graphic"><ShoppingBag size={82}/><span>♥</span></div><h2>Your bag is feeling lonely.</h2><p>Let's find some cute things to keep it company.</p><Link className="btn btn-purple" to="/shop">Discover goodies <ArrowRight size={18}/></Link></div>}
    <Link to="/shop" className="cart-back"><ArrowLeft size={17}/> Continue browsing</Link>
  </div>;
}
