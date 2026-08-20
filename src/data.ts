import { Product, CustomerDebt, Transaction } from './types';

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_DEBTS: CustomerDebt[] = [];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const CATEGORIES = [
  { id: 'all', ar: 'الكل', en: 'All' },
  { id: 'groceries', ar: 'مواد غذائية', en: 'Groceries' },
  { id: 'beverages', ar: 'مشروبات', en: 'Beverages' },
  { id: 'dairy', ar: 'ألبان وأجبان', en: 'Dairy & Cheese' },
  { id: 'snacks', ar: 'سناكس وحلويات', en: 'Snacks & Sweets' },
  { id: 'personal', ar: 'عناية شخصية', en: 'Personal Care' }
];
