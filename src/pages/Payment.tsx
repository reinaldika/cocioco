import { Link, useParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CircleCheck, Copy, CreditCard, ExternalLink, Globe2, Info, LockKeyhole, MessageCircleHeart, ShieldAlert, ShoppingBag, Wallet } from 'lucide-react';
import { useStore } from '../store';
import { resolveCartLine } from '../custom';
import { Truck } from 'lucide-react';
import { countryName } from '../countries';
import { showCurrency, INTERNATIONAL_MULTIPLIER } from '../pricing';
import { useToast } from '../components/Toast';

export default function Payment() {
  const { id } = useParams();
  const { orders, paymentSettings, backendMode, loading } = useStore();
  const toast=useToast();
  const [copied, setCopied] = useState('');
  const order=orders.find(o=>o.id===id);
  const international=order?.currency==='USD';
  const payable=order ? showCurrency(order.amountDue ?? order.total,order.currency || 'IDR') : '';
  const hasPaymentDetails = international ? Boolean(paymentSettings.paypalEmail && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(paymentSettings.paypalEmail)) : Boolean(paymentSettings.bankName && paymentSettings.accountHolder && paymentSettings.accountNumber);
  const whatsapp = (paymentSettings.whatsappNumber || '6282317422632').replace(/\D/g,'');
  const message = useMemo(()=> {
    if (!order) return '';
    const lines = [
      'Halo admin COCIOCO SHOP! Saya mau konfirmasi pembayaran order.',
      `Order ID: ${order.id}`,
      `Nama: ${order.customerName}`,
      `Negara: ${countryName(order.country || 'ID')}`,
      `Total produk: ${payable}`,
      `Metode: ${international ? 'PayPal (USD)' : 'Transfer bank (IDR)'}`,
      'Mohon konfirmasi ongkir/biaya tambahan jika ada.',
      hasPaymentDetails ? 'Saya akan lampirkan bukti transfer secara manual di chat ini.' : 'Mohon info rekening/PayPal resmi COCIOCO sebelum saya melakukan pembayaran.',
    ];
    return lines.join('\n');
  },[order,payable,international,hasPaymentDetails]);
  const waUrl=`https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;
  async function copyValue(value: string, type: string) {
    try { await navigator.clipboard.writeText(value); setCopied(type); toast('Copied to clipboard!'); }
    catch { toast('Copy unavailable. Please select and copy the text.',true); }
  }
  if(!order && loading)return <div className="container page-section">Loading your order…</div>;
  if(!order) return <div className="container page-section payment-notfound"><Wallet size={48}/><h1>We can't find that order.</h1><p>Sign in with the account used at checkout to access this private order.</p><Link className="btn btn-black" to="/shop">Back to shop <ArrowRight size={18}/></Link></div>;
  if(order?.paymentStatus==='verified') return <div className="container page-section cx-payment-closed"><CircleCheck size={44}/><h1>Payment verified!</h1><p>Order <b>{order.id}</b> has been confirmed by COCIOCO. Please do not transfer again. Follow your package's journey in the private order tracker.</p><Link className="btn btn-black" to={`/track/${order.id}`}><Truck size={18}/> Track your order <ArrowRight size={16}/></Link></div>;
  if(order?.paymentStatus==='rejected') return <div className="container page-section cx-payment-closed"><ShieldAlert size={44}/><h1>This order is closed.</h1><p>Order <b>{order.id}</b> was rejected or cancelled before payment confirmation. Please do not transfer to a previous payment instruction. Contact COCIOCO or start a new order.</p><Link className="btn btn-black" to="/shop">Back to the shop <ArrowRight size={16}/></Link></div>;

  return <div className="container payment-page page-section">
    <div className="payment-steps"><span className="step-done"><CircleCheck size={15}/> BAG</span><span className="step-line"/><span className="step-done"><CircleCheck size={15}/> YOUR DETAILS</span><span className="step-line"/><span className="step-current">03 · PAYMENT</span></div>
    <div className="payment-header"><span className="eyebrow">ALMOST IN YOUR HANDS</span><h1>Time to make it <em>official.</em></h1><p>Your order is recorded as <strong>{order.paymentStatus.replaceAll('_',' ')}</strong>. Follow the payment steps and send your receipt to our WhatsApp admin.</p></div>
    <div className="payment-layout"><div className="payment-main">
      <section className="payment-card payment-hero-card"><div className="payment-card-head"><div><span className="payment-step-no">01 / PAYMENT METHOD</span><h2>{international?'International PayPal transfer':'Indonesia bank transfer'}</h2></div><span className="payment-round-icon">{international?<Globe2 size={26}/>:<CreditCard size={26}/>}</span></div>
        <p className="payment-card-description">{international?'For customers outside Indonesia, send the quoted USD amount to the official PayPal email after verifying payment details.':'For customers in Indonesia, transfer the displayed IDR amount to the official COCIOCO bank account after verifying payment details.'}</p>
        <div className="payment-method-chip"><span className="method-dot"/>{international?'PAYPAL · USD':'BANK TRANSFER · IDR'}</div>
        {hasPaymentDetails ? <div className="payment-account">
          {!international ? <>
            <div className="payment-account-row"><span>BANK</span><strong>{paymentSettings.bankName}</strong></div>
            <div className="payment-account-row"><span>ACCOUNT HOLDER</span><strong>{paymentSettings.accountHolder}</strong></div>
            <div className="payment-account-row"><span>ACCOUNT NUMBER</span><div className="payment-copy-value"><strong>{paymentSettings.accountNumber}</strong><button aria-label="Copy bank account number" onClick={()=>copyValue(paymentSettings.accountNumber,'bank')}>{copied==='bank'?<Check size={18}/>:<Copy size={18}/>}</button></div></div>
          </> : <div className="payment-account-row"><span>PAYPAL EMAIL</span><div className="payment-copy-value"><strong>{paymentSettings.paypalEmail}</strong><button aria-label="Copy PayPal email" onClick={()=>copyValue(paymentSettings.paypalEmail,'paypal')}>{copied==='paypal'?<Check size={18}/>:<Copy size={18}/>}</button></div></div>}
        </div> : <div className="payment-missing"><ShieldAlert size={22}/><div><strong>Payment destination not configured yet</strong><p>COCIOCO has not published its {international?'PayPal email':'bank account details'} for this order. Please contact the admin to obtain verified transfer instructions. Do not transfer money using guessed payment details.</p></div></div>}
        <div className="payment-amount"><span>AMOUNT FOR PRODUCTS</span><strong>{payable}</strong><small>*Shipping, customs, transfer and processing fees may be quoted separately. Payment details and totals must be confirmed with COCIOCO.</small></div>
        {international && <p className="payment-fx-small">Converted from {showCurrency(order.total,'IDR')} using 1 USD = {showCurrency(order.fxRate,'IDR')} × {INTERNATIONAL_MULTIPLIER}. {order.fxSource==='demo'?'Demo fallback rate — not a live quote.':'Indicative daily FX published: '+order.fxAsOf}. <a href="https://www.exchangerate-api.com" target="_blank" rel="noreferrer">Rates by Exchange Rate API ↗</a></p>}
      </section>
      <section className="payment-card payment-whatsapp-card"><div className="payment-card-head"><div><span className="payment-step-no">02 / SEND PROOF</span><h2>Send your receipt ♡</h2></div><span className="payment-round-icon whatsapp-round"><MessageCircleHeart size={26}/></span></div>
        <p className="payment-card-description">Once you complete the payment, tap the button below. WhatsApp will open with your order ID and payment details in the message. <strong>Attach the transfer receipt manually</strong> in your WhatsApp chat before sending.</p>
        <div className="wa-number"><span>OFFICIAL COCIOCO WHATSAPP</span><strong>+{whatsapp}</strong></div>
        <a className="btn btn-black whatsapp-action" href={waUrl} target="_blank" rel="noopener noreferrer"><MessageCircleHeart size={20}/>{hasPaymentDetails?'Open WhatsApp & attach proof':'Ask admin for payment details'} <ExternalLink size={17}/></a>
        <div className="payment-guidance"><Info size={17}/><p>A website cannot attach your receipt to a WhatsApp chat automatically through a wa.me link. Please add your screenshot or transfer receipt yourself.</p></div>
      </section>
      <div className="payment-demo-notice"><LockKeyhole size={21}/><div><strong>{backendMode==='live'?'Your payment is checked manually by COCIOCO.':'Phase A local preview — no payment verification.'}</strong><p>{backendMode==='live'?'A WhatsApp receipt does not automatically verify payment. COCIOCO staff will review it and update this order in your account. Shipping and bank/PayPal charges may be quoted separately.':'This preview is local to your browser. Do not send money until a real payment account is configured.'}</p></div></div>
    </div>
    <aside className="payment-sidebar"><div className="payment-order-card"><span className="eyebrow">YOUR ORDER</span><h2>A little recap.</h2><div className="payment-order-ref"><span>ORDER ID</span><button onClick={()=>copyValue(order.id,'order')} title="Copy order ID">{order.id} {copied==='order'?<Check size={16}/>:<Copy size={15}/>}</button></div>
      <div className="payment-order-items">{(order.lines?.length?order.lines:order.items.map(item=>resolveCartLine(item)).filter((l):l is NonNullable<typeof l>=>Boolean(l))).map(line=><div key={line.key} className="payment-order-item"><img src={line.image} alt=""/><div><strong>{line.name}</strong><span>Qty {line.quantity} · {line.detail}</span></div></div>)}</div>
      <div className="payment-order-summary-row"><span>Destination</span><strong>{countryName(order.country||'ID')}</strong></div>
      <div className="payment-order-summary-row"><span>Payment</span><strong>{international?'PayPal':'Bank transfer'}</strong></div>
      <div className="payment-order-summary-row"><span>Order status</span><strong className="order-awaiting">{order.paymentStatus.replaceAll('_',' ').toUpperCase()}</strong></div>
      <div className="payment-order-total"><span>PRODUCTS TOTAL</span><strong>{payable}</strong></div>
      <Link className="cx-payment-tracking" to={`/track/${order.id}`}><Truck size={17}/> Track this order <ArrowRight size={16}/></Link>
      <Link to="/shop" className="payment-shop-link"><ShoppingBag size={17}/> Continue shopping <ArrowRight size={17}/></Link>
    </div><Link className="payment-back-link" to="/shop"><ArrowLeft size={17}/> Back to the shop</Link></aside></div>
  </div>;
}
