import React, { useState } from 'react';
import { Language, Product, CustomerDebt, Transaction, AppTab } from '../types';
import { 
  TrendingUp, AlertTriangle, Users, ArrowUpRight, Package, ShoppingCart, 
  DollarSign, Camera, Smartphone, ArrowLeftRight, Search, Plus, 
  CheckCircle2, RefreshCw, X, ShieldAlert, Layers, BellRing, Settings2,
  Sparkles, Bot
} from 'lucide-react';
import { playSuccessSound, playClickSound, playBeepSound } from '../utils/audio';

interface DashboardTabProps {
  lang: Language;
  products: Product[];
  debts: CustomerDebt[];
  transactions: Transaction[];
  onNavigate: (tab: AppTab, filter?: string) => void;
  onUpdateProduct?: (product: Product) => void;
  onOpenAIOrganizer?: () => void;
}

export default function DashboardTab({ 
  lang, 
  products, 
  debts, 
  transactions, 
  onNavigate,
  onUpdateProduct,
  onOpenAIOrganizer
}: DashboardTabProps) {
  // Low Stock State & Refill Modal
  const [filterType, setFilterType] = useState<'all' | 'outOfStock' | 'lowStock'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refillingProduct, setRefillingProduct] = useState<Product | null>(null);
  const [addQtyInput, setAddQtyInput] = useState<number>(10);
  const [editMinQtyInput, setEditMinQtyInput] = useState<number>(5);

  // Calculate stats dynamically
  const totalSales = transactions.reduce((sum, tx) => sum + tx.totalAmount, 0);
  const totalProfit = transactions.reduce((sum, tx) => sum + tx.profit, 0);
  
  // Products that are low on stock or completely out
  const lowStockProducts = products.filter(p => p.quantity <= p.minQuantity);
  const outOfStockCount = products.filter(p => p.quantity === 0).length;
  const criticalLowCount = products.filter(p => p.quantity > 0 && p.quantity <= p.minQuantity).length;

  const totalDebtsAmount = debts.reduce((sum, d) => sum + d.totalDebt, 0);
  const activeDebtorsCount = debts.filter(d => d.totalDebt > 0).length;

  const translations = {
    ar: {
      salesTitle: "إجمالي المبيعات",
      profitTitle: "الربح المحقق",
      lowStockTitle: "السلع منخفضة المخزون",
      debtsTitle: "إجمالي الديون المعلقة",
      currency: "د.ج",
      vsPrevWeek: "مقارنة بالأسبوع الماضي",
      vsPrevMonth: "مقارنة بالشهر الماضي",
      activeDebtors: "من أصل {count} عملاء نشطين",
      alertsHeader: "التنبيهات العاجلة والديون",
      alertsSub: "قائمة محدثة تلقائياً بالسلع والديون المستحقة",
      refillAction: "إعادة تعبئة",
      collectAction: "تحصيل الدفع",
      recentSalesHeader: "مبيعات اليوم الأخيرة",
      recentSalesSub: "آخر العمليات المسجلة على الكاشير",
      noSalesYet: "لم يتم تسجيل أي عمليات بيع اليوم بعد.",
      viewAllSales: "عرض كل العمليات",
      viewAllInventory: "إدارة المخزون كامل",
      weeklyChartHeader: "أداء المبيعات الأسبوعي",
      sat: "السبت", sun: "الأحد", mon: "الإثنين", tue: "الثلاثاء", wed: "الأربعاء", thu: "الخميس", fri: "الجمعة",
      
      // Smart Low Stock Section
      smartAlertsHeader: "تنبيهات المخزون الذكية (المنتجات القريبة من النفاد)",
      smartAlertsSub: "مراقبة مستمرة للسلع التي بلغت أو تجاوزت الحد الأدنى للكمية المحددة في المخزون",
      filterAll: "الكل",
      filterOut: "نفد بالكامل (0)",
      filterLow: "مستوى حرج (أقل من الحد)",
      searchAlertsPlaceholder: "البحث في تنبيهات المخزون باسم السلعة أو الباركود...",
      outOfStockBadge: "نفد بالكامل",
      criticalBadge: "قريب من النفاد",
      quickAddQty: "شحن سريع",
      refillModalTitle: "إعادة تعبئة وضبط حد التنبيه للسلعة",
      currentStockLabel: "المخزون الحالي المتوفر:",
      addStockLabel: "الكمية المضافة للمخزون (+):",
      minQtyThresholdLabel: "حد التنبيه الأدنى للنفاد:",
      saveRefillBtn: "حفظ وتحديث الكمية بالمخزون",
      cancelBtn: "إلغاء",
      noLowStockFound: "ممتاز! جميع المنتجات في المخزون متوفرة بأسعار وكميات كافية.",
      stockLevelGauge: "مستوى المخزون الحالي"
    },
    en: {
      salesTitle: "Total Sales",
      profitTitle: "Net Profit",
      lowStockTitle: "Low Stock Items",
      debtsTitle: "Pending Customer Debts",
      currency: "DZD",
      vsPrevWeek: "vs previous week",
      vsPrevMonth: "vs previous month",
      activeDebtors: "across {count} active debtors",
      alertsHeader: "Actionable Alerts & Tasks",
      alertsSub: "Auto-generated list of depleted stock and pending collections",
      refillAction: "Refill",
      collectAction: "Collect Payment",
      recentSalesHeader: "Recent Transactions",
      recentSalesSub: "Latest transactions processed on the POS checkout",
      noSalesYet: "No sales recorded yet today.",
      viewAllSales: "View All Sales",
      viewAllInventory: "Manage Inventory",
      weeklyChartHeader: "Weekly Sales Performance",
      sat: "Sat", sun: "Sun", mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri",

      // Smart Low Stock Section
      smartAlertsHeader: "Smart Inventory Low-Stock Alerts",
      smartAlertsSub: "Real-time tracking of items reaching or below their minimum stock threshold",
      filterAll: "All Low Stock",
      filterOut: "Out of Stock (0)",
      filterLow: "Near Depletion",
      searchAlertsPlaceholder: "Search low stock alerts by item name or barcode...",
      outOfStockBadge: "Out of Stock",
      criticalBadge: "Low Stock Alert",
      quickAddQty: "Quick Top-Up",
      refillModalTitle: "Refill Stock & Set Alert Limit",
      currentStockLabel: "Current Stock Available:",
      addStockLabel: "Quantity to Add (+):",
      minQtyThresholdLabel: "Minimum Alert Threshold:",
      saveRefillBtn: "Save & Update Inventory",
      cancelBtn: "Cancel",
      noLowStockFound: "Great news! All products have healthy stock levels.",
      stockLevelGauge: "Current Stock Gauge"
    }
  };

  const t = translations[lang];

  // Map Arabic days of week
  const days = [t.sat, t.sun, t.mon, t.tue, t.wed, t.thu, t.fri];

  // Calculate dynamic weekly sales chart from real transactions
  const chartSales = React.useMemo(() => {
    const dailyTotals = [0, 0, 0, 0, 0, 0, 0]; // Sat, Sun, Mon, Tue, Wed, Thu, Fri
    if (transactions.length === 0) return dailyTotals;

    transactions.forEach(tx => {
      if (!tx.date) return;
      const txDate = new Date(tx.date);
      const day = txDate.getDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
      // Map to Sat=0, Sun=1, Mon=2, Tue=3, Wed=4, Thu=5, Fri=6
      const mappedIdx = (day + 1) % 7;
      dailyTotals[mappedIdx] += tx.totalAmount;
    });

    return dailyTotals;
  }, [transactions]);

  const maxSaleValue = Math.max(...chartSales, 100);

  // Filter low stock products for the dedicated smart alert panel
  const filteredLowStockList = lowStockProducts.filter(p => {
    const matchesSearch = searchQuery.trim() === '' || 
      p.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery);

    if (!matchesSearch) return false;

    if (filterType === 'outOfStock') return p.quantity === 0;
    if (filterType === 'lowStock') return p.quantity > 0;
    return true; // 'all'
  }).sort((a, b) => {
    // Sort 0 quantity items first, then lowest quantity ratio
    if (a.quantity === 0 && b.quantity !== 0) return -1;
    if (a.quantity !== 0 && b.quantity === 0) return 1;
    return (a.quantity / (a.minQuantity || 1)) - (b.quantity / (b.minQuantity || 1));
  });

  // Handle Quick Direct Add (+5, +10, +20)
  const handleQuickAdd = (p: Product, addAmount: number) => {
    if (!onUpdateProduct) return;
    playSuccessSound();
    const updatedProduct: Product = {
      ...p,
      quantity: p.quantity + addAmount
    };
    onUpdateProduct(updatedProduct);
  };

  // Open Refill Modal
  const openRefillModal = (p: Product) => {
    playClickSound();
    setRefillingProduct(p);
    setAddQtyInput(10);
    setEditMinQtyInput(p.minQuantity || 5);
  };

  // Submit Refill Modal
  const handleSaveRefill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refillingProduct || !onUpdateProduct) return;

    playSuccessSound();
    const qtyToAdd = Math.max(0, Number(addQtyInput) || 0);
    const newMin = Math.max(1, Number(editMinQtyInput) || 1);

    const updated: Product = {
      ...refillingProduct,
      quantity: refillingProduct.quantity + qtyToAdd,
      minQuantity: newMin
    };

    onUpdateProduct(updated);
    setRefillingProduct(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* AI Store Organizer Banner */}
      {onOpenAIOrganizer && (
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white p-4 sm:p-5 rounded-2xl border border-emerald-500/30 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 flex items-center justify-center shrink-0">
              <Sparkles size={24} className="animate-pulse" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h4 className="text-base font-black font-display text-emerald-300">
                  {lang === 'ar' ? 'منظّم المتجر الذكي بالذكاء الاصطناعي (AI Store Organizer)' : 'AI Store Organizer & Layout Assistant'}
                </h4>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-full border border-emerald-500/40">
                  Gemini AI
                </span>
              </div>
              <p className="text-xs text-emerald-100/80 leading-relaxed">
                {lang === 'ar' 
                  ? 'ترتيب الرفوف والواجهة، تقسيم الأقسام، اقتراح العروض المربحة وأولويات الشراء لكل تاجر مسجل'
                  : 'Smart shelf arrangement, product categorization, combo offers, and inventory priorities'}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenAIOrganizer}
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Bot size={16} />
            <span>{lang === 'ar' ? 'فتح مُنظّم المتجر الذكي' : 'Launch AI Organizer'}</span>
          </button>
        </div>
      )}

      {/* Smart Alert Top Notification Banner if there are depleted/low-stock products */}
      {lowStockProducts.length > 0 && (
        <div className="bg-gradient-to-r from-amber-900/90 via-slate-900 to-red-950 text-white p-4 rounded-2xl border border-amber-500/30 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center shrink-0">
              <BellRing size={22} className="animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-extrabold font-display text-amber-300">
                  {lang === 'ar' ? 'تنبيه مخزون ذكي عاجل' : 'Urgent Smart Inventory Alert'}
                </h4>
                {outOfStockCount > 0 && (
                  <span className="bg-red-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full animate-pulse">
                    {outOfStockCount} {lang === 'ar' ? 'نفذت بالكامل' : 'Out of Stock'}
                  </span>
                )}
              </div>
              <p className="text-xs text-amber-100/80 mt-0.5">
                {lang === 'ar' 
                  ? `يوجد ${lowStockProducts.length} منتجات وصلت أو تجاوزت حد النفاد الأدنى في محلك. يمكنك تزويدها بنقرة واحدة من اللوحة بالأسفل.`
                  : `There are ${lowStockProducts.length} items reaching critical low stock level. Refill them easily below.`}
              </p>
            </div>
          </div>

          <a 
            href="#smart-stock-section"
            onClick={(e) => {
              e.preventDefault();
              const elem = document.getElementById('smart-stock-section');
              if (elem) elem.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all whitespace-nowrap cursor-pointer shrink-0 self-end sm:self-center"
          >
            {lang === 'ar' ? 'مراجعة وشحن السلع الآن ↓' : 'Review & Refill Items ↓'}
          </a>
        </div>
      )}

      {/* Quick POS Camera & Mobile Sync Feature Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Camera Scanner Quick Trigger */}
        <div 
          onClick={() => onNavigate('sales')}
          className="p-4 bg-gradient-to-r from-emerald-900 to-[#0f172a] text-white rounded-2xl border border-emerald-800/50 shadow-md flex items-center justify-between cursor-pointer hover:shadow-lg transition-all active:scale-[0.99] group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Camera size={24} />
            </div>
            <div>
              <h4 className="text-sm font-extrabold font-display text-white">
                {lang === 'ar' ? 'كاميرا الهاتف لمسح باركود المنتجات' : 'Phone Camera Barcode Scanner'}
              </h4>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                {lang === 'ar' ? 'افتح الكاشير واضغط على الكاميرا للبيع الفوري بالنقر' : 'Open POS cashier register and scan barcodes live'}
              </p>
            </div>
          </div>
          <ArrowUpRight size={18} className="text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </div>

        {/* Cross-Device Sync Quick Banner */}
        <div 
          onClick={() => {
            const syncBtn = document.querySelector('button[title*="ربط"]') as HTMLButtonElement;
            if (syncBtn) syncBtn.click();
          }}
          className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between cursor-pointer hover:border-slate-400 hover:shadow-md transition-all active:scale-[0.99] group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 group-hover:scale-110 transition-transform">
              <ArrowLeftRight size={22} />
            </div>
            <div>
              <h4 className="text-sm font-extrabold font-display text-slate-950 flex items-center gap-2">
                <span>{lang === 'ar' ? 'ربط الهاتف بالكمبيوتر (تزامن حقيقي)' : 'Link Phone & PC (Live Sync)'}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === 'ar' ? 'امسح رمز QR من هاتف المحمول لربط الحساب والمخزون بـ الكمبيوتر' : 'Scan QR code from phone to pair account & inventory'}
              </p>
            </div>
          </div>
          <Smartphone size={18} className="text-slate-400 group-hover:text-slate-900 transition-colors" />
        </div>

      </div>

      {/* 1. Dynamic Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.salesTitle}</span>
            <span className="p-2 bg-slate-50 rounded-xl text-slate-800">
              <DollarSign size={18} />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-display font-extrabold text-slate-950">
              {totalSales.toFixed(2)} <span className="text-xs font-semibold text-slate-400 font-sans">{t.currency}</span>
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-[#006c49]">
            <ArrowUpRight size={14} />
            <span className="font-semibold">+14.2%</span>
            <span className="text-slate-400">{t.vsPrevWeek}</span>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.profitTitle}</span>
            <span className="p-2 bg-emerald-50 rounded-xl text-[#006c49]">
              <TrendingUp size={18} />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-display font-extrabold text-[#006c49]">
              {totalProfit.toFixed(2)} <span className="text-xs font-semibold text-emerald-600/60 font-sans">{t.currency}</span>
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-[#006c49]">
            <ArrowUpRight size={14} />
            <span className="font-semibold">+8.5%</span>
            <span className="text-slate-400">{t.vsPrevMonth}</span>
          </div>
        </div>

        {/* Low Stock alerts */}
        <div 
          onClick={() => {
            const elem = document.getElementById('smart-stock-section');
            if (elem) elem.scrollIntoView({ behavior: 'smooth' });
          }}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.lowStockTitle}</span>
            <span className={`p-2 rounded-xl transition-colors ${lowStockProducts.length > 0 ? 'bg-amber-50 text-amber-600 group-hover:bg-amber-100' : 'bg-slate-50 text-slate-400'}`}>
              <Package size={18} />
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className={`text-3xl font-display font-extrabold ${lowStockProducts.length > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {lowStockProducts.length}
            </span>
            {outOfStockCount > 0 && (
              <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                {outOfStockCount} {lang === 'ar' ? 'نفذت' : 'empty'}
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs">
            <span className={`font-semibold ${lowStockProducts.length > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
              {lowStockProducts.length > 0 
                ? (lang === 'ar' ? `تحتاج إعادة تعبئة وشحن` : `${lowStockProducts.length} items to refill`) 
                : (lang === 'ar' ? 'المخزون متوفر وسليم' : 'Stock healthy')
              }
            </span>
          </div>
        </div>

        {/* Total Debts */}
        <div 
          onClick={() => onNavigate('debts')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-amber-200 transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.debtsTitle}</span>
            <span className={`p-2 rounded-xl transition-colors ${totalDebtsAmount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
              <Users size={18} />
            </span>
          </div>
          <div className="mt-4">
            <span className={`text-3xl font-display font-extrabold ${totalDebtsAmount > 0 ? 'text-amber-600' : 'text-slate-950'}`}>
              {totalDebtsAmount.toFixed(2)} <span className="text-xs font-semibold text-slate-400 font-sans">{t.currency}</span>
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
            <span>{t.activeDebtors.replace('{count}', activeDebtorsCount.toString())}</span>
          </div>
        </div>
      </div>

      {/* 🌟 DEDICATED SMART LOW STOCK ALERTS PANEL 🌟 */}
      <div id="smart-stock-section" className="bg-white p-6 rounded-3xl border border-amber-200/80 shadow-md space-y-5 relative">
        
        {/* Header & Subtitle */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
              <AlertTriangle size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold font-display text-slate-950">
                  {t.smartAlertsHeader}
                </h3>
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300">
                  {lowStockProducts.length} {lang === 'ar' ? 'سلعة' : 'items'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
                {t.smartAlertsSub}
              </p>
            </div>
          </div>

          <button 
            onClick={() => onNavigate('inventory', 'low-stock')}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 self-start md:self-auto cursor-pointer shadow-xs"
          >
            <Package size={15} />
            <span>{t.viewAllInventory}</span>
          </button>
        </div>

        {/* Filter Pills & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Quick Category / Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/60 overflow-x-auto no-scrollbar">
            <button
              onClick={() => { playClickSound(); setFilterType('all'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                filterType === 'all' 
                  ? 'bg-white text-slate-950 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.filterAll} ({lowStockProducts.length})
            </button>

            <button
              onClick={() => { playClickSound(); setFilterType('outOfStock'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                filterType === 'outOfStock' 
                  ? 'bg-red-600 text-white shadow-xs' 
                  : 'text-red-600 hover:bg-red-50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              <span>{t.filterOut} ({outOfStockCount})</span>
            </button>

            <button
              onClick={() => { playClickSound(); setFilterType('lowStock'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                filterType === 'lowStock' 
                  ? 'bg-amber-600 text-white shadow-xs' 
                  : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              {t.filterLow} ({criticalLowCount})
            </button>
          </div>

          {/* Search Box inside Alerts */}
          <div className="relative min-w-[240px]">
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchAlertsPlaceholder}
              className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white font-sans"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs"
              >
                ✕
              </button>
            )}
          </div>

        </div>

        {/* Low Stock Products List */}
        {filteredLowStockList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[460px] overflow-y-auto pr-1 pt-1">
            {filteredLowStockList.map((p) => {
              const isOut = p.quantity === 0;
              const safeMax = Math.max((p.minQuantity || 5) * 2, 10);
              const percentage = Math.min(100, Math.round((p.quantity / safeMax) * 100));

              return (
                <div 
                  key={p.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    isOut 
                      ? 'bg-red-50/60 border-red-200 hover:border-red-300 shadow-xs' 
                      : 'bg-amber-50/40 border-amber-200/80 hover:border-amber-300 shadow-xs'
                  }`}
                >
                  {/* Top row: Name, barcode, status badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black font-display text-slate-950">
                          {lang === 'ar' ? p.nameAr : p.nameEn}
                        </h4>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono">
                          {p.barcode}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {lang === 'ar' ? `سعر البيع: ${p.sellingPrice} د.ج` : `Sell price: ${p.sellingPrice} DZD`}
                      </p>
                    </div>

                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border whitespace-nowrap flex items-center gap-1 ${
                      isOut 
                        ? 'bg-red-600 text-white border-red-700 shadow-xs' 
                        : 'bg-amber-500/10 text-amber-800 border-amber-300'
                    }`}>
                      {isOut && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>}
                      <span>{isOut ? t.outOfStockBadge : t.criticalBadge}</span>
                    </span>
                  </div>

                  {/* Stock Gauge Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className={isOut ? 'text-red-700' : 'text-amber-800'}>
                        {lang === 'ar' 
                          ? `المتبقي: ${p.quantity} قطع (الحد الأدنى للنفاد: ${p.minQuantity})` 
                          : `Stock: ${p.quantity} units (Min threshold: ${p.minQuantity})`}
                      </span>
                      <span className="text-slate-400 font-mono">{percentage}%</span>
                    </div>

                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${Math.max(percentage, isOut ? 0 : 5)}%` }}
                        className={`h-full transition-all duration-500 ${
                          isOut ? 'bg-red-600' : 'bg-amber-500'
                        }`}
                      ></div>
                    </div>
                  </div>

                  {/* Quick Action Top-Up Buttons */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-500 font-semibold ml-1">
                        {lang === 'ar' ? 'إضافة سريعة:' : 'Quick Add:'}
                      </span>
                      {[+5, +10, +20].map((addNum) => (
                        <button
                          key={addNum}
                          type="button"
                          onClick={() => handleQuickAdd(p, addNum)}
                          className="px-2 py-1 bg-white hover:bg-emerald-600 hover:text-white text-slate-800 text-[10px] font-bold rounded-lg border border-slate-200 transition-all cursor-pointer shadow-2xs"
                          title={lang === 'ar' ? `زيادة ${addNum} قطع فوراً` : `Add +${addNum} items`}
                        >
                          +{addNum}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => openRefillModal(p)}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] rounded-xl transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={13} />
                      <span>{t.refillAction}</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center space-y-2">
            <CheckCircle2 size={36} className="mx-auto text-emerald-500" />
            <h4 className="text-xs font-bold text-slate-800 font-display">
              {t.noLowStockFound}
            </h4>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              {lang === 'ar' 
                ? 'لا توجد أي سلعة وصلت إلى حد النفاد الأدنى المحدد. سيقوم النظام بالتنبيه تلقائياً بمجرد انخفاض أي كمية.' 
                : 'No products are currently reaching their alert threshold.'}
            </p>
          </div>
        )}

      </div>

      {/* 2. Visual Reports Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold font-display text-slate-950">{t.weeklyChartHeader}</h3>
          </div>
          <div className="flex items-center gap-2 text-xs bg-slate-50 p-1.5 rounded-xl border border-slate-100">
            <span className="w-2.5 h-2.5 bg-[#131b2e] rounded-full inline-block"></span>
            <span className="font-semibold text-slate-600">{t.salesTitle}</span>
          </div>
        </div>
        
        {/* Custom Visual SVG Chart */}
        <div className="w-full h-56 pt-2 select-none">
          <div className="h-44 w-full flex items-end justify-between px-2 sm:px-4 relative border-b border-slate-100">
            <div className="absolute inset-x-0 top-0 h-px bg-slate-50 border-t border-dashed border-slate-200/60 pointer-events-none"></div>
            <div className="absolute inset-x-0 top-1/3 h-px bg-slate-50 border-t border-dashed border-slate-200/60 pointer-events-none"></div>
            <div className="absolute inset-x-0 top-2/3 h-px bg-slate-50 border-t border-dashed border-slate-200/60 pointer-events-none"></div>
            
            {chartSales.map((val, idx) => {
              const heightPct = `${(val / maxSaleValue) * 100}%`;
              return (
                <div key={idx} className="flex flex-col items-center flex-1 group z-10">
                  <div className="relative w-full flex justify-center items-end h-36">
                    <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 bg-[#131b2e] text-white text-[10px] py-1 px-2.5 rounded-lg shadow-md transition-all whitespace-nowrap z-30 font-display">
                      {val.toFixed(1)} {t.currency}
                    </div>
                    <div 
                      style={{ height: heightPct }} 
                      className={`w-6 sm:w-10 rounded-t-lg transition-all duration-500 hover:brightness-110 cursor-pointer ${
                        idx === chartSales.length - 1 ? 'bg-[#006c49]' : 'bg-[#131b2e]'
                      }`}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between items-center text-[11px] font-semibold text-slate-400 mt-2.5 px-2 sm:px-4">
            {days.map((day, idx) => (
              <span key={idx} className="flex-1 text-center font-display">{day}</span>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Splits for Action Alerts & Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Actions Feed */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-base font-bold font-display text-slate-950">{t.alertsHeader}</h3>
            <p className="text-xs text-slate-500 font-sans mt-0.5">{t.alertsSub}</p>
          </div>

          <div className="space-y-3.5 flex-1 max-h-[320px] overflow-y-auto pr-1">
            {/* Low stock alerts summary */}
            {lowStockProducts.slice(0, 3).map(p => (
              <div key={p.id} className="p-3.5 bg-amber-50/50 border border-amber-200/60 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-100 rounded-xl text-amber-600">
                    <AlertTriangle size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 font-display">
                      {lang === 'ar' ? p.nameAr : p.nameEn}
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-sans">
                      {lang === 'ar' ? `المتبقي: ${p.quantity} قطع (الحد الأدنى: ${p.minQuantity})` : `Qty remaining: ${p.quantity} (Min: ${p.minQuantity})`}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => openRefillModal(p)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] rounded-lg transition-all cursor-pointer"
                >
                  {t.refillAction}
                </button>
              </div>
            ))}

            {/* Debts reminder alert */}
            {debts.filter(d => d.totalDebt > 100).map(d => (
              <div key={d.id} className="p-3.5 bg-red-50/40 border border-red-200/50 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                    <Users size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 font-display">
                      {d.name}
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-sans">
                      {lang === 'ar' ? `رصيد دين مستحق: ${d.totalDebt.toFixed(2)} د.ج` : `Outstanding debt: ${d.totalDebt.toFixed(2)} DZD`}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => onNavigate('debts')}
                  className="px-3 py-1.5 bg-[#0F172A] hover:bg-slate-800 text-white font-semibold text-[11px] rounded-lg transition-all cursor-pointer"
                >
                  {t.collectAction}
                </button>
              </div>
            ))}

            {lowStockProducts.length === 0 && debts.length === 0 && (
              <div className="py-8 text-center text-slate-400 text-xs">
                <Package size={32} className="mx-auto text-slate-300 mb-2" />
                <span>{lang === 'ar' ? 'لا توجد تنبيهات معلقة حالياً' : 'No urgent alerts at this time.'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions Feed */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-base font-bold font-display text-slate-950">{t.recentSalesHeader}</h3>
              <p className="text-xs text-slate-500 font-sans mt-0.5">{t.recentSalesSub}</p>
            </div>
            <button 
              onClick={() => onNavigate('analytics')}
              className="text-xs font-bold text-[#006c49] hover:underline"
            >
              {t.viewAllSales}
            </button>
          </div>

          <div className="space-y-3 flex-1 max-h-[320px] overflow-y-auto pr-1">
            {transactions.slice(0, 4).map(tx => (
              <div key={tx.id} className="p-3 bg-slate-50 border border-slate-200/40 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-slate-200/60 rounded-lg text-slate-700">
                    <ShoppingCart size={15} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 font-display">
                        #{tx.id.replace('tx-', '')}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        tx.paymentMethod === 'cash' ? 'bg-emerald-50 text-emerald-700' :
                        tx.paymentMethod === 'card' ? 'bg-sky-50 text-sky-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {tx.paymentMethod.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(tx.date).toLocaleTimeString(lang === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold font-display text-slate-950 block">
                    {tx.totalAmount.toFixed(2)} {t.currency}
                  </span>
                  <span className="text-[9px] text-[#006c49] font-semibold">
                    +{tx.profit.toFixed(2)} {t.currency} profit
                  </span>
                </div>
              </div>
            ))}

            {transactions.length === 0 && (
              <div className="py-12 text-center text-slate-400 text-xs">
                {t.noSalesYet}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 🛠️ REFILL & MINIMUM ALERT THRESHOLD MODAL 🛠️ */}
      {refillingProduct && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <RefreshCw size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold font-display text-slate-950">
                    {t.refillModalTitle}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-bold">
                    {lang === 'ar' ? refillingProduct.nameAr : refillingProduct.nameEn} ({refillingProduct.barcode})
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setRefillingProduct(null)}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveRefill} className="space-y-4">
              
              {/* Current Stock Banner */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
                <span className="text-slate-600 font-semibold">{t.currentStockLabel}</span>
                <span className={`font-mono font-black px-2.5 py-1 rounded-lg ${
                  refillingProduct.quantity === 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {refillingProduct.quantity} {lang === 'ar' ? 'قطع' : 'units'}
                </span>
              </div>

              {/* Quantity to Add */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">
                  {t.addStockLabel}
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    value={addQtyInput}
                    onChange={(e) => setAddQtyInput(Number(e.target.value))}
                    className="flex-1 py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold font-mono text-slate-900 focus:outline-none focus:border-emerald-600"
                    required
                  />
                  <div className="flex gap-1">
                    {[10, 20, 50].map(amt => (
                      <button
                        type="button"
                        key={amt}
                        onClick={() => setAddQtyInput(amt)}
                        className="px-2.5 py-2 bg-slate-100 hover:bg-emerald-100 text-slate-800 hover:text-emerald-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        +{amt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Min Threshold */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">
                  {t.minQtyThresholdLabel}
                </label>
                <input
                  type="number"
                  min="1"
                  value={editMinQtyInput}
                  onChange={(e) => setEditMinQtyInput(Number(e.target.value))}
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold font-mono text-slate-900 focus:outline-none focus:border-emerald-600"
                  required
                />
                <p className="text-[10px] text-slate-400">
                  {lang === 'ar' ? 'سيتم إظهار تنبيه في اللوحة بمجرد انخفاض الكمية المتبقية إلى هذا العدد أو أقل.' : 'System triggers alert when stock drops to this number or below.'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRefillingProduct(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl transition-all shadow-md cursor-pointer"
                >
                  {t.saveRefillBtn}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
