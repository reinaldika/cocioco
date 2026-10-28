import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Heart, Instagram, Menu, ShoppingBag, Sparkles, UserRound, X, PackageSearch } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useStore } from '../store';
import { socials } from '../data';

const navItems = [ { to: '/', text: 'Home', end: true }, { to: '/shop', text: 'Shop', end: false }, { to: '/custom', text: 'Custom Studio', end: false }, { to: '/commissions', text: 'Commission Hub', end: false }, { to: '/leaderboard', text: 'Rankings', end: false }, { to: '/about', text: 'Our World', end: false } ];
export function Header() {
  const { user, cart } = useStore(); const navigate = useNavigate(); const [menu, setMenu] = useState(false); const location = useLocation();
  useEffect(() => setMenu(false), [location.pathname]);
  return <><div className="announcement"> YOUR CUTE LITTLE CREATIVE UNIVERSE <span>♥</span> SHOP, DESIGN & EARN </div>
    <div className="header-outer"><header className="site-header container"><Link className="brand" to="/" aria-label="COCIOCO SHOP home"><span className="brand-word">cocioco<span className="brand-dot">.</span></span><span className="brand-small">SHOP</span></Link>
      <nav className="desktop-nav" aria-label="Main navigation">{navItems.map(item => <NavLink key={item.to} end={item.end} to={item.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>{item.text}</NavLink>)}</nav>
      <div className="header-actions"><Link className="header-icon-btn cx-track-header" to="/track" aria-label="Track your order" title="Track your order"><PackageSearch size={19}/></Link><button className="header-icon-btn desktop-fav" aria-label="View favorite items" onClick={() => navigate('/shop?favorites=1')}><Heart size={20}/></button><Link className="header-icon-btn cart-header" to="/cart" aria-label={`Shopping bag with ${cart.reduce((sum, i) => sum + i.quantity, 0)} items`}><ShoppingBag size={20}/>{cart.length > 0 && <span className="cart-count">{cart.reduce((sum, i) => sum + i.quantity, 0)}</span>}</Link><Link className="account-link" to={user?.role === 'admin' ? '/admin' : user ? '/dashboard' : '/auth'}><UserRound size={16}/><span>{user ? user.name.split(' ')[0] : 'Sign in'}</span></Link><button className="header-icon-btn mobile-menu-btn" aria-label={menu ? 'Close menu' : 'Open menu'} aria-expanded={menu} onClick={() => setMenu(!menu)}>{menu ? <X size={22}/> : <Menu size={22}/>}</button></div>
    </header></div>
    <AnimatePresence>{menu && <motion.nav className="mobile-nav" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} aria-label="Mobile navigation">{navItems.map(item => <NavLink key={item.to} end={item.end} to={item.to}>{item.text}<ArrowUpRight size={18}/></NavLink>)}<Link to="/track">Track an order<ArrowUpRight size={18}/></Link><Link to={user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/auth'}>My Account<ArrowUpRight size={18}/></Link></motion.nav>}</AnimatePresence>
  </>;
}
export function Footer() { const {backendMode}=useStore(); return <footer className="footer"><div className="container"><div className="footer-top"><div className="footer-brand"><Link to="/" className="footer-logo">cocioco<span>.</span></Link><p>A happy little corner of the internet for<br/> makers, dreamers, and collectors.</p><div className="footer-social"><Instagram size={18}/><span>made with ♡ & a little bit of chaos</span></div></div><div className="footer-column"><h4>EXPLORE</h4><Link to="/shop">Shop all</Link><Link to="/shop?category=physical">Collectibles</Link><Link to="/shop?category=digital">Digital assets</Link><Link to="/custom">Custom Studio</Link><Link to="/track">Track an order</Link><Link to="/giving">Gives Back Journal</Link><Link to="/about">Our world</Link></div><div className="footer-column"><h4>FOR CREATORS</h4><Link to="/commissions">Commission Hub</Link><Link to="/board">Task board</Link><Link to="/auth">Join as designer</Link><Link to="/dashboard">My dashboard</Link><Link to="/leaderboard">Creator rankings</Link></div><div className="footer-column"><h4>FIND US</h4>{socials.map(s => <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer">{s.name} <ArrowUpRight size={13}/></a>)}</div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} COCIOCO SHOP. Made for cute things & big ideas.</span><span className="demo-copy">{backendMode==='live'?'Account-based shopping · manually verified payments & deliveries':'Interactive demo • accounts, orders & files are local to this browser'}</span><span>KEEP IT CUTE </span></div></div></footer>; }
 export function Layout({ children }: { children: ReactNode }) {   const location = useLocation();   const { backendMode, error, paymentSettings, user } = useStore();    useEffect(() => {     window.scrollTo({ top: 0, behavior: 'instant' });   }, [location.pathname]);    const whatsappNumber = paymentSettings.whatsappNumber.replace(/\D/g, '');    const taskId = location.pathname.match(     /^\/commissions\/([^/]+)/   )?.[1];    const message = taskId     ? `Halo admin COCIOCO! Saya ${user?.role === 'designer' ? 'designer' : 'pengunjung'} dan membutuhkan bantuan terkait commission ${taskId}.`     : location.pathname.startsWith('/custom')       ? 'Halo admin COCIOCO! Saya ingin bertanya tentang custom order.'       : 'Halo admin COCIOCO! Saya ingin bertanya tentang produk atau layanan COCIOCO SHOP.';    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;    return (     <div className="app-shell">       <Header />        {backendMode === 'live' && error && (         <div className="cx-live-error" role="alert">           Could not sync the COCIOCO database: {error}.           Please refresh, or contact the shop before checkout.         </div>       )}        <motion.main         key={location.pathname}         initial={{ opacity: .75 }}         animate={{ opacity: 1 }}         transition={{ duration: .22 }}       >         {children}       </motion.main>        <Footer />        {whatsappNumber.length >= 10 &&         whatsappNumber.length <= 15 && (           <a             className="floating-admin-chat"             href={whatsappUrl}             target="_blank"             rel="noopener noreferrer"             aria-label="Chat with COCIOCO admin via WhatsApp"           >             <MessageCircle size={19} />             <span>Chat with admin</span>           </a>         )}        <Link         className="floating-help"         to="/commissions"         aria-label="Explore commissions"       >         <Sparkles size={20} />         <span>MAKE & EARN</span>         <ArrowRight size={16} />       </Link>     </div>   ); }
  const location = useLocation();const {backendMode,error}=useStore();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [location.pathname]);
  return <div className="app-shell"><Header/>{backendMode==='live'&&error&&<div className="cx-live-error" role="alert">Could not sync the COCIOCO database: {error}. Please refresh, or contact the shop before checkout.</div>}<motion.main key={location.pathname} initial={{ opacity: .75 }} animate={{ opacity: 1 }} transition={{ duration: .22 }}>{children}</motion.main><Footer/><Link className="floating-help" to="/commissions" aria-label="Explore commissions"><Sparkles size={20}/><span>MAKE & EARN</span><ArrowRight size={16}/></Link></div>;
}

/* Floating admin support */
.floating-admin-chat {
  position: fixed;
  right: 24px;
  bottom: 94px;
  z-index: 85;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  padding: 13px 20px;
  border: 2px solid #282128;
  border-radius: 999px;

  background: #e0f18d;
  color: #282128;
  box-shadow: 4px 5px 0 #282128;

  font-size: 12px;
  font-weight: 900;

  transition: transform .2s, background .2s;
}

.floating-admin-chat:hover {
  transform: translateY(-3px);
  background: #dfcbf8;
}

@media (max-width: 600px) {
  .floating-admin-chat {
    right: 18px;
    bottom: 91px;
    padding: 13px;
  }

  .floating-admin-chat span {
    display: none;
  }
}
