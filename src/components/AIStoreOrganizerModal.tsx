import React, { useState, useEffect } from 'react';
import { Language, Product, Transaction, CustomerDebt } from '../types';
import { 
  Sparkles, Bot, Layers, ShoppingBag, PackageCheck, AlertCircle, 
  Printer, RefreshCw, X, Check, Lightbulb, Tag, Flame, ShieldAlert,
  ArrowRightLeft, Sparkle, LayoutGrid, Store, ArrowDownToLine
} from 'lucide-react';
import { playSuccessSound, playClickSound, playErrorSound } from '../utils/audio';

interface AIStoreReport {
  storeOverview: string;
  shelfArrangement: Array<{
    sectionName: string;
    idealCategories: string[];
    recommendedProducts: string[];
    placementTip: string;
  }>;
  smartCategories: Array<{
    categoryName: string;
    color: string;
    description: string;
  }>;
  smartBundles: Array<{
    bundleTitle: string;
    itemsIncluded: string[];
    suggestedPriceDzd: number;
    benefit: string;
  }>;
  inventoryPriorities: string[];
  aiTips: string[];
}

interface AIStoreOrganizerModalProps {
  lang: Language;
  shopName: string;
  products: Product[];
  transactions: Transaction[];
  debts: CustomerDebt[];
  isOpen: boolean;
  onClose: () => void;
}

export default function AIStoreOrganizerModal({
  lang,
  shopName,
  products,
  transactions,
  debts,
  isOpen,
  onClose
}: AIStoreOrganizerModalProps) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<AIStoreReport | null>(null);
  const [isAiGenerated, setIsAiGenerated] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'shelves' | 'categories' | 'bundles' | 'priorities'>('shelves');

  const [appliedBundles, setAppliedBundles] = useState<string[]>([]);

  const fetchAIReport = async () => {
    setLoading(true);
    setError(null);
    try {
      playClickSound();
      const res = await fetch('/api/ai/organize-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopName,
          products,
          transactions,
          debts,
          lang
        })
      });

      const data = await res.json();
      if (data.success && data.result) {
        setReport(data.result);
        setIsAiGenerated(!!data.aiGenerated);
        playSuccessSound();
      } else {
        throw new Error(data.error || 'تعذر تحميل تحليل الذكاء الاصطناعي');
      }
    } catch (err: any) {
      console.warn("AI Store Organizer fetch error:", err);
      playErrorSound();
      setError(err.message || 'حدث خطأ أثناء الاتصال بمحرك الذكاء الاصطناعي');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !report && !loading) {
      fetchAIReport();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePrintPlan = () => {
    playClickSound();
    window.print();
  };

  const toggleApplyBundle = (bundleTitle: string) => {
    playClickSound();
    if (appliedBundles.includes(bundleTitle)) {
      setAppliedBundles(prev => prev.filter(b => b !== bundleTitle));
    } else {
      setAppliedBundles(prev => [...prev, bundleTitle]);
      playSuccessSound();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-fade-in print:bg-white print:p-0">
      <div className="bg-slate-900 border border-emerald-500/30 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:border-none print:shadow-none print:bg-white text-slate-100">
        
        {/* Header Bar */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 border-b border-emerald-800/40 flex items-center justify-between shrink-0 print:border-b-2 print:border-emerald-600 print:text-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 shrink-0 print:bg-emerald-100 print:text-emerald-800">
              <Sparkles size={26} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white font-display print:text-emerald-950">
                  {lang === 'ar' ? 'منظّم المتجر الذكي بالذكاء الاصطناعي' : 'AI Store Organizer & Planner'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30 flex items-center gap-1 print:hidden">
                  <Bot size={12} />
                  <span>{isAiGenerated ? 'Gemini 3.6 AI' : 'Smart Engine'}</span>
                </span>
              </div>
              <p className="text-xs text-emerald-200/80 mt-0.5 print:text-slate-600">
                {lang === 'ar' 
                  ? `خطة وترتيب مخصص لـ (${shopName}) لرفع المبيعات وتحسين تنسيق الرفوف`
                  : `Tailored arrangement & layout strategy for (${shopName})`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handlePrintPlan}
              disabled={loading || !report}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="طباعة خطة الترتيب"
            >
              <Printer size={15} />
              <span className="hidden sm:inline">{lang === 'ar' ? 'طباعة الخطة' : 'Print Plan'}</span>
            </button>

            <button
              onClick={fetchAIReport}
              disabled={loading}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
              title="إعادة التحليل"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin text-emerald-400' : ''} />
            </button>

            <button
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-white rounded-xl border border-slate-700 transition-all cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-right print:text-slate-900 print:p-0 print:space-y-4">
          
          {loading && (
            <div className="py-16 text-center space-y-4">
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin"></div>
                <Sparkles size={32} className="text-emerald-400 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-emerald-300">
                  {lang === 'ar' ? 'جاري تحليل منتجات ومبيعات المتجر...' : 'Analyzing store items & layout...'}
                </h3>
                <p className="text-xs text-slate-400">
                  {lang === 'ar' ? 'يقوم الذكاء الاصطناعي بدراسة أصناف المحل لتوزيع المنتجات وحساب الرفوف والعروض المثالية' : 'Gemini AI is generating the optimal layout and combo packages'}
                </p>
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="p-4 bg-rose-950/40 border border-rose-800/60 rounded-2xl text-rose-200 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle size={20} className="text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={fetchAIReport}
                className="px-3 py-1.5 bg-rose-800 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                {lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}
              </button>
            </div>
          )}

          {!loading && report && (
            <>
              {/* Store AI Overview Header Banner */}
              <div className="p-4 sm:p-5 bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-600/30 rounded-2xl relative overflow-hidden print:bg-emerald-50 print:border-emerald-200">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-emerald-500/20 text-emerald-300 rounded-xl shrink-0 print:bg-emerald-200 print:text-emerald-900">
                    <Store size={22} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-extrabold text-emerald-300 print:text-emerald-950">
                      {lang === 'ar' ? 'الرؤية الاستراتيجية لتنظيم المحل:' : 'Store Strategic Overview:'}
                    </h3>
                    <p className="text-xs text-slate-200 leading-relaxed font-sans print:text-slate-800">
                      {report.storeOverview}
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto print:hidden">
                <button
                  onClick={() => setActiveTab('shelves')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer border ${
                    activeTab === 'shelves'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-900/30'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-800'
                  }`}
                >
                  <LayoutGrid size={16} />
                  <span>{lang === 'ar' ? '1. توزيع الرفوف والواجهة' : '1. Shelf Arrangement'}</span>
                </button>

                <button
                  onClick={() => setActiveTab('categories')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer border ${
                    activeTab === 'categories'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-900/30'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-800'
                  }`}
                >
                  <Layers size={16} />
                  <span>{lang === 'ar' ? '2. الأقسام الذكية' : '2. Smart Categories'}</span>
                </button>

                <button
                  onClick={() => setActiveTab('bundles')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer border ${
                    activeTab === 'bundles'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-900/30'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-800'
                  }`}
                >
                  <ShoppingBag size={16} />
                  <span>{lang === 'ar' ? '3. العروض الحزمة المربحة' : '3. Combo Bundles'}</span>
                </button>

                <button
                  onClick={() => setActiveTab('priorities')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer border ${
                    activeTab === 'priorities'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-900/30'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-800'
                  }`}
                >
                  <Lightbulb size={16} />
                  <span>{lang === 'ar' ? '4. أولويات ونشاط المحل' : '4. AI Priorities'}</span>
                </button>
              </div>

              {/* Tab 1: Shelves Layout */}
              {(activeTab === 'shelves' || typeof window !== 'undefined' && window.matchMedia('print').matches) && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-extrabold text-slate-200 flex items-center gap-2 print:text-slate-900">
                      <LayoutGrid size={18} className="text-emerald-400 print:text-emerald-700" />
                      <span>{lang === 'ar' ? 'خطة توزيع الرفوف والمناطق في المحل' : 'Recommended Shelf Distribution'}</span>
                    </h4>
                    <span className="text-[11px] text-slate-400 print:hidden">
                      {lang === 'ar' ? 'نصائح موجهة لترتيب المنتجات بصرية بالمتجر' : 'Visual product placement guide'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {report.shelfArrangement.map((shelf, idx) => (
                      <div 
                        key={idx}
                        className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-2xl space-y-3 relative hover:border-emerald-500/50 transition-all print:bg-slate-50 print:border-slate-300 print:text-slate-900"
                      >
                        <div className="flex items-center justify-between border-b border-slate-700/60 pb-2.5 print:border-slate-300">
                          <span className="text-xs font-black text-emerald-400 print:text-emerald-800 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] flex items-center justify-center font-bold">
                              {idx + 1}
                            </span>
                            {shelf.sectionName}
                          </span>
                        </div>

                        {/* Ideal Categories */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 block print:text-slate-600">
                            {lang === 'ar' ? 'الفئات المناسبة لهذا الرف:' : 'Ideal Categories:'}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {shelf.idealCategories.map((cat, cIdx) => (
                              <span key={cIdx} className="px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 text-[11px] font-bold border border-emerald-800/40 print:bg-emerald-100 print:text-emerald-900">
                                {cat}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Recommended products from shop */}
                        {shelf.recommendedProducts && shelf.recommendedProducts.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 block print:text-slate-600">
                              {lang === 'ar' ? 'منتجات من محلك يُنصح بوضعها هنا:' : 'Recommended Shop Products:'}
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {shelf.recommendedProducts.map((pName, pIdx) => (
                                <span key={pIdx} className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-200 text-[10px] font-medium border border-slate-700 print:bg-white print:border-slate-300 print:text-slate-800">
                                  {pName}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Placement Tip */}
                        <div className="p-2.5 bg-amber-950/20 border border-amber-800/30 rounded-xl text-[11px] text-amber-200/90 leading-normal flex items-start gap-2 print:bg-amber-50 print:border-amber-200 print:text-amber-950">
                          <Lightbulb size={14} className="text-amber-400 shrink-0 mt-0.5 print:text-amber-600" />
                          <p>{shelf.placementTip}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 2: Smart Categories */}
              {(activeTab === 'categories' || typeof window !== 'undefined' && window.matchMedia('print').matches) && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-extrabold text-slate-200 flex items-center gap-2 print:text-slate-900">
                      <Layers size={18} className="text-sky-400 print:text-sky-700" />
                      <span>{lang === 'ar' ? 'الأقسام الذكية وتصنيف السلع' : 'Smart Category Groupings'}</span>
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {report.smartCategories.map((sc, idx) => (
                      <div 
                        key={idx}
                        className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-2xl flex items-start gap-3 print:bg-slate-50 print:border-slate-300"
                      >
                        <div 
                          className="w-3 h-12 rounded-full shrink-0" 
                          style={{ backgroundColor: sc.color || '#006c49' }}
                        />
                        <div className="space-y-1">
                          <h5 className="text-xs font-bold text-slate-100 print:text-slate-900">
                            {sc.categoryName}
                          </h5>
                          <p className="text-[11px] text-slate-300 leading-normal print:text-slate-700">
                            {sc.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: Combo Bundles */}
              {(activeTab === 'bundles' || typeof window !== 'undefined' && window.matchMedia('print').matches) && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-extrabold text-slate-200 flex items-center gap-2 print:text-slate-900">
                      <ShoppingBag size={18} className="text-amber-400 print:text-amber-700" />
                      <span>{lang === 'ar' ? 'حزم العروض المقتراحة لزيادة الأرباح' : 'High-Margin Combo Offers'}</span>
                    </h4>
                    <span className="text-[11px] text-slate-400 print:hidden">
                      {lang === 'ar' ? 'دمج منتج سريع الحركة مع آخر عال الهامش الربحي' : 'Combine fast sellers with margin boosters'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {report.smartBundles.map((bundle, idx) => {
                      const isApplied = appliedBundles.includes(bundle.bundleTitle);
                      return (
                        <div 
                          key={idx}
                          className={`p-4 rounded-2xl border transition-all space-y-3 relative ${
                            isApplied 
                              ? 'bg-emerald-950/40 border-emerald-500 shadow-md' 
                              : 'bg-slate-800/60 border-slate-700/80 hover:border-amber-500/40'
                          } print:bg-amber-50 print:border-amber-200 print:text-slate-900`}
                        >
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-bold text-amber-300 font-display print:text-amber-900 flex items-center gap-1.5">
                              <Flame size={15} className="text-amber-400" />
                              {bundle.bundleTitle}
                            </h5>
                            <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 font-mono font-bold text-xs border border-amber-500/30 print:bg-amber-100 print:text-amber-950">
                              {bundle.suggestedPriceDzd} {lang === 'ar' ? 'د.ج' : 'DZD'}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 block print:text-slate-600">
                              {lang === 'ar' ? 'المنتجات المدمجة في الحزمة:' : 'Bundled Items:'}
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {bundle.itemsIncluded.map((item, iIdx) => (
                                <span key={iIdx} className="px-2.5 py-0.5 rounded-lg bg-slate-900 text-slate-200 text-[11px] font-medium border border-slate-700 print:bg-white print:border-slate-300 print:text-slate-900">
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-300 leading-snug print:text-slate-800">
                            💡 <span className="font-semibold text-slate-200 print:text-slate-900">{bundle.benefit}</span>
                          </p>

                          <div className="pt-2 border-t border-slate-700/60 flex items-center justify-end print:hidden">
                            <button
                              onClick={() => toggleApplyBundle(bundle.bundleTitle)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                isApplied
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'bg-slate-700 hover:bg-emerald-700 text-slate-200 hover:text-white'
                              }`}
                            >
                              {isApplied ? (
                                <>
                                  <Check size={14} />
                                  <span>{lang === 'ar' ? 'تمت إضافة العرض' : 'Bundle Activated'}</span>
                                </>
                              ) : (
                                <>
                                  <Tag size={14} />
                                  <span>{lang === 'ar' ? 'تفعيل العرض للزبائن' : 'Activate Bundle'}</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab 4: Priorities & AI Tips */}
              {(activeTab === 'priorities' || typeof window !== 'undefined' && window.matchMedia('print').matches) && (
                <div className="space-y-5">
                  {/* Priorities */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-extrabold text-slate-200 flex items-center gap-2 print:text-slate-900">
                      <PackageCheck size={18} className="text-emerald-400 print:text-emerald-700" />
                      <span>{lang === 'ar' ? 'أولويات وإجراءات التزويد الفورية:' : 'Actionable Inventory Priorities:'}</span>
                    </h4>
                    <div className="space-y-2">
                      {report.inventoryPriorities.map((prio, idx) => (
                        <div key={idx} className="p-3 bg-slate-800/60 border border-slate-700/80 rounded-xl text-xs text-slate-200 flex items-start gap-2.5 print:bg-slate-50 print:border-slate-300 print:text-slate-900">
                          <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5 print:bg-emerald-100 print:text-emerald-900">
                            {idx + 1}
                          </span>
                          <p className="leading-normal">{prio}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Strategic Tips */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-extrabold text-slate-200 flex items-center gap-2 print:text-slate-900">
                      <Sparkle size={18} className="text-amber-400 print:text-amber-700" />
                      <span>{lang === 'ar' ? 'نصائح ذكية لتطوير تجارة المحل:' : 'Strategic Retail Advice:'}</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {report.aiTips.map((tip, idx) => (
                        <div key={idx} className="p-3 bg-amber-950/20 border border-amber-800/30 rounded-xl text-xs text-amber-200/90 leading-relaxed print:bg-amber-50 print:border-amber-200 print:text-amber-950">
                          <span className="font-bold text-amber-400 block mb-1 print:text-amber-800">
                            💡 {lang === 'ar' ? `نصيحة #${idx + 1}` : `Tip #${idx + 1}`}
                          </span>
                          <p>{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between shrink-0 print:hidden text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-emerald-400" />
            <span>{lang === 'ar' ? 'محرك تنظيم المحلات بالذكاء الاصطناعي - فنك ماركت' : 'AI Powered Store Organizer - Fenk Market'}</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition-all cursor-pointer"
          >
            {lang === 'ar' ? 'إغلاق النافذة' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
}
