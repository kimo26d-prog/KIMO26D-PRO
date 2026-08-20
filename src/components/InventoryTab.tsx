import React, { useState, useMemo } from 'react';
import { Language, Product, SHOP_TYPES, CATEGORY_PRESETS_BY_SHOP_TYPE, CategoryOption } from '../types';
import { CATEGORIES } from '../data';
import { Search, Plus, Filter, AlertTriangle, Edit2, Trash2, RefreshCw, Layers, Camera, CheckCircle2, Sparkles, Tag, PlusCircle, X } from 'lucide-react';
import BarcodeScannerModal from './BarcodeScannerModal';
import { playBeepSound, playSuccessSound, playErrorSound, playClickSound } from '../utils/audio';

interface InventoryTabProps {
  lang: Language;
  shopType?: string;
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  initialFilter?: string; // e.g. 'low-stock'
  onOpenAIOrganizer?: () => void;
}

export default function InventoryTab({ lang, shopType = 'grocery', products, onAddProduct, onUpdateProduct, onDeleteProduct, initialFilter = '', onOpenAIOrganizer }: InventoryTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockStatus, setStockStatus] = useState(initialFilter || 'all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Active shop type preset state for category selection in modals
  const [modalShopType, setModalShopType] = useState<string>(shopType || 'grocery');

  // Camera Barcode Scanner State
  const [scannerTarget, setScannerTarget] = useState<'search' | 'form' | null>(null);

  const handleInventoryCameraScan = (scannedCode: string) => {
    playBeepSound();
    if (scannerTarget === 'search') {
      setSearchQuery(scannedCode);
    } else if (scannerTarget === 'form') {
      setBarcode(scannedCode);
    }
    setScannerTarget(null);
  };

  // Form states for adding/editing product
  const [barcode, setBarcode] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  
  // Category Form State
  const [categoryAr, setCategoryAr] = useState<string>('مواد غذائية');
  const [categoryEn, setCategoryEn] = useState<string>('Groceries');
  const [isCustomCategory, setIsCustomCategory] = useState<boolean>(false);
  const [customCategoryInputAr, setCustomCategoryInputAr] = useState<string>('');
  const [customCategoryInputEn, setCustomCategoryInputEn] = useState<string>('');

  const [buyingPrice, setBuyingPrice] = useState('0.00');
  const [sellingPrice, setSellingPrice] = useState('0.00');
  const [quantity, setQuantity] = useState('0');
  const [minQuantity, setMinQuantity] = useState('5');

  // Current shop type's category presets
  const currentActivityPresets = useMemo(() => {
    return CATEGORY_PRESETS_BY_SHOP_TYPE[modalShopType] || CATEGORY_PRESETS_BY_SHOP_TYPE.grocery;
  }, [modalShopType]);

  // Dynamic filter categories merged from all shop presets + unique categories in existing products
  const filterCategories = useMemo(() => {
    const list: { id: string; ar: string; en: string }[] = [
      { id: 'all', ar: lang === 'ar' ? 'جميع التصنيفات' : 'All Categories', en: 'All Categories' }
    ];

    // 1. Current active presets
    currentActivityPresets.forEach(cp => {
      if (!list.some(item => item.ar === cp.ar)) {
        list.push({ id: cp.id, ar: cp.ar, en: cp.en });
      }
    });

    // 2. Unique categories from user products
    products.forEach(p => {
      if (p.categoryAr && !list.some(item => item.ar === p.categoryAr)) {
        list.push({ id: `cat_prod_${p.categoryAr}`, ar: p.categoryAr, en: p.categoryEn || p.categoryAr });
      }
    });

    // 3. Other shop type presets
    Object.values(CATEGORY_PRESETS_BY_SHOP_TYPE).forEach(presetArr => {
      presetArr.forEach(c => {
        if (!list.some(item => item.ar === c.ar)) {
          list.push({ id: c.id, ar: c.ar, en: c.en });
        }
      });
    });

    return list;
  }, [currentActivityPresets, products, lang]);

  // Unified single category option list for modals (خانة واحدة)
  const combinedCategoryOptions = useMemo(() => {
    const list: { ar: string; en: string }[] = [];
    const added = new Set<string>();

    // 1. Current active activity presets
    currentActivityPresets.forEach(cp => {
      if (!added.has(cp.ar)) {
        added.add(cp.ar);
        list.push({ ar: cp.ar, en: cp.en });
      }
    });

    // 2. Presets from all shop activities
    Object.values(CATEGORY_PRESETS_BY_SHOP_TYPE).forEach(presetArr => {
      presetArr.forEach(c => {
        if (!added.has(c.ar)) {
          added.add(c.ar);
          list.push({ ar: c.ar, en: c.en });
        }
      });
    });

    // 3. User's existing custom product categories
    products.forEach(p => {
      if (p.categoryAr && !added.has(p.categoryAr)) {
        added.add(p.categoryAr);
        list.push({ ar: p.categoryAr, en: p.categoryEn || p.categoryAr });
      }
    });

    return list;
  }, [currentActivityPresets, products]);

  const translations = {
    ar: {
      searchPlaceholder: "البحث بالاسم أو الباركود...",
      addBtn: "إضافة سلعة جديدة",
      categoryLabel: "التصنيف / الفئة",
      statusLabel: "حالة المخزون",
      statusAll: "الكل",
      statusLow: "منخفض المخزون",
      statusOut: "نافد المخزون",
      statusHealthy: "متوفر / سليم",
      thBarcode: "الباركود",
      thName: "اسم السلعة",
      thCategory: "التصنيف",
      thPriceBuy: "سعر الشراء",
      thPriceSell: "سعر البيع",
      thQty: "الكمية المتاحة",
      thValue: "قيمة المخزون",
      thActions: "إجراءات",
      generateBarcode: "توليد تلقائي",
      addTitle: "إضافة سلعة جديدة للمخزون",
      editTitle: "تعديل بيانات السلعة",
      saveBtn: "حفظ التغييرات",
      addSubmit: "إضافة للمخزون",
      cancel: "إلغاء",
      confirmDelete: "هل أنت متأكد من رغبتك في حذف هذه السلعة نهائياً؟",
      totalAssetsLabel: "القيمة الإجمالية للمخزون بالبيع",
      activeItems: "سلعة مسجلة",
      currency: "د.ج",
      labelAr: "الاسم بالعربية",
      labelEn: "الاسم بالإنجليزية",
      labelMinQty: "حد التنبيه الأدنى",
      invalidPrices: "يرجى التحقق من صحة الأسعار والكميات المكتوبة"
    },
    en: {
      searchPlaceholder: "Search by barcode or product name...",
      addBtn: "Add New Product",
      categoryLabel: "Category / Activity",
      statusLabel: "Stock Status",
      statusAll: "All Stocks",
      statusLow: "Low Stock Alert",
      statusOut: "Out of Stock",
      statusHealthy: "Healthy Stock",
      thBarcode: "Barcode",
      thName: "Product Name",
      thCategory: "Category",
      thPriceBuy: "Buying Price",
      thPriceSell: "Selling Price",
      thQty: "Stock Qty",
      thValue: "Stock Value",
      thActions: "Actions",
      generateBarcode: "Generate",
      addTitle: "Add New Inventory Item",
      editTitle: "Edit Product Details",
      saveBtn: "Save Changes",
      addSubmit: "Add to Inventory",
      cancel: "Cancel",
      confirmDelete: "Are you sure you want to permanently delete this product?",
      totalAssetsLabel: "Total Stock Asset Valuation (at retail)",
      activeItems: "registered items",
      currency: "DZD",
      labelAr: "Name in Arabic",
      labelEn: "Name in English",
      labelMinQty: "Min Alert Threshold",
      invalidPrices: "Please verify that prices and quantities are valid"
    }
  };

  const t = translations[lang];

  // Auto Barcode Generator Helper
  const handleGenerateBarcode = () => {
    playClickSound();
    const randomBarcode = '628' + Math.floor(1000000000 + Math.random() * 9000000000).toString();
    setBarcode(randomBarcode);
  };

  // Filter products dynamically
  const filteredProducts = products.filter(p => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = p.barcode.includes(query) || 
                          p.nameAr.toLowerCase().includes(query) || 
                          p.nameEn.toLowerCase().includes(query);
    
    // Category filter matching
    let matchesCategory = true;
    if (selectedCategory !== 'all') {
      const selectedObj = filterCategories.find(c => c.id === selectedCategory);
      const targetAr = selectedObj ? selectedObj.ar : selectedCategory;
      matchesCategory = p.categoryAr === targetAr || p.categoryEn === targetAr;
    }
    
    // Stock status mapping
    let matchesStatus = true;
    if (stockStatus === 'low-stock') {
      matchesStatus = p.quantity > 0 && p.quantity <= p.minQuantity;
    } else if (stockStatus === 'out-stock') {
      matchesStatus = p.quantity === 0;
    } else if (stockStatus === 'healthy') {
      matchesStatus = p.quantity > p.minQuantity;
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Calculate sum assets valuation of these products
  const totalAssetsValue = products.reduce((sum, p) => sum + (p.quantity * p.sellingPrice), 0);

  // Helper to open Add Product Modal initialized with current shop type categories
  const openAddModal = () => {
    playClickSound();
    setModalShopType(shopType || 'grocery');
    const defaultPresets = CATEGORY_PRESETS_BY_SHOP_TYPE[shopType || 'grocery'] || CATEGORY_PRESETS_BY_SHOP_TYPE.grocery;
    setCategoryAr(defaultPresets[0].ar);
    setCategoryEn(defaultPresets[0].en);
    setIsCustomCategory(false);
    setCustomCategoryInputAr('');
    setCustomCategoryInputEn('');

    setBarcode('');
    setNameAr('');
    setNameEn('');
    setBuyingPrice('0.00');
    setSellingPrice('0.00');
    setQuantity('0');
    setMinQuantity('5');
    handleGenerateBarcode();
    setShowAddModal(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const bPrice = parseFloat(buyingPrice);
    const sPrice = parseFloat(sellingPrice);
    const qtyNum = parseInt(quantity);
    const minQtyNum = parseInt(minQuantity);

    if (isNaN(bPrice) || isNaN(sPrice) || isNaN(qtyNum) || isNaN(minQtyNum)) {
      playErrorSound();
      alert(t.invalidPrices);
      return;
    }

    // Determine final category text
    let finalCatAr = categoryAr;
    let finalCatEn = categoryEn;

    if (isCustomCategory) {
      finalCatAr = customCategoryInputAr.trim() || (lang === 'ar' ? 'عام' : 'General');
      finalCatEn = customCategoryInputEn.trim() || finalCatAr;
    }

    const newProduct: Product = {
      id: 'prod-' + Date.now(),
      barcode: barcode.trim() || 'NO-BARCODE',
      nameAr: nameAr.trim(),
      nameEn: nameEn.trim(),
      categoryAr: finalCatAr,
      categoryEn: finalCatEn,
      buyingPrice: bPrice,
      sellingPrice: sPrice,
      quantity: qtyNum,
      minQuantity: minQtyNum
    };

    onAddProduct(newProduct);
    playSuccessSound();
    
    // Reset Form
    setBarcode('');
    setNameAr('');
    setNameEn('');
    setBuyingPrice('0.00');
    setSellingPrice('0.00');
    setQuantity('0');
    setMinQuantity('5');
    setShowAddModal(false);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setBarcode(product.barcode);
    setNameAr(product.nameAr);
    setNameEn(product.nameEn);
    
    // Set category states
    setModalShopType(shopType || 'grocery');
    setCategoryAr(product.categoryAr);
    setCategoryEn(product.categoryEn);
    
    // Check if it's custom or preset
    const matchedPreset = currentActivityPresets.find(cp => cp.ar === product.categoryAr);
    if (!matchedPreset) {
      setIsCustomCategory(true);
      setCustomCategoryInputAr(product.categoryAr);
      setCustomCategoryInputEn(product.categoryEn);
    } else {
      setIsCustomCategory(false);
    }

    setBuyingPrice(product.buyingPrice.toFixed(2));
    setSellingPrice(product.sellingPrice.toFixed(2));
    setQuantity(product.quantity.toString());
    setMinQuantity(product.minQuantity.toString());
    setShowEditModal(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const bPrice = parseFloat(buyingPrice);
    const sPrice = parseFloat(sellingPrice);
    const qtyNum = parseInt(quantity);
    const minQtyNum = parseInt(minQuantity);

    if (isNaN(bPrice) || isNaN(sPrice) || isNaN(qtyNum) || isNaN(minQtyNum)) {
      playErrorSound();
      alert(t.invalidPrices);
      return;
    }

    let finalCatAr = categoryAr;
    let finalCatEn = categoryEn;

    if (isCustomCategory) {
      finalCatAr = customCategoryInputAr.trim() || (lang === 'ar' ? 'عام' : 'General');
      finalCatEn = customCategoryInputEn.trim() || finalCatAr;
    }

    const updatedProduct: Product = {
      ...editingProduct,
      barcode: barcode.trim(),
      nameAr: nameAr.trim(),
      nameEn: nameEn.trim(),
      categoryAr: finalCatAr,
      categoryEn: finalCatEn,
      buyingPrice: bPrice,
      sellingPrice: sPrice,
      quantity: qtyNum,
      minQuantity: minQtyNum
    };

    onUpdateProduct(updatedProduct);
    playSuccessSound();
    setShowEditModal(false);
    setEditingProduct(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t.confirmDelete)) {
      onDeleteProduct(id);
    }
  };

  return (
    <div className="space-y-5">
      
      {/* 1. Header Metrics Banner */}
      <div className="bg-[#131b2e] text-white p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">{t.totalAssetsLabel}</span>
          <h2 className="text-2xl font-display font-extrabold text-white mt-1">
            {totalAssetsValue.toFixed(2)} <span className="text-sm font-semibold text-slate-400 font-sans">{t.currency}</span>
          </h2>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="px-4 py-2 bg-white/10 rounded-xl text-xs font-semibold">
            {products.length} {t.activeItems}
          </div>
          {onOpenAIOrganizer && (
            <button
              type="button"
              onClick={onOpenAIOrganizer}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black font-display text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm border border-emerald-400/40"
              title={lang === 'ar' ? 'منظم المتجر الذكي بالذكاء الاصطناعي' : 'AI Store Organizer'}
            >
              <Sparkles size={15} className="animate-pulse" />
              <span>{lang === 'ar' ? 'مُنظّم المتجر (AI)' : 'AI Organizer'}</span>
            </button>
          )}
          <button 
            onClick={openAddModal}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold font-display text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={15} />
            <span>{t.addBtn}</span>
          </button>
        </div>
      </div>

      {/* 2. Advanced Search & Categorical Filters */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Keyword Search + Camera Button */}
          <div className="relative flex gap-2 items-center">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">
                <Search size={18} />
              </span>
              <input 
                type="text" 
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full py-2.5 pr-10 pl-4 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:border-slate-950 ${lang === 'ar' ? 'text-right' : 'text-left'}`}
              />
            </div>

            <button
              type="button"
              onClick={() => setScannerTarget('search')}
              className="py-2.5 px-3 bg-[#131b2e] hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap active:scale-95"
              title={lang === 'ar' ? 'مسح الباركود بالكاميرا للبحث' : 'Scan barcode to search'}
            >
              <Camera size={16} className="text-emerald-400" />
              <span className="hidden sm:inline">{lang === 'ar' ? 'مسح بالكاميرا' : 'Camera'}</span>
            </button>
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 whitespace-nowrap"><Filter size={15} className="inline mr-1" /></span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none font-bold text-slate-800"
            >
              {filterCategories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {lang === 'ar' ? cat.ar : cat.en}
                </option>
              ))}
            </select>
          </div>

          {/* Stock status switches */}
          <div className="flex items-center gap-2">
            <select
              value={stockStatus}
              onChange={(e) => setStockStatus(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none font-sans"
            >
              <option value="all">{t.statusAll}</option>
              <option value="low-stock">{t.statusLow}</option>
              <option value="out-stock">{t.statusOut}</option>
              <option value="healthy">{t.statusHealthy}</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Products List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4 text-right font-display">{t.thBarcode}</th>
                <th className="py-3 px-4 text-right font-display">{t.thName}</th>
                <th className="py-3 px-4 text-right font-display">{t.thCategory}</th>
                <th className="py-3 px-4 text-right font-display">{t.thPriceBuy}</th>
                <th className="py-3 px-4 text-right font-display">{t.thPriceSell}</th>
                <th className="py-3 px-4 text-right font-display">{t.thQty}</th>
                <th className="py-3 px-4 text-right font-display">{t.thValue}</th>
                <th className="py-3 px-4 text-center font-display">{t.thActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredProducts.map(p => {
                const totalVal = p.quantity * p.sellingPrice;
                const isLowStock = p.quantity > 0 && p.quantity <= p.minQuantity;
                const isOut = p.quantity === 0;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-all font-sans">
                    {/* Barcode */}
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {p.barcode}
                    </td>
                    {/* Name */}
                    <td className="py-3 px-4 font-bold text-slate-950 font-display">
                      {lang === 'ar' ? p.nameAr : p.nameEn}
                    </td>
                    {/* Category */}
                    <td className="py-3 px-4 text-slate-600 font-display">
                      {lang === 'ar' ? p.categoryAr : p.categoryEn}
                    </td>
                    {/* Buying price */}
                    <td className="py-3 px-4 font-medium text-slate-600">
                      {p.buyingPrice.toFixed(2)} {t.currency}
                    </td>
                    {/* Selling price */}
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {p.sellingPrice.toFixed(2)} {t.currency}
                    </td>
                    {/* Qty */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-950">{p.quantity}</span>
                        {isOut && (
                          <span className="px-1.5 py-0.5 bg-red-50 text-red-700 font-bold text-[9px] rounded-full">
                            {t.statusOut}
                          </span>
                        )}
                        {isLowStock && (
                          <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 font-bold text-[9px] rounded-full flex items-center gap-0.5">
                            <AlertTriangle size={8} />
                            {t.statusLow}
                          </span>
                        )}
                      </div>
                    </td>
                    {/* Stock Value */}
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {totalVal.toFixed(2)} {t.currency}
                    </td>
                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center items-center gap-1.5">
                        <button 
                          onClick={() => openEditModal(p)}
                          className="p-1.5 bg-slate-50 text-slate-600 hover:text-slate-950 border border-slate-100 rounded-lg hover:bg-slate-100 cursor-pointer"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button 
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 bg-red-50 text-red-600 hover:text-red-800 border border-red-100 rounded-lg hover:bg-red-100 cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-[#006c49] flex items-center justify-center mx-auto shadow-inner">
                        <Layers size={24} />
                      </div>
                      <p className="text-sm font-bold text-slate-800 font-display">
                        {lang === 'ar' ? 'لا توجد منتجات في قائمة المخزون حالياً' : 'No products in inventory yet'}
                      </p>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                        {lang === 'ar' 
                          ? 'ابدأ بتسجيل سلع متجرك الحقيقية بالضغط على زر "إضافة منتج جديد" أو استخدام ماسح الباركود.' 
                          : 'Start registering your store items by clicking "Add New Product" or using the barcode scanner.'}
                      </p>
                      <button
                        onClick={openAddModal}
                        className="mt-2 px-4 py-2 bg-[#006c49] hover:bg-[#005237] text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-2 shadow-xs cursor-pointer"
                      >
                        <Plus size={14} />
                        <span>{t.addBtn}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Add Inventory Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[92vh] overflow-y-auto p-4 sm:p-5 border border-slate-100 shadow-xl animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm sm:text-base font-bold text-slate-950 font-display flex items-center gap-2">
                <Plus className="text-emerald-600" size={18} />
                <span>{t.addTitle}</span>
              </h3>
              <button 
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="mt-3 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                
                {/* Barcode */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    {t.thBarcode}
                  </label>
                  <div className="flex gap-1.5">
                    <input 
                      type="text" 
                      required
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                    <button 
                      type="button"
                      onClick={() => setScannerTarget('form')}
                      className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold font-display flex items-center gap-1 cursor-pointer shrink-0"
                      title={lang === 'ar' ? 'مسح باركود المنتج بالكاميرا' : 'Scan barcode with camera'}
                    >
                      <Camera size={13} />
                      <span className="text-[11px]">{lang === 'ar' ? 'كاميرا' : 'Scan'}</span>
                    </button>
                    <button 
                      type="button"
                      onClick={handleGenerateBarcode}
                      className="px-2.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-[11px] font-semibold font-display flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <RefreshCw size={12} />
                      <span>{t.generateBarcode}</span>
                    </button>
                  </div>
                </div>

                {/* Name Arabic */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    {t.labelAr} <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="مثال: شوكولاتة كادبوري"
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-right bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-semibold"
                  />
                </div>

                {/* Name English */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    {t.labelEn} <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Cadbury Chocolate"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-left bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-semibold"
                  />
                </div>

                {/* Unified Single Category Field */}
                <div className="space-y-1 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                      <Tag size={13} className="text-[#006c49]" />
                      <span>{t.categoryLabel}</span>
                    </label>
                    {isCustomCategory && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomCategory(false);
                          if (combinedCategoryOptions.length > 0) {
                            setCategoryAr(combinedCategoryOptions[0].ar);
                            setCategoryEn(combinedCategoryOptions[0].en);
                          }
                        }}
                        className="text-[10px] text-[#006c49] hover:underline font-bold cursor-pointer"
                      >
                        {lang === 'ar' ? '← العودة للقائمة' : '← Back to List'}
                      </button>
                    )}
                  </div>

                  {!isCustomCategory ? (
                    <select
                      value={categoryAr}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '__CUSTOM__') {
                          setIsCustomCategory(true);
                          setCustomCategoryInputAr('');
                          setCustomCategoryInputEn('');
                        } else {
                          const matched = combinedCategoryOptions.find(c => c.ar === val);
                          if (matched) {
                            setCategoryAr(matched.ar);
                            setCategoryEn(matched.en);
                          }
                        }
                      }}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#006c49] font-bold text-slate-800 cursor-pointer"
                    >
                      {combinedCategoryOptions.map((catOption) => (
                        <option key={catOption.ar} value={catOption.ar}>
                          {lang === 'ar' ? catOption.ar : catOption.en}
                        </option>
                      ))}
                      <option value="__CUSTOM__" className="font-bold text-amber-700 bg-amber-50">
                        {lang === 'ar' ? '+ كتابة تصنيف جديد / مخصص...' : '+ Enter Custom Category...'}
                      </option>
                    </select>
                  ) : (
                    <div className="space-y-1 animate-fade-in">
                      <input
                        type="text"
                        required
                        autoFocus
                        placeholder={lang === 'ar' ? 'أدخل اسم التصنيف الجديد...' : 'Enter new category name...'}
                        value={customCategoryInputAr}
                        onChange={(e) => {
                          setCustomCategoryInputAr(e.target.value);
                          setCustomCategoryInputEn(e.target.value);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-amber-300 text-xs bg-amber-50/70 focus:outline-none focus:ring-1 focus:ring-amber-500 font-bold text-slate-800"
                      />
                    </div>
                  )}
                </div>

                {/* Qty */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    {t.thQty}
                  </label>
                  <input 
                    type="number" 
                    min="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-semibold"
                  />
                </div>

                {/* Min stock warning */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    {t.labelMinQty}
                  </label>
                  <input 
                    type="number" 
                    min="1"
                    value={minQuantity}
                    onChange={(e) => setMinQuantity(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-semibold"
                  />
                </div>

                {/* Buying price */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    {t.thPriceBuy} ({t.currency})
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={buyingPrice}
                    onChange={(e) => setBuyingPrice(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-semibold"
                  />
                </div>

                {/* Selling price */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    {t.thPriceSell} ({t.currency})
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-bold"
                  />
                </div>

              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100 mt-2">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2 bg-[#006c49] hover:bg-[#005237] text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  {t.addSubmit}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Edit Inventory Item Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[92vh] overflow-y-auto p-4 sm:p-5 border border-slate-100 shadow-xl animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm sm:text-base font-bold text-slate-950 font-display flex items-center gap-2">
                <Edit2 className="text-[#006c49]" size={18} />
                <span>{t.editTitle}</span>
              </h3>
              <button 
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="mt-3 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                
                {/* Product Name label info static */}
                <div className="sm:col-span-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex justify-between items-center text-xs">
                  <span className="font-bold font-display text-slate-800">
                    {lang === 'ar' ? editingProduct.nameAr : editingProduct.nameEn}
                  </span>
                  <span className="font-mono text-slate-500 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">{editingProduct.barcode}</span>
                </div>

                {/* Unified Single Category Field */}
                <div className="space-y-1 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                      <Tag size={13} className="text-[#006c49]" />
                      <span>{t.categoryLabel}</span>
                    </label>
                    {isCustomCategory && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomCategory(false);
                          if (combinedCategoryOptions.length > 0) {
                            setCategoryAr(combinedCategoryOptions[0].ar);
                            setCategoryEn(combinedCategoryOptions[0].en);
                          }
                        }}
                        className="text-[10px] text-[#006c49] hover:underline font-bold cursor-pointer"
                      >
                        {lang === 'ar' ? '← العودة للقائمة' : '← Back to List'}
                      </button>
                    )}
                  </div>

                  {!isCustomCategory ? (
                    <select
                      value={categoryAr}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '__CUSTOM__') {
                          setIsCustomCategory(true);
                          setCustomCategoryInputAr('');
                          setCustomCategoryInputEn('');
                        } else {
                          const matched = combinedCategoryOptions.find(c => c.ar === val);
                          if (matched) {
                            setCategoryAr(matched.ar);
                            setCategoryEn(matched.en);
                          }
                        }
                      }}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#006c49] font-bold text-slate-800 cursor-pointer"
                    >
                      {combinedCategoryOptions.map((catOption) => (
                        <option key={catOption.ar} value={catOption.ar}>
                          {lang === 'ar' ? catOption.ar : catOption.en}
                        </option>
                      ))}
                      <option value="__CUSTOM__" className="font-bold text-amber-700 bg-amber-50">
                        {lang === 'ar' ? '+ كتابة تصنيف جديد / مخصص...' : '+ Enter Custom Category...'}
                      </option>
                    </select>
                  ) : (
                    <div className="space-y-1 animate-fade-in">
                      <input
                        type="text"
                        required
                        autoFocus
                        placeholder={lang === 'ar' ? 'أدخل اسم التصنيف الجديد...' : 'Enter new category name...'}
                        value={customCategoryInputAr}
                        onChange={(e) => {
                          setCustomCategoryInputAr(e.target.value);
                          setCustomCategoryInputEn(e.target.value);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-amber-300 text-xs bg-amber-50/70 focus:outline-none focus:ring-1 focus:ring-amber-500 font-bold text-slate-800"
                      />
                    </div>
                  )}
                </div>

                {/* Qty stock modifier */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    {t.thQty}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button 
                      type="button"
                      onClick={() => setQuantity(prev => Math.max(0, parseInt(prev || '0') - 1).toString())}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg cursor-pointer text-xs"
                    >
                      -
                    </button>
                    <input 
                      type="number" 
                      min="0"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full px-2 py-1 rounded-xl border border-slate-200 text-center text-xs bg-slate-50 focus:outline-none font-bold"
                    />
                    <button 
                      type="button"
                      onClick={() => setQuantity(prev => (parseInt(prev || '0') + 1).toString())}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg cursor-pointer text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Min Warning Qty */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    {t.labelMinQty}
                  </label>
                  <input 
                    type="number" 
                    min="1"
                    value={minQuantity}
                    onChange={(e) => setMinQuantity(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#006c49] font-semibold"
                  />
                </div>

                {/* Buying price */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    {t.thPriceBuy} ({t.currency})
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={buyingPrice}
                    onChange={(e) => setBuyingPrice(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#006c49] font-semibold"
                  />
                </div>

                {/* Selling price */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    {t.thPriceSell} ({t.currency})
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#006c49] font-bold"
                  />
                </div>

              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100 mt-2">
                <button 
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer"
                >
                  {t.saveBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Camera Barcode Scanner Modal */}
      {scannerTarget !== null && (
        <BarcodeScannerModal
          lang={lang}
          isOpen={scannerTarget !== null}
          onClose={() => setScannerTarget(null)}
          onScanSuccess={handleInventoryCameraScan}
          title={lang === 'ar' ? 'كاميرا المخزون: مسح الباركود' : 'Inventory Scanner: Read Barcode'}
          continuous={false}
        />
      )}

    </div>
  );
}
