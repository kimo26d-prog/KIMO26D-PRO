import React, { useState } from 'react';
import { Language, CustomerDebt, DebtRecord } from '../types';
import { Search, UserCheck, Plus, DollarSign, Calendar, Eye, FileText, CheckCircle, Smartphone } from 'lucide-react';
import { playSuccessSound, playErrorSound, playNotificationSound } from '../utils/audio';

interface DebtsTabProps {
  lang: Language;
  debts: CustomerDebt[];
  onAddDebtCustomer: (customer: CustomerDebt) => void;
  onUpdateCustomerDebts: (updatedDebts: CustomerDebt[]) => void;
}

export default function DebtsTab({ lang, debts, onAddDebtCustomer, onUpdateCustomerDebts }: DebtsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDebtor, setSelectedDebtor] = useState<CustomerDebt | null>(null);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAddDebtModal, setShowAddDebtModal] = useState(false);

  // Form states
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [addDebtAmount, setAddDebtAmount] = useState('');
  const [addDebtNote, setAddDebtNote] = useState('');

  const translations = {
    ar: {
      searchPlaceholder: "ابحث بالاسم أو رقم الجوال...",
      totalPortfolio: "المحفظة الإجمالية للديون المستحقة",
      debtorsCount: "عدد المدينين النشطين",
      addDebtor: "تسجيل عميل جديد",
      thName: "اسم العميل",
      thPhone: "رقم الجوال",
      thBalance: "الرصيد المطلوب",
      thLastAction: "آخر حركة للعميل",
      thActions: "إجراءات وسداد",
      recordPayment: "تسديد دفعة",
      addDebt: "تسجيل دين يدوي",
      viewStatement: "كشف حساب",
      statementTitle: "دفتر حساب وكشف عمليات",
      custSummary: "ملخص حساب العميل",
      date: "التاريخ",
      type: "نوع الحركة",
      amount: "المبلغ",
      note: "البيان / ملاحظة",
      settlement: "تسوية / سداد",
      incurred: "شراء بالآجل",
      paymentMethod: "طريقة السداد / التحويل",
      paymentSuccess: "تم تسجيل الحركة بنجاح وتحديث كشف الحساب.",
      currency: "د.ج",
      noDebtors: "لا يوجد عملاء مدينين حالياً بالدفتر.",
      confirmPayment: "سداد رصيد",
      confirmAddDebt: "قيد دين جديد",
      manualNoteDefault: "قيد يدوي بالدفتر",
      paymentNoteDefault: "تسديد دفعة نقدية",
      printStatement: "طباعة كشف الحساب",
      close: "إغلاق",
      custName: "اسم العميل الكامل",
      custPhone: "رقم الجوال",
      submitCust: "تسجيل العميل"
    },
    en: {
      searchPlaceholder: "Search by customer name or mobile...",
      totalPortfolio: "Total Outstanding Store Debt Portfolio",
      debtorsCount: "Active Debtor Accounts",
      addDebtor: "Add New Account",
      thName: "Customer Name",
      thPhone: "Mobile Phone",
      thBalance: "Outstanding Balance",
      thLastAction: "Last Transaction",
      thActions: "Ledger Actions",
      recordPayment: "Record Payment",
      addDebt: "Incur Debt",
      viewStatement: "Ledger Details",
      statementTitle: "Customer Account Ledger & Audit Trail",
      custSummary: "Customer Summary Profile",
      date: "Date",
      type: "Type",
      amount: "Amount",
      note: "Details / Note",
      settlement: "Credit Payment",
      incurred: "Debt Addition",
      paymentMethod: "Payment Method",
      paymentSuccess: "Ledger updated successfully.",
      currency: "DZD",
      noDebtors: "No debtor accounts currently in the register.",
      confirmPayment: "Record Settle Payment",
      confirmAddDebt: "Add Credit Debt",
      manualNoteDefault: "Manual ledger debt adjustment",
      paymentNoteDefault: "Direct credit installment payment",
      printStatement: "Print Ledger Statement",
      close: "Close",
      custName: "Full Customer Name",
      custPhone: "Phone Number",
      submitCust: "Add Customer"
    }
  };

  const t = translations[lang];

  // Calculations
  const totalOutstandingPortfolio = debts.reduce((sum, d) => sum + d.totalDebt, 0);
  const activeDebtorsCount = debts.filter(d => d.totalDebt > 0).length;

  const filteredDebtors = debts.filter(d => {
    const query = searchQuery.toLowerCase().trim();
    return d.name.toLowerCase().includes(query) || d.phone.includes(query);
  });

  const handleAddDebtorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim()) {
      playErrorSound();
      return;
    }

    const newCustomer: CustomerDebt = {
      id: 'debt-' + Date.now(),
      name: custName.trim(),
      phone: custPhone.trim() || 'N/A',
      totalDebt: 0,
      lastTransactionDate: new Date().toISOString(),
      history: []
    };

    onAddDebtCustomer(newCustomer);
    playNotificationSound();
    setCustName('');
    setCustPhone('');
    setShowAddCustomerModal(false);
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebtor) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      playErrorSound();
      alert(lang === 'ar' ? 'يرجى إدخال مبلغ صحيح' : 'Please enter a valid amount');
      return;
    }

    if (amount > selectedDebtor.totalDebt) {
      if (!window.confirm(lang === 'ar' ? 'المبلغ المدفوع يتجاوز رصيد الدين الحالي! هل تريد المتابعة لتسوية الحساب؟' : 'Payment exceeds outstanding debt! Proceed anyway?')) {
        return;
      }
    }

    const updatedDebts = debts.map(d => {
      if (d.id === selectedDebtor.id) {
        const newRecord: DebtRecord = {
          date: new Date().toISOString(),
          amount: amount,
          type: 'payment',
          note: paymentNote.trim() || t.paymentNoteDefault
        };
        const updatedDebt = {
          ...d,
          totalDebt: Math.max(0, d.totalDebt - amount),
          lastTransactionDate: new Date().toISOString(),
          history: [newRecord, ...d.history]
        };
        // Update selection in view state too
        setSelectedDebtor(updatedDebt);
        return updatedDebt;
      }
      return d;
    });

    onUpdateCustomerDebts(updatedDebts);
    setPaymentAmount('');
    setPaymentNote('');
    setShowPaymentModal(false);
    playSuccessSound();
    alert(t.paymentSuccess);
  };

  const handleAddDebtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebtor) return;

    const amount = parseFloat(addDebtAmount);
    if (isNaN(amount) || amount <= 0) {
      playErrorSound();
      alert(lang === 'ar' ? 'يرجى إدخال مبلغ صحيح' : 'Please enter a valid amount');
      return;
    }

    const updatedDebts = debts.map(d => {
      if (d.id === selectedDebtor.id) {
        const newRecord: DebtRecord = {
          date: new Date().toISOString(),
          amount: amount,
          type: 'add',
          note: addDebtNote.trim() || t.manualNoteDefault
        };
        const updatedDebt = {
          ...d,
          totalDebt: d.totalDebt + amount,
          lastTransactionDate: new Date().toISOString(),
          history: [newRecord, ...d.history]
        };
        setSelectedDebtor(updatedDebt);
        return updatedDebt;
      }
      return d;
    });

    onUpdateCustomerDebts(updatedDebts);
    setAddDebtAmount('');
    setAddDebtNote('');
    setShowAddDebtModal(false);
    playNotificationSound();
    alert(t.paymentSuccess);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Portfolio Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Outstanding store debts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              {t.totalPortfolio}
            </span>
            <span className="text-2xl font-display font-extrabold text-amber-600 block mt-1">
              {totalOutstandingPortfolio.toFixed(2)} <span className="text-xs font-semibold text-slate-400 font-sans">{t.currency}</span>
            </span>
          </div>
          <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
            <DollarSign size={24} />
          </div>
        </div>

        {/* Debtor accounts count */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              {t.debtorsCount}
            </span>
            <span className="text-2xl font-display font-extrabold text-slate-900 block mt-1">
              {activeDebtorsCount}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl text-slate-800">
            <UserCheck size={24} />
          </div>
        </div>
      </div>

      {/* 2. Main Ledger splits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left pane: Debtors list (Col Span 7) */}
        <div className="lg:col-span-7 space-y-4">
          
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3 justify-between items-center">
            <div className="relative w-full sm:max-w-xs">
              <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">
                <Search size={18} />
              </span>
              <input 
                type="text" 
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full py-2 pr-9 pl-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:border-slate-950 ${lang === 'ar' ? 'text-right' : 'text-left'}`}
              />
            </div>
            <button
              onClick={() => setShowAddCustomerModal(true)}
              className="w-full sm:w-auto px-4 py-2 bg-slate-950 text-white font-bold font-display text-xs rounded-xl hover:bg-slate-800 transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              <Plus size={14} />
              <span>{t.addDebtor}</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4 text-right font-display">{t.thName}</th>
                    <th className="py-3 px-4 text-right font-display">{t.thPhone}</th>
                    <th className="py-3 px-4 text-right font-display">{t.thBalance}</th>
                    <th className="py-3 px-4 text-right font-display">{t.thLastAction}</th>
                    <th className="py-3 px-4 text-center font-display">{t.thActions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredDebtors.map(d => {
                    const hasDebt = d.totalDebt > 0;
                    const isSelected = selectedDebtor?.id === d.id;

                    return (
                      <tr 
                        key={d.id} 
                        className={`hover:bg-slate-50/50 transition-all cursor-pointer ${isSelected ? 'bg-slate-50 border-r-2 border-slate-900' : ''}`}
                        onClick={() => setSelectedDebtor(d)}
                      >
                        <td className="py-3.5 px-4 font-bold text-slate-950 font-display">
                          {d.name}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono">
                          {d.phone}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`font-extrabold font-display text-sm ${hasDebt ? 'text-amber-600' : 'text-slate-400'}`}>
                            {d.totalDebt.toFixed(2)} {t.currency}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 font-sans">
                          {d.lastTransactionDate 
                            ? new Date(d.lastTransactionDate).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' })
                            : 'N/A'
                          }
                        </td>
                        <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => {
                              setSelectedDebtor(d);
                              setSelectedDebtor(d);
                            }}
                            className="text-slate-900 font-bold hover:underline"
                          >
                            {t.viewStatement}
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredDebtors.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        {t.noDebtors}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right pane: Account details & Statement (Col Span 5) */}
        <div className="lg:col-span-5">
          {selectedDebtor ? (
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-5 animate-fade-in" id="printable-area">
              
              {/* Profile Card Summary */}
              <div className="pb-4 border-b border-slate-100">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-bold font-display text-slate-950">{selectedDebtor.name}</h3>
                    <p className="text-xs text-slate-400 font-mono flex items-center gap-1 mt-1">
                      <Smartphone size={12} />
                      <span>{selectedDebtor.phone}</span>
                    </p>
                  </div>
                  <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                    <UserCheck size={20} />
                  </span>
                </div>
                
                {/* Outstanding balance badge */}
                <div className="mt-4 p-4 bg-amber-50/50 border border-amber-200/40 rounded-xl flex justify-between items-center">
                  <span className="text-xs font-semibold text-amber-950 font-display">{translations[lang].thBalance}</span>
                  <span className="text-xl font-display font-extrabold text-amber-600">
                    {selectedDebtor.totalDebt.toFixed(2)} <span className="text-xs font-semibold text-slate-400 font-sans">{t.currency}</span>
                  </span>
                </div>

                {/* Direct quick action buttons */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="py-2 px-3 bg-[#006c49] text-white hover:bg-[#005236] font-semibold text-xs rounded-xl text-center transition-all cursor-pointer flex justify-center items-center gap-1"
                  >
                    <CheckCircle size={14} />
                    <span>{t.recordPayment}</span>
                  </button>

                  <button
                    onClick={() => setShowAddDebtModal(true)}
                    className="py-2 px-3 bg-[#0F172A] text-white hover:bg-slate-800 font-semibold text-xs rounded-xl text-center transition-all cursor-pointer flex justify-center items-center gap-1"
                  >
                    <Plus size={14} />
                    <span>{t.addDebt}</span>
                  </button>
                </div>
              </div>

              {/* Transactions list */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-bold text-slate-900 font-display flex items-center gap-1">
                    <FileText size={14} />
                    <span>{t.statementTitle}</span>
                  </h4>
                  <button 
                    onClick={handlePrint}
                    className="text-[10px] font-bold text-slate-400 hover:text-slate-950 flex items-center gap-1 border border-slate-100 rounded p-1"
                  >
                    <Calendar size={10} />
                    <span>{t.printStatement}</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                  {selectedDebtor.history.map((record, index) => {
                    const isPayment = record.type === 'payment';
                    return (
                      <div key={index} className={`p-3 rounded-xl border flex justify-between items-center text-xs ${
                        isPayment ? 'bg-emerald-50/50 border-emerald-100' : 'bg-amber-50/30 border-amber-100'
                      }`}>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={`font-bold font-display ${isPayment ? 'text-emerald-700' : 'text-amber-800'}`}>
                              {isPayment ? t.settlement : t.incurred}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(record.date).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">{record.note}</p>
                        </div>
                        <span className={`font-bold font-display ${isPayment ? 'text-emerald-700' : 'text-amber-600'}`}>
                          {isPayment ? '-' : '+'}{record.amount.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}

                  {selectedDebtor.history.length === 0 && (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      No historical entries for this account.
                    </div>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/80 shadow-sm text-slate-400 text-xs h-64 flex flex-col justify-center items-center">
              <UserCheck size={36} className="text-slate-200 mb-2" />
              <span>{lang === 'ar' ? 'اختر عميلاً من القائمة اليسرى لعرض كشف الحساب وتفاصيل الديون' : 'Select a customer from the left list to view their outstanding account ledger.'}</span>
            </div>
          )}
        </div>

      </div>

      {/* MODAL: Add Customer */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 border border-slate-100 shadow-xl animate-scale-in">
            <h3 className="text-sm font-bold text-slate-950 font-display flex items-center gap-2">
              <Plus className="text-[#006c49]" size={18} />
              <span>{t.addDebtor}</span>
            </h3>
            
            <form onSubmit={handleAddDebtorSubmit} className="mt-4 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  {t.custName} <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  placeholder={lang === 'ar' ? "مثال: عبدالله الشمري" : "e.g. Abdullah Al-Shammeri"}
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
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
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:border-slate-950 text-left font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                >
                  {t.close}
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

      {/* MODAL: Record Settle Payment */}
      {showPaymentModal && selectedDebtor && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 border border-slate-100 shadow-xl animate-scale-in">
            <h3 className="text-sm font-bold text-slate-950 font-display flex items-center gap-2">
              <CheckCircle className="text-[#006c49]" size={18} />
              <span>{t.recordPayment} : {selectedDebtor.name}</span>
            </h3>
            
            <form onSubmit={handleRecordPaymentSubmit} className="mt-4 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  {t.amount} ({t.currency}) <span className="text-red-500">*</span>
                </label>
                <input 
                  type="number" 
                  required
                  step="0.01"
                  min="0.1"
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-center bg-slate-50 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  {t.note}
                </label>
                <input 
                  type="text" 
                  placeholder={t.paymentNoteDefault}
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none ${lang === 'ar' ? 'text-right' : 'text-left'}`}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                >
                  {t.close}
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2 bg-[#006c49] hover:bg-[#005236] text-white font-semibold text-xs rounded-xl transition-all cursor-pointer"
                >
                  {t.confirmPayment}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Record Incur Debt */}
      {showAddDebtModal && selectedDebtor && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 border border-slate-100 shadow-xl animate-scale-in">
            <h3 className="text-sm font-bold text-slate-950 font-display flex items-center gap-2">
              <Plus className="text-amber-600" size={18} />
              <span>{t.addDebt} : {selectedDebtor.name}</span>
            </h3>
            
            <form onSubmit={handleAddDebtSubmit} className="mt-4 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  {t.amount} ({t.currency}) <span className="text-red-500">*</span>
                </label>
                <input 
                  type="number" 
                  required
                  step="0.01"
                  min="0.1"
                  placeholder="0.00"
                  value={addDebtAmount}
                  onChange={(e) => setAddDebtAmount(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-center bg-slate-50 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  {t.note}
                </label>
                <input 
                  type="text" 
                  placeholder={t.manualNoteDefault}
                  value={addDebtNote}
                  onChange={(e) => setAddDebtNote(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none ${lang === 'ar' ? 'text-right' : 'text-left'}`}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowAddDebtModal(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                >
                  {t.close}
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer"
                >
                  {t.confirmAddDebt}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
