import React, { useState, useRef } from 'react';
import { Language, SHOP_TYPES } from '../types';
import { 
  X, Upload, Image as ImageIcon, Check, Store, Phone, MapPin, 
  RotateCcw, Sparkles, FileText, Settings, Building2, ShoppingBag, 
  Tag
} from 'lucide-react';
import fenkLogo from '../assets/images/fenk_logo_1783465306813.jpg';
import { playSuccessSound, playClickSound } from '../utils/audio';

interface StoreSettingsModalProps {
  lang: Language;
  isOpen: boolean;
  onClose: () => void;
  shopName: string;
  shopType?: string;
  syncCode?: string;
  onUpdateSettings: (newSettings: {
    shopName: string;
    shopType: string;
    shopPhone: string;
    shopAddress: string;
    shopLogo: string;
  }) => void;
}

// Preset store logos for quick selection
const PRESET_LOGOS = [
  { id: 'default', nameAr: 'شعار فنك الإفتراضي', nameEn: 'Fenk Default', url: fenkLogo },
  { 
    id: 'grocery', 
    nameAr: 'بقالة / سوبرماركت', 
    nameEn: 'Grocery Store',
    url: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=200&q=80'
  },
  { 
    id: 'fashion', 
    nameAr: 'ملابس وأزياء', 
    nameEn: 'Fashion & Apparel',
    url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=200&q=80'
  },
  { 
    id: 'tech', 
    nameAr: 'إلكترونيات وهواتف', 
    nameEn: 'Tech & Electronics',
    url: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=200&q=80'
  },
  { 
    id: 'cafe', 
    nameAr: 'مقهى ومخبزة', 
    nameEn: 'Bakery & Cafe',
    url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=200&q=80'
  },
  { 
    id: 'pharmacy', 
    nameAr: 'صيدلية / تجميل', 
    nameEn: 'Pharmacy & Beauty',
    url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=200&q=80'
  }
];

export default function StoreSettingsModal({
  lang,
  isOpen,
  onClose,
  shopName,
  shopType,
  syncCode,
  onUpdateSettings
}: StoreSettingsModalProps) {
  const codeKey = syncCode || localStorage.getItem('fenk_mahli_sync_code') || 'DEFAULT';

  const [name, setName] = useState<string>(() => {
    return shopName || localStorage.getItem(`fenk_mahli_shop_name_${codeKey}`) || localStorage.getItem('fenk_mahli_shop_name') || 'بقالة التوفير الحديثة';
  });

  const [selectedShopType, setSelectedShopType] = useState<string>(() => {
    return shopType || localStorage.getItem(`fenk_mahli_shop_type_${codeKey}`) || localStorage.getItem('fenk_mahli_shop_type') || 'grocery';
  });

  const [phone, setPhone] = useState<string>(() => {
    return localStorage.getItem(`fenk_mahli_owner_phone_${codeKey}`) || localStorage.getItem('fenk_mahli_owner_phone') || '0550 12 34 56';
  });

  const [address, setAddress] = useState<string>(() => {
    return localStorage.getItem(`fenk_mahli_wilaya_${codeKey}`) || localStorage.getItem('fenk_mahli_wilaya') || 'الجزائر العاصمة';
  });

  const [logoUrl, setLogoUrl] = useState<string>(() => {
    return localStorage.getItem(`fenk_mahli_shop_logo_${codeKey}`) || localStorage.getItem('fenk_mahli_shop_logo') || fenkLogo;
  });

  const [isSavedToast, setIsSavedToast] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle custom image file upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError(lang === 'ar' ? 'يرجى اختيار ملف صورة صالح (PNG, JPG, WEBP)' : 'Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // Max 5MB
      setUploadError(lang === 'ar' ? 'حجم الصورة كبير جداً (الأقصى 5 ميجابايت)' : 'Image size too large (max 5MB)');
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      if (base64String) {
        setLogoUrl(base64String);
        playClickSound();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    playSuccessSound();

    const cleanName = name.trim() || 'المتجر';
    const cleanPhone = phone.trim() || '0550 00 00 00';
    const cleanAddress = address.trim() || 'الجزائر';

    localStorage.setItem('fenk_mahli_shop_name', cleanName);
    localStorage.setItem('fenk_mahli_shop_type', selectedShopType);
    localStorage.setItem('fenk_mahli_owner_phone', cleanPhone);
    localStorage.setItem('fenk_mahli_wilaya', cleanAddress);
    localStorage.setItem('fenk_mahli_shop_logo', logoUrl);

    if (codeKey) {
      localStorage.setItem(`fenk_mahli_shop_name_${codeKey}`, cleanName);
      localStorage.setItem(`fenk_mahli_shop_type_${codeKey}`, selectedShopType);
      localStorage.setItem(`fenk_mahli_owner_phone_${codeKey}`, cleanPhone);
      localStorage.setItem(`fenk_mahli_wilaya_${codeKey}`, cleanAddress);
      localStorage.setItem(`fenk_mahli_shop_logo_${codeKey}`, logoUrl);
    }

    onUpdateSettings({
      shopName: cleanName,
      shopType: selectedShopType,
      shopPhone: cleanPhone,
      shopAddress: cleanAddress,
      shopLogo: logoUrl
    });

    setIsSavedToast(true);
    setTimeout(() => {
      setIsSavedToast(false);
      onClose();
    }, 1200);
  };

  const handleResetLogo = () => {
    playClickSound();
    setLogoUrl(fenkLogo);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-3 sm:p-4 z-50 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-xl p-5 sm:p-6 border border-slate-200 shadow-2xl relative my-auto space-y-5">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-slate-900 text-white rounded-2xl shadow-sm">
              <Settings size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold font-display text-slate-950">
                {lang === 'ar' ? 'إعدادات وشعار الفاتورة المطبوعة' : 'Store & Invoice Logo Settings'}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'ar' 
                  ? 'رفع أو اختيار شعار المتجر وتحديث البيانات الظاهرة في رأس الفواتير' 
                  : 'Customize your store logo and contact details printed on sales receipts'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Success Toast Banner */}
        {isSavedToast && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 font-bold font-display animate-bounce-in">
            <Check size={18} className="text-emerald-600 shrink-0" />
            <span>
              {lang === 'ar' 
                ? 'تم حفظ الإعدادات والشعار بنجاح! سيظهر في الفواتير القادمة.' 
                : 'Settings & Logo saved successfully!'}
            </span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          
          {/* Section 1: Logo Management */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black font-display text-slate-900 flex items-center gap-1.5">
                <ImageIcon size={15} className="text-[#006c49]" />
                <span>{lang === 'ar' ? 'شعار المتجر للفاتورة المطبوعة' : 'Printed Receipt Store Logo'}</span>
              </label>

              {logoUrl !== fenkLogo && (
                <button
                  type="button"
                  onClick={handleResetLogo}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <RotateCcw size={12} />
                  <span>{lang === 'ar' ? 'استعادة الشعار الافتراضي' : 'Reset to default'}</span>
                </button>
              )}
            </div>

            {/* Upload Area & Current Logo Preview */}
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3.5 rounded-2xl border border-slate-200">
              
              {/* Logo Preview Box */}
              <div className="relative group shrink-0">
                <img 
                  src={logoUrl} 
                  alt="Store Logo Preview" 
                  className="w-20 h-20 object-contain rounded-2xl border-2 border-slate-200 shadow-sm bg-slate-50 p-1"
                />
                <span className="absolute -bottom-2 -right-2 bg-slate-900 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full shadow-xs">
                  {lang === 'ar' ? 'المعاينة' : 'Preview'}
                </span>
              </div>

              {/* Upload Controls */}
              <div className="flex-1 space-y-2 text-center sm:text-right w-full">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-[#006c49] hover:bg-[#005236] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Upload size={14} />
                    <span>{lang === 'ar' ? 'رفع شعار جديد من الجهاز' : 'Upload Image File'}</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-500">
                  {lang === 'ar' 
                    ? 'يدعم صور PNG, JPG, WEBP بحجم أقصى 5 ميجابايت' 
                    : 'Supports PNG, JPG or WEBP formats up to 5MB'}
                </p>

                {uploadError && (
                  <p className="text-xs text-rose-600 font-bold">{uploadError}</p>
                )}
              </div>
            </div>

            {/* Quick Preset Logos */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-600 block">
                {lang === 'ar' ? 'أو اختر شعاراً جاهزاً بحسب نشاطك التجارية:' : 'Or pick from preset activity icons:'}
              </span>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {PRESET_LOGOS.map((preset) => {
                  const isSelected = logoUrl === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setLogoUrl(preset.url);
                      }}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        isSelected 
                          ? 'border-[#006c49] bg-emerald-50/80 shadow-xs ring-1 ring-[#006c49]' 
                          : 'border-slate-200 bg-white hover:bg-slate-100/80'
                      }`}
                    >
                      <img 
                        src={preset.url} 
                        alt={preset.nameAr} 
                        className="w-8 h-8 object-contain rounded-lg border border-slate-100"
                      />
                      <span className="text-[9px] font-bold text-slate-800 line-clamp-1">
                        {lang === 'ar' ? preset.nameAr : preset.nameEn}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 2: Store Activity Type Selection */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-black font-display text-slate-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Tag size={15} className="text-[#006c49]" />
                <span>{lang === 'ar' ? 'تحديد نوع وسجل المحل / النشاط التجاري' : 'Select Shop Activity Type'}</span>
              </span>
              <span className="text-[10px] bg-emerald-100 text-[#006c49] font-bold px-2 py-0.5 rounded-full">
                {lang === 'ar' ? 'مخصص للخصوصية' : 'Store Specific'}
              </span>
            </h4>

            <p className="text-[11px] text-slate-500">
              {lang === 'ar' 
                ? 'اختر نوع النشاط التجاري لم حلك للتحكم في تخصيص الفواتير وإدارة السلع بخوصية كاملة:' 
                : 'Select your business type to customize receipts and catalog privacy:'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {SHOP_TYPES.map((st) => {
                const isSelected = selectedShopType === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setSelectedShopType(st.id);
                    }}
                    className={`p-2.5 rounded-2xl border text-right transition-all cursor-pointer flex items-start gap-2.5 ${
                      isSelected
                        ? 'border-[#006c49] bg-emerald-50/90 shadow-xs ring-2 ring-[#006c49]/20'
                        : 'border-slate-200 bg-white hover:bg-slate-100/90'
                    }`}
                  >
                    <span className="text-xl shrink-0 p-1 bg-white rounded-xl shadow-2xs border border-slate-100">{st.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-extrabold line-clamp-1 ${isSelected ? 'text-[#006c49]' : 'text-slate-900'}`}>
                          {lang === 'ar' ? st.nameAr : st.nameEn}
                        </span>
                        {isSelected && <Check size={14} className="text-[#006c49] shrink-0" />}
                      </div>
                      <p className="text-[9.5px] text-slate-500 line-clamp-1 mt-0.5 font-medium">
                        {lang === 'ar' ? st.descriptionAr : st.descriptionEn}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Store Information */}
          <div className="space-y-3">
            <h4 className="text-xs font-black font-display text-slate-900 flex items-center gap-1.5">
              <Building2 size={15} className="text-[#006c49]" />
              <span>{lang === 'ar' ? 'بيانات المتجر المطبوعة بالفاتورة' : 'Store Print Information'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Store Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Store size={13} className="text-slate-400" />
                  <span>{lang === 'ar' ? 'اسم المتجر' : 'Store Name'}</span>
                </label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={lang === 'ar' ? "مثال: بقالة التوفير الحديثة" : "Store Name"}
                  className={`w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:border-slate-950 font-bold ${lang === 'ar' ? 'text-right' : 'text-left'}`}
                />
              </div>

              {/* Store Phone */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Phone size={13} className="text-slate-400" />
                  <span>{lang === 'ar' ? 'رقم هاتف المحل' : 'Store Phone'}</span>
                </label>
                <input 
                  type="text" 
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0550 12 34 56"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:border-slate-950 font-mono font-bold text-left"
                />
              </div>

              {/* Store Address */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <MapPin size={13} className="text-slate-400" />
                  <span>{lang === 'ar' ? 'عنوان المحل / الولاية' : 'Store Address / Location'}</span>
                </label>
                <input 
                  type="text" 
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={lang === 'ar' ? "الجزائر العاصمة - حي باب الزوار" : "Algiers, Bab Ezzouar"}
                  className={`w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:border-slate-950 font-bold ${lang === 'ar' ? 'text-right' : 'text-left'}`}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Live Receipt Header Simulation Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-3.5 space-y-2 border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase flex items-center gap-1">
                <FileText size={12} />
                <span>{lang === 'ar' ? 'معاينة رأس الفاتورة عند الطباعة' : 'Live Printed Receipt Header Preview'}</span>
              </span>
              <span className="text-[9px] text-slate-400">{lang === 'ar' ? 'طابعة حرارية' : 'Thermal Receipt'}</span>
            </div>

            <div className="bg-white text-slate-900 rounded-xl p-3 space-y-1.5 text-center shadow-xs max-w-xs mx-auto my-1">
              <img 
                src={logoUrl} 
                alt="Logo" 
                className="w-12 h-12 object-contain mx-auto rounded-xl border border-slate-200 p-0.5 bg-white shadow-2xs"
              />
              <h5 className="font-black font-display text-sm text-slate-950 tracking-tight">
                {name || 'اسم المتجر'}
              </h5>
              <p className="text-[9px] text-slate-500 font-medium">
                {lang === 'ar' ? 'فاتورة مبيعات مبسطة' : 'Simplified Tax Invoice'}
              </p>
              <div className="flex items-center justify-center gap-3 text-[10px] font-bold text-slate-900 bg-slate-50 py-1 px-2 rounded-lg border border-slate-200/80">
                <span className="font-mono flex items-center gap-0.5">
                  <Phone size={10} className="text-emerald-700" />
                  {phone || '0550 00 00 00'}
                </span>
                <span className="flex items-center gap-0.5">
                  <MapPin size={10} className="text-emerald-700" />
                  {address || 'الجزائر'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-[#006c49] hover:bg-[#005236] text-white font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check size={16} />
              <span>{lang === 'ar' ? 'حفظ إعدادات الفاتورة والشعار' : 'Save Logo & Invoice Settings'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
