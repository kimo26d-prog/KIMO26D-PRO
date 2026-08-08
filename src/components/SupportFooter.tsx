import React from 'react';
import { Language } from '../types';
import { PhoneCall, MessageCircle, HelpCircle, ShieldCheck } from 'lucide-react';
import fenkLogo from '../assets/images/fenk_logo_1783465306813.jpg';

interface SupportFooterProps {
  lang: Language;
}

export default function SupportFooter({ lang }: SupportFooterProps) {
  const phoneNumber = '0777946398';
  const whatsappUrl = 'https://wa.me/213777946398?text=' + encodeURIComponent('مرحباً، أحتاج إلى الدعم الفني لتطبيق فنك ماركت');

  return (
    <footer className="mt-12 bg-[#131b2e] text-white border-t border-slate-800 rounded-t-3xl shadow-xl overflow-hidden print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* App Branding & Logo */}
          <div className="flex items-center gap-3 text-center md:text-right">
            <img 
              src={fenkLogo} 
              alt="فنك ماركت - Fenk Market" 
              className="w-12 h-12 object-contain rounded-2xl border border-slate-700/80 bg-slate-900 p-1 shadow-md shrink-0" 
            />
            <div>
              <h3 className="text-base font-black font-display text-white tracking-tight flex items-center justify-center md:justify-start gap-1.5">
                <span>{lang === 'ar' ? 'تطبيق فنك ماركت' : 'Fenk Market App'}</span>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full font-sans border border-emerald-500/30 font-bold">
                  v2.4.0
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 font-sans">
                {lang === 'ar' ? 'النظام المتكامل لإدارة المحلات والمبيعات في الجزائر' : 'All-in-One Retail & Sales Manager'}
              </p>
            </div>
          </div>

          {/* Technical Support Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-300 ml-2">
              <HelpCircle size={16} className="text-emerald-400" />
              <span>{lang === 'ar' ? 'الدعم الفني والخدمة:' : 'Technical Support:'}</span>
            </div>

            {/* Direct Call Button */}
            <a 
              href={`tel:${phoneNumber}`}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black font-display transition-all border border-slate-700 flex items-center gap-2 shadow-xs active:scale-95 group cursor-pointer"
              title={lang === 'ar' ? 'اتصال مباشر بالدعم الفني' : 'Call Support'}
            >
              <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
                <PhoneCall size={14} />
              </div>
              <span className="font-mono text-sm tracking-wider">{phoneNumber}</span>
            </a>

            {/* WhatsApp Direct Chat Button */}
            <a 
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black font-display transition-all shadow-md flex items-center gap-2 active:scale-95 group cursor-pointer"
              title={lang === 'ar' ? 'تواصل عبر واتساب' : 'Chat on WhatsApp'}
            >
              <div className="p-1 rounded-lg bg-white/20 text-white group-hover:scale-110 transition-transform">
                <MessageCircle size={15} />
              </div>
              <span>{lang === 'ar' ? 'مراسلة عبر واتساب' : 'WhatsApp Support'}</span>
            </a>
          </div>

        </div>

        {/* Bottom Bar Rights */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
          <p className="flex items-center gap-1">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>© 2026 {lang === 'ar' ? 'فنك ماركت - جميع الحقوق محفوظة' : 'Fenk Market - All Rights Reserved'}</span>
          </p>
          <p className="font-mono text-slate-400">
            {lang === 'ar' ? 'دعم فني سريع: 0777946398' : 'Support Hotline: 0777946398'}
          </p>
        </div>
      </div>
    </footer>
  );
}
