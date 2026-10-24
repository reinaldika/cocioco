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
  const { orders, paymentSettings } = useStore();
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
  if(!order) return <div className="container page-section payment-notfound"><Wallet size={48}/><h1>We can't find that order.</h1><p>In Phase A, orders are saved only in the current browser. Open this page from the same device where you checked out.</p><Link className="btn btn-black" to="/shop">Back to shop <ArrowRight size={18}/></Link></div>;
  return <div className="container payment-page page-section">
    <div className="payment-steps"><span className="step-done"><CircleCheck size={15}/> BAG</span><span className="step-line"/><span className="step-done"><CircleCheck size={15}/> YOUR DETAILS</span><span className="step-line"/><span className="step-current">03 · PAYMENT</span></div>
    <div className="payment-header"><span className="eyebrow">ALMOST IN YOUR HANDS</span><h1>Time to make it <em>official.</em></h1><p>Your order is saved as <strong>awaiting payment</strong> in this browser. Follow the payment steps and send your receipt to our WhatsApp admin.</p></div>
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
        </div> : <div className="payment-missing"><ShieldAlert size={22}/><div><strong>Payment destination not configured yet</strong><p>COCIOCO has not published its {international?'PayPal email':'bank account details'} in this Phase A demo. Please contact the admin to obtain verified transfer instructions. Do not transfer money using guessed payment details.</p></div></div>}
        <div className="payment-amount"><span>AMOUNT FOR PRODUCTS</span><strong>{payable}</strong><small>*Shipping, customs, transfer and processing fees may be quoted separately. Payment details and totals must be confirmed with COCIOCO.</small></div>
        {international && <p className="payment-fx-small">Converted from {showCurrency(order.total,'IDR')} using 1 USD = {showCurrency(order.fxRate,'IDR')} × {INTERNATIONAL_MULTIPLIER}. {order.fxSource==='demo'?'Demo fallback rate — not a live quote.':'Indicative daily FX published: '+order.fxAsOf}. <a href="https://www.exchangerate-api.com" target="_blank" rel="noreferrer">Rates by Exchange Rate API ↗</a></p>}
      </section>
      <section className="payment-card payment-whatsapp-card"><div className="payment-card-head"><div><span className="payment-step-no">02 / SEND PROOF</span><h2>Send your receipt ♡</h2></div><span className="payment-round-icon whatsapp-round"><MessageCircleHeart size={26}/></span></div>
        <p className="payment-card-description">Once you complete the payment, tap the button below. WhatsApp will open with your order ID and payment details in the message. <strong>Attach the transfer receipt manually</strong> in your WhatsApp chat before sending.</p>
        <div className="wa-number"><span>OFFICIAL COCIOCO WHATSAPP</span><strong>+{whatsapp}</strong></div>
        <a className="btn btn-black whatsapp-action" href={waUrl} target="_blank" rel="noopener noreferrer"><MessageCircleHeart size={20}/>{hasPaymentDetails?'Open WhatsApp & attach proof':'Ask admin for payment details'} <ExternalLink size={17}/></a>
        <div className="payment-guidance"><Info size={17}/><p>A website cannot attach your receipt to a WhatsApp chat automatically through a wa.me link. Please add your screenshot or transfer receipt yourself.</p></div>
      </section>
      <div className="payment-demo-notice"><LockKeyhole size={21}/><div><strong>Phase A interactive preview — payment is not verified online.</strong><p>Orders and settings exist only in this browser, and WhatsApp actions do not change order status. Do not advertise this as a functioning checkout until Phase B connects a database, secure admin access, shared payment instructions, and verification.</p></div></div>
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
