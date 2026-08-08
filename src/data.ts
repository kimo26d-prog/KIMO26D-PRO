import { Product, CustomerDebt, Transaction } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    barcode: '6281007212345',
    nameAr: 'حليب المراعي كامل الدسم 1 لتر',
    nameEn: 'Almarai Full Fat Milk 1L',
    categoryAr: 'ألبان وأجبان',
    categoryEn: 'Dairy & Cheese',
    buyingPrice: 4.50,
    sellingPrice: 6.00,
    quantity: 28,
    minQuantity: 10
  },
  {
    id: 'prod-2',
    barcode: '6281011112223',
    nameAr: 'بيبسي علبة 330 مل',
    nameEn: 'Pepsi Can 330ml',
    categoryAr: 'مشروبات',
    categoryEn: 'Beverages',
    buyingPrice: 1.80,
    sellingPrice: 2.50,
    quantity: 48,
    minQuantity: 15
  },
  {
    id: 'prod-3',
    barcode: '4005900123456',
    nameAr: 'كريم نيفيا مرطب 150 مل',
    nameEn: 'Nivea Moisturizing Cream 150ml',
    categoryAr: 'عناية شخصية',
    categoryEn: 'Personal Care',
    buyingPrice: 14.20,
    sellingPrice: 19.50,
    quantity: 4,
    minQuantity: 8
  },
  {
    id: 'prod-4',
    barcode: '6281002223334',
    nameAr: 'شاي ليبتون الأسود 100 كيس',
    nameEn: 'Lipton Black Tea 100 Bags',
    categoryAr: 'مشروبات',
    categoryEn: 'Beverages',
    buyingPrice: 11.50,
    sellingPrice: 16.00,
    quantity: 18,
    minQuantity: 5
  },
  {
    id: 'prod-5',
    barcode: '0896860431234',
    nameAr: 'نودلز إندومي كوب دجاج 60 جرام',
    nameEn: 'Indomie Chicken Cup Noodles 60g',
    categoryAr: 'مواد غذائية',
    categoryEn: 'Groceries',
    buyingPrice: 2.10,
    sellingPrice: 3.50,
    quantity: 3,
    minQuantity: 12
  },
  {
    id: 'prod-6',
    barcode: '3017620421234',
    nameAr: 'شوكولاتة نوتيلا 350 جرام',
    nameEn: 'Nutella Spread 350g',
    categoryAr: 'سناكس وحلويات',
    categoryEn: 'Snacks & Sweets',
    buyingPrice: 24.00,
    sellingPrice: 32.00,
    quantity: 0,
    minQuantity: 5
  },
  {
    id: 'prod-7',
    barcode: '6281001110099',
    nameAr: 'زيت دوار الشمس عافية 1.5 لتر',
    nameEn: 'Afia Sunflower Oil 1.5L',
    categoryAr: 'مواد غذائية',
    categoryEn: 'Groceries',
    buyingPrice: 18.50,
    sellingPrice: 24.00,
    quantity: 12,
    minQuantity: 4
  },
  {
    id: 'prod-8',
    barcode: '6281030040050',
    nameAr: 'جبنة فيتا المراعي 200 جرام',
    nameEn: 'Almarai Feta Cheese 200g',
    categoryAr: 'ألبان وأجبان',
    categoryEn: 'Dairy & Cheese',
    buyingPrice: 3.80,
    sellingPrice: 5.50,
    quantity: 22,
    minQuantity: 8
  }
];

export const INITIAL_DEBTS: CustomerDebt[] = [
  {
    id: 'debt-1',
    name: 'أحمد منصور العتيبي',
    phone: '0554123456',
    totalDebt: 245.00,
    lastTransactionDate: '2026-07-06T18:30:00Z',
    history: [
      { date: '2026-07-01T10:15:00Z', amount: 150.00, type: 'add', note: 'شراء مواد تموينية مختلفة' },
      { date: '2026-07-03T20:00:00Z', amount: 50.00, type: 'payment', note: 'دفعة نقدية مسددة' },
      { date: '2026-07-06T18:30:00Z', amount: 145.00, type: 'add', note: 'شراء حليب وزيت دوار الشمس' }
    ]
  },
  {
    id: 'debt-2',
    name: 'أبو فهد الشهراني',
    phone: '0501112222',
    totalDebt: 85.50,
    lastTransactionDate: '2026-07-05T14:20:00Z',
    history: [
      { date: '2026-07-02T16:45:00Z', amount: 125.50, type: 'add', note: 'مشتريات عائلية' },
      { date: '2026-07-05T14:20:00Z', amount: 40.00, type: 'payment', note: 'دفعة تحويل بنكي' }
    ]
  },
  {
    id: 'debt-3',
    name: 'خالد محمد يوسف',
    phone: '0569876543',
    totalDebt: 320.00,
    lastTransactionDate: '2026-07-07T11:05:00Z',
    history: [
      { date: '2026-06-28T09:00:00Z', amount: 200.00, type: 'add', note: 'حساب متبقي للشهر الماضي' },
      { date: '2026-07-07T11:05:00Z', amount: 120.00, type: 'add', note: 'مشروبات وألبان للعمل' }
    ]
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    date: '2026-07-07T14:30:00Z',
    items: [
      { productId: 'prod-1', productNameAr: 'حليب المراعي كامل الدسم 1 لتر', productNameEn: 'Almarai Full Fat Milk 1L', sellingPrice: 6.00, buyingPrice: 4.50, quantity: 2 },
      { productId: 'prod-2', productNameAr: 'بيبسي علبة 330 مل', productNameEn: 'Pepsi Can 330ml', sellingPrice: 2.50, buyingPrice: 1.80, quantity: 4 }
    ],
    totalAmount: 22.00,
    profit: 5.80,
    paymentMethod: 'cash'
  },
  {
    id: 'tx-2',
    date: '2026-07-07T11:05:00Z',
    items: [
      { productId: 'prod-7', productNameAr: 'زيت دوار الشمس عافية 1.5 لتر', productNameEn: 'Afia Sunflower Oil 1.5L', sellingPrice: 24.00, buyingPrice: 18.50, quantity: 5 }
    ],
    totalAmount: 120.00,
    profit: 27.50,
    paymentMethod: 'debt',
    customerId: 'debt-3',
    customerName: 'خالد محمد يوسف'
  },
  {
    id: 'tx-3',
    date: '2026-07-06T18:30:00Z',
    items: [
      { productId: 'prod-1', productNameAr: 'حليب المراعي كامل الدسم 1 لتر', productNameEn: 'Almarai Full Fat Milk 1L', sellingPrice: 6.00, buyingPrice: 4.50, quantity: 15 },
      { productId: 'prod-7', productNameAr: 'زيت دوار الشمس عافية 1.5 لتر', productNameEn: 'Afia Sunflower Oil 1.5L', sellingPrice: 24.00, buyingPrice: 18.50, quantity: 2 }
    ],
    totalAmount: 138.00,
    profit: 33.50,
    paymentMethod: 'debt',
    customerId: 'debt-1',
    customerName: 'أحمد منصور العتيبي'
  },
  {
    id: 'tx-4',
    date: '2026-07-06T12:15:00Z',
    items: [
      { productId: 'prod-3', productNameAr: 'كريم نيفيا مرطب 150 مل', productNameEn: 'Nivea Moisturizing Cream 150ml', sellingPrice: 19.50, buyingPrice: 14.20, quantity: 2 },
      { productId: 'prod-4', productNameAr: 'شاي ليبتون الأسود 100 كيس', productNameEn: 'Lipton Black Tea 100 Bags', sellingPrice: 16.00, buyingPrice: 11.50, quantity: 1 }
    ],
    totalAmount: 55.00,
    profit: 15.10,
    paymentMethod: 'card'
  },
  {
    id: 'tx-5',
    date: '2026-07-05T16:20:00Z',
    items: [
      { productId: 'prod-8', productNameAr: 'جبنة فيتا المراعي 200 جرام', productNameEn: 'Almarai Feta Cheese 200g', sellingPrice: 5.50, buyingPrice: 3.80, quantity: 6 },
      { productId: 'prod-2', productNameAr: 'بيبسي علبة 330 مل', productNameEn: 'Pepsi Can 330ml', sellingPrice: 2.50, buyingPrice: 1.80, quantity: 10 }
    ],
    totalAmount: 58.00,
    profit: 17.20,
    paymentMethod: 'cash'
  }
];

export const CATEGORIES = [
  { id: 'all', ar: 'الكل', en: 'All' },
  { id: 'groceries', ar: 'مواد غذائية', en: 'Groceries' },
  { id: 'beverages', ar: 'مشروبات', en: 'Beverages' },
  { id: 'dairy', ar: 'ألبان وأجبان', en: 'Dairy & Cheese' },
  { id: 'snacks', ar: 'سناكس وحلويات', en: 'Snacks & Sweets' },
  { id: 'personal', ar: 'عناية شخصية', en: 'Personal Care' }
];
