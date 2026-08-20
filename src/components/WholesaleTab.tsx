import React, { useState, useMemo } from 'react';
import { Language, Product, SaleItem, CustomerDebt, Transaction, WholesaleClient } from '../types';
import { CATEGORIES } from '../data';
import {
  Boxes,
  ShoppingCart,
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Truck,
  Building2,
  UserPlus,
  Printer,
  Calculator,
  Percent,
  Layers,
  FileText,
  DollarSign,
  TrendingUp,
  CreditCard,
  Phone,
  MapPin,
  Barcode,
  PackageCheck,
  ChevronRight,
  Sparkles,
  Camera,
  X,
  Edit2,
  Save,
  Clock,
  ShieldCheck
} from 'lucide-react';
import BarcodeScannerModal from './BarcodeScannerModal';
import WholesaleInvoiceModal from './WholesaleInvoiceModal';
import { playBeepSound, playCashRegisterSound, playErrorSound, playNotificationSound, playSuccessSound, playClickSound } from '../utils/audio';

interface WholesaleTabProps {
  lang: Language;
  shopName: string;
  shopPhone?: string;
  shopAddress?: string;
  shopLogo?: string;
  products: Product[];
  debts: CustomerDebt[];
  transactions: Transaction[];
  onCompleteSale: (transaction: Transaction, updatedProducts: Product[], updatedDebts?: CustomerDebt[]) => void;
  onUpdateProduct: (product: Product) => void;
  onAddCustomer: (newCustomer: CustomerDebt) => void;
}

export default function WholesaleTab({
  lang,
  shopName,
  shopPhone,
  shopAddress,
  shopLogo,
  products,
  debts,
  transactions,
  onCompleteSale,
  onUpdateProduct,
  onAddCustomer
}: WholesaleTabProps) {
  // Sub-tabs inside Wholesale
  const [subTab, setSubTab] = useState<'pos' | 'pricing' | 'history' | 'clients' | 'calculator'>('pos');

  // Search & Filters in POS
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Wholesale Cart
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [pricingTier, setPricingTier] = useState<'wholesale' | 'semi_wholesale' | 'super_wholesale' | 'custom'>('wholesale');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [driverName, setDriverName] = useState<string>('');
  const [vehiclePlate, setVehiclePlate] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'debt' | 'cheque' | 'transfer'>('cash');
  const [chequeNumber, setChequeNumber] = useState('');
  const [chequeBank, setChequeBank] = useState('');
  const [chequeDueDate, setChequeDueDate] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  // Modals & Scanner
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [scanToast, setScanToast] = useState<{ message: string; isError?: boolean } | null>(null);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [completedTxForInvoice, setCompletedTxForInvoice] = useState<Transaction | null>(null);

  // Wholesale Clients storage
  const [wholesaleClients, setWholesaleClients] = useState<WholesaleClient[]>(() => {
    const saved = localStorage.getItem('fenk_mahli_wholesale_clients');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'client-1',
        storeName: 'سوبرماركت الأمل والحياة',
        contactPerson: 'الحاج بلقاسم',
        phone: '0551 22 33 44',
        wilaya: 'الجزائر العاصمة - باب الزوار',
        taxId: 'RC: 16/00-1234567 • NIF: 000123456789012',
        priceTier: 'wholesale',
        totalPurchases: 450000,
        outstandingBalance: 35000,
        ordersCount: 8,
        lastOrderDate: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: 'client-2',
        storeName: 'تغذية عامة البركة',
        contactPerson: 'الأخ عبد القادر',
        phone: '0662 88 99 00',
        wilaya: 'البليدة - أولاد يعيش',
        taxId: 'RC: 09/00-9876543 • NIF: 000987654321098',
        priceTier: 'semi_wholesale',
        totalPurchases: 280000,
        outstandingBalance: 0,
        ordersCount: 4,
        lastOrderDate: new Date(Date.now() - 86400000 * 5).toISOString()
      }
    ];
  });

  // Client form state
  const [newClientStore, setNewClientStore] = useState('');
  const [newClientContact, setNewClientContact] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientWilaya, setNewClientWilaya] = useState('');
  const [newClientTaxId, setNewClientTaxId] = useState('');

  // Pricing manager bulk edit state
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editWholesalePrice, setEditWholesalePrice] = useState<number>(0);
  const [editSemiPrice, setEditSemiPrice] = useState<number>(0);
  const [editCartonQty, setEditCartonQty] = useState<number>(12);
  const [bulkDiscountPercent, setBulkDiscountPercent] = useState<number>(15);

  // Margin Calculator state
  const [calcBuyingPrice, setCalcBuyingPrice] = useState<number>(500);
  const [calcCartonQty, setCalcCartonQty] = useState<number>(24);
  const [calcMarginPercent, setCalcMarginPercent] = useState<number>(20);
  const [calcPalletCartons, setCalcPalletCartons] = useState<number>(40);

  const saveWholesaleClients = (clients: WholesaleClient[]) => {
    setWholesaleClients(clients);
    localStorage.setItem('fenk_mahli_wholesale_clients', JSON.stringify(clients));
  };

  const triggerToast = (message: string, isError = false) => {
    if (isError) playErrorSound();
    else playNotificationSound();
    setScanToast({ message, isError });
    setTimeout(() => setScanToast(null), 3000);
  };

  // Filtered Products for Wholesale POS
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'all' || p.categoryAr === selectedCategory || p.categoryEn === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.nameAr.toLowerCase().includes(q) ||
        p.nameEn.toLowerCase().includes(q) ||
        p.barcode.includes(q);
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Wholesale Transactions History
  const wholesaleTransactions = useMemo(() => {
    return transactions.filter(t => t.saleType === 'wholesale' || (t.items && t.items.some(i => i.isWholesale)));
  }, [transactions]);

  // Summary Metrics
  const wholesaleTotalRevenue = wholesaleTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
  const wholesaleTotalProfit = wholesaleTransactions.reduce((sum, t) => sum + (t.profit || 0), 0);
  const wholesaleOrdersCount = wholesaleTransactions.length;

  // Effective wholesale price resolution helper
  const getProductWholesalePrice = (p: Product, tier: 'wholesale' | 'semi_wholesale' | 'super_wholesale' | 'custom'): number => {
    if (tier === 'semi_wholesale' && p.semiWholesalePrice && p.semiWholesalePrice > 0) {
      return p.semiWholesalePrice;
    }
    if (p.wholesalePrice && p.wholesalePrice > 0) {
      return p.wholesalePrice;
    }
    // Default wholesale discount if not explicitly set: 12% below retail
    return Math.max(p.buyingPrice, Number((p.sellingPrice * 0.88).toFixed(2)));
  };

  const getUnitsPerCarton = (p: Product): number => {
    return p.cartonQuantity && p.cartonQuantity > 0 ? p.cartonQuantity : 12;
  };

  // Add Carton or Units to Cart
  const addCartonToCart = (product: Product, cartonMultiplier = 1) => {
    playClickSound();
    const unitsPerBox = getUnitsPerCarton(product);
    const addedUnits = unitsPerBox * cartonMultiplier;

    if (product.quantity < addedUnits) {
      triggerToast(
        lang === 'ar'
          ? `الكمية المتاحة في المخزن (${product.quantity} قطعة) أقل من المطلوب (${addedUnits} قطعة)!`
          : `Insufficient stock (${product.quantity} pcs available)!`,
        true
      );
      return;
    }

    const unitPrice = getProductWholesalePrice(product, pricingTier);

    const existingIndex = cart.findIndex(item => item.productId === product.id);
    if (existingIndex > -1) {
      const updated = [...cart];
      const prevQty = updated[existingIndex].quantity;
      const newTotalQty = prevQty + addedUnits;

      if (product.quantity < newTotalQty) {
        triggerToast(lang === 'ar' ? 'الكمية المطلوبة تتجاوز المخزون المتوفر!' : 'Requested qty exceeds available stock!', true);
        return;
      }

      const prevCartons = updated[existingIndex].cartonCount || 0;
      updated[existingIndex].quantity = newTotalQty;
      updated[existingIndex].cartonCount = prevCartons + cartonMultiplier;
      setCart(updated);
    } else {
      const newItem: SaleItem = {
        productId: product.id,
        productNameAr: product.nameAr,
        productNameEn: product.nameEn,
        sellingPrice: unitPrice,
        buyingPrice: product.buyingPrice,
        quantity: addedUnits,
        isWholesale: true,
        packageType: 'carton',
        cartonCount: cartonMultiplier,
        unitsPerCarton: unitsPerBox,
        priceTier: pricingTier
      };
      setCart([newItem, ...cart]);
    }

    triggerToast(
      lang === 'ar'
        ? `تمت إضافة ${cartonMultiplier} كرتونة (${addedUnits} قطعة) من "${product.nameAr}"`
        : `Added ${cartonMultiplier} box(es) of "${product.nameEn}"`
    );
  };

  const addBulkUnitsToCart = (product: Product, count = 1) => {
    playClickSound();
    if (product.quantity < count) {
      triggerToast(lang === 'ar' ? 'الكمية غير كافية في المخزن!' : 'Insufficient stock!', true);
      return;
    }

    const unitPrice = getProductWholesalePrice(product, pricingTier);
    const existingIndex = cart.findIndex(item => item.productId === product.id);

    if (existingIndex > -1) {
      const updated = [...cart];
      const newQty = updated[existingIndex].quantity + count;
      if (product.quantity < newQty) {
        triggerToast(lang === 'ar' ? 'تجاوزت المخزون المتاح!' : 'Exceeds stock!', true);
        return;
      }
      updated[existingIndex].quantity = newQty;
      setCart(updated);
    } else {
      const newItem: SaleItem = {
        productId: product.id,
        productNameAr: product.nameAr,
        productNameEn: product.nameEn,
        sellingPrice: unitPrice,
        buyingPrice: product.buyingPrice,
        quantity: count,
        isWholesale: true,
        packageType: 'unit',
        priceTier: pricingTier
      };
      setCart([newItem, ...cart]);
    }
  };

  const updateCartItemQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (product.quantity < newQuantity) {
      triggerToast(lang === 'ar' ? `المتاح فقط: ${product.quantity} قطعة` : `Available: ${product.quantity} pcs`, true);
      return;
    }

    const unitsPerBox = getUnitsPerCarton(product);
    const updated = cart.map((item) => {
      if (item.productId === productId) {
        return {
          ...item,
          quantity: newQuantity,
          cartonCount: item.packageType === 'carton' ? Math.ceil(newQuantity / unitsPerBox) : item.cartonCount
        };
      }
      return item;
    });
    setCart(updated);
  };

  const updateCartItemPrice = (productId: string, newPrice: number) => {
    const updated = cart.map(item => item.productId === productId ? { ...item, sellingPrice: newPrice } : item);
    setCart(updated);
  };

  const removeFromCart = (productId: string) => {
    playClickSound();
    setCart(cart.filter(item => item.productId !== productId));
  };

  const clearCart = () => {
    playClickSound();
    setCart([]);
  };

  // Cart Calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
  const cartTotalCartons = cart.reduce((sum, item) => sum + (item.cartonCount || 0), 0);
  const cartTotalPieces = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartFinalAmount = Math.max(0, cartSubtotal - (discountAmount || 0) + (shippingFee || 0));
  const cartTotalProfit = cart.reduce((sum, item) => sum + ((item.sellingPrice - item.buyingPrice) * item.quantity), 0) - (discountAmount || 0);

  // Complete Wholesale Checkout
  const handleWholesaleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      triggerToast(lang === 'ar' ? 'السلة فارغة! يرجى اختيار السلع والطرود أولاً.' : 'Cart is empty!', true);
      return;
    }

    playCashRegisterSound();

    const clientObj = wholesaleClients.find(c => c.id === selectedClient);
    const clientName = clientObj ? clientObj.storeName : (lang === 'ar' ? 'زبون جملة نقدي' : 'Cash Wholesale Merchant');

    // Deduct quantities from products
    const updatedProducts = products.map((p) => {
      const inCart = cart.find(c => c.productId === p.id);
      if (inCart) {
        return {
          ...p,
          quantity: Math.max(0, p.quantity - inCart.quantity)
        };
      }
      return p;
    });

    // Handle debt if payment method is 'debt'
    let updatedDebts = [...debts];
    if (paymentMethod === 'debt' && clientObj) {
      const existingDebt = debts.find(d => d.name === clientObj.storeName || d.phone === clientObj.phone);
      if (existingDebt) {
        updatedDebts = debts.map((d) => {
          if (d.id === existingDebt.id) {
            return {
              ...d,
              totalDebt: d.totalDebt + cartFinalAmount,
              lastTransactionDate: new Date().toISOString(),
              history: [
                {
                  date: new Date().toISOString(),
                  amount: cartFinalAmount,
                  type: 'add' as const,
                  note: `طلبية جملة #${new Date().getTime().toString().slice(-4)} (${cartTotalCartons} كرتونة)`
                },
                ...d.history
              ]
            };
          }
          return d;
        });
      } else {
        const newDebtor: CustomerDebt = {
          id: `debt-${Date.now()}`,
          name: clientObj.storeName,
          phone: clientObj.phone,
          totalDebt: cartFinalAmount,
          lastTransactionDate: new Date().toISOString(),
          history: [
            {
              date: new Date().toISOString(),
              amount: cartFinalAmount,
              type: 'add' as const,
              note: `طلبية جملة (${cartTotalCartons} كرتونة / ${cartTotalPieces} قطعة)`
            }
          ]
        };
        updatedDebts.unshift(newDebtor);
        onAddCustomer(newDebtor);
      }

      // Update client stats in wholesale clients
      const updatedClients = wholesaleClients.map((c) => {
        if (c.id === clientObj.id) {
          return {
            ...c,
            outstandingBalance: (c.outstandingBalance || 0) + cartFinalAmount,
            totalPurchases: (c.totalPurchases || 0) + cartFinalAmount,
            ordersCount: (c.ordersCount || 0) + 1,
            lastOrderDate: new Date().toISOString()
          };
        }
        return c;
      });
      saveWholesaleClients(updatedClients);
    } else if (clientObj) {
      // Just record purchases
      const updatedClients = wholesaleClients.map((c) => {
        if (c.id === clientObj.id) {
          return {
            ...c,
            totalPurchases: (c.totalPurchases || 0) + cartFinalAmount,
            ordersCount: (c.ordersCount || 0) + 1,
            lastOrderDate: new Date().toISOString()
          };
        }
        return c;
      });
      saveWholesaleClients(updatedClients);
    }

    const newTx: Transaction = {
      id: `WS-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      items: [...cart],
      totalAmount: cartFinalAmount,
      profit: cartTotalProfit,
      paymentMethod,
      saleType: 'wholesale',
      invoiceType: 'bon_livraison',
      customerId: clientObj?.id,
      customerName: clientName,
      clientCommercialName: clientObj?.storeName || clientName,
      clientPhone: clientObj?.phone,
      clientWilaya: clientObj?.wilaya,
      clientTaxNumber: clientObj?.taxId,
      discountAmount: discountAmount || 0,
      shippingFee: shippingFee || 0,
      driverName: driverName || undefined,
      vehiclePlate: vehiclePlate || undefined,
      chequeNumber: paymentMethod === 'cheque' ? chequeNumber : undefined,
      chequeBank: paymentMethod === 'cheque' ? chequeBank : undefined,
      chequeDueDate: paymentMethod === 'cheque' ? chequeDueDate : undefined,
      notes: orderNotes || undefined,
      deliveryStatus: 'delivered'
    };

    onCompleteSale(newTx, updatedProducts, updatedDebts);

    // Reset Form
    setCart([]);
    setDiscountAmount(0);
    setShippingFee(0);
    setDriverName('');
    setVehiclePlate('');
    setChequeNumber('');
    setChequeBank('');
    setOrderNotes('');

    // Open Wholesale Invoice Modal
    setCompletedTxForInvoice(newTx);
    playSuccessSound();
  };

  // Add new client submit
  const handleAddNewClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientStore.trim() || !newClientPhone.trim()) return;

    const newC: WholesaleClient = {
      id: `client-${Date.now()}`,
      storeName: newClientStore.trim(),
      contactPerson: newClientContact.trim() || newClientStore.trim(),
      phone: newClientPhone.trim(),
      wilaya: newClientWilaya.trim() || 'الجزائر العاصمة',
      taxId: newClientTaxId.trim() || undefined,
      priceTier: 'wholesale',
      totalPurchases: 0,
      outstandingBalance: 0,
      ordersCount: 0,
      lastOrderDate: new Date().toISOString()
    };

    const updated = [newC, ...wholesaleClients];
    saveWholesaleClients(updated);
    setSelectedClient(newC.id);
    setShowAddClientModal(false);
    setNewClientStore('');
    setNewClientContact('');
    setNewClientPhone('');
    setNewClientWilaya('');
    setNewClientTaxId('');
    playSuccessSound();
  };

  // Quick edit product wholesale price
  const handleSaveProductWholesale = (product: Product) => {
    const updated: Product = {
      ...product,
      wholesalePrice: editWholesalePrice > 0 ? editWholesalePrice : undefined,
      semiWholesalePrice: editSemiPrice > 0 ? editSemiPrice : undefined,
      cartonQuantity: editCartonQty > 0 ? editCartonQty : undefined,
      cartonPrice: (editWholesalePrice > 0 ? editWholesalePrice : product.sellingPrice * 0.88) * editCartonQty
    };
    onUpdateProduct(updated);
    setEditingProductId(null);
    playSuccessSound();
  };

  // Apply category-wide discount to wholesale prices
  const handleApplyCategoryWholesaleDiscount = () => {
    playClickSound();
    const discountFactor = (100 - bulkDiscountPercent) / 100;
    products.forEach((p) => {
      if (selectedCategory === 'all' || p.categoryAr === selectedCategory || p.categoryEn === selectedCategory) {
        const calcWholesale = Number((p.sellingPrice * discountFactor).toFixed(2));
        const cartonUnits = p.cartonQuantity || 12;
        const updated: Product = {
          ...p,
          wholesalePrice: calcWholesale,
          cartonQuantity: cartonUnits,
          cartonPrice: Number((calcWholesale * cartonUnits).toFixed(2))
        };
        onUpdateProduct(updated);
      }
    });
    triggerToast(lang === 'ar' ? `تم تحديث أسعار الجملة بخصم ${bulkDiscountPercent}% بنجاح!` : `Updated wholesale prices!`);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      
      {/* Toast Notification */}
      {scanToast && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl shadow-xl border flex items-center gap-2 text-xs font-bold font-display ${
          scanToast.isError ? 'bg-red-900/90 text-white border-red-500/50' : 'bg-indigo-900/90 text-white border-indigo-400/50'
        }`}>
          {scanToast.isError ? <AlertCircle size={16} className="text-red-400" /> : <CheckCircle2 size={16} className="text-indigo-300" />}
          <span>{scanToast.message}</span>
        </div>
      )}

      {/* 1. Wholesale Header Banner & Key Metrics */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-300 flex items-center justify-center shadow-inner">
              <Boxes size={30} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black font-display text-white">
                  {lang === 'ar' ? 'منظومة البيع بالجملة وتوزيع الطرود' : 'Wholesale & Bulk Distribution Hub'}
                </h2>
                <span className="bg-indigo-500/20 text-indigo-300 text-[10px] px-2.5 py-0.5 rounded-full font-bold border border-indigo-400/30">
                  Gros & Demi-Gros
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                {lang === 'ar'
                  ? 'إدارة طلبيات الكراتين، تسعير الطرود، سندات التسليم (Bon de Livraison)، وحسابات التجار والموزعين'
                  : 'Manage bulk orders, carton pricing, delivery slips, and wholesale merchant accounts'}
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <div className="bg-white/5 backdrop-blur-xs border border-white/10 rounded-2xl p-2.5 text-center">
              <span className="text-[10px] text-indigo-200 font-medium block">
                {lang === 'ar' ? 'مبيعات الجملة' : 'Wholesale Revenue'}
              </span>
              <span className="text-sm sm:text-base font-black font-display text-emerald-400">
                {wholesaleTotalRevenue.toFixed(2)} <span className="text-[9px] font-sans font-normal text-white/70">د.ج</span>
              </span>
            </div>

            <div className="bg-white/5 backdrop-blur-xs border border-white/10 rounded-2xl p-2.5 text-center">
              <span className="text-[10px] text-indigo-200 font-medium block">
                {lang === 'ar' ? 'سندات وطلبيات' : 'Orders / Slips'}
              </span>
              <span className="text-sm sm:text-base font-black font-display text-white">
                {wholesaleOrdersCount}
              </span>
            </div>

            <div className="bg-white/5 backdrop-blur-xs border border-white/10 rounded-2xl p-2.5 text-center">
              <span className="text-[10px] text-indigo-200 font-medium block">
                {lang === 'ar' ? 'الأرباح الصافية' : 'Wholesale Profit'}
              </span>
              <span className="text-sm sm:text-base font-black font-display text-indigo-300">
                {wholesaleTotalProfit.toFixed(2)} <span className="text-[9px] font-sans font-normal text-white/70">د.ج</span>
              </span>
            </div>

            <div className="bg-white/5 backdrop-blur-xs border border-white/10 rounded-2xl p-2.5 text-center">
              <span className="text-[10px] text-indigo-200 font-medium block">
                {lang === 'ar' ? 'تجار مسجلين' : 'Active Merchants'}
              </span>
              <span className="text-sm sm:text-base font-black font-display text-amber-300">
                {wholesaleClients.length}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Sub-Tabs Bar */}
        <div className="mt-5 pt-3 border-t border-indigo-900/60 flex gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => { playClickSound(); setSubTab('pos'); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-display transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              subTab === 'pos'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white/5 text-indigo-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <ShoppingCart size={14} />
            <span>{lang === 'ar' ? 'كاشير وطلبيات الجملة' : 'Wholesale POS'}</span>
          </button>

          <button
            onClick={() => { playClickSound(); setSubTab('pricing'); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-display transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              subTab === 'pricing'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white/5 text-indigo-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Layers size={14} />
            <span>{lang === 'ar' ? 'أسعار الجملة والطرود' : 'Wholesale Pricing'}</span>
          </button>

          <button
            onClick={() => { playClickSound(); setSubTab('history'); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-display transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              subTab === 'history'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white/5 text-indigo-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <FileText size={14} />
            <span>{lang === 'ar' ? 'سجل فواتير وسندات الجملة' : 'Delivery Slips History'}</span>
          </button>

          <button
            onClick={() => { playClickSound(); setSubTab('clients'); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-display transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              subTab === 'clients'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white/5 text-indigo-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Building2 size={14} />
            <span>{lang === 'ar' ? 'دليل تجار وعملاء الجملة' : 'Merchants Directory'}</span>
          </button>

          <button
            onClick={() => { playClickSound(); setSubTab('calculator'); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-display transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              subTab === 'calculator'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white/5 text-indigo-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Calculator size={14} />
            <span>{lang === 'ar' ? 'حاسبة هوامش الجملة الذكية' : 'Margin Calculator'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: WHOLESALE POS REGISTER & ORDER DISPATCH */}
      {/* ========================================================================= */}
      {subTab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Left Column: Product Selection Grid (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Search & Camera Toolbar */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-2.5">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={lang === 'ar' ? 'ابحث عن منتج أو باركود لإضافته كرتونة أو بالجملة...' : 'Search product or barcode...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-3 pr-9 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowCameraScanner(true)}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold font-display flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Camera size={15} className="text-indigo-400" />
                <span>{lang === 'ar' ? 'مسح بالكاميرا' : 'Camera Scan'}</span>
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold font-display whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-indigo-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                {lang === 'ar' ? 'جميع الأصناف' : 'All Categories'}
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.ar)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold font-display whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat.ar
                      ? 'bg-indigo-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  {lang === 'ar' ? cat.ar : cat.en}
                </button>
              ))}
            </div>

            {/* Product Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[580px] overflow-y-auto pr-1">
              {filteredProducts.map((product) => {
                const unitsPerBox = getUnitsPerCarton(product);
                const wholesalePrice = getProductWholesalePrice(product, pricingTier);
                const cartonPrice = wholesalePrice * unitsPerBox;
                const availableCartons = Math.floor(product.quantity / unitsPerBox);
                const isOutOfStock = product.quantity <= 0;

                return (
                  <div
                    key={product.id}
                    className={`bg-white rounded-2xl p-3.5 border transition-all flex flex-col justify-between ${
                      isOutOfStock
                        ? 'border-slate-200 opacity-60 bg-slate-50'
                        : 'border-slate-200/80 hover:border-indigo-300 shadow-xs hover:shadow-md'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-extrabold text-xs sm:text-sm text-slate-950 font-display line-clamp-1">
                            {lang === 'ar' ? product.nameAr : product.nameEn}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                            <Barcode size={11} />
                            <span>{product.barcode}</span>
                          </span>
                        </div>

                        {/* Stock Badge */}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ${
                          product.quantity <= (product.minQuantity || 5)
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-[#006c49]'
                        }`}>
                          {product.quantity} {lang === 'ar' ? 'قطعة' : 'pcs'}
                          {availableCartons > 0 && ` (~${availableCartons} كرتونة)`}
                        </span>
                      </div>

                      {/* Wholesale Price Box */}
                      <div className="mt-3 p-2 rounded-xl bg-indigo-50/70 border border-indigo-100 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 font-medium text-[11px]">{lang === 'ar' ? 'سعر الجملة للقطعة:' : 'Unit WS Price:'}</span>
                          <span className="font-bold text-indigo-950 font-mono">
                            {wholesalePrice.toFixed(2)} <span className="text-[10px] font-sans font-normal text-slate-500">د.ج</span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs border-t border-indigo-100/80 pt-1">
                          <span className="text-slate-600 font-medium text-[11px] flex items-center gap-1">
                            <Boxes size={12} className="text-indigo-600" />
                            <span>{lang === 'ar' ? `سعر الكرتونة (${unitsPerBox} قطعة):` : `Box (${unitsPerBox} pcs):`}</span>
                          </span>
                          <span className="font-extrabold text-indigo-700 font-mono">
                            {cartonPrice.toFixed(2)} <span className="text-[10px] font-sans font-normal text-slate-500">د.ج</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Add Buttons */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={isOutOfStock || product.quantity < unitsPerBox}
                        onClick={() => addCartonToCart(product, 1)}
                        className="py-2 bg-indigo-900 hover:bg-indigo-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold font-display flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer"
                        title={lang === 'ar' ? `إضافة 1 كرتونة (${unitsPerBox} قطعة)` : `Add 1 Box (${unitsPerBox} pcs)`}
                      >
                        <Boxes size={13} />
                        <span>{lang === 'ar' ? '+ كرتونة كاملة' : '+ 1 Box'}</span>
                      </button>

                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => addBulkUnitsToCart(product, 1)}
                        className="py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-800 rounded-xl text-xs font-bold font-display flex items-center justify-center gap-1 transition-all cursor-pointer"
                        title={lang === 'ar' ? 'إضافة قطع منفردة بسعر الجملة' : 'Add Wholesale Units'}
                      >
                        <Plus size={13} />
                        <span>{lang === 'ar' ? '+ بالحبة (جملة)' : '+ Unit'}</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>

          {/* Right Column: Wholesale Order Cart & Client Setup (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-md flex flex-col justify-between space-y-4">
            
            <div>
              {/* Cart Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                    <Boxes size={16} />
                  </div>
                  <div>
                    <h3 className="font-black font-display text-sm text-slate-950">
                      {lang === 'ar' ? 'سلة طلبية الجملة وسند التسليم' : 'Wholesale Order Dispatch'}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {cartTotalCartons} {lang === 'ar' ? 'كرتونة' : 'boxes'} • {cartTotalPieces} {lang === 'ar' ? 'قطعة' : 'pcs'}
                    </p>
                  </div>
                </div>

                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center gap-1 p-1 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>{lang === 'ar' ? 'إفراغ السلة' : 'Clear'}</span>
                  </button>
                )}
              </div>

              {/* Wholesale Client Selector */}
              <div className="mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-slate-700 flex items-center gap-1">
                    <Building2 size={13} className="text-indigo-600" />
                    <span>{lang === 'ar' ? 'تاجر / عميل الجملة المستلم:' : 'Wholesale Client / Store:'}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddClientModal(true)}
                    className="text-[11px] font-bold text-indigo-700 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <UserPlus size={12} />
                    <span>{lang === 'ar' ? '+ تاجر جديد' : '+ New Client'}</span>
                  </button>
                </div>

                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600 font-semibold"
                >
                  <option value="">{lang === 'ar' ? '— زبون جملة نقدي عام (دون تسجيل) —' : '— General Wholesale Cash Buyer —'}</option>
                  {wholesaleClients.map((client) => (
                    <option key={client.id} value={client.id}>
                      🏢 {client.storeName} ({client.wilaya}) - {client.phone}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pricing Tier Selector */}
              <div className="mt-3 flex items-center gap-1.5 text-xs">
                <span className="text-[11px] font-bold text-slate-500">{lang === 'ar' ? 'فئة السعر:' : 'Tier:'}</span>
                <div className="flex-1 grid grid-cols-3 gap-1">
                  <button
                    type="button"
                    onClick={() => setPricingTier('wholesale')}
                    className={`py-1 text-[11px] rounded-lg font-bold transition-all cursor-pointer ${
                      pricingTier === 'wholesale' ? 'bg-indigo-900 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {lang === 'ar' ? 'سعر الجملة' : 'Wholesale'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPricingTier('semi_wholesale')}
                    className={`py-1 text-[11px] rounded-lg font-bold transition-all cursor-pointer ${
                      pricingTier === 'semi_wholesale' ? 'bg-indigo-900 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {lang === 'ar' ? 'نصف جملة' : 'Semi-WS'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPricingTier('super_wholesale')}
                    className={`py-1 text-[11px] rounded-lg font-bold transition-all cursor-pointer ${
                      pricingTier === 'super_wholesale' ? 'bg-indigo-900 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {lang === 'ar' ? 'جملة كبرى' : 'Super-WS'}
                  </button>
                </div>
              </div>

              {/* Cart Items List */}
              <div className="mt-3 space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl text-xs space-y-1">
                    <Boxes size={28} className="mx-auto text-slate-300 mb-1" />
                    <p className="font-bold">{lang === 'ar' ? 'السلة فارغة' : 'Cart is empty'}</p>
                    <p className="text-[11px]">{lang === 'ar' ? 'اختر المنتجات والكراتين من القائمة لإضافتها لطلبية الجملة' : 'Select products to add'}</p>
                  </div>
                ) : (
                  cart.map((item) => {
                    const itemTotal = item.sellingPrice * item.quantity;
                    return (
                      <div
                        key={item.productId}
                        className="p-2.5 rounded-xl border border-slate-200/90 bg-slate-50/80 flex items-center justify-between gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-xs text-slate-900 truncate">
                            {lang === 'ar' ? item.productNameAr : item.productNameEn}
                          </h5>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex flex-wrap items-center gap-1.5">
                            {item.cartonCount ? (
                              <span className="bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded font-bold">
                                {item.cartonCount} كرتونة ({item.quantity} قطعة)
                              </span>
                            ) : (
                              <span>{item.quantity} قطعة</span>
                            )}
                            <span>• بسعر: {item.sellingPrice.toFixed(2)} د.ج</span>
                          </div>
                        </div>

                        {/* Quantity Counter & Delete */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden text-xs">
                            <button
                              type="button"
                              onClick={() => updateCartItemQuantity(item.productId, item.quantity - (item.unitsPerCarton || 1))}
                              className="px-2 py-0.5 hover:bg-slate-100 text-slate-700 font-bold cursor-pointer"
                            >
                              -
                            </button>
                            <span className="px-2 font-mono font-bold text-slate-900">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateCartItemQuantity(item.productId, item.quantity + (item.unitsPerCarton || 1))}
                              className="px-2 py-0.5 hover:bg-slate-100 text-slate-700 font-bold cursor-pointer"
                            >
                              +
                            </button>
                          </div>

                          <span className="font-extrabold text-xs text-slate-950 font-mono min-w-[60px] text-left">
                            {itemTotal.toFixed(2)}
                          </span>

                          <button
                            type="button"
                            onClick={() => removeFromCart(item.productId)}
                            className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>

            {/* Checkout Options & Totals */}
            <div className="border-t border-slate-200 pt-3 space-y-3">
              
              {/* Discount & Shipping inputs */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">{lang === 'ar' ? 'خصم تجاري (د.ج):' : 'Discount (DZD):'}</label>
                  <input
                    type="number"
                    min="0"
                    value={discountAmount || ''}
                    onChange={(e) => setDiscountAmount(Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full px-2.5 py-1 rounded-xl border border-slate-200 text-xs bg-slate-50 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">{lang === 'ar' ? 'تكلفة الشحن والتوصيل:' : 'Delivery Fee:'}</label>
                  <input
                    type="number"
                    min="0"
                    value={shippingFee || ''}
                    onChange={(e) => setShippingFee(Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full px-2.5 py-1 rounded-xl border border-slate-200 text-xs bg-slate-50 font-mono"
                  />
                </div>
              </div>

              {/* Delivery Driver Info */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <input
                    type="text"
                    placeholder={lang === 'ar' ? 'اسم سائق التوزيع (اختياري)' : 'Driver name'}
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full px-2.5 py-1 rounded-xl border border-slate-200 text-xs bg-slate-50"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder={lang === 'ar' ? 'رقم اللوحة / المركبة' : 'Vehicle Plate'}
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    className="w-full px-2.5 py-1 rounded-xl border border-slate-200 text-xs bg-slate-50 font-mono"
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">{lang === 'ar' ? 'طريقة السداد والتسوية:' : 'Payment Settlement:'}</label>
                <div className="grid grid-cols-4 gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`py-1.5 rounded-xl font-bold transition-all text-center cursor-pointer ${
                      paymentMethod === 'cash' ? 'bg-[#006c49] text-white shadow-xs' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {lang === 'ar' ? 'نقدي (كاش)' : 'Cash'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('debt')}
                    className={`py-1.5 rounded-xl font-bold transition-all text-center cursor-pointer ${
                      paymentMethod === 'debt' ? 'bg-amber-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {lang === 'ar' ? 'آجل (دين)' : 'Credit'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cheque')}
                    className={`py-1.5 rounded-xl font-bold transition-all text-center cursor-pointer ${
                      paymentMethod === 'cheque' ? 'bg-indigo-900 text-white shadow-xs' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {lang === 'ar' ? 'شيك تجاري' : 'Cheque'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('transfer')}
                    className={`py-1.5 rounded-xl font-bold transition-all text-center cursor-pointer ${
                      paymentMethod === 'transfer' ? 'bg-sky-700 text-white shadow-xs' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {lang === 'ar' ? 'تحويل / CCP' : 'Transfer'}
                  </button>
                </div>
              </div>

              {/* Cheque Info Inputs if Cheque Selected */}
              {paymentMethod === 'cheque' && (
                <div className="p-2.5 bg-indigo-50/80 rounded-xl border border-indigo-100 grid grid-cols-3 gap-2 text-xs animate-fade-in">
                  <div>
                    <input
                      type="text"
                      placeholder={lang === 'ar' ? 'رقم الشيك' : 'Cheque No.'}
                      value={chequeNumber}
                      onChange={(e) => setChequeNumber(e.target.value)}
                      className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs bg-white font-mono"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder={lang === 'ar' ? 'اسم البنك (BNA, CPA...)' : 'Bank'}
                      value={chequeBank}
                      onChange={(e) => setChequeBank(e.target.value)}
                      className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <input
                      type="date"
                      value={chequeDueDate}
                      onChange={(e) => setChequeDueDate(e.target.value)}
                      className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs bg-white font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Order Net Total Summary */}
              <div className="p-3 bg-slate-900 text-white rounded-2xl space-y-1.5">
                <div className="flex justify-between text-xs text-slate-300 font-mono">
                  <span>{lang === 'ar' ? 'المجموع الصافي للسلع:' : 'Subtotal:'}</span>
                  <span>{cartSubtotal.toFixed(2)} د.ج</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-xs text-emerald-400 font-mono">
                    <span>{lang === 'ar' ? 'الخصم التجاري:' : 'Discount:'}</span>
                    <span>-{discountAmount.toFixed(2)} د.ج</span>
                  </div>
                )}
                {shippingFee > 0 && (
                  <div className="flex justify-between text-xs text-slate-300 font-mono">
                    <span>{lang === 'ar' ? 'مصاريف النقل:' : 'Transport:'}</span>
                    <span>+{shippingFee.toFixed(2)} د.ج</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-sm sm:text-base font-black">
                  <span className="text-white">{lang === 'ar' ? 'المبلغ الصافي المستحق:' : 'Total Net:'}</span>
                  <span className="text-emerald-400 font-mono text-lg">
                    {cartFinalAmount.toFixed(2)} <span className="text-xs font-sans font-semibold text-white">د.ج</span>
                  </span>
                </div>
              </div>

              {/* Final Submit Button */}
              <button
                type="button"
                disabled={cart.length === 0}
                onClick={handleWholesaleCheckout}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-700 to-indigo-900 hover:from-indigo-600 hover:to-indigo-800 disabled:opacity-40 text-white rounded-2xl font-black font-display text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <PackageCheck size={18} />
                <span>{lang === 'ar' ? 'إصدار سند التسليم وإتمام طلبية الجملة' : 'Dispatch Order & Print Slip'}</span>
              </button>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: WHOLESALE PRICING & PACKAGING MANAGER */}
      {/* ========================================================================= */}
      {subTab === 'pricing' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-md space-y-5">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-950 font-display flex items-center gap-2">
                <Layers className="text-indigo-600" size={20} />
                <span>{lang === 'ar' ? 'جدول تسعير الجملة والكراتين والطرود' : 'Wholesale Pricing & Packaging Matrix'}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === 'ar' ? 'تحديد أسعار بيع الجملة، سعة الكراتين، وسعر الصندوق لكل منتج بالمخزن' : 'Define unit wholesale, carton capacity, and box prices'}
              </p>
            </div>

            {/* Bulk Category Pricing Tool */}
            <div className="flex items-center gap-2 bg-indigo-50 p-2 rounded-2xl border border-indigo-100">
              <span className="text-xs font-bold text-indigo-950 whitespace-nowrap">{lang === 'ar' ? 'تطبيق خصم جملة تلقائي:' : 'Auto WS Discount:'}</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={bulkDiscountPercent}
                  onChange={(e) => setBulkDiscountPercent(Number(e.target.value))}
                  className="w-14 px-2 py-1 rounded-lg border border-indigo-200 text-xs text-center font-bold bg-white"
                />
                <span className="text-xs font-bold text-indigo-800">%</span>
              </div>
              <button
                type="button"
                onClick={handleApplyCategoryWholesaleDiscount}
                className="px-3 py-1 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
              >
                {lang === 'ar' ? 'تطبيق على الأصناف' : 'Apply'}
              </button>
            </div>
          </div>

          {/* Pricing Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                  <th className="p-3">{lang === 'ar' ? 'المنتج / الباركود' : 'Product / Barcode'}</th>
                  <th className="p-3 text-center">{lang === 'ar' ? 'سعر الشراء' : 'Buying Price'}</th>
                  <th className="p-3 text-center">{lang === 'ar' ? 'سعر التجزئة (العادي)' : 'Retail Price'}</th>
                  <th className="p-3 text-center text-indigo-900">{lang === 'ar' ? 'سعر الجملة للقطعة' : 'Wholesale Price'}</th>
                  <th className="p-3 text-center">{lang === 'ar' ? 'سعة الكرتونة' : 'Units/Carton'}</th>
                  <th className="p-3 text-center text-indigo-900">{lang === 'ar' ? 'سعر الكرتونة كاملة' : 'Carton Price'}</th>
                  <th className="p-3 text-center">{lang === 'ar' ? 'المخزون المتاح' : 'Stock'}</th>
                  <th className="p-3 text-center">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => {
                  const isEditing = editingProductId === product.id;
                  const currentWs = product.wholesalePrice || Number((product.sellingPrice * 0.88).toFixed(2));
                  const currentCartonQty = product.cartonQuantity || 12;
                  const currentCartonPrice = product.cartonPrice || (currentWs * currentCartonQty);

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/60">
                      <td className="p-3">
                        <span className="font-bold text-slate-950 block">{lang === 'ar' ? product.nameAr : product.nameEn}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{product.barcode}</span>
                      </td>

                      <td className="p-3 text-center font-mono text-slate-600">
                        {product.buyingPrice.toFixed(2)} د.ج
                      </td>

                      <td className="p-3 text-center font-mono font-semibold text-slate-800">
                        {product.sellingPrice.toFixed(2)} د.ج
                      </td>

                      {/* Wholesale Price Field */}
                      <td className="p-3 text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editWholesalePrice}
                            onChange={(e) => setEditWholesalePrice(Number(e.target.value))}
                            className="w-20 px-2 py-1 rounded-lg border border-indigo-300 text-xs font-mono font-bold text-center bg-white"
                          />
                        ) : (
                          <span className="font-extrabold text-indigo-900 font-mono bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                            {currentWs.toFixed(2)} د.ج
                          </span>
                        )}
                      </td>

                      {/* Carton Quantity */}
                      <td className="p-3 text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editCartonQty}
                            onChange={(e) => setEditCartonQty(Number(e.target.value))}
                            className="w-16 px-2 py-1 rounded-lg border border-indigo-300 text-xs font-mono font-bold text-center bg-white"
                          />
                        ) : (
                          <span className="font-mono text-slate-700 font-bold">{currentCartonQty} قطعة</span>
                        )}
                      </td>

                      {/* Carton Price */}
                      <td className="p-3 text-center font-mono font-extrabold text-indigo-700">
                        {isEditing ? (
                          <span>{(editWholesalePrice * editCartonQty).toFixed(2)} د.ج</span>
                        ) : (
                          <span>{currentCartonPrice.toFixed(2)} د.ج</span>
                        )}
                      </td>

                      {/* Available Stock */}
                      <td className="p-3 text-center font-mono">
                        <span className="font-bold text-slate-900">{product.quantity}</span>
                        <span className="text-[10px] text-slate-400 block">(~{Math.floor(product.quantity / currentCartonQty)} كرتونة)</span>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-center">
                        {isEditing ? (
                          <button
                            type="button"
                            onClick={() => handleSaveProductWholesale(product)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 mx-auto cursor-pointer"
                          >
                            <Save size={12} />
                            <span>{lang === 'ar' ? 'حفظ' : 'Save'}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProductId(product.id);
                              setEditWholesalePrice(currentWs);
                              setEditSemiPrice(product.semiWholesalePrice || currentWs);
                              setEditCartonQty(currentCartonQty);
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 mx-auto cursor-pointer"
                          >
                            <Edit2 size={12} />
                            <span>{lang === 'ar' ? 'تعديل' : 'Edit'}</span>
                          </button>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: WHOLESALE INVOICES & DELIVERY SLIPS HISTORY */}
      {/* ========================================================================= */}
      {subTab === 'history' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-950 font-display flex items-center gap-2">
                <FileText className="text-indigo-600" size={20} />
                <span>{lang === 'ar' ? 'سجل سندات التسليم وفواتير الجملة' : 'Delivery Slips & Wholesale Invoices Archive'}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === 'ar' ? 'أرشيف كامل لسندات خروج البضاعة والطرود مع إمكانية إعادة الطباعة فوراً' : 'Archive of dispatched wholesale orders and printable slips'}
              </p>
            </div>
          </div>

          {wholesaleTransactions.length === 0 ? (
            <div className="p-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-3xl space-y-2">
              <FileText size={36} className="mx-auto text-slate-300" />
              <p className="font-bold text-sm">{lang === 'ar' ? 'لا توجد سندات أو فواتير جملة مسجلة بعد' : 'No wholesale transactions yet'}</p>
              <p className="text-xs">{lang === 'ar' ? 'قم بإجراء أول عملية بيع بالجملة من قسم كاشير الجملة' : 'Create wholesale sales from POS tab'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                    <th className="p-3">{lang === 'ar' ? 'رقم السند' : 'Ref #'}</th>
                    <th className="p-3">{lang === 'ar' ? 'التاريخ والوقت' : 'Date'}</th>
                    <th className="p-3">{lang === 'ar' ? 'التاجر / المحل المستلم' : 'Merchant'}</th>
                    <th className="p-3 text-center">{lang === 'ar' ? 'الطرود والقطع' : 'Boxes & Units'}</th>
                    <th className="p-3 text-center">{lang === 'ar' ? 'طريقة السداد' : 'Payment'}</th>
                    <th className="p-3 text-left">{lang === 'ar' ? 'المبلغ الصافي المستحق' : 'Total Amount'}</th>
                    <th className="p-3 text-center">{lang === 'ar' ? 'معاينة وطباعة' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {wholesaleTransactions.map((tx) => {
                    const cartonsCount = tx.items.reduce((sum, i) => sum + (i.cartonCount || 0), 0);
                    const unitsCount = tx.items.reduce((sum, i) => sum + i.quantity, 0);

                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/60">
                        <td className="p-3 font-mono font-bold text-indigo-950">
                          #{tx.id.toUpperCase()}
                        </td>

                        <td className="p-3 text-slate-600 font-mono text-[11px]">
                          {new Date(tx.date).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : 'en-US', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </td>

                        <td className="p-3 font-bold text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <Building2 size={13} className="text-indigo-600" />
                            <span>{tx.clientCommercialName || tx.customerName || (lang === 'ar' ? 'زبون نقدي' : 'Cash Client')}</span>
                          </div>
                          {tx.clientWilaya && (
                            <span className="text-[10px] text-slate-400 font-normal block">{tx.clientWilaya}</span>
                          )}
                        </td>

                        <td className="p-3 text-center font-mono">
                          <span className="font-bold text-slate-900">{cartonsCount} كرتونة</span>
                          <span className="text-[10px] text-slate-400 block">({unitsCount} قطعة)</span>
                        </td>

                        <td className="p-3 text-center">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            tx.paymentMethod === 'debt' ? 'bg-amber-100 text-amber-900' :
                            tx.paymentMethod === 'cheque' ? 'bg-indigo-100 text-indigo-900' :
                            tx.paymentMethod === 'transfer' ? 'bg-sky-100 text-sky-900' :
                            'bg-emerald-100 text-[#006c49]'
                          }`}>
                            {tx.paymentMethod === 'debt' ? (lang === 'ar' ? 'آجل (دين)' : 'Credit') :
                             tx.paymentMethod === 'cheque' ? (lang === 'ar' ? 'شيك تجاري' : 'Cheque') :
                             tx.paymentMethod === 'transfer' ? (lang === 'ar' ? 'تحويل CCP' : 'Transfer') :
                             (lang === 'ar' ? 'نقدي (كاش)' : 'Cash')}
                          </span>
                        </td>

                        <td className="p-3 text-left font-mono font-extrabold text-slate-950">
                          {tx.totalAmount.toFixed(2)} د.ج
                        </td>

                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              playClickSound();
                              setCompletedTxForInvoice(tx);
                            }}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 mx-auto cursor-pointer transition-all shadow-2xs"
                          >
                            <Printer size={13} className="text-indigo-700" />
                            <span>{lang === 'ar' ? 'سند التسليم' : 'View Slip'}</span>
                          </button>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: WHOLESALE CLIENTS DIRECTORY */}
      {/* ========================================================================= */}
      {subTab === 'clients' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-950 font-display flex items-center gap-2">
                <Building2 className="text-indigo-600" size={20} />
                <span>{lang === 'ar' ? 'دليل المحلات والشركاء وتجار الجملة' : 'Wholesale Partners & Merchants Directory'}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === 'ar' ? 'إدارة بيانات التجار، السجل التجاري، أرقام التواصل، وأرصدة المشتريات والديون' : 'Merchant accounts, commercial registers, and transaction ledgers'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddClientModal(true)}
              className="px-3.5 py-2 bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold font-display flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <UserPlus size={15} />
              <span>{lang === 'ar' ? 'إضافة تاجر جديد' : 'Add Merchant'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wholesaleClients.map((client) => (
              <div
                key={client.id}
                className="bg-slate-50/90 rounded-2xl p-4 border border-slate-200/80 hover:border-indigo-300 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-200 text-indigo-800 flex items-center justify-center font-bold font-display text-sm">
                        🏢
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-slate-950 font-display">{client.storeName}</h4>
                        <p className="text-xs text-slate-600 font-medium">{client.contactPerson}</p>
                      </div>
                    </div>

                    <span className="bg-indigo-100 text-indigo-900 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {client.ordersCount || 0} {lang === 'ar' ? 'طلبيات' : 'orders'}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-slate-600 font-mono">
                    <p className="flex items-center gap-1.5">
                      <Phone size={12} className="text-slate-400" />
                      <span dir="ltr">{client.phone}</span>
                    </p>
                    <p className="flex items-center gap-1.5 font-sans">
                      <MapPin size={12} className="text-slate-400" />
                      <span>{client.wilaya}</span>
                    </p>
                    {client.taxId && (
                      <p className="text-[11px] text-slate-500 bg-white p-1.5 rounded-lg border border-slate-200 mt-1">
                        {client.taxId}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">{lang === 'ar' ? 'إجمالي المشتريات:' : 'Total Purchases:'}</span>
                    <span className="font-extrabold text-xs text-slate-900 font-mono">
                      {(client.totalPurchases || 0).toFixed(2)} د.ج
                    </span>
                  </div>

                  {client.outstandingBalance !== undefined && client.outstandingBalance > 0 ? (
                    <div className="text-left">
                      <span className="text-[10px] text-amber-600 font-bold block">{lang === 'ar' ? 'مستحقات آجلة:' : 'Balance Due:'}</span>
                      <span className="font-extrabold text-xs text-amber-700 font-mono">
                        {client.outstandingBalance.toFixed(2)} د.ج
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] bg-emerald-100 text-[#006c49] px-2 py-0.5 rounded-full font-bold">
                      {lang === 'ar' ? 'الحساب مسوى (0 د.ج)' : 'Settled'}
                    </span>
                  )}
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5: WHOLESALE MARGIN & LOT CALCULATOR */}
      {/* ========================================================================= */}
      {subTab === 'calculator' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-md space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-base sm:text-lg text-slate-950 font-display flex items-center gap-2">
              <Calculator className="text-indigo-600" size={20} />
              <span>{lang === 'ar' ? 'حاسبة هوامش ربح الجملة والطرود والمنصات (Palettes)' : 'Wholesale Margin & Lot Calculator'}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'ar' ? 'أداة احترافية لحساب أسعار الشراء، تكلفة الكرتونة، الأرباح المتوقعة، وهوامش التوزيع' : 'Calculate box costs, margins, and container/pallet profits'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Input parameters */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">{lang === 'ar' ? 'معطيات السلعة والشراء' : 'Input Values'}</h4>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">{lang === 'ar' ? 'سعر شراء القطعة الواحدة من المصنع/المستورد (د.ج):' : 'Unit Factory Buying Price (DZD):'}</label>
                <input
                  type="number"
                  min="1"
                  value={calcBuyingPrice}
                  onChange={(e) => setCalcBuyingPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono font-bold bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">{lang === 'ar' ? 'عدد القطع في الكرتونة / الطرد الواحد:' : 'Units per Carton / Box:'}</label>
                <input
                  type="number"
                  min="1"
                  value={calcCartonQty}
                  onChange={(e) => setCalcCartonQty(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono font-bold bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">{lang === 'ar' ? 'هامش الربح المطلوب للقطعة بالجملة (%):' : 'Target Wholesale Profit Margin (%):'}</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={calcMarginPercent}
                  onChange={(e) => setCalcMarginPercent(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono font-bold bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">{lang === 'ar' ? 'عدد الكراتين في الباليتة / المنصة (Palette):' : 'Cartons per Pallet:'}</label>
                <input
                  type="number"
                  min="1"
                  value={calcPalletCartons}
                  onChange={(e) => setCalcPalletCartons(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono font-bold bg-white"
                />
              </div>
            </div>

            {/* Calculated Profit Output */}
            {(() => {
              const unitWholesaleSelling = calcBuyingPrice * (1 + calcMarginPercent / 100);
              const unitProfit = unitWholesaleSelling - calcBuyingPrice;
              const cartonBuyingCost = calcBuyingPrice * calcCartonQty;
              const cartonSellingPrice = unitWholesaleSelling * calcCartonQty;
              const cartonProfit = unitProfit * calcCartonQty;
              const palletTotalSelling = cartonSellingPrice * calcPalletCartons;
              const palletTotalProfit = cartonProfit * calcPalletCartons;

              return (
                <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-2xl border border-indigo-800 space-y-4 flex flex-col justify-between shadow-lg">
                  <div>
                    <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider block mb-3">
                      {lang === 'ar' ? 'النتائج والتسعير المحسوب' : 'Calculated Pricing & Profits'}
                    </span>

                    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                      <div className="bg-white/10 p-2.5 rounded-xl">
                        <span className="text-indigo-200 text-[10px] block">{lang === 'ar' ? 'سعر بيع الجملة المقترح:' : 'Suggested Unit WS:'}</span>
                        <span className="text-base font-extrabold text-emerald-400">{unitWholesaleSelling.toFixed(2)} د.ج</span>
                      </div>

                      <div className="bg-white/10 p-2.5 rounded-xl">
                        <span className="text-indigo-200 text-[10px] block">{lang === 'ar' ? 'ربح القطعة الواحدة:' : 'Unit Profit:'}</span>
                        <span className="text-base font-extrabold text-indigo-300">+{unitProfit.toFixed(2)} د.ج</span>
                      </div>

                      <div className="bg-white/10 p-2.5 rounded-xl">
                        <span className="text-indigo-200 text-[10px] block">{lang === 'ar' ? 'تكلفة شراء الكرتونة:' : 'Box Buying Cost:'}</span>
                        <span className="text-base font-extrabold text-white">{cartonBuyingCost.toFixed(2)} د.ج</span>
                      </div>

                      <div className="bg-white/10 p-2.5 rounded-xl">
                        <span className="text-indigo-200 text-[10px] block">{lang === 'ar' ? 'سعر بيع الكرتونة بالجملة:' : 'Box Selling Price:'}</span>
                        <span className="text-base font-extrabold text-amber-300">{cartonSellingPrice.toFixed(2)} د.ج</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-white/15 rounded-xl border border-white/20 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>{lang === 'ar' ? 'ربح الكرتونة الواحدة:' : 'Profit per Box:'}</span>
                      <span className="font-bold text-emerald-400 font-mono">+{cartonProfit.toFixed(2)} د.ج</span>
                    </div>
                    <div className="flex justify-between text-sm font-black pt-1 border-t border-white/20">
                      <span>{lang === 'ar' ? `صافي ربح المنصة (${calcPalletCartons} كرتونة):` : `Pallet Net Profit:`}</span>
                      <span className="text-emerald-400 font-mono text-base">+{palletTotalProfit.toFixed(2)} د.ج</span>
                    </div>
                  </div>
                </div>
              );
            })()}

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Camera Barcode Scanner Modal */}
      {showCameraScanner && (
        <BarcodeScannerModal
          isOpen={showCameraScanner}
          onClose={() => setShowCameraScanner(false)}
          onScanSuccess={(code) => {
            setShowCameraScanner(false);
            const matched = products.find(p => p.barcode === code.trim());
            if (matched) {
              addCartonToCart(matched, 1);
            } else {
              triggerToast(lang === 'ar' ? `لم يتم العثور على منتج بالباركود: ${code}` : `Not found: ${code}`, true);
            }
          }}
          lang={lang}
        />
      )}

      {/* Add New Wholesale Client Modal */}
      {showAddClientModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h4 className="font-extrabold text-sm sm:text-base text-slate-950 font-display flex items-center gap-2">
                <Building2 className="text-indigo-600" size={18} />
                <span>{lang === 'ar' ? 'تسجيل تاجر / عميل جملة جديد' : 'Register New Wholesale Merchant'}</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowAddClientModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddNewClient} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {lang === 'ar' ? 'اسم المتجر / المؤسسة التجارية:' : 'Store / Company Name:'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'ar' ? 'مثال: سوبرماركت القدس' : 'e.g. Al-Quds Supermarket'}
                  value={newClientStore}
                  onChange={(e) => setNewClientStore(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    {lang === 'ar' ? 'الشخص المسؤول:' : 'Contact Person:'}
                  </label>
                  <input
                    type="text"
                    placeholder={lang === 'ar' ? 'مثال: الحاج كريم' : 'e.g. Karim'}
                    value={newClientContact}
                    onChange={(e) => setNewClientContact(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    {lang === 'ar' ? 'رقم الهاتف:' : 'Phone:'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0550 00 00 00"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {lang === 'ar' ? 'الولاية والعنوان:' : 'Wilaya & Address:'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'ar' ? 'مثال: الجزائر العاصمة - الرويبة' : 'Algiers - Rouiba'}
                  value={newClientWilaya}
                  onChange={(e) => setNewClientWilaya(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {lang === 'ar' ? 'السجل التجاري أو NIF (اختياري):' : 'RC / NIF (Optional):'}
                </label>
                <input
                  type="text"
                  placeholder="RC: 16/00-123456 • NIF: 000..."
                  value={newClientTaxId}
                  onChange={(e) => setNewClientTaxId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddClientModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
                >
                  {lang === 'ar' ? 'حفظ التاجر' : 'Save Merchant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Wholesale Invoice Modal */}
      {completedTxForInvoice && (
        <WholesaleInvoiceModal
          lang={lang}
          transaction={completedTxForInvoice}
          shopName={shopName}
          shopPhone={shopPhone}
          shopAddress={shopAddress}
          shopLogo={shopLogo}
          onClose={() => setCompletedTxForInvoice(null)}
          isNewSale={true}
        />
      )}

    </div>
  );
}
