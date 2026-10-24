export type ProductCategory = 'physical' | 'digital';
export type Product = {
  id: string;
  slug: string;
  name: string;
  category: ProductCategory;
  collection: string;
  price: number;
  image: string;
  badge?: string;
  color: string;
  description: string;
  includes: string[];
  stock: number;
};
export type TaskStatus = 'available' | 'in_progress' | 'under_review' | 'revision' | 'completed' | 'cancelled';
export type Submission = { name: string; size: number; submittedAt: number; by: string };
export type Task = {
  id: string;
  title: string;
  category: string;
  description: string;
  reward: number;
  durationHours: number;
  status: TaskStatus;
  postedAt: number;
  art: string;
  tone: string;
  skills: string[];
  deliverables: string[];
  brief: string;
  assignedTo?: string;
  assigneeName?: string;
  claimedAt?: number;
  deadlineAt?: number;
  submissions: Submission[];
};
export type User = { id: string; name: string; email: string; role: 'designer' | 'admin'; joinedAt: number };
export type Penalty = { id: string; userId: string; taskId: string; level: number; hours: number; at: number; until: number | null };
export type CartItem = { productId: string; quantity: number };
export type Order = {
  id: string;
  total: number; // original discounted total in IDR, for reporting
  amountDue: number; // country-dependent payable total (excludes any shipping costs)
  currency: 'IDR' | 'USD';
  country: string;
  fxRate: number;
  fxSource: 'api' | 'demo' | 'none';
  fxAsOf: string;
  at: number;
  items: CartItem[];
  customerName: string;
  email: string;
  phone: string;
  address: string;
  payment: 'bank_transfer' | 'paypal_manual';
  paymentStatus: 'awaiting_payment' | 'pending_verification' | 'verified';
};
export type PaymentSettings = {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  paypalEmail: string;
  whatsappNumber: string;
};
export type CreateOrderInput = {
  customerName: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  discount: number;
  fxRate: number;
  fxSource: 'api' | 'demo' | 'none';
  fxAsOf: string;
};
