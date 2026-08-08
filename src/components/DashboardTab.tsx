import React from 'react';
import { Language, Product, CustomerDebt, Transaction, AppTab } from '../types';
import { TrendingUp, AlertTriangle, Users, ArrowUpRight, ArrowDownRight, Package, ShoppingCart, DollarSign, Camera, Smartphone, ArrowLeftRight } from 'lucide-react';

interface DashboardTabProps {
  lang: Language;
  products: Product[];
  debts: CustomerDebt[];
  transactions: Transaction[];
  onNavigate: (tab: AppTab, filter?: string) => void;
}

export default function DashboardTab({ lang, products, debts, transactions, onNavigate }: DashboardTabProps) {
  // Calculate stats dynamically
  const totalSales = transactions.reduce((sum, tx) => sum + tx.totalAmount, 0);
  const totalProfit = transactions.reduce((sum, tx) => sum + tx.profit, 0);
  
  const lowStockProducts = products.filter(p => p.quantity <= p.minQuantity);
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
      alertsHeader: "التنبيهات العاجلة والإجراءات المطلوبة",
      alertsSub: "قائمة محدثة تلقائياً بالسلع الموشكة على النفاد والديون المستحقة",
      refillAction: "إعادة تعبئة",
      collectAction: "تحصيل الدفع",
      recentSalesHeader: "مبيعات اليوم الأخيرة",
      recentSalesSub: "آخر العمليات المسجلة على الكاشير",
      noSalesYet: "لم يتم تسجيل أي عمليات بيع اليوم بعد.",
      viewAllSales: "عرض كل العمليات",
      viewAllInventory: "إدارة المخزون كامل",
      weeklyChartHeader: "أداء المبيعات الأسبوعي",
      sat: "السبت", sun: "الأحد", mon: "الإثنين", tue: "الثلاثاء", wed: "الأربعاء", thu: "الخميس", fri: "الجمعة"
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
      sat: "Sat", sun: "Sun", mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri"
    }
  };

  const t = translations[lang];

  // Map Arabic days of week
  const days = lang === 'ar' 
    ? [t.sat, t.sun, t.mon, t.tue, t.wed, t.thu, t.fri]
    : [t.sat, t.sun, t.mon, t.tue, t.wed, t.thu, t.fri];

  // Mock sales values for chart matching transaction totals
  const chartSales = [180, 240, 150, 310, 210, 420, totalSales]; 
  const maxSaleValue = Math.max(...chartSales, 500);

  return (
    <div className="space-y-6">
      
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
            // Dispatch event or navigate
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
          onClick={() => onNavigate('inventory', 'low-stock')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-amber-200 transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.lowStockTitle}</span>
            <span className={`p-2 rounded-xl transition-colors ${lowStockProducts.length > 0 ? 'bg-amber-50 text-amber-600 group-hover:bg-amber-100' : 'bg-slate-50 text-slate-400'}`}>
              <Package size={18} />
            </span>
          </div>
          <div className="mt-4">
            <span className={`text-3xl font-display font-extrabold ${lowStockProducts.length > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {lowStockProducts.length}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs">
            <span className={`font-semibold ${lowStockProducts.length > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
              {lowStockProducts.length > 0 ? `${lowStockProducts.length} items to refill` : 'Stock healthy'}
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
            {/* Horizontal Grid Lines */}
            <div className="absolute inset-x-0 top-0 h-px bg-slate-50 border-t border-dashed border-slate-200/60 pointer-events-none"></div>
            <div className="absolute inset-x-0 top-1/3 h-px bg-slate-50 border-t border-dashed border-slate-200/60 pointer-events-none"></div>
            <div className="absolute inset-x-0 top-2/3 h-px bg-slate-50 border-t border-dashed border-slate-200/60 pointer-events-none"></div>
            
            {chartSales.map((val, idx) => {
              const heightPct = `${(val / maxSaleValue) * 100}%`;
              return (
                <div key={idx} className="flex flex-col items-center flex-1 group z-10">
                  <div className="relative w-full flex justify-center items-end h-36">
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 bg-[#131b2e] text-white text-[10px] py-1 px-2.5 rounded-lg shadow-md transition-all whitespace-nowrap z-30 font-display">
                      {val.toFixed(1)} {t.currency}
                    </div>
                    {/* Bar */}
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
          {/* Chart Labels */}
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
            {/* Low stock alerts */}
            {lowStockProducts.map(p => (
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
                  onClick={() => onNavigate('inventory', 'low-stock')}
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
                <span>No urgent alerts at this time. All systems optimal!</span>
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

    </div>
  );
}
