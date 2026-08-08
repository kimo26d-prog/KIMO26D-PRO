import React, { useState } from 'react';
import { Language, Product } from '../types';
import { CATEGORIES } from '../data';
import { Search, Plus, Filter, AlertTriangle, Edit2, Trash2, RefreshCw, Layers, Camera, CheckCircle2 } from 'lucide-react';
import BarcodeScannerModal from './BarcodeScannerModal';
import { playBeepSound, playSuccessSound, playErrorSound, playClickSound } from '../utils/audio';

interface InventoryTabProps {
  lang: Language;
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  initialFilter?: string; // e.g. 'low-stock'
}

export default function InventoryTab({ lang, products, onAddProduct, onUpdateProduct, onDeleteProduct, initialFilter = '' }: InventoryTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockStatus, setStockStatus] = useState(initialFilter || 'all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

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
  // Form states for adding product
  const [barcode, setBarcode] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [category, setCategory] = useState('groceries');
  const [buyingPrice, setBuyingPrice] = useState('0.00');
  const [sellingPrice, setSellingPrice] = useState('0.00');
  const [quantity, setQuantity] = useState('0');
  const [minQuantity, setMinQuantity] = useState('5');

  const translations = {
    ar: {
      searchPlaceholder: "البحث بالاسم أو الباركود...",
      addBtn: "إضافة سلعة جديدة",
      categoryLabel: "التصنيف",
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
      categoryLabel: "Category",
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
    
    // Category filter mapping
    const catObj = CATEGORIES.find(c => c.id === selectedCategory);
    const matchesCategory = selectedCategory === 'all' || 
                            p.categoryAr === catObj?.ar || 
                            p.categoryEn === catObj?.en;
    
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

    // Category mapping to text
    const matchedCategory = CATEGORIES.find(c => c.id === category) || CATEGORIES[1];

    const newProduct: Product = {
      id: 'prod-' + Date.now(),
      barcode: barcode.trim() || 'NO-BARCODE',
      nameAr: nameAr.trim(),
      nameEn: nameEn.trim(),
      categoryAr: matchedCategory.ar,
      categoryEn: matchedCategory.en,
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
    setCategory('groceries');
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
    const catKey = CATEGORIES.find(c => c.ar === product.categoryAr)?.id || 'groceries';
    setCategory(catKey);
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

    const matchedCategory = CATEGORIES.find(c => c.id === category) || CATEGORIES[1];

    const updatedProduct: Product = {
      ...editingProduct,
      barcode: barcode.trim(),
      nameAr: nameAr.trim(),
      nameEn: nameEn.trim(),
      categoryAr: matchedCategory.ar,
      categoryEn: matchedCategory.en,
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
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white/10 rounded-xl text-xs font-semibold">
            {products.length} {t.activeItems}
          </div>
          <button 
            onClick={() => {
              handleGenerateBarcode();
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold font-display text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
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
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none"
            >
              {CATEGORIES.map(cat => (
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
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Layers className="mx-auto text-slate-200 mb-2" size={32} />
                    <span>No products found matching filters.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Add Inventory Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 border border-slate-100 shadow-xl animate-scale-in">
            <h3 className="text-base font-bold text-slate-950 font-display flex items-center gap-2">
              <Plus className="text-emerald-600" size={20} />
              <span>{t.addTitle}</span>
            </h3>
            
            <form onSubmit={handleAddSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Barcode */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 block">
                    {t.thBarcode}
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      required
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono bg-slate-50 focus:outline-none"
                    />
                    <button 
                      type="button"
                      onClick={() => setScannerTarget('form')}
                      className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold font-display flex items-center gap-1 cursor-pointer"
                      title={lang === 'ar' ? 'مسح باركود المنتج بالكاميرا' : 'Scan barcode with camera'}
                    >
                      <Camera size={14} />
                      <span className="hidden sm:inline">{lang === 'ar' ? 'الكاميرا' : 'Scan'}</span>
                    </button>
                    <button 
                      type="button"
                      onClick={handleGenerateBarcode}
                      className="px-3 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-semibold font-display flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw size={13} />
                      <span>{t.generateBarcode}</span>
                    </button>
                  </div>
                </div>

                {/* Name Arabic */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    {t.labelAr} <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="مثال: شوكولاتة كادبوري 90 جرام"
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-right bg-slate-50 focus:outline-none"
                  />
                </div>

                {/* Name English */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    {t.labelEn} <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Cadbury Chocolate 90g"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-left bg-slate-50 focus:outline-none"
                  />
                </div>

                {/* Category Selection */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    {t.categoryLabel}
                  </label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none"
                  >
                    {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {lang === 'ar' ? cat.ar : cat.en}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Qty */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    {t.thQty}
                  </label>
                  <input 
                    type="number" 
                    min="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none"
                  />
                </div>

                {/* Buying price */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    {t.thPriceBuy} ({t.currency})
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={buyingPrice}
                    onChange={(e) => setBuyingPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none"
                  />
                </div>

                {/* Selling price */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    {t.thPriceSell} ({t.currency})
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none"
                  />
                </div>

                {/* Min stock for warnings */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 block">
                    {t.labelMinQty}
                  </label>
                  <input 
                    type="number" 
                    min="1"
                    value={minQuantity}
                    onChange={(e) => setMinQuantity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none"
                  />
                </div>

              </div>

              <div className="flex gap-2.5 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer"
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 border border-slate-100 shadow-xl animate-scale-in">
            <h3 className="text-base font-bold text-slate-950 font-display flex items-center gap-2">
              <Edit2 className="text-[#006c49]" size={18} />
              <span>{t.editTitle}</span>
            </h3>
            
            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Product Name label info static */}
                <div className="sm:col-span-2 p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                  <span className="font-bold font-display text-slate-800">
                    {lang === 'ar' ? editingProduct.nameAr : editingProduct.nameEn}
                  </span>
                  <span className="font-mono text-slate-400">{editingProduct.barcode}</span>
                </div>

                {/* Qty stock modifier */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    {t.thQty}
                  </label>
                  <div className="flex items-center gap-2">
                    <button 
                      type="button"
                      onClick={() => setQuantity(prev => Math.max(0, parseInt(prev || '0') - 1).toString())}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg cursor-pointer text-sm"
                    >
                      -
                    </button>
                    <input 
                      type="number" 
                      min="0"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-center text-sm bg-slate-50 focus:outline-none"
                    />
                    <button 
                      type="button"
                      onClick={() => setQuantity(prev => (parseInt(prev || '0') + 1).toString())}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg cursor-pointer text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Min Warning Qty */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    {t.labelMinQty}
                  </label>
                  <input 
                    type="number" 
                    min="1"
                    value={minQuantity}
                    onChange={(e) => setMinQuantity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none"
                  />
                </div>

                {/* Buying price */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    {t.thPriceBuy} ({t.currency})
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={buyingPrice}
                    onChange={(e) => setBuyingPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none"
                  />
                </div>

                {/* Selling price */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    {t.thPriceSell} ({t.currency})
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none font-bold"
                  />
                </div>

              </div>

              <div className="flex gap-2.5 pt-4">
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
