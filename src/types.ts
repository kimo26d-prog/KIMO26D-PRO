export interface Product {
  id: string;
  barcode: string;
  nameAr: string;
  nameEn: string;
  categoryAr: string;
  categoryEn: string;
  buyingPrice: number;
  sellingPrice: number;
  quantity: number;
  minQuantity: number;
}

export interface SaleItem {
  productId: string;
  productNameAr: string;
  productNameEn: string;
  sellingPrice: number;
  buyingPrice: number;
  quantity: number;
}

export interface Transaction {
  id: string;
  date: string;
  items: SaleItem[];
  totalAmount: number;
  profit: number;
  paymentMethod: 'cash' | 'card' | 'debt';
  customerId?: string;
  customerName?: string;
}

export interface DebtRecord {
  date: string;
  amount: number;
  type: 'add' | 'payment';
  note?: string;
}

export interface CustomerDebt {
  id: string;
  name: string;
  phone: string;
  totalDebt: number;
  lastTransactionDate: string;
  history: DebtRecord[];
}

export interface SubscriberAccount {
  syncCode: string;
  shopName: string;
  ownerName: string;
  ownerPhone: string;
  wilaya: string;
  status: 'active' | 'expired' | 'suspended';
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  monthlyFee: number;
  lastPaymentDate: string;
  notes?: string;
  productsCount?: number;
  devicesCount?: number;
}

export type Language = 'ar' | 'en';
export type AppTab = 'dashboard' | 'inventory' | 'sales' | 'debts' | 'analytics' | 'subscribers';
