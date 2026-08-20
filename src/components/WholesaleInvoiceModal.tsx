import React, { useState } from 'react';
import { Transaction, Language } from '../types';
import { Printer, Download, X, Check, Share2, Building2, Store, Phone, Calendar, Hash, FileText, MapPin, Truck, Layers, ShieldCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import fenkLogo from '../assets/images/fenk_logo_1783465306813.jpg';
import { exportInvoiceToPdf, printDocumentA4, printInvoiceDirect } from '../utils/invoicePdf';
import { playSuccessSound, playClickSound } from '../utils/audio';

interface WholesaleInvoiceModalProps {
  lang: Language;
  transaction: Transaction;
  shopName?: string;
  shopPhone?: string;
  shopAddress?: string;
  shopLogo?: string;
  onClose: () => void;
  isNewSale?: boolean;
}

export default function WholesaleInvoiceModal({
  lang,
  transaction,
  shopName,
  shopPhone,
  shopAddress,
  shopLogo,
  onClose,
  isNewSale = false
}: WholesaleInvoiceModalProps) {
  const [docFormat, setDocFormat] = useState<'a4' | 'thermal'>('a4');
  const [isExporting, setIsExporting] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  const nameToDisplay = shopName || localStorage.getItem('fenk_mahli_shop_name') || 'مؤسسة التجارة والتوزيع';
  const phoneToDisplay = shopPhone || localStorage.getItem('fenk_mahli_owner_phone') || '0550 12 34 56';
  const addressToDisplay = shopAddress || localStorage.getItem('fenk_mahli_wilaya') || (lang === 'ar' ? 'الجزائر العاصمة' : 'Algiers');
  const logoToDisplay = shopLogo || localStorage.getItem('fenk_mahli_shop_logo') || fenkLogo;

  const totalCartons = transaction.items.reduce((sum, item) => sum + (item.cartonCount || 0), 0);
  const totalUnits = transaction.items.reduce((sum, item) => sum + item.quantity, 0);

  const formattedDate = new Date(transaction.date).toLocaleString(
    lang === 'ar' ? 'ar-DZ' : 'en-US',
    { dateStyle: 'medium', timeStyle: 'short' }
  );

  const handlePrint = () => {
    playClickSound();
    if (docFormat === 'a4') {
      printDocumentA4('printable-wholesale-doc');
    } else {
      printInvoiceDirect('printable-wholesale-doc', '80mm');
    }
  };

  const handleDownloadPdf = async () => {
    playClickSound();
    setIsExporting(true);
    const fileName = `Bon_Livraison_${transaction.id.toUpperCase()}.pdf`;
    await exportInvoiceToPdf('printable-wholesale-doc', fileName);
    setIsExporting(false);
    playSuccessSound();
  };

  const handleWhatsAppShare = () => {
    playClickSound();
    const itemsList = transaction.items
      .map((item) => {
        const pkg = item.cartonCount ? `[${item.cartonCount} كرتونة (${item.quantity} قطعة)]` : `[${item.quantity} قطعة]`;
        return `• ${lang === 'ar' ? item.productNameAr : item.productNameEn} ${pkg} بسعر ${item.sellingPrice.toFixed(2)} = ${(item.sellingPrice * item.quantity).toFixed(2)} د.ج`;
      })
      .join('\n');

    const text = lang === 'ar'
      ? `📦 *سند تسليم وفاتورة بيع بالجملة (Bon de Livraison)*\n` +
        `المؤسسة المورّدة: ${nameToDisplay}\n` +
        `العميل / التاجر: ${transaction.clientCommercialName || transaction.customerName || 'عميل تجزئة'}\n` +
        `رقم السند: #${transaction.id.toUpperCase()}\n` +
        `التاريخ: ${formattedDate}\n` +
        `--------------------\n` +
        `إجمالي الطرود: ${totalCartons} كرتونة | مجموع القطع: ${totalUnits} قطعة\n` +
        `--------------------\n` +
        `${itemsList}\n` +
        `--------------------\n` +
        (transaction.discountAmount ? `الخصم التجاري: -${transaction.discountAmount.toFixed(2)} د.ج\n` : '') +
        (transaction.shippingFee ? `مصاريف الشحن: +${transaction.shippingFee.toFixed(2)} د.ج\n` : '') +
        `المبلغ الصافي المستحق: *${transaction.totalAmount.toFixed(2)} د.ج*\n` +
        `طريقة السداد: ${transaction.paymentMethod === 'debt' ? 'آجل على الحساب' : transaction.paymentMethod === 'cheque' ? 'شيك تجاري' : transaction.paymentMethod === 'transfer' ? 'تحويل بنكي / CCP' : 'نقدي كاش'}\n` +
        `نشكركم على حسن تعاملكم التجاري معنا!`
      : `📦 *Wholesale Delivery Slip (Bon de Livraison)*\n` +
        `Supplier: ${nameToDisplay}\n` +
        `Client: ${transaction.clientCommercialName || transaction.customerName || 'Retail Merchant'}\n` +
        `Ref: #${transaction.id.toUpperCase()}\n` +
        `Date: ${formattedDate}\n` +
        `--------------------\n` +
        `Cartons: ${totalCartons} | Total Units: ${totalUnits}\n` +
        `--------------------\n` +
        `${itemsList}\n` +
        `--------------------\n` +
        `Total Net Amount: *${transaction.totalAmount.toFixed(2)} DZD*\n` +
        `Payment: ${transaction.paymentMethod.toUpperCase()}`;

    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  const qrCodeData = JSON.stringify({
    type: 'WHOLESALE_DELIVERY_SLIP',
    store: nameToDisplay,
    ref: transaction.id,
    client: transaction.clientCommercialName || transaction.customerName,
    total: transaction.totalAmount,
    date: transaction.date
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xl max-w-4xl w-full max-h-[96vh] flex flex-col overflow-hidden my-auto">
        
        {/* Modal Top Header Bar */}
        <div className="p-3.5 sm:p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-300 flex items-center justify-center">
              <Layers size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold font-display text-sm sm:text-base text-white">
                  {lang === 'ar' ? 'سند تسليم وفاتورة بيع بالجملة' : 'Wholesale Delivery Slip & Invoice'}
                </h3>
                {isNewSale && (
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/40 font-bold">
                    {lang === 'ar' ? 'تمت العملية بنجاح' : 'Success'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                #{transaction.id.toUpperCase()} • {formattedDate}
              </p>
            </div>
          </div>

          {/* Format Toggle & Close */}
          <div className="flex items-center gap-2">
            <div className="bg-slate-800 p-0.5 rounded-xl flex items-center text-xs">
              <button
                type="button"
                onClick={() => setDocFormat('a4')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  docFormat === 'a4' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {lang === 'ar' ? 'ورقة A4 رسمية' : 'A4 Format'}
              </button>
              <button
                type="button"
                onClick={() => setDocFormat('thermal')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  docFormat === 'thermal' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {lang === 'ar' ? 'إيصال كاشير 80mm' : 'Thermal 80mm'}
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-[#006c49] hover:bg-[#00583b] text-white rounded-xl text-xs font-bold font-display flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Printer size={15} />
              <span>{lang === 'ar' ? 'طباعة المستند فوراً' : 'Print Document'}</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold font-display flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Download size={15} />
              <span>{isExporting ? (lang === 'ar' ? 'جاري التحميل...' : 'Exporting...') : (lang === 'ar' ? 'تحميل ملف PDF' : 'Download PDF')}</span>
            </button>
          </div>

          <button
            onClick={handleWhatsAppShare}
            className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 rounded-xl text-xs font-bold font-display flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Share2 size={14} className="text-emerald-600" />
            <span>{lang === 'ar' ? 'إرسال للتاجر عبر واتساب' : 'Share via WhatsApp'}</span>
          </button>
        </div>

        {/* Printable Document Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70 flex justify-center">
          <div
            id="printable-wholesale-doc"
            className={`bg-white shadow-lg border border-slate-200 p-6 transition-all ${
              docFormat === 'a4' ? 'w-full max-w-[210mm] text-slate-900 rounded-xl' : 'w-[80mm] max-w-full text-[11px] rounded-lg'
            }`}
            style={{ minHeight: docFormat === 'a4' ? '260mm' : 'auto' }}
          >
            {/* Header: Seller Store & Document Title */}
            <div className="border-b-2 border-slate-900 pb-4 mb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={logoToDisplay}
                    alt="Logo"
                    className="w-14 h-14 object-contain rounded-xl border border-slate-200 p-1 bg-white"
                  />
                  <div>
                    <h2 className="text-lg font-black font-display text-slate-950 leading-tight">
                      {nameToDisplay}
                    </h2>
                    <p className="text-xs text-slate-600 font-medium mt-0.5 flex items-center gap-1">
                      <MapPin size={11} className="text-slate-400" />
                      <span>{addressToDisplay}</span>
                    </p>
                    <p className="text-xs text-slate-600 font-mono flex items-center gap-1">
                      <Phone size={11} className="text-slate-400" />
                      <span dir="ltr">{phoneToDisplay}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-block bg-slate-900 text-white px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider mb-1">
                    {lang === 'ar' ? 'سند تسليم بضاعة (BON DE LIVRAISON)' : 'DELIVERY SLIP & INVOICE'}
                  </div>
                  <div className="text-xs text-slate-600 font-mono">
                    <span className="font-bold">{lang === 'ar' ? 'الرقم المرجعي:' : 'Ref:'}</span> #{transaction.id.toUpperCase()}
                  </div>
                  <div className="text-xs text-slate-600">
                    <span className="font-bold">{lang === 'ar' ? 'التاريخ:' : 'Date:'}</span> {formattedDate}
                  </div>
                </div>
              </div>

              {/* Client & Destination Commercial Box */}
              <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                    {lang === 'ar' ? 'المشتري / التاجر المستلم (Client)' : 'Customer / Merchant Details'}
                  </span>
                  <p className="text-xs font-bold text-slate-950 flex items-center gap-1 mt-0.5">
                    <Building2 size={13} className="text-indigo-600" />
                    <span>{transaction.clientCommercialName || transaction.customerName || (lang === 'ar' ? 'زبون جملة نقدي' : 'Wholesale Cash Client')}</span>
                  </p>
                  {transaction.clientPhone && (
                    <p className="text-[11px] text-slate-600 font-mono mt-0.5">
                      <span className="text-slate-400">{lang === 'ar' ? 'الهاتف:' : 'Phone:'}</span> {transaction.clientPhone}
                    </p>
                  )}
                  {transaction.clientTaxNumber && (
                    <p className="text-[11px] text-slate-600 font-mono mt-0.5">
                      <span className="text-slate-400">{lang === 'ar' ? 'السجل / NIF:' : 'RC / NIF:'}</span> {transaction.clientTaxNumber}
                    </p>
                  )}
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                    {lang === 'ar' ? 'بيانات التوصيل والشحن (Livraison)' : 'Delivery & Transport Info'}
                  </span>
                  <p className="text-xs text-slate-800 font-semibold flex items-center gap-1 mt-0.5">
                    <Truck size={13} className="text-slate-500" />
                    <span>
                      {transaction.driverName 
                        ? `${lang === 'ar' ? 'السائق:' : 'Driver:'} ${transaction.driverName}`
                        : (lang === 'ar' ? 'تسليم بالمستودع / استلام مباشر' : 'Warehouse Direct Pick-up')
                      }
                      {transaction.vehiclePlate && ` (${transaction.vehiclePlate})`}
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    <span className="text-slate-400">{lang === 'ar' ? 'الوجهة / الولاية:' : 'Destination:'}</span> {transaction.clientWilaya || addressToDisplay}
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    <span className="text-slate-400">{lang === 'ar' ? 'طريقة السداد:' : 'Payment:'}</span>{' '}
                    <span className="font-bold text-slate-900">
                      {transaction.paymentMethod === 'debt' ? (lang === 'ar' ? 'آجل على الحساب (Crédit)' : 'Credit On Account')
                        : transaction.paymentMethod === 'cheque' ? (lang === 'ar' ? 'شيك تجاري' : 'Cheque')
                        : transaction.paymentMethod === 'transfer' ? (lang === 'ar' ? 'تحويل بنكي / CCP' : 'Bank Transfer')
                        : (lang === 'ar' ? 'نقدي (كاش)' : 'Cash')}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto my-3">
              <table className="w-full text-right text-xs border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200 text-[11px]">
                    <th className="p-2 w-8 text-center">#</th>
                    <th className="p-2">{lang === 'ar' ? 'السلعة / البضاعة' : 'Designation / Item'}</th>
                    <th className="p-2 text-center">{lang === 'ar' ? 'الطرود (Colis)' : 'Boxes'}</th>
                    <th className="p-2 text-center">{lang === 'ar' ? 'سعة الطرد' : 'Units/Box'}</th>
                    <th className="p-2 text-center">{lang === 'ar' ? 'إجمالي القطع' : 'Total Units'}</th>
                    <th className="p-2 text-left">{lang === 'ar' ? 'سعر الجملة (د.ج)' : 'Unit Price'}</th>
                    <th className="p-2 text-left">{lang === 'ar' ? 'المجموع (د.ج)' : 'Total (DZD)'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {transaction.items.map((item, idx) => {
                    const itemTotal = item.sellingPrice * item.quantity;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2 text-center text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                        <td className="p-2 font-bold text-slate-900">
                          <div>{lang === 'ar' ? item.productNameAr : item.productNameEn}</div>
                          {item.priceTier && (
                            <span className="text-[9px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-mono">
                              {item.priceTier === 'semi_wholesale' ? (lang === 'ar' ? 'نصف جملة' : 'Semi-Gros') : (lang === 'ar' ? 'سعر جملة' : 'Gros')}
                            </span>
                          )}
                        </td>
                        <td className="p-2 text-center font-bold text-slate-800 font-mono">
                          {item.cartonCount ? `${item.cartonCount} كرتونة` : '-'}
                        </td>
                        <td className="p-2 text-center text-slate-600 font-mono">
                          {item.unitsPerCarton ? `x${item.unitsPerCarton}` : '-'}
                        </td>
                        <td className="p-2 text-center font-extrabold text-slate-950 font-mono">
                          {item.quantity}
                        </td>
                        <td className="p-2 text-left font-mono font-semibold text-slate-700">
                          {item.sellingPrice.toFixed(2)}
                        </td>
                        <td className="p-2 text-left font-mono font-bold text-slate-900">
                          {itemTotal.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals, Financial Breakdown, & QR */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-2 border-t border-slate-200">
              
              {/* Left Column: QR & Notes */}
              <div className="space-y-2 flex flex-col justify-between">
                <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <QRCodeSVG value={qrCodeData} size={64} level="M" />
                  <div className="text-[10px] text-slate-500 space-y-0.5">
                    <p className="font-bold text-slate-800">{lang === 'ar' ? 'رمز التحقق والتتبع التجاري' : 'Commercial Verification QR'}</p>
                    <p>{lang === 'ar' ? 'سند معتمد للإخراج والتسليم المخزني' : 'Certified Warehouse Dispatch'}</p>
                    <p className="font-mono text-slate-400">FENK-MAHLI-WHOLESALE-DZ</p>
                  </div>
                </div>

                {transaction.notes && (
                  <div className="p-2 rounded-lg bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900">
                    <span className="font-bold">{lang === 'ar' ? 'ملاحظات:' : 'Notes:'}</span> {transaction.notes}
                  </div>
                )}
              </div>

              {/* Right Column: Financial Summary */}
              <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <div className="flex justify-between text-slate-600 font-mono text-[11px]">
                  <span>{lang === 'ar' ? 'إجمالي عدد الطرود / الكراتين:' : 'Total Cartons:'}</span>
                  <span className="font-bold text-slate-900">{totalCartons} {lang === 'ar' ? 'طرد / كرتونة' : 'Boxes'}</span>
                </div>
                <div className="flex justify-between text-slate-600 font-mono text-[11px]">
                  <span>{lang === 'ar' ? 'مجموع عدد القطع الإجمالي:' : 'Total Units Count:'}</span>
                  <span className="font-bold text-slate-900">{totalUnits} {lang === 'ar' ? 'قطعة' : 'Pcs'}</span>
                </div>

                {transaction.discountAmount && transaction.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-mono text-[11px]">
                    <span>{lang === 'ar' ? 'الخصم التجاري الممنوح:' : 'Commercial Discount:'}</span>
                    <span className="font-bold">-{transaction.discountAmount.toFixed(2)} {lang === 'ar' ? 'د.ج' : 'DZD'}</span>
                  </div>
                )}

                {transaction.shippingFee && transaction.shippingFee > 0 && (
                  <div className="flex justify-between text-slate-700 font-mono text-[11px]">
                    <span>{lang === 'ar' ? 'تكلفة النقل والتوصيل:' : 'Transport / Shipping:'}</span>
                    <span className="font-bold">+{transaction.shippingFee.toFixed(2)} {lang === 'ar' ? 'د.ج' : 'DZD'}</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t-2 border-slate-900 text-sm sm:text-base font-black text-slate-950">
                  <span>{lang === 'ar' ? 'المبلغ الصافي المستحق:' : 'Total Net Amount:'}</span>
                  <span className="font-extrabold text-[#006c49] font-mono">
                    {transaction.totalAmount.toFixed(2)} <span className="text-xs font-sans font-bold">{lang === 'ar' ? 'د.ج' : 'DZD'}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Signature & Stamp Boxes */}
            <div className="mt-8 pt-4 border-t border-slate-200 grid grid-cols-2 gap-4 text-center">
              <div className="p-3 border border-dashed border-slate-300 rounded-xl min-h-[90px] flex flex-col justify-between">
                <p className="text-[11px] font-bold text-slate-700">{lang === 'ar' ? 'ختم وتوقيع البائع والمستودع' : "Seller's Stamp & Signature"}</p>
                <p className="text-[10px] text-slate-400 font-mono">Pour la Société</p>
              </div>

              <div className="p-3 border border-dashed border-slate-300 rounded-xl min-h-[90px] flex flex-col justify-between">
                <p className="text-[11px] font-bold text-slate-700">{lang === 'ar' ? 'توقيع وختم المستلم / التاجر' : "Client Receipt & Stamp"}</p>
                <p className="text-[10px] text-slate-400 font-mono">Bon pour Réception et Conformité</p>
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-400 mt-4">
              {lang === 'ar' ? 'شكراً لتعاملكم التجاري معنا • تم الإصدار بواسطة نظام فينَك المحلي للبيع والتوزيع' : 'Thank you for your business • Powered by Fenk Mahli Retail & Wholesale'}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
