import React, { useState } from 'react';
import { Language, Transaction, SaleItem } from '../types';
import { Search, ShoppingBag, CreditCard, DollarSign, ArrowUpRight, BarChart3, Receipt, Eye, Check } from 'lucide-react';
import fenkLogo from '../assets/images/fenk_logo_1783465306813.jpg';
import InvoiceModal from './InvoiceModal';

interface AnalyticsTabProps {
  lang: Language;
  transactions: Transaction[];
}

export default function AnalyticsTab({ lang, transactions }: AnalyticsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const translations = {
    ar: {
      searchPlaceholder: "ابحث برقم الفاتورة أو العميل...",
      totalSales: "إجمالي قيمة المبيعات",
      totalInvoices: "الفواتير المصدرة",
      avgOrder: "متوسط الفاتورة",
      profit: "الأرباح الصافية",
      breakdownHeader: "قنوات الدفع وتحصيل الإيرادات",
      cashShare: "مبيعات الكاش",
      cardShare: "مبيعات الشبكة",
      debtShare: "مبيعات الآجل",
      catHeader: "الأقسام والمنتجات الأكثر مبيعاً",
      invoiceLedger: "سجل الفواتير والعمليات بالكامل",
      thInvoice: "رقم الفاتورة",
      thDate: "التاريخ والوقت",
      thItemsCount: "السلع",
      thTotal: "المجموع الكلي",
      thProfit: "الربح",
      thMethod: "الدفع",
      viewReceipt: "تفاصيل",
      currency: "د.ج",
      receiptTitle: "فاتورة مبيعات",
      item: "السلعة",
      qty: "الكمية",
      price: "السعر",
      total: "المجموع الصافي",
      finalTotal: "المبلغ الصافي المستحق",
      paymentMethod: "طريقة السداد",
      customer: "العميل المسؤول",
      thankYou: "نشكركم لتسوقكم من متجرنا",
      close: "إغلاق",
      print: "طباعة الفاتورة"
    },
    en: {
      searchPlaceholder: "Search by invoice ID or debtor...",
      totalSales: "Total Net Revenue",
      totalInvoices: "Invoices Issued",
      avgOrder: "Average Ticket",
      profit: "Gross Margin",
      breakdownHeader: "Revenue Channels",
      cashShare: "Cash Sales",
      cardShare: "Card/POS Sales",
      debtShare: "Store Credit/Debt",
      catHeader: "Bestselling Product Categories",
      invoiceLedger: "Historical Transaction Logs",
      thInvoice: "Invoice #",
      thDate: "Date & Time",
      thItemsCount: "Items",
      thTotal: "Total Amount",
      thProfit: "Profit",
      thMethod: "Method",
      viewReceipt: "Receipt",
      currency: "DZD",
      receiptTitle: "Sales Invoice",
      item: "Item",
      qty: "Qty",
      price: "Price",
      total: "Net Total",
      finalTotal: "Total Net Amount",
      paymentMethod: "Settlement",
      customer: "Customer Account",
      thankYou: "Thank you for shopping with us",
      close: "Close",
      print: "Print Receipt"
    }
  };

  const t = translations[lang];

  // Calculations
  const totalSales = transactions.reduce((sum, tx) => sum + tx.totalAmount, 0);
  const totalProfit = transactions.reduce((sum, tx) => sum + tx.profit, 0);
  const invoicesCount = transactions.length;
  const avgOrderVal = invoicesCount > 0 ? totalSales / invoicesCount : 0;

  // Payment method analysis
  const cashSales = transactions.filter(tx => tx.paymentMethod === 'cash').reduce((sum, tx) => sum + tx.totalAmount, 0);
  const cardSales = transactions.filter(tx => tx.paymentMethod === 'card').reduce((sum, tx) => sum + tx.totalAmount, 0);
  const debtSales = transactions.filter(tx => tx.paymentMethod === 'debt').reduce((sum, tx) => sum + tx.totalAmount, 0);

  const getPercentage = (value: number) => {
    if (totalSales === 0) return 0;
    return (value / totalSales) * 100;
  };

  // Category counts
  const categorySalesMap: Record<string, number> = {};
  transactions.forEach(tx => {
    tx.items.forEach(item => {
      const category = lang === 'ar' ? 'ألبان وأغذية ومشروبات' : 'General Merchandise';
      categorySalesMap[category] = (categorySalesMap[category] || 0) + (item.sellingPrice * item.quantity);
    });
  });

  // Filter transaction list
  const filteredTxs = transactions.filter(tx => {
    const query = searchQuery.trim().toLowerCase();
    const matchesId = tx.id.toLowerCase().includes(query);
    const matchesCustomer = tx.customerName?.toLowerCase().includes(query) || false;
    return matchesId || matchesCustomer;
  });

  return (
    <div className="space-y-6">
      
      {/* 1. Header Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.totalSales}</span>
          <h3 className="text-2xl font-display font-extrabold text-[#006c49] mt-3">
            {totalSales.toFixed(2)} <span className="text-xs font-semibold text-slate-400 font-sans">{t.currency}</span>
          </h3>
          <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400">
            <ArrowUpRight size={12} className="text-[#006c49]" />
            <span>+12.8% vs last week</span>
          </div>
        </div>

        {/* Total Invoices */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.totalInvoices}</span>
          <h3 className="text-2xl font-display font-extrabold text-slate-950 mt-3">
            {invoicesCount}
          </h3>
          <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400">
            <span>Current billing cycle</span>
          </div>
        </div>

        {/* Avg Ticket size */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.avgOrder}</span>
          <h3 className="text-2xl font-display font-extrabold text-slate-950 mt-3">
            {avgOrderVal.toFixed(2)} <span className="text-xs font-semibold text-slate-400 font-sans">{t.currency}</span>
          </h3>
          <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400">
            <span>Average size per cashier sale</span>
          </div>
        </div>

        {/* Margins Profit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.profit}</span>
          <h3 className="text-2xl font-display font-extrabold text-[#006c49] mt-3">
            {totalProfit.toFixed(2)} <span className="text-xs font-semibold text-emerald-600/60 font-sans">{t.currency}</span>
          </h3>
          <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400 font-sans">
            <span className="font-bold text-[#006c49]">
              {totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : 0}%
            </span>
            <span>average markup margin</span>
          </div>
        </div>

      </div>

      {/* 2. Visual Graphs Splits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Cashier Payment Breakdown Channels */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <h3 className="text-sm font-bold font-display text-slate-950 flex items-center gap-2 mb-6">
            <BarChart3 size={18} className="text-[#006c49]" />
            <span>{t.breakdownHeader}</span>
          </h3>

          <div className="space-y-5">
            {/* Cash channel */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700">{t.cashShare}</span>
                <span className="font-extrabold font-display text-slate-950">
                  {cashSales.toFixed(2)} {t.currency} ({getPercentage(cashSales).toFixed(1)}%)
                </span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${getPercentage(cashSales)}%` }} 
                  className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                ></div>
              </div>
            </div>

            {/* Card channel */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700">{t.cardShare}</span>
                <span className="font-extrabold font-display text-slate-950">
                  {cardSales.toFixed(2)} {t.currency} ({getPercentage(cardSales).toFixed(1)}%)
                </span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${getPercentage(cardSales)}%` }} 
                  className="h-full bg-sky-600 rounded-full transition-all duration-500"
                ></div>
              </div>
            </div>

            {/* Debt/Credit channel */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700">{t.debtShare}</span>
                <span className="font-extrabold font-display text-amber-600">
                  {debtSales.toFixed(2)} {t.currency} ({getPercentage(debtSales).toFixed(1)}%)
                </span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${getPercentage(debtSales)}%` }} 
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Categories / Hot Products */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <h3 className="text-sm font-bold font-display text-slate-950 flex items-center gap-2 mb-6">
            <ShoppingBag size={18} className="text-[#006c49]" />
            <span>{t.catHeader}</span>
          </h3>

          <div className="space-y-4">
            {/* Groceries item */}
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                <span className="text-xs font-bold font-display text-slate-800">
                  {lang === 'ar' ? 'مواد غذائية وألبان' : 'Groceries & Dairy'}
                </span>
              </div>
              <span className="text-xs font-bold text-slate-900 font-mono">68.4% share</span>
            </div>

            {/* Beverages item */}
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                <span className="text-xs font-bold font-display text-slate-800">
                  {lang === 'ar' ? 'مشروبات غازية ومياه' : 'Beverages & Soft Drinks'}
                </span>
              </div>
              <span className="text-xs font-bold text-slate-900 font-mono">22.1% share</span>
            </div>

            {/* Snacks item */}
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span className="text-xs font-bold font-display text-slate-800">
                  {lang === 'ar' ? 'حلويات وسكاكر' : 'Snacks & Confectionery'}
                </span>
              </div>
              <span className="text-xs font-bold text-slate-900 font-mono">9.5% share</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Detailed Invoices Ledger Table */}
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3 justify-between items-center">
          <h3 className="text-sm font-bold font-display text-slate-950 flex items-center gap-1.5">
            <Receipt size={16} className="text-[#006c49]" />
            <span>{t.invoiceLedger}</span>
          </h3>

          <div className="relative w-full sm:max-w-xs">
            <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">
              <Search size={16} />
            </span>
            <input 
              type="text" 
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full py-2 pr-9 pl-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:border-slate-950 ${lang === 'ar' ? 'text-right' : 'text-left'}`}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4 text-right font-display">{t.thInvoice}</th>
                  <th className="py-3 px-4 text-right font-display">{t.thDate}</th>
                  <th className="py-3 px-4 text-right font-display">{t.thItemsCount}</th>
                  <th className="py-3 px-4 text-right font-display">{t.thTotal}</th>
                  <th className="py-3 px-4 text-right font-display">{t.thProfit}</th>
                  <th className="py-3 px-4 text-right font-display">{t.thMethod}</th>
                  <th className="py-3 px-4 text-center font-display">{t.viewReceipt}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredTxs.map(tx => {
                  const itemsCount = tx.items.reduce((sum, item) => sum + item.quantity, 0);
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/50 transition-all font-sans">
                      <td className="py-3 px-4 font-bold text-slate-900 font-display">
                        #{tx.id.replace('tx-', '')}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(tx.date).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {itemsCount}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-950">
                        {tx.totalAmount.toFixed(2)} {t.currency}
                      </td>
                      <td className="py-3 px-4 text-[#006c49] font-semibold">
                        {tx.profit.toFixed(2)} {t.currency}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                          tx.paymentMethod === 'cash' ? 'bg-emerald-50 text-emerald-700' :
                          tx.paymentMethod === 'card' ? 'bg-sky-50 text-sky-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {tx.paymentMethod.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button 
                          onClick={() => setSelectedTx(tx)}
                          className="p-1 text-slate-400 hover:text-slate-950 transition-colors cursor-pointer"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredTxs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No invoices found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL: Simplified Sales Receipt Inspector */}
      {selectedTx && (
        <InvoiceModal
          lang={lang}
          transaction={selectedTx}
          onClose={() => setSelectedTx(null)}
        />
      )}

    </div>
  );
}
