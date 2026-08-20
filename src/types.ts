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
  // Wholesale extensions (البيع بالجملة)
  wholesalePrice?: number; // سعر الجملة للقطعة (DZD)
  semiWholesalePrice?: number; // سعر نصف الجملة للقطعة (DZD)
  cartonQuantity?: number; // عدد القطع في الكرتونة / الصندوق
  cartonPrice?: number; // سعر الكرتونة الواحدة بالجملة
  minWholesaleQty?: number; // الحد الأدنى لطلب الجملة
  wholesaleUnit?: string; // كرتونة / صندوق / طرد / كيس / حبة
}

export interface SaleItem {
  productId: string;
  productNameAr: string;
  productNameEn: string;
  sellingPrice: number;
  buyingPrice: number;
  quantity: number;
  // Wholesale extensions
  isWholesale?: boolean;
  packageType?: 'unit' | 'carton' | 'box' | 'pack';
  cartonCount?: number;
  unitsPerCarton?: number;
  priceTier?: 'retail' | 'semi_wholesale' | 'wholesale' | 'super_wholesale' | 'custom';
}

export interface Transaction {
  id: string;
  date: string;
  items: SaleItem[];
  totalAmount: number;
  profit: number;
  paymentMethod: 'cash' | 'card' | 'debt' | 'cheque' | 'transfer';
  customerId?: string;
  customerName?: string;
  // Wholesale extensions
  saleType?: 'retail' | 'wholesale';
  invoiceType?: 'simplified' | 'standard' | 'bon_livraison' | 'proforma';
  discountAmount?: number;
  shippingFee?: number;
  driverName?: string;
  vehiclePlate?: string;
  clientCommercialName?: string;
  clientPhone?: string;
  clientWilaya?: string;
  clientAddress?: string;
  clientTaxNumber?: string; // NIF / RC
  chequeNumber?: string;
  chequeBank?: string;
  chequeDueDate?: string;
  deliveryStatus?: 'delivered' | 'in_transit' | 'pending';
  notes?: string;
}

export interface WholesaleClient {
  id: string;
  storeName: string;
  contactPerson: string;
  phone: string;
  wilaya: string;
  address?: string;
  taxId?: string; // NIF / RC / NIS
  priceTier?: 'semi_wholesale' | 'wholesale' | 'super_wholesale';
  outstandingBalance?: number;
  totalPurchases?: number;
  ordersCount?: number;
  lastOrderDate?: string;
  notes?: string;
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
  shopType?: string;
  ownerName: string;
  ownerPhone: string;
  wilaya: string;
  status: 'active' | 'expired' | 'suspended';
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  monthlyFee: number;
  lastPaymentDate: string;
  username?: string;
  password?: string;
  notes?: string;
  productsCount?: number;
  devicesCount?: number;
}

export interface ShopTypeOption {
  id: string;
  nameAr: string;
  nameEn: string;
  icon: string;
  descriptionAr: string;
  descriptionEn: string;
}

export interface CategoryOption {
  id: string;
  ar: string;
  en: string;
}

export const CATEGORY_PRESETS_BY_SHOP_TYPE: Record<string, CategoryOption[]> = {
  grocery: [
    { id: 'groceries', ar: 'مواد غذائية', en: 'Groceries' },
    { id: 'beverages', ar: 'مشروبات وسوائل', en: 'Beverages' },
    { id: 'dairy', ar: 'ألبان وأجبان', en: 'Dairy & Cheese' },
    { id: 'snacks', ar: 'سناكس وحلويات', en: 'Snacks & Sweets' },
    { id: 'personal', ar: 'عناية شخصية', en: 'Personal Care' },
    { id: 'cleaning', ar: 'منظفات ومستلزمات منزلية', en: 'Cleaning & Household' }
  ],
  barber: [
    { id: 'hair_services', ar: 'خدمات قص وتصفيف الشعر', en: 'Haircuts & Styling' },
    { id: 'beard_services', ar: 'حلاقة وتهذيب اللحية', en: 'Beard & Grooming' },
    { id: 'skincare', ar: 'كريمات وعناية بالبشرة', en: 'Skincare & Creams' },
    { id: 'perfumes', ar: 'عطور ومستحضرات تجميل', en: 'Perfumes & Cosmetics' },
    { id: 'barber_tools', ar: 'أدوات ومعدات حلاقة', en: 'Barber Tools & Supplies' }
  ],
  pharmacy: [
    { id: 'medicines', ar: 'أدوية ومسكنات', en: 'Medicines & Painkillers' },
    { id: 'vitamins', ar: 'مكملات وفيتامينات', en: 'Vitamins & Supplements' },
    { id: 'baby_care', ar: 'عناية بالطفل والأم', en: 'Baby & Mother Care' },
    { id: 'medical_supplies', ar: 'تجهيزات ومستلزمات طبية', en: 'Medical Equipment' },
    { id: 'cosmetics', ar: 'مستحضرات تجميل للعناية', en: 'Cosmetics' }
  ],
  clothing: [
    { id: 'men_clothing', ar: 'ملابس رجالية', en: "Men's Wear" },
    { id: 'women_clothing', ar: 'ملابس نسائية', en: "Women's Wear" },
    { id: 'kids_clothing', ar: 'ملابس أطفال', en: "Kids' Wear" },
    { id: 'shoes', ar: 'أحذية ومصنوعات جلدية', en: 'Footwear & Shoes' },
    { id: 'accessories', ar: 'إكسسوارات وموضة', en: 'Fashion Accessories' }
  ],
  electronics: [
    { id: 'mobiles', ar: 'هواتف وأجهزة ذكية', en: 'Mobiles & Smart Devices' },
    { id: 'cables_accessories', ar: 'إكسسوارات وكوابل', en: 'Accessories & Cables' },
    { id: 'chargers', ar: 'شواحن وبطاريات', en: 'Chargers & Power' },
    { id: 'repairs', ar: 'خدمات صيانة وقطع غيار', en: 'Repair & Spare Parts' },
    { id: 'computers', ar: 'كمبيوتر وحواسيب', en: 'Computers & IT' }
  ],
  restaurant: [
    { id: 'meals', ar: 'وجبات وأطباق رئيسية', en: 'Main Dishes & Meals' },
    { id: 'fast_food', ar: 'سندويتشات وجبات سريعة', en: 'Sandwiches & Fast Food' },
    { id: 'drinks', ar: 'مشروبات باردة وساخنة', en: 'Hot & Cold Drinks' },
    { id: 'pastries', ar: 'حلويات ومخبوزات', en: 'Pastries & Desserts' },
    { id: 'appetizers', ar: 'مقبلات وسلطات', en: 'Appetizers & Salads' }
  ],
  auto_parts: [
    { id: 'engine_parts', ar: 'قطع غيار المحركات', en: 'Engine Parts' },
    { id: 'oils_fluids', ar: 'زيوت وسوائل المركبات', en: 'Oils & Fluids' },
    { id: 'auto_accessories', ar: 'إكسسوارات وكماليات السيارات', en: 'Auto Accessories' },
    { id: 'tires_batteries', ar: 'إطارات وبطاريات', en: 'Tires & Batteries' },
    { id: 'body_lighting', ar: 'هيكل وإنارة ومصابيح', en: 'Body & Lighting' }
  ],
  hardware: [
    { id: 'electric_tools', ar: 'أدوات ومعدات كهربائية', en: 'Electrical Tools' },
    { id: 'plumbing', ar: 'سباكة وتجهيزات صحية', en: 'Plumbing & Sanitary' },
    { id: 'paint_building', ar: 'طلاء ومواد بناء', en: 'Paint & Construction' },
    { id: 'hardware_fasteners', ar: 'براغي وخردوات وعتاد', en: 'Hardware & Fasteners' },
    { id: 'hand_tools', ar: 'أدوات يدوية', en: 'Hand Tools' }
  ],
  other: [
    { id: 'general_items', ar: 'سلع ومنتجات عامة', en: 'General Merchandise' },
    { id: 'services', ar: 'خدمات وأعمال', en: 'Services' },
    { id: 'miscellaneous', ar: 'متنوعات أخرى', en: 'Miscellaneous' }
  ]
};

export const SHOP_TYPES: ShopTypeOption[] = [
  { 
    id: 'grocery', 
    nameAr: 'بقالة ومواد غذائية وسوبرماركت', 
    nameEn: 'Grocery & Supermarket', 
    icon: '🛒',
    descriptionAr: 'بيع المواد الغذائية، المشروبات، والمستلزمات اليومية',
    descriptionEn: 'Food, beverages, and daily consumer goods'
  },
  { 
    id: 'barber', 
    nameAr: 'صالون حلاقة وتجميل', 
    nameEn: 'Barber & Beauty Salon', 
    icon: '✂️',
    descriptionAr: 'خدمات الحلاقة، العناية بالبشرة، والمنتجات التجميلية',
    descriptionEn: 'Haircutting, grooming, skincare, and cosmetics'
  },
  { 
    id: 'pharmacy', 
    nameAr: 'صيدلية وتجهيزات طبية', 
    nameEn: 'Pharmacy & Medical Supplies', 
    icon: '💊',
    descriptionAr: 'بيع الأدوية، المكملات، والمستلزمات الصحية',
    descriptionEn: 'Medicines, supplements, and healthcare products'
  },
  { 
    id: 'clothing', 
    nameAr: 'محل ألبسة وأزياء وأحذية', 
    nameEn: 'Fashion & Clothing Store', 
    icon: '👔',
    descriptionAr: 'ملابس رجالية، نسائية، أطفال، وأحذية',
    descriptionEn: 'Men, women, kids apparel, and footwear'
  },
  { 
    id: 'electronics', 
    nameAr: 'محل إلكترونيات وهواتف وصيانة', 
    nameEn: 'Electronics & Mobile Shop', 
    icon: '📱',
    descriptionAr: 'هواتف، أجهزة كمبيوتر، كماليات، وخدمات التصليح',
    descriptionEn: 'Mobiles, computers, accessories, and repair'
  },
  { 
    id: 'restaurant', 
    nameAr: 'مطعم / مقهى / مخبزة وتطعام', 
    nameEn: 'Restaurant / Cafe / Bakery', 
    icon: '☕',
    descriptionAr: 'وجبات سريعة، مأكولات، مشروبات، وحلويات',
    descriptionEn: 'Fast food, meals, drinks, and pastries'
  },
  { 
    id: 'auto_parts', 
    nameAr: 'قطع غيار ولوازم السيارات', 
    nameEn: 'Auto Parts & Supplies', 
    icon: '🚘',
    descriptionAr: 'قطع غيار، زيوت، وإكسسوارات المركبات',
    descriptionEn: 'Vehicle spare parts, oils, and car accessories'
  },
  { 
    id: 'hardware', 
    nameAr: 'خردوات وعتاد بناء (Quincaillerie)', 
    nameEn: 'Hardware & Construction Tools', 
    icon: '🛠️',
    descriptionAr: 'أدوات كهربائية، سباكة، طلاء، ومواد البناء',
    descriptionEn: 'Tools, plumbing, paint, and hardware'
  },
  { 
    id: 'other', 
    nameAr: 'نشاط تجاري أو خدمي آخر', 
    nameEn: 'Other Retail or Service', 
    icon: '🏪',
    descriptionAr: 'أي نشاط تجاري أو تجارة تجزئة متخصصة أخرى',
    descriptionEn: 'Any other specialized retail or service business'
  }
];

export type Language = 'ar' | 'en';
export type AppTab = 'dashboard' | 'inventory' | 'sales' | 'wholesale' | 'debts' | 'analytics' | 'subscribers';
