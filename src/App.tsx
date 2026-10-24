import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ToastProvider } from './components/Toast';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductPage from './pages/ProductPage';
import Cart from './pages/Cart';
import Payment from './pages/Payment';
import Commissions from './pages/Commissions';
import TaskDetail from './pages/TaskDetail';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Auth from './pages/Auth';
import About from './pages/About';

export default function App() {
  return <ToastProvider><Layout><Routes>
    <Route path="/" element={<Home/>}/>
    <Route path="/shop" element={<Shop/>}/>
    <Route path="/shop/:slug" element={<ProductPage/>}/>
    <Route path="/cart" element={<Cart/>}/>
    <Route path="/payment/:id" element={<Payment/>}/>
    <Route path="/commissions" element={<Commissions/>}/>
    <Route path="/board" element={<Navigate to="/commissions#board" replace/>}/>
    <Route path="/commissions/:id" element={<TaskDetail/>}/>
    <Route path="/dashboard" element={<Dashboard/>}/>
    <Route path="/admin" element={<Admin/>}/>
    <Route path="/auth" element={<Auth/>}/>
    <Route path="/about" element={<About/>}/>
    <Route path="*" element={<div className="notfound page-section container"><div className="notfound-emoji">☻</div><h1>Oops! Lost in the cute universe?</h1><p>That page must have floated away.</p><a className="btn btn-purple" href="/">Back to home <span>↗</span></a></div>}/>
  </Routes></Layout></ToastProvider>;
}
