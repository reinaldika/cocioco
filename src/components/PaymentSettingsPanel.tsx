import { useState, type FormEvent } from 'react';
import { CreditCard, Globe2, Info, MessageCircleHeart, Save, ShieldAlert } from 'lucide-react';
import { useStore } from '../store';
import { useToast } from './Toast';

export default function PaymentSettingsPanel() {
  const { paymentSettings, updatePaymentSettings } = useStore();
  const toast = useToast();
  const [draft, setDraft] = useState(paymentSettings);
  function save(event: FormEvent) {
    event.preventDefault();
    if (draft.paypalEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(draft.paypalEmail)) return toast('Enter a valid PayPal email or leave it empty.',true);
    if (!/^\+?[0-9\s()-]{9,25}$/.test(draft.whatsappNumber)) return toast('Enter a valid WhatsApp number.',true);
    updatePaymentSettings(draft);
    toast('Payment settings saved in this browser. Not shared with visitors.');
  }
  return <div className="admin-payment-settings">
    <div className="dash-section-title"><div><span className="eyebrow">STORE CONFIGURATION</span><h2>Payment <em>details.</em></h2></div><CreditCard size={29}/></div>
    <div className="payment-settings-warning"><ShieldAlert size={22}/><div><strong>Local demo settings only</strong><p>Changes are stored in this browser only. They will NOT automatically appear to customers on other devices. Phase B will securely publish official payment instructions from a shared database. Do not accept live orders yet.</p></div></div>
    <form onSubmit={save} className="payment-settings-form">
      <div className="payment-settings-section"><div className="payment-settings-section-head"><CreditCard size={22}/><div><h3>Indonesia · Bank Transfer</h3><p>Shown to shoppers selecting Indonesia.</p></div></div>
        <label>Bank name<input placeholder="e.g. BCA, Mandiri, BNI" value={draft.bankName} onChange={e=>setDraft({...draft,bankName:e.target.value})} maxLength={80}/></label>
        <label>Account number<input inputMode="numeric" placeholder="Your official bank account number" value={draft.accountNumber} onChange={e=>setDraft({...draft,accountNumber:e.target.value})} maxLength={50}/></label>
        <label>Account holder<input placeholder="Legal account holder name" value={draft.accountHolder} onChange={e=>setDraft({...draft,accountHolder:e.target.value})} maxLength={120}/></label>
      </div>
      <div className="payment-settings-section"><div className="payment-settings-section-head"><Globe2 size={22}/><div><h3>International · PayPal</h3><p>Shown to shoppers outside Indonesia.</p></div></div>
        <label>Official PayPal email<input placeholder="your-paypal@example.com" type="email" value={draft.paypalEmail} onChange={e=>setDraft({...draft,paypalEmail:e.target.value})} maxLength={150}/></label>
      </div>
      <div className="payment-settings-section"><div className="payment-settings-section-head"><MessageCircleHeart size={22}/><div><h3>Confirmation via WhatsApp</h3><p>Prefilled order confirmation messages use this number.</p></div></div>
        <label>WhatsApp number with country code<input required inputMode="tel" value={draft.whatsappNumber} onChange={e=>setDraft({...draft,whatsappNumber:e.target.value})} placeholder="6282317422632" maxLength={25}/></label>
      </div>
      <button type="submit" className="btn btn-black payment-save-btn"><Save size={18}/> Save demo payment settings</button>
      <div className="settings-tip"><Info size={18}/> For real transactions in Phase B, payment details and order amounts must be read from an authenticated backend with role-based admin access.</div>
    </form>
  </div>;
}
