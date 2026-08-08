import React, { useState } from 'react';
import { Language } from '../types';
import { Eye, EyeOff, Lock, User, LogIn, Store, PhoneCall, MessageCircle } from 'lucide-react';
import fenkLogo from '../assets/images/fenk_logo_1783465306813.jpg';
import { playSuccessSound, playErrorSound } from '../utils/audio';

interface LoginScreenProps {
  lang: Language;
  onLanguageToggle: (lang: Language) => void;
  onLoginSuccess: (shopName: string) => void;
}

export default function LoginScreen({ lang, onLanguageToggle, onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  
  // Register Shop State
  const [newShopNameAr, setNewShopNameAr] = useState('');
  const [newShopNameEn, setNewShopNameEn] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [shopCategory, setShopCategory] = useState('grocery');

  const translations = {
    ar: {
      title: "مرحباً بك في تطبيق فنك ماركت",
      subtitle: "سجل دخولك لإدارة متجرك بكفاءة",
      emailLabel: "البريد الإلكتروني أو اسم المستخدم",
      passwordLabel: "كلمة المرور",
      forgot: "نسيت كلمة المرور؟",
      remember: "تذكرني على هذا الجهاز",
      login: "تسجيل الدخول",
      noShop: "ليس لديك متجر مسجل؟",
      register: "تسجيل متجر جديد",
      version: "تطبيق فنك ماركت FENK MARKET v2.4.0",
      rights: "© 2026 تطبيق فنك ماركت - جميع الحقوق محفوظة",
      required: "يرجى تعبئة جميع الحقول المطلوبة",
      wrongCreds: "اسم المستخدم أو كلمة المرور غير صحيحة. استخدم أي قيم للمحاكاة أو سجل متجر جديد!",
      signingIn: "جاري تسجيل الدخول...",
      supportTitle: "الدعم الفني والخدمة",
      supportPhone: "0777946398",
      whatsapp: "تواصل عبر واتساب",
      regTitle: "تسجيل متجر جديد",
      regSubtitle: "أنشئ حساب متجرك في ثوانٍ وابدأ الإدارة الفورية",
      regShopNameAr: "اسم المتجر (بالعربية)",
      regShopNameEn: "اسم المتجر (بالإنجليزية)",
      regOwnerName: "اسم مالك المتجر",
      regCategory: "نشاط المتجر الرئيسي",
      regSubmit: "إنشاء المتجر وبدء الاستخدام",
      regCancel: "إلغاء",
      grocery: "مواد غذائية وتموينات",
      clothing: "ملابس وأزياء",
      electronics: "إلكترونيات وهواتف",
      other: "نشاط آخر"
    },
    en: {
      title: "Welcome to Fenk Market App",
      subtitle: "Log in to manage your shop efficiently",
      emailLabel: "Email or Username",
      passwordLabel: "Password",
      forgot: "Forgot Password?",
      remember: "Remember me on this device",
      login: "Login",
      noShop: "Don't have a registered shop?",
      register: "Register New Shop",
      version: "FENK MARKET App v2.4.0",
      rights: "© 2026 Fenk Market - All rights reserved",
      required: "Please fill in all required fields",
      wrongCreds: "Incorrect credentials. You can use any values or register a new shop to continue!",
      signingIn: "Signing in...",
      supportTitle: "Technical Support",
      supportPhone: "0777946398",
      whatsapp: "Chat on WhatsApp",
      regTitle: "Register New Shop",
      regSubtitle: "Create your shop profile in seconds and start managing",
      regShopNameAr: "Shop Name (Arabic)",
      regShopNameEn: "Shop Name (English)",
      regOwnerName: "Owner Name",
      regCategory: "Main Business Activity",
      regSubmit: "Create Shop & Get Started",
      regCancel: "Cancel",
      grocery: "Groceries & Supermarket",
      clothing: "Clothing & Fashion",
      electronics: "Electronics & Mobile",
      other: "Other Activity"
    }
  };

  const t = translations[lang];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      playErrorSound();
      setError(t.required);
      return;
    }

    setLoading(true);
    setError('');

    // Simulate authentication
    setTimeout(() => {
      setLoading(false);
      playSuccessSound();
      // Accept any login for demo purposes
      onLoginSuccess(lang === 'ar' ? 'بقالة التوفير الحديثة' : 'Al-Tawfeer Modern Grocery');
    }, 1200);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const shopNameAr = newShopNameAr.trim() || 'بقالة فينك محلي';
    const shopNameEn = newShopNameEn.trim() || 'Fenk Mahli Supermarket';
    
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowRegisterModal(false);
      playSuccessSound();
      onLoginSuccess(lang === 'ar' ? shopNameAr : shopNameEn);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-[#f8f9ff] relative select-none">
      {/* Language Toggle */}
      <div className="fixed top-6 right-6 flex gap-1 bg-slate-200/60 p-1 rounded-full z-10">
        <button 
          onClick={() => onLanguageToggle('ar')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${lang === 'ar' ? 'bg-[#131b2e] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-300/40'}`}
          id="lang-ar"
        >
          العربية
        </button>
        <button 
          onClick={() => onLanguageToggle('en')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${lang === 'en' ? 'bg-[#131b2e] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-300/40'}`}
          id="lang-en"
        >
          EN
        </button>
      </div>

      {/* Login Container */}
      <div className="w-full max-w-[440px] flex flex-col items-center">
        {/* App Logo */}
        <div className="mb-6 animate-pulse" id="logo-container">
          <img 
            alt="Fenk Mahli Manager Logo" 
            className="w-24 h-24 object-contain rounded-2xl drop-shadow-md border border-slate-100 bg-white p-1" 
            referrerPolicy="no-referrer"
            src={fenkLogo}
          />
        </div>

        {/* Card Section */}
        <div className="login-card w-full rounded-2xl p-8 flex flex-col bg-white">
          {/* Header Text */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold font-display text-slate-950 mb-1">{t.title}</h1>
            <p className="text-sm font-sans text-slate-500">{t.subtitle}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit} id="loginForm">
            {/* Username/Email */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block" htmlFor="email">
                {t.emailLabel}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">
                  <User size={18} />
                </span>
                <input 
                  className={`w-full py-2.5 pr-10 pl-4 rounded-xl border border-slate-200 text-sm bg-[#f8f9ff] input-focus-ring transition-all ${lang === 'ar' ? 'text-right' : 'text-left'}`}
                  id="email" 
                  name="email" 
                  placeholder={lang === 'ar' ? "example@shop.com" : "owner@store.com"} 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                  type="text" 
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-slate-700" htmlFor="password">
                  {t.passwordLabel}
                </label>
                <a className="text-slate-900 font-semibold hover:underline" href="#" onClick={(e) => { e.preventDefault(); alert(lang === 'ar' ? 'ميزة استعادة كلمة المرور تجريبية. يمكنك تسجيل متجر جديد فوراً.' : 'Password reset is a demo feature. Try registering a new shop instantly.'); }}>
                  {t.forgot}
                </a>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">
                  <Lock size={18} />
                </span>
                <input 
                  className={`w-full py-2.5 pr-10 pl-10 rounded-xl border border-slate-200 text-sm bg-[#f8f9ff] input-focus-ring transition-all ${lang === 'ar' ? 'text-right' : 'text-left'}`}
                  id="password" 
                  name="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  type={showPassword ? "text" : "password"} 
                />
                <button 
                  className="absolute inset-y-0 left-3 flex items-center text-slate-400 hover:text-slate-800 transition-colors" 
                  onClick={() => setShowPassword(!showPassword)}
                  type="button"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2">
              <input 
                className="w-4 h-4 rounded border-slate-300 text-slate-950 focus:ring-slate-950 accent-slate-950" 
                id="remember" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                type="checkbox" 
              />
              <label className="text-xs text-slate-500 cursor-pointer select-none font-sans" htmlFor="remember">
                {t.remember}
              </label>
            </div>

            {/* Action Button */}
            <button 
              className="w-full py-3 bg-[#0F172A] text-white font-semibold font-display text-sm rounded-xl shadow-sm hover:bg-[#1e293b] active:scale-[0.98] transition-all flex justify-center items-center gap-2 cursor-pointer disabled:opacity-80" 
              disabled={loading}
              type="submit"
            >
              {loading ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  <span>{t.signingIn}</span>
                </>
              ) : (
                <>
                  <span>{t.login}</span>
                  <LogIn size={16} />
                </>
              )}
            </button>
          </form>

          {/* Secondary Actions */}
          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col items-center gap-3">
            <p className="text-xs text-slate-500 font-sans">{t.noShop}</p>
            <button 
              onClick={() => {
                setShowRegisterModal(true);
                setError('');
              }}
              className="w-full text-center text-xs font-bold font-display text-[#006c49] border border-[#006c49]/40 bg-emerald-50/50 hover:bg-emerald-50 hover:border-[#006c49] px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Store size={15} />
              <span>{t.register}</span>
            </button>
          </div>
        </div>

        {/* Technical Support Box */}
        <div className="mt-6 w-full bg-[#131b2e] text-white p-4 rounded-2xl border border-slate-800 shadow-md flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-display text-emerald-400">
              {lang === 'ar' ? 'الدعم الفني والخدمة المباشرة:' : 'Technical Support & Help:'}
            </span>
          </div>

          <div className="flex items-center justify-center gap-2 w-full">
            {/* Phone Call */}
            <a 
              href="tel:0777946398"
              className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black font-mono border border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <PhoneCall size={14} className="text-emerald-400" />
              <span>0777946398</span>
            </a>

            {/* WhatsApp */}
            <a 
              href={`https://wa.me/213777946398?text=${encodeURIComponent('مرحباً، أحتاج إلى الدعم الفني لتطبيق فنك ماركت')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold font-display flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <MessageCircle size={15} />
              <span>{t.whatsapp}</span>
            </a>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="mt-6 text-center">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.version}</p>
          <p className="text-[11px] text-slate-400 mt-1 font-sans">{t.rights}</p>
        </div>
      </div>

      {/* Register New Shop Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 border border-slate-100 shadow-xl animate-scale-in">
            <h3 className="text-lg font-bold text-slate-950 font-display flex items-center gap-2">
              <Store className="text-[#006c49]" size={20} />
              <span>{t.regTitle}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-sans mb-4">
              {t.regSubtitle}
            </p>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  {t.regShopNameAr} <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="مثال: بقالة البركة السعيدة"
                  value={newShopNameAr}
                  onChange={(e) => setNewShopNameAr(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-right bg-slate-50 focus:outline-none focus:border-slate-950"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  {t.regShopNameEn} <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Al-Baraka Happy Grocery"
                  value={newShopNameEn}
                  onChange={(e) => setNewShopNameEn(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-left bg-slate-50 focus:outline-none focus:border-slate-950"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  {t.regOwnerName}
                </label>
                <input 
                  type="text" 
                  placeholder={lang === 'ar' ? "مثال: عبدالله الودعاني" : "e.g. Abdullah Al-Wadani"}
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:border-slate-950 ${lang === 'ar' ? 'text-right' : 'text-left'}`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  {t.regCategory}
                </label>
                <select 
                  value={shopCategory}
                  onChange={(e) => setShopCategory(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:border-slate-950 ${lang === 'ar' ? 'text-right' : 'text-left'}`}
                >
                  <option value="grocery">{t.grocery}</option>
                  <option value="clothing">{t.clothing}</option>
                  <option value="electronics">{t.electronics}</option>
                  <option value="other">{t.other}</option>
                </select>
              </div>

              <div className="flex gap-2.5 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                >
                  {t.regCancel}
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-[#006c49] hover:bg-[#005236] text-white font-semibold text-xs rounded-xl transition-all cursor-pointer"
                >
                  {t.regSubmit}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
