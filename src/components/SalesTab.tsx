import React, { useState } from 'react';
import { Language, Product, SaleItem, CustomerDebt, Transaction } from '../types';
import { CATEGORIES } from '../data';
import { Search, ShoppingCart, Trash2, CreditCard, DollarSign, UserCheck, Check, Plus, AlertCircle, Camera, CheckCircle2, Package } from 'lucide-react';
import BarcodeScannerModal from './BarcodeScannerModal';
import InvoiceModal from './InvoiceModal';
import { playBeepSound, playCashRegisterSound, playErrorSound, playNotificationSound, playSuccessSound, playClickSound } from '../utils/audio';

interface SalesTabProps {
  lang: Language;
  products: Product[];
  debts: CustomerDebt[];
  onCompleteSale: (transaction: Transaction, updatedProducts: Product[], updatedDebts?: CustomerDebt[]) => void;
  onAddCustomer: (newCustomer: CustomerDebt) => void;
}

export default function SalesTab({ lang, products, debts, onCompleteSale, onAddCustomer }: SalesTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'debt'>('cash');
  const [selectedDebtorId, setSelectedDebtorId] = useState('');
  
  // Register customer on the fly
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  // Camera barcode scanner state
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [scanToast, setScanToast] = useState<{ message: string; isError?: boolean } | null>(null);

  // Completed transaction state for instant Invoice modal
  const [completedTxForInvoice, setCompletedTxForInvoice] = useState<Transaction | null>(null);

  const triggerToast = (message: string, isError = false) => {
    if (isError) {
      playErrorSound();
    } else {
      playNotificationSound();
    }
    setScanToast({ message, isError });
    setTimeout(() => setScanToast(null), 3000);
  };

  const handleCameraScanSuccess = (scannedCode: string) => {
    const cleanCode = scannedCode.trim();
    const matchedProduct = products.find(p => p.barcode === cleanCode);

    if (matchedProduct) {
      if (matchedProduct.quantity <= 0) {
        triggerToast(lang === 'ar' ? `السلعة "${matchedProduct.nameAr}" نافدة من المخزن!` : `Product "${matchedProduct.nameEn}" is out of stock!`, true);
      } else {
        addToCart(matchedProduct);
        playBeepSound();
        triggerToast(lang === 'ar' ? `تمت إضافة "${matchedProduct.nameAr}" إلى السلة` : `Added "${matchedProduct.nameEn}" to cart`);
      }
    } else {
      triggerToast(lang === 'ar' ? `لم يتم العثور على منتج بالباركود: ${cleanCode}` : `No product found with barcode: ${cleanCode}`, true);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const query = searchQuery.trim();
      if (!query) return;

      const matchedProduct = products.find(p => p.barcode === query);
      if (matchedProduct) {
        if (matchedProduct.quantity <= 0) {
          triggerToast(lang === 'ar' ? `السلعة "${matchedProduct.nameAr}" نافدة من المخزن!` : `Product "${matchedProduct.nameEn}" is out of stock!`, true);
        } else {
          addToCart(matchedProduct);
          setSearchQuery('');
          playBeepSound();
          triggerToast(lang === 'ar' ? `تمت إضافة "${matchedProduct.nameAr}" إلى السلة` : `Added "${matchedProduct.nameEn}" to cart`);
        }
      }
    }
  };

  const translations = {
    ar: {
      searchPlaceholder: "ابحث عن سلعة باسمها أو رمز الباركود...",
      categories: "التصنيفات المتاحة",
      cartTitle: "سلة المبيعات الحالية",
      cartEmpty: "السلة فارغة. انقر على المنتجات لإضافتها.",
      itemLabel: "سلعة",
      itemsLabel: "سلع",
      subtotal: "المجموع الصافي",
      total: "المبلغ الإجمالي الصافي",
      payMethod: "طريقة السداد",
      cash: "نقدي (كاش)",
      card: "مدى / شبكة",
      debt: "آجل (على الحساب)",
      selectDebtor: "اختر العميل المدين",
      addDebtorBtn: "عميل جديد",
      completeSale: "إتمام عملية البيع وطباعة الفاتورة",
      stockWarning: "الكمية المحددة بالبيع تتجاوز المتاح في المخزن!",
      insufficientStock: "مخزون غير كافٍ!",
      successSale: "تمت العملية بنجاح! تم تسجيل الفاتورة وتعديل المخزون.",
      currency: "د.ج",
      addCustTitle: "إضافة عميل دين جديد",
      custName: "اسم العميل الكامل",
      custPhone: "رقم الجوال",
      submitCust: "تسجيل العميل",
      cancel: "إلغاء",
      outOfStock: "نافد من المخزن",
      qtyAvailable: "المتاح: {qty} حبة"
    },
    en: {
      searchPlaceholder: "Search catalog by name or barcode...",
      categories: "Categories",
      cartTitle: "Active Sales Register",
      cartEmpty: "Register is empty. Tap products to add them.",
      itemLabel: "item",
      itemsLabel: "items",
      subtotal: "Net Subtotal",
      total: "Total Net Amount",
      payMethod: "Payment Method",
      cash: "Cash Sale",
      card: "Mada / Card",
      debt: "Store Debt (On Credit)",
      selectDebtor: "Select Debtor Customer",
      addDebtorBtn: "New Debtor",
      completeSale: "Complete Register & Print Invoice",
      stockWarning: "Requested quantity exceeds available stock!",
      insufficientStock: "Insufficient stock!",
      successSale: "Success! Sale registered, stock deducted, and accounts adjusted.",
      currency: "DZD",
      addCustTitle: "Register New Credit Customer",
      custName: "Full Customer Name",
      custPhone: "Phone Number",
      submitCust: "Add Customer",
      cancel: "Cancel",
      outOfStock: "Out of stock",
      qtyAvailable: "Available: {qty} units"
    }
  };

  const t = translations[lang];

  // Filter list
  const filteredProducts = products.filter(p => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = p.barcode.includes(query) || 
                          p.nameAr.toLowerCase().includes(query) || 
                          p.nameEn.toLowerCase().includes(query);
    
    const catObj = CATEGORIES.find(c => c.id === selectedCategory);
    const matchesCategory = selectedCategory === 'all' || 
                            p.categoryAr === catObj?.ar || 
                            p.categoryEn === catObj?.en;

    return matchesSearch && matchesCategory;
  });

  // Cart operations
  const addToCart = (product: Product) => {
    if (product.quantity === 0) {
      playErrorSound();
      return;
    }

    const existingIndex = cart.findIndex(item => item.productId === product.id);
    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty >= product.quantity) {
        playErrorSound();
        alert(t.stockWarning);
        return;
      }
      playBeepSound();
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      playBeepSound();
      const newItem: SaleItem = {
        productId: product.id,
        productNameAr: product.nameAr,
        productNameEn: product.nameEn,
        sellingPrice: product.sellingPrice,
        buyingPrice: product.buyingPrice,
        quantity: 1
      };
      setCart([...cart, newItem]);
    }
  };

  const updateCartQty = (productId: string, delta: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingIndex = cart.findIndex(item => item.productId === productId);
    if (existingIndex === -1) return;

    const currentQty = cart[existingIndex].quantity;
    const newQty = currentQty + delta;

    if (newQty <= 0) {
      // Remove
      playClickSound();
      setCart(cart.filter(item => item.productId !== productId));
    } else {
      if (newQty > product.quantity) {
        playErrorSound();
        alert(t.stockWarning);
        return;
      }
      playClickSound();
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity = newQty;
      setCart(updatedCart);
    }
  };

  const removeFromCart = (productId: string) => {
    playClickSound();
    setCart(cart.filter(item => item.productId !== productId));
  };

  // Totals calculations - Pure Net Total without VAT addition
  const totalAmount = cart.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (paymentMethod === 'debt' && !selectedDebtorId) {
      playErrorSound();
      alert(lang === 'ar' ? 'يرجى تحديد العميل المسؤول عن الدين أولاً' : 'Please select the customer responsible for this credit sale first');
      return;
    }

    // Verify stock one last time and deduct
    const updatedProducts = products.map(p => {
      const cartItem = cart.find(item => item.productId === p.id);
      if (cartItem) {
        const newQty = p.quantity - cartItem.quantity;
        if (newQty < 0) {
          throw new Error(`${t.insufficientStock} (${lang === 'ar' ? p.nameAr : p.nameEn})`);
        }
        return { ...p, quantity: newQty };
      }
      return p;
    });

    let updatedDebts = [...debts];
    let debtorName = '';

    if (paymentMethod === 'debt') {
      const debtorIndex = updatedDebts.findIndex(d => d.id === selectedDebtorId);
      if (debtorIndex > -1) {
        debtorName = updatedDebts[debtorIndex].name;
        updatedDebts[debtorIndex] = {
          ...updatedDebts[debtorIndex],
          totalDebt: updatedDebts[debtorIndex].totalDebt + totalAmount,
          lastTransactionDate: new Date().toISOString(),
          history: [
            {
              date: new Date().toISOString(),
              amount: totalAmount,
              type: 'add',
              note: lang === 'ar' 
                ? `مشتريات فاتورة كاشير آجل بقيمة ${totalAmount.toFixed(2)} د.ج` 
                : `Invoice register credit sale of ${totalAmount.toFixed(2)} DZD`
            },
            ...updatedDebts[debtorIndex].history
          ]
        };
      }
    }

    // Calculate profit
    // sellingPrice - buyingPrice = profit margin per unit
    const profit = cart.reduce((sum, item) => sum + ((item.sellingPrice - item.buyingPrice) * item.quantity), 0);

    const transaction: Transaction = {
      id: 'tx-' + Math.floor(100000 + Math.random() * 900000).toString(),
      date: new Date().toISOString(),
      items: cart,
      totalAmount: totalAmount,
      profit: profit,
      paymentMethod: paymentMethod,
      ...(paymentMethod === 'debt' ? { customerId: selectedDebtorId, customerName: debtorName } : {})
    };

    try {
      onCompleteSale(transaction, updatedProducts, updatedDebts);
      setCart([]);
      setSelectedDebtorId('');
      playCashRegisterSound();
      setCompletedTxForInvoice(transaction);
    } catch (err: any) {
      playErrorSound();
      alert(err.message || 'Error executing cashier checkout.');
    }
  };

  const handleAddDebtorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim()) return;

    const newCustomer: CustomerDebt = {
      id: 'debt-' + Date.now(),
      name: newCustomerName.trim(),
      phone: newCustomerPhone.trim() || 'N/A',
      totalDebt: 0,
      lastTransactionDate: new Date().toISOString(),
      history: []
    };

    onAddCustomer(newCustomer);
    setSelectedDebtorId(newCustomer.id);
    
    setNewCustomerName('');
    setNewCustomerPhone('');
    setShowAddCustomerModal(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* LEFT COLUMN: Product Selector (Col Span 7) */}
      <div className="lg:col-span-7 space-y-5">
        
        {/* Search Catalog + Camera Scan Button */}
        <div className="space-y-2">
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-sm flex gap-2 items-center relative">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">
                <Search size={18} />
              </span>
              <input 
                type="text" 
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className={`w-full py-2.5 pr-10 pl-4 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:border-slate-950 ${lang === 'ar' ? 'text-right' : 'text-left'}`}
              />
            </div>

            <button
              type="button"
              onClick={() => setShowCameraScanner(true)}
              className="py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xs whitespace-nowrap active:scale-95"
              title={lang === 'ar' ? 'مسح الباركود بكاميرا الهاتف' : 'Scan barcode with camera'}
            >
              <Camera size={18} />
              <span className="hidden sm:inline">
                {lang === 'ar' ? 'مسح الباركود بالكاميرا' : 'Scan Barcode'}
              </span>
            </button>
          </div>

          {/* Toast feedback after camera scan */}
          {scanToast && (
            <div className={`p-3 rounded-xl border text-xs font-bold font-display flex items-center gap-2 animate-bounce-in shadow-xs ${
              scanToast.isError 
                ? 'bg-amber-50 border-amber-200 text-amber-800' 
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}>
              {scanToast.isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
              <span>{scanToast.message}</span>
            </div>
          )}
        </div>

        {/* Category filtering chips */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 block mb-2.5 uppercase tracking-wider font-display">
            {t.categories}
          </span>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold font-display transition-all cursor-pointer ${
                  selectedCategory === cat.id 
                    ? 'bg-[#131b2e] text-white shadow-sm' 
                    : 'bg-slate-50 text-slate-600 border border-slate-200/40 hover:bg-slate-100'
                }`}
              >
                {lang === 'ar' ? cat.ar : cat.en}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProducts.map(p => {
            const isOut = p.quantity === 0;
            const isLow = p.quantity > 0 && p.quantity <= p.minQuantity;

            return (
              <div 
                key={p.id}
                onClick={() => !isOut && addToCart(p)}
                className={`p-4 bg-white rounded-2xl border transition-all select-none relative flex flex-col justify-between ${
                  isOut 
                    ? 'opacity-60 border-slate-100 cursor-not-allowed bg-slate-50/50' 
                    : 'border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-400 cursor-pointer active:scale-[0.98]'
                }`}
              >
                {/* Out Of Stock Cover */}
                {isOut && (
                  <div className="absolute top-2 left-2 bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[9px] font-bold font-display">
                    {t.outOfStock}
                  </div>
                )}
                {/* Low Stock Indicator Dot */}
                {isLow && !isOut && (
                  <div className="absolute top-2.5 left-2.5 w-2 h-2 bg-amber-500 rounded-full animate-pulse" title="Low Stock"></div>
                )}

                <div>
                  <span className="text-[9px] font-mono text-slate-400 block">{p.barcode}</span>
                  <h4 className="text-xs font-bold font-display text-slate-950 mt-1 line-clamp-2">
                    {lang === 'ar' ? p.nameAr : p.nameEn}
                  </h4>
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <div>
                    <span className="text-sm font-display font-extrabold text-slate-900 block">
                      {p.sellingPrice.toFixed(2)} <span className="text-[10px] font-semibold text-slate-400 font-sans">{t.currency}</span>
                    </span>
                    <span className={`text-[10px] font-semibold ${isOut ? 'text-red-500' : isLow ? 'text-amber-500' : 'text-[#006c49]'}`}>
                      {t.qtyAvailable.replace('{qty}', p.quantity.toString())}
                    </span>
                  </div>
                  <div className={`p-1.5 rounded-lg text-white ${isOut ? 'bg-slate-300' : 'bg-[#131b2e]'}`}>
                    <Plus size={14} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-8 text-center my-4">
            <Package className="mx-auto text-slate-300 mb-2" size={32} />
            <p className="text-xs font-bold text-slate-700 font-display">
              {lang === 'ar' ? 'لا توجد سلع مسجلة تطابق البحث' : 'No products found'}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {lang === 'ar' ? 'قم بتسجيل سلع متجرك من تبويب "إدارة المخزون" لتبدأ عمليات البيع بالكاشير.' : 'Add items from Inventory Tab to display them here in POS.'}
            </p>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Sales Register & Cashier Summary (Col Span 5) */}
      <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between min-h-[580px]">
        
        <div>
          {/* Header */}
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold font-display text-slate-950 flex items-center gap-1.5">
              <ShoppingCart size={16} className="text-[#006c49]" />
              <span>{t.cartTitle}</span>
            </h3>
            <span className="bg-slate-100 px-2.5 py-0.5 text-slate-700 rounded-full text-[10px] font-bold">
              {cart.reduce((sum, i) => sum + i.quantity, 0)} {cart.reduce((sum, i) => sum + i.quantity, 0) === 1 ? t.itemLabel : t.itemsLabel}
            </span>
          </div>

          {/* Cart items list */}
          <div className="mt-4 space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
            {cart.map(item => (
              <div key={item.productId} className="flex items-center justify-between gap-2 p-2 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="flex-1 min-w-0">
                  <h4 className="text-[11px] font-bold font-display text-slate-950 truncate">
                    {lang === 'ar' ? item.productNameAr : item.productNameEn}
                  </h4>
                  <p className="text-[10px] text-[#006c49] font-bold mt-0.5">
                    {item.sellingPrice.toFixed(2)} {t.currency}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Qty selectors */}
                  <div className="flex items-center gap-1.5 bg-white rounded-lg border border-slate-200 p-0.5">
                    <button 
                      onClick={() => updateCartQty(item.productId, -1)}
                      className="w-5 h-5 flex justify-center items-center font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded cursor-pointer text-xs"
                    >
                      -
                    </button>
                    <span className="w-5 text-center text-[11px] font-bold text-slate-900">{item.quantity}</span>
                    <button 
                      onClick={() => updateCartQty(item.productId, 1)}
                      className="w-5 h-5 flex justify-center items-center font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded cursor-pointer text-xs"
                    >
                      +
                    </button>
                  </div>

                  {/* Qty Total price */}
                  <span className="w-16 text-right text-[11px] font-bold text-slate-900 font-display">
                    {(item.sellingPrice * item.quantity).toFixed(2)}
                  </span>

                  {/* Delete button */}
                  <button 
                    onClick={() => removeFromCart(item.productId)}
                    className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}

            {cart.length === 0 && (
              <div className="py-20 text-center text-slate-400 text-xs">
                <ShoppingCart className="mx-auto text-slate-200 mb-3" size={36} />
                <span>{t.cartEmpty}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Checkout Summary */}
        <div className="mt-6 pt-5 border-t border-slate-100 space-y-4">
          
          {/* Net Price Calculations Summary */}
          <div className="space-y-1.5 text-xs text-slate-500 font-sans">
            <div className="flex justify-between">
              <span>{lang === 'ar' ? 'عدد السلع المحددة:' : 'Selected Items:'}</span>
              <span className="font-bold text-slate-800">{totalItemsCount} {totalItemsCount === 1 ? t.itemLabel : t.itemsLabel}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-100 text-sm font-display text-slate-950">
              <span className="font-bold">{lang === 'ar' ? 'المبلغ الصافي المستحق:' : 'Net Total Amount:'}</span>
              <span className="font-extrabold text-xl text-[#006c49]">
                {totalAmount.toFixed(2)} <span className="text-xs font-semibold font-sans">{t.currency}</span>
              </span>
            </div>
          </div>

          {/* Checkout payment selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block font-display">
              {t.payMethod}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`py-2 px-1 rounded-xl text-center text-[10px] sm:text-xs font-bold font-display transition-all cursor-pointer border flex flex-col items-center gap-1 ${
                  paymentMethod === 'cash' 
                    ? 'bg-[#131b2e] text-white border-[#131b2e]' 
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <DollarSign size={14} />
                <span>{t.cash}</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`py-2 px-1 rounded-xl text-center text-[10px] sm:text-xs font-bold font-display transition-all cursor-pointer border flex flex-col items-center gap-1 ${
                  paymentMethod === 'card' 
                    ? 'bg-[#131b2e] text-white border-[#131b2e]' 
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <CreditCard size={14} />
                <span>{t.card}</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('debt')}
                className={`py-2 px-1 rounded-xl text-center text-[10px] sm:text-xs font-bold font-display transition-all cursor-pointer border flex flex-col items-center gap-1 ${
                  paymentMethod === 'debt' 
                    ? 'bg-amber-600 text-white border-amber-600' 
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <UserCheck size={14} />
                <span>{t.debt}</span>
              </button>
            </div>
          </div>

          {/* Credit Debtor Selection (shown only if 'debt' payment selected) */}
          {paymentMethod === 'debt' && (
            <div className="p-3 bg-amber-50/50 border border-amber-200/50 rounded-xl space-y-2 animate-fade-in">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-amber-950 font-display">
                  {t.selectDebtor}
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(true)}
                  className="text-[10px] font-extrabold text-[#006c49] bg-emerald-50/70 border border-[#006c49]/30 hover:bg-emerald-50 px-2 py-1 rounded-lg cursor-pointer flex items-center gap-0.5"
                >
                  <Plus size={10} />
                  <span>{t.addDebtorBtn}</span>
                </button>
              </div>
              <select
                value={selectedDebtorId}
                onChange={(e) => setSelectedDebtorId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none"
              >
                <option value="">-- {lang === 'ar' ? 'اختر عميلاً من الدفتر' : 'Select Customer'} --</option>
                {debts.map(debtor => (
                  <option key={debtor.id} value={debtor.id}>
                    {debtor.name} ({debtor.phone})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Checkout Submit */}
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full py-3 bg-[#0F172A] hover:bg-slate-800 text-white font-bold font-display text-xs rounded-xl shadow-md transition-all flex justify-center items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check size={16} />
            <span>{t.completeSale}</span>
          </button>
        </div>
      </div>

      {/* Add Debt Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 border border-slate-100 shadow-xl animate-scale-in">
            <h3 className="text-sm font-bold text-slate-950 font-display flex items-center gap-2">
              <Plus className="text-[#006c49]" size={18} />
              <span>{t.addCustTitle}</span>
            </h3>
            
            <form onSubmit={handleAddDebtorSubmit} className="mt-4 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  {t.custName} <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  placeholder={lang === 'ar' ? "مثال: عبدالله الحربي" : "e.g. Abdullah Al-Harbi"}
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:border-slate-950 ${lang === 'ar' ? 'text-right' : 'text-left'}`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  {t.custPhone}
                </label>
                <input 
                  type="text" 
                  placeholder="05xxxxxxxx"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:border-slate-950 text-left font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2 bg-[#006c49] hover:bg-[#005236] text-white font-semibold text-xs rounded-xl transition-all cursor-pointer"
                >
                  {t.submitCust}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Camera Barcode Scanner Modal */}
      {showCameraScanner && (
        <BarcodeScannerModal
          lang={lang}
          isOpen={showCameraScanner}
          onClose={() => setShowCameraScanner(false)}
          onScanSuccess={handleCameraScanSuccess}
          title={lang === 'ar' ? 'كاميرا الكاشير: مسح باركود السلعة' : 'Register Scanner: Scan Item Barcode'}
          continuous={true}
          lastScanFeedback={scanToast}
        />
      )}

      {/* Official Invoice Print/PDF Modal on Sale Complete */}
      {completedTxForInvoice && (
        <InvoiceModal
          lang={lang}
          transaction={completedTxForInvoice}
          isNewSale={true}
          onClose={() => setCompletedTxForInvoice(null)}
        />
      )}

    </div>
  );
}
