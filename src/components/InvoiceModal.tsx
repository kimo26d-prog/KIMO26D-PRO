import React, { useState } from 'react';
import { Transaction, Language } from '../types';
import { Printer, Download, X, Check, Share2, ShoppingBag, Store, Phone, Calendar, Hash, FileText, MapPin } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import fenkLogo from '../assets/images/fenk_logo_1783465306813.jpg';
import { exportInvoiceToPdf, printInvoiceDirect } from '../utils/invoicePdf';
import { playSuccessSound, playClickSound } from '../utils/audio';

interface InvoiceModalProps {
  lang: Language;
  transaction: Transaction;
  shopName?: string;
  shopPhone?: string;
  shopAddress?: string;
  shopLogo?: string;
  onClose: () => void;
  isNewSale?: boolean;
}

export default function InvoiceModal({ 
  lang, 
  transaction, 
  shopName, 
  shopPhone,
  shopAddress,
  shopLogo,
  onClose,
  isNewSale = false 
}: InvoiceModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Thermal paper width selector (80mm standard vs 58mm narrow)
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>(() => {
    return (localStorage.getItem('fenk_mahli_paper_width') as '58mm' | '80mm') || '80mm';
  });

  const nameToDisplay = shopName || localStorage.getItem('fenk_mahli_shop_name') || 'بقالة التوفير الحديثة';
  const phoneToDisplay = shopPhone || localStorage.getItem('fenk_mahli_owner_phone') || '0550 12 34 56';
  const addressToDisplay = shopAddress || localStorage.getItem('fenk_mahli_wilaya') || (lang === 'ar' ? 'الجزائر العاصمة' : 'Algiers');
  const logoToDisplay = shopLogo || localStorage.getItem('fenk_mahli_shop_logo') || fenkLogo;

  const totalItemsCount = transaction.items.reduce((sum, item) => sum + item.quantity, 0);
  const formattedDate = new Date(transaction.date).toLocaleString(
    lang === 'ar' ? 'ar-DZ' : 'en-US',
    { dateStyle: 'medium', timeStyle: 'short' }
  );

  const handlePaperWidthChange = (width: '58mm' | '80mm') => {
    playClickSound();
    setPaperWidth(width);
    localStorage.setItem('fenk_mahli_paper_width', width);
  };

  const handlePrint = () => {
    playClickSound();
    printInvoiceDirect('printable-invoice-receipt', paperWidth);
  };

  const handleDownloadPdf = async () => {
    playClickSound();
    setIsExporting(true);
    const fileName = `Invoice_${transaction.id.toUpperCase()}.pdf`;
    await exportInvoiceToPdf('printable-invoice-receipt', fileName);
    setIsExporting(false);
    playSuccessSound();
  };

  const handleWhatsAppShare = () => {
    playClickSound();
    const itemsList = transaction.items
      .map((item) => `• ${lang === 'ar' ? item.productNameAr : item.productNameEn} x${item.quantity} = ${(item.sellingPrice * item.quantity).toFixed(2)} د.ج`)
      .join('\n');

    const text = lang === 'ar'
      ? `📄 *فاتورة مبيعات - ${shopName}*\n` +
        `رقم الفاتورة: #${transaction.id.toUpperCase()}\n` +
        `التاريخ: ${formattedDate}\n` +
        `--------------------\n` +
        `${itemsList}\n` +
        `--------------------\n` +
        `المجموع الكلي: *${transaction.totalAmount.toFixed(2)} د.ج*\n` +
        `طريقة السداد: ${transaction.paymentMethod.toUpperCase()}\n` +
        `شكراً لتسوقكم معنا!`
      : `📄 *Sales Invoice - ${shopName}*\n` +
        `Invoice ID: #${transaction.id.toUpperCase()}\n` +
        `Date: ${formattedDate}\n` +
        `--------------------\n` +
        `${itemsList}\n` +
        `--------------------\n` +
        `Total: *${transaction.totalAmount.toFixed(2)} DZD*\n` +
        `Payment: ${transaction.paymentMethod.toUpperCase()}\n` +
        `Thank you for your visit!`;

    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  const qrCodeData = JSON.stringify({
    store: shopName,
    inv: transaction.id,
    total: transaction.totalAmount,
    date: transaction.date
  });

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-3 sm:p-4 z-50 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-md p-5 sm:p-6 border border-slate-200 shadow-2xl relative my-auto space-y-5">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold font-display text-slate-950">
                {lang === 'ar' ? 'فاتورة مبيعات رسمية' : 'Official Sales Invoice'}
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                #{transaction.id.toUpperCase()}
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Success banner if newly completed sale */}
        {isNewSale && (
          <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 font-bold font-display animate-bounce-in">
            <Check size={18} className="text-emerald-600 shrink-0" />
            <span>
              {lang === 'ar' 
                ? 'تم تسجيل البيع بنجاح وخصم السلع من المخزن!' 
                : 'Sale completed successfully! Stock updated.'}
            </span>
          </div>
        )}

        {/* Thermal Roll Paper Size Selector Bar */}
        <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center justify-between text-xs font-bold gap-1 border border-slate-200">
          <span className="text-[11px] font-bold text-slate-600 px-2 flex items-center gap-1">
            <Printer size={13} className="text-[#006c49]" />
            <span>{lang === 'ar' ? 'عرض رول الطباعة:' : 'Paper Width:'}</span>
          </span>

          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => handlePaperWidthChange('80mm')}
              className={`px-3 py-1 rounded-xl transition-all cursor-pointer text-xs font-extrabold ${
                paperWidth === '80mm'
                  ? 'bg-slate-950 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              80mm {lang === 'ar' ? '(قياسي)' : '(Standard)'}
            </button>
            <button
              type="button"
              onClick={() => handlePaperWidthChange('58mm')}
              className={`px-3 py-1 rounded-xl transition-all cursor-pointer text-xs font-extrabold ${
                paperWidth === '58mm'
                  ? 'bg-[#006c49] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              58mm {lang === 'ar' ? '(حراري ضيق)' : '(Compact POS)'}
            </button>
          </div>
        </div>

        {/* Printable Thermal Receipt Card Container */}
        <div 
          id="printable-invoice-receipt" 
          className={`bg-white border border-slate-200/90 rounded-2xl space-y-3.5 shadow-2xs font-sans text-slate-900 transition-all ${
            paperWidth === '58mm' ? 'receipt-58mm p-3 max-w-[280px]' : 'receipt-80mm p-4 max-w-[360px]'
          }`}
          style={{ width: '100%', margin: '0 auto' }}
        >
          {/* Receipt Top Logo & Store Title */}
          <div className="text-center space-y-1.5 pb-3 border-b border-dashed border-slate-300">
            <img 
              src={logoToDisplay} 
              alt="Store Logo" 
              className={`object-contain mx-auto rounded-xl border border-slate-200/80 p-1 bg-white shadow-2xs transition-all ${
                paperWidth === '58mm' ? 'w-11 h-11' : 'w-14 h-14'
              }`}
              style={{
                imageRendering: 'crisp-edges',
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact'
              }}
            />
            <h4 className={`font-black font-display text-slate-950 tracking-tight ${
              paperWidth === '58mm' ? 'text-sm' : 'text-base'
            }`}>
              {nameToDisplay}
            </h4>
            <p className="text-[10px] text-slate-500 font-medium">
              {lang === 'ar' ? 'فاتورة مبيعات' : 'Sales Invoice'}
            </p>

            {/* Dedicated Space for Store Phone & Address */}
            <div className="pt-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-bold text-slate-900 bg-slate-50 py-1.5 px-2 rounded-lg border border-slate-200/80">
              <div className="flex items-center gap-1">
                <Phone size={12} className="text-emerald-700 shrink-0" />
                <span className="font-mono">{phoneToDisplay}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin size={12} className="text-emerald-700 shrink-0" />
                <span>{addressToDisplay}</span>
              </div>
            </div>
          </div>

          {/* Invoice Metadata Grid */}
          <div className="text-[11px] text-slate-600 font-mono space-y-1 pb-3 border-b border-dashed border-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">{lang === 'ar' ? 'رقم الفاتورة:' : 'Invoice ID:'}</span>
              <span className="font-extrabold text-slate-900">#{transaction.id.toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">{lang === 'ar' ? 'التاريخ والوقت:' : 'Date:'}</span>
              <span className="font-semibold text-slate-800">{formattedDate}</span>
            </div>
            {transaction.customerName && (
              <div className="flex justify-between text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                <span>{lang === 'ar' ? 'العميل المدين:' : 'Debtor Customer:'}</span>
                <span>{transaction.customerName}</span>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="space-y-2">
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="border-b border-slate-300 text-slate-500 font-bold text-[10px]">
                  <th className="py-1 text-right">{lang === 'ar' ? 'السلعة' : 'Item'}</th>
                  <th className="py-1 text-center">{lang === 'ar' ? 'العدد' : 'Qty'}</th>
                  <th className="py-1 text-center">{lang === 'ar' ? 'السعر' : 'Price'}</th>
                  <th className="py-1 text-left">{lang === 'ar' ? 'الإجمالي' : 'Total'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-xs">
                {transaction.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-1.5 font-sans font-bold text-slate-900 text-right pr-1">
                      {lang === 'ar' ? item.productNameAr : item.productNameEn}
                    </td>
                    <td className="py-1.5 text-center text-slate-600 font-semibold">{item.quantity}</td>
                    <td className="py-1.5 text-center text-slate-600">{item.sellingPrice.toFixed(2)}</td>
                    <td className="py-1.5 text-left font-black text-slate-900 font-display">
                      {(item.sellingPrice * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="border-t border-dashed border-slate-300 pt-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500 font-mono text-[11px]">
              <span>{lang === 'ar' ? 'مجموع عدد السلع:' : 'Total Items:'}</span>
              <span className="font-semibold text-slate-800">{totalItemsCount}</span>
            </div>

            <div className="flex justify-between items-center text-sm font-black font-display text-slate-950 pt-2 border-t border-slate-200">
              <span>{lang === 'ar' ? 'المبلغ الصافي المستحق:' : 'Total Net Amount:'}</span>
              <span className="text-base font-extrabold text-[#006c49]">
                {transaction.totalAmount.toFixed(2)} <span className="text-xs font-sans font-semibold">{lang === 'ar' ? 'د.ج' : 'DZD'}</span>
              </span>
            </div>
          </div>

          {/* Payment Method & QR Code */}
          <div className="border-t border-dashed border-slate-300 pt-3 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-mono block">
                {lang === 'ar' ? 'طريقة السداد:' : 'Payment Method:'}
              </span>
              <span className="inline-block px-2.5 py-0.5 rounded-md font-extrabold text-xs bg-slate-900 text-white font-mono uppercase">
                {transaction.paymentMethod === 'cash' ? (lang === 'ar' ? 'نقدي (كاش)' : 'CASH') :
                 transaction.paymentMethod === 'card' ? (lang === 'ar' ? 'بطاقة / مدى' : 'CARD') :
                 (lang === 'ar' ? 'آجل (دين)' : 'CREDIT')}
              </span>
              <p className="text-[10px] text-slate-400 font-sans italic mt-1">
                {lang === 'ar' ? 'شكراً لتسوقكم ويثقكم بنا!' : 'Thank you for shopping!'}
              </p>
            </div>

            {/* Verification QR */}
            <div className="p-1 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <QRCodeSVG value={qrCodeData} size={54} />
            </div>
          </div>

        </div>

        {/* Invoice Action Bar */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="grid grid-cols-2 gap-2.5">
            {/* Direct Printer Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="py-3 bg-slate-950 hover:bg-slate-800 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all flex justify-center items-center gap-2 cursor-pointer active:scale-95"
            >
              <Printer size={16} />
              <span>{lang === 'ar' ? 'طباعة مباشرة' : 'Direct Print'}</span>
            </button>

            {/* Download PDF Button */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
            >
              <Download size={16} />
              <span>
                {isExporting 
                  ? (lang === 'ar' ? 'جاري تجهيز PDF...' : 'Creating PDF...') 
                  : (lang === 'ar' ? 'تنزيل فاتورة PDF' : 'Download PDF')}
              </span>
            </button>
          </div>

          <div className="flex gap-2">
            {/* WhatsApp Share Button */}
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="flex-1 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl transition-all border border-emerald-200/80 flex justify-center items-center gap-2 cursor-pointer"
            >
              <Share2 size={15} />
              <span>{lang === 'ar' ? 'إرسال عبر الواتساب' : 'Share WhatsApp'}</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              {lang === 'ar' ? 'إغلاق ومتابعة' : 'Close'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
