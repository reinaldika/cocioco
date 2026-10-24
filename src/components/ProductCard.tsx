import { Link } from 'react-router-dom';
import { ArrowUpRight, Heart, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Product } from '../types';
import { money } from '../data';
import { useStore } from '../store';
import { useToast } from './Toast';
export default function ProductCard({ product }: { product: Product }) {
  const { addCart, toggleWishlist, wishlist } = useStore();
  const toast = useToast();
  const favorited = wishlist.includes(product.id);
  return <motion.article className="product-card" whileHover={{ y: -7 }} transition={{ type: 'spring', stiffness: 330, damping: 25 }}>
    <div className="product-img-wrap" style={{ backgroundColor: product.color }}>
      <Link to={`/shop/${product.slug}`} className="product-img-link" aria-label={`View ${product.name}`}><img src={product.image} alt={`${product.name} illustration`} loading="lazy" /></Link>
      {product.badge && <span className="product-badge">{product.badge}</span>}
      <button type="button" className={`favorite-btn ${favorited ? 'is-favorite' : ''}`} onClick={() => { toggleWishlist(product.id); toast(favorited ? 'Removed from your favorites.' : 'Added to your favorites! ♡'); }} aria-label={favorited ? `Remove ${product.name} from favorites` : `Favorite ${product.name}`}><Heart size={20} fill={favorited ? 'currentColor' : 'none'} /></button>
      <button type="button" className="quick-add" onClick={() => { addCart(product.id); toast(`${product.name} added to your bag!`); }} aria-label={`Add ${product.name} to bag`}><Plus size={20} /></button>
    </div>
    <div className="product-meta"><span>{product.collection}  {product.category === 'digital' ? 'Digital download' : 'Collectible'}</span><span className="tiny-arrow"><ArrowUpRight size={16}/></span></div>
    <Link to={`/shop/${product.slug}`} className="product-name">{product.name}</Link>
    <div className="product-price">{money(product.price)}</div>
  </motion.article>;
}
