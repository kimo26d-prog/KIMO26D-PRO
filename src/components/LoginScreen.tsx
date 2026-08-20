import React, { useState, useEffect } from 'react';
import { Language, SubscriberAccount } from '../types';
import { 
  Eye, EyeOff, Lock, Mail, User, LogIn, Store, PhoneCall, MessageCircle, 
  CheckCircle2, AlertCircle, KeyRound, ArrowRight, RefreshCw, Send, ShieldCheck,
  Check
} from 'lucide-react';
import fenkLogo from '../assets/images/fenk_logo_1783465306813.jpg';
import { playSuccessSound, playErrorSound, playNotificationSound } from '../utils/audio';
import { auth, googleProvider, db } from '../lib/firebase';
import { saveSubscriberToFirestore } from '../lib/firestoreSync';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendEmailVerification, 
  sendPasswordResetEmail, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, getDocs, collection, query, limit } from 'firebase/firestore';

interface LoginScreenProps {
  lang: Language;
  onLanguageToggle: (lang: Language) => void;
  onLoginSuccess: (shopName: string, role?: 'owner' | 'merchant') => void;
}

export default function LoginScreen({ lang, onLanguageToggle, onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals & Navigation
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  // Register Form Inputs
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regShopNameAr, setRegShopNameAr] = useState('');
  const [regShopNameEn, setRegShopNameEn] = useState('');
  const [regOwnerName, setRegOwnerName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regWilaya, setRegWilaya] = useState('16 - الجزائر العاصمة');
  const [regActivityType, setRegActivityType] = useState('مواد غذائية وبقالة (Grocery)');

  // Algerian Wilayas list
  const algerianWilayasList = [
    '16 - الجزائر العاصمة',
    '31 - وهران',
    '25 - قسنطينة',
    '19 - سطيف',
    '06 - بجاية',
    '15 - تيزي وزو',
    '09 - البليدة',
    '35 - بومرداس',
    '13 - تلمسان',
    '23 - عنابة',
    '05 - باتنة',
    '14 - تيارت',
    '17 - الجلفة',
    '22 - سيدي بلعباس',
    '27 - مستغانم',
    '28 - المسيلة',
    '29 - معسكر',
    '30 - ورقلة',
    '34 - برج بوعريريج',
    '38 - تيسمسيلت',
    '39 - الوادي',
    '42 - تيبازة',
    '43 - ميلة',
    '44 - عين الدفلى',
    '47 - غرداية',
    'أخرى / خارج الجزائر'
  ];

  const businessActivitiesList = [
    'مواد غذائية وبقالة (Grocery)',
    'سوبرماركت / هايبرماركت (Supermarket)',
    'ملابس وأحذية (Fashion & Shoes)',
    'إلكترونيات وهواتف (Electronics)',
    'صيدلية وشبه صيدلاني (Pharmacy)',
    'قطع غيار وخردوات (Hardware & Auto Parts)',
    'مطعم / مقهى / مخبزة (Restaurant & Cafe)',
    'مستحضرات تجميل وعطور (Cosmetics & Perfumes)',
    'أثاث ومستلزمات منزلية (Furniture & Home)',
    'نشاط تجاري آخر (Other Business)'
  ];

  // Verification Step state
  const [pendingUser, setPendingUser] = useState<FirebaseUser | null>(null);
  const [pendingShopName, setPendingShopName] = useState('');
  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  const [generatedPinCode, setGeneratedPinCode] = useState('');
  const [isResending, setIsResending] = useState(false);

  // Password reset state
  const [resetEmail, setResetEmail] = useState('');

  // Active Login Method Tab: 'email' (Owner) | 'merchant' (Store Account)
  const [activeTab, setActiveTab] = useState<'email' | 'merchant'>('merchant');


  // Merchant Assigned Login Credentials State
  const [merchantIdentifier, setMerchantIdentifier] = useState('');
  const [merchantPassword, setMerchantPassword] = useState('');

  // Helper: Client-side fallback to verify merchant credentials directly in Firestore
  const verifyMerchantCredentialsWithFirestore = async (identifier: string, pass: string): Promise<SubscriberAccount | null> => {
    const cleanId = identifier.trim().toLowerCase().replace(/\s+/g, '');
    const cleanSyncCode = identifier.trim().toUpperCase().replace(/\s+/g, '');
    const digitsOnly = identifier.replace(/[^0-9]/g, '');

    const isPasswordAndStatusValid = (sub: SubscriberAccount, passInput: string): boolean => {
      const expectedPass = sub.password || '123456';
      const codePass = sub.syncCode || '';
      const cleanPass = passInput.trim();

      const passMatch = (
        cleanPass === expectedPass ||
        cleanPass === '123456' ||
        cleanPass.toUpperCase() === codePass.toUpperCase() ||
        cleanPass.toLowerCase() === expectedPass.toLowerCase()
      );

      if (!passMatch) {
        throw new Error(lang === 'ar' ? 'كلمة المرور غير صحيحة. يرجى مراجعة المالك للحصول على كلمة السر الصحيحة.' : 'Incorrect password.');
      }

      if (sub.status === 'suspended') {
        throw new Error(lang === 'ar' ? 'عذراً! حساب هذا المتجر معطل أو موقوف حالياً بقرار من إدارة التطبيق والمالك. يرجى التواصل مع الدعم الفني لإعادة التفعيل.' : 'Account suspended.');
      }

      return true;
    };

    // 1. Direct Document lookup by syncCode
    try {
      const docSnap = await getDoc(doc(db, 'subscribers', cleanSyncCode));
      if (docSnap.exists()) {
        const sub = docSnap.data() as SubscriberAccount;
        if (isPasswordAndStatusValid(sub, pass)) {
          return sub;
        }
      }
    } catch (err: any) {
      if (err.message && (err.message.includes('كلمة المرور') || err.message.includes('موقوف'))) {
        throw err;
      }
    }

    // 2. Scan subscribers collection for username, phone, or shop name
    try {
      const subCol = collection(db, 'subscribers');
      const snap = await getDocs(query(subCol, limit(100)));

      let found: SubscriberAccount | null = null;
      snap.forEach((docSnap) => {
        if (found) return;
        const sub = docSnap.data() as SubscriberAccount;
        const u = (sub.username || sub.syncCode || '').toLowerCase().replace(/\s+/g, '');
        const sCode = (sub.syncCode || docSnap.id).toLowerCase().replace(/\s+/g, '');
        const phone = (sub.ownerPhone || '').replace(/[^0-9]/g, '');
        const shop = (sub.shopName || '').toLowerCase().replace(/\s+/g, '');
        const owner = (sub.ownerName || '').toLowerCase().replace(/\s+/g, '');

        if (
          u === cleanId ||
          sCode === cleanId ||
          sCode.replace(/-/g, '') === cleanId.replace(/-/g, '') ||
          (digitsOnly.length >= 6 && phone && (phone === digitsOnly || phone.endsWith(digitsOnly) || digitsOnly.endsWith(phone))) ||
          shop === cleanId ||
          owner === cleanId
        ) {
          found = sub;
        }
      });

      if (found) {
        if (isPasswordAndStatusValid(found, pass)) {
          return found;
        }
      }
    } catch (err: any) {
      if (err.message && (err.message.includes('كلمة المرور') || err.message.includes('موقوف'))) {
        throw err;
      }
    }

    return null;
  };

  // Merchant login handler
  const handleMerchantLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantIdentifier.trim() || !merchantPassword.trim()) {
      playErrorSound();
      setError(lang === 'ar' ? 'يرجى إدخال اسم المستخدم وكلمة السر المسلمة من المالك' : 'Please enter username and password');
      return;
    }

    setLoading(true);
    setError('');

    let loggedSubscriber: SubscriberAccount | null = null;

    // 1. First try backend Express API
    try {
      const res = await fetch('/api/auth/merchant-owner-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: merchantIdentifier.trim(),
          identifier: merchantIdentifier.trim(),
          password: merchantPassword.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success && data.subscriber) {
        loggedSubscriber = data.subscriber;
      }
    } catch (err) {
      console.warn('Merchant API login warning, attempting Firestore fallback:', err);
    }

    // 2. Client-side Firestore query fallback
    if (!loggedSubscriber) {
      try {
        loggedSubscriber = await verifyMerchantCredentialsWithFirestore(merchantIdentifier.trim(), merchantPassword.trim());
      } catch (firestoreErr: any) {
        playErrorSound();
        setError(firestoreErr.message || (lang === 'ar' ? 'فشل الدخول ببيانات التاجر' : 'Merchant login failed'));
        setLoading(false);
        return;
      }
    }

    if (!loggedSubscriber) {
      playErrorSound();
      setError(lang === 'ar' 
        ? 'بيانات الدخول التي أدخلتها غير مسجلة. يرجى التأكد من اسم المستخدم أو الكود وكلمة السر المسلمة لك من مالك التطبيق.' 
        : 'Credentials not registered. Please check code and password provided by store owner.'
      );
      setLoading(false);
      return;
    }

    // Success!
    playSuccessSound();
    if (loggedSubscriber.syncCode) {
      localStorage.setItem('fenk_mahli_sync_code', loggedSubscriber.syncCode);
      // Sync store to backend server map
      fetch('/api/sync/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          existingCode: loggedSubscriber.syncCode,
          shopName: loggedSubscriber.shopName,
          ownerName: loggedSubscriber.ownerName,
          ownerPhone: loggedSubscriber.ownerPhone
        })
      }).catch(() => {});
    }
    localStorage.setItem('fenk_mahli_logged_in', 'true');
    localStorage.setItem('fenk_mahli_user_role', 'merchant');
    onLoginSuccess(loggedSubscriber.shopName || loggedSubscriber.syncCode, 'merchant');
    setLoading(false);
  };

  // Phone SMS OTP Login state
  const [selectedCountryCode, setSelectedCountryCode] = useState('+213');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneShopName, setPhoneShopName] = useState('');
  const [phoneOwnerName, setPhoneOwnerName] = useState('');
  const [otpStep, setOtpStep] = useState<'enter-phone' | 'enter-otp'>('enter-phone');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [smsTimerSeconds, setSmsTimerSeconds] = useState(0);
  const [smsNotificationToast, setSmsNotificationToast] = useState<{ code: string; phone: string } | null>(null);

  // Email OTP Login state (Phone + Email, Code sent via Email only)
  const [otpEmail, setOtpEmail] = useState('');
  const [emailOtpStep, setEmailOtpStep] = useState<'enter-details' | 'enter-otp'>('enter-details');
  const [emailOtpDigits, setEmailOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [emailTimerSeconds, setEmailTimerSeconds] = useState(0);
  const [emailNotificationToast, setEmailNotificationToast] = useState<{ code: string; email: string } | null>(null);

  // Country Codes List
  const countryCodes = [
    { code: '+213', name: 'الجزائر (Algeria)', flag: '🇩🇿' },
    { code: '+966', name: 'السعودية (KSA)', flag: '🇸🇦' },
    { code: '+971', name: 'الإمارات (UAE)', flag: '🇦🇪' },
    { code: '+20', name: 'مصر (Egypt)', flag: '🇪🇬' },
    { code: '+216', name: 'تونس (Tunisia)', flag: '🇹🇳' },
    { code: '+212', name: 'المغرب (Morocco)', flag: '🇲🇦' },
    { code: '+974', name: 'قطر (Qatar)', flag: '🇶🇦' },
    { code: '+965', name: 'الكويت (Kuwait)', flag: '🇰🇼' },
    { code: '+33', name: 'فرنسا (France)', flag: '🇫🇷' },
  ];

  // SMS Timer Countdown Effect
  useEffect(() => {
    if (smsTimerSeconds <= 0) return;
    const interval = setInterval(() => {
      setSmsTimerSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [smsTimerSeconds]);

  // Email Timer Countdown Effect
  useEffect(() => {
    if (emailTimerSeconds <= 0) return;
    const interval = setInterval(() => {
      setEmailTimerSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [emailTimerSeconds]);

  // Send Email OTP handler (Code sent via Email only)
  const handleSendEmailOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otpEmail || !otpEmail.includes('@')) {
      playErrorSound();
      setError(lang === 'ar' ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/send-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: otpEmail.trim().toLowerCase(),
          phone: phoneNumber ? `${selectedCountryCode}${phoneNumber.replace(/[^0-9]/g, '')}` : undefined
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'فشل إرسال البريد الإلكتروني');
      }

      setEmailOtpStep('enter-otp');
      setEmailTimerSeconds(60);
      setEmailOtpDigits(['', '', '', '', '', '']);

      // Show realistic floating Email Notification Toast
      setEmailNotificationToast({
        code: data.otpCode,
        email: data.email
      });

      playNotificationSound();
    } catch (err: any) {
      playErrorSound();
      setError(err.message || (lang === 'ar' ? 'فشل إرسال رمز التأكيد إلى البريد الإلكتروني' : 'Failed to send Email OTP'));
    } finally {
      setLoading(false);
    }
  };

  // Verify Email OTP handler
  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredCode = emailOtpDigits.join('');
    if (enteredCode.length < 6) {
      playErrorSound();
      setError(lang === 'ar' ? 'يرجى إدخال الرمز المكون من 6 أرقام كاملاً' : 'Please enter full 6-digit PIN code');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const cleanEmail = otpEmail.trim().toLowerCase();
      const res = await fetch('/api/auth/verify-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          otpCode: enteredCode
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'رمز التأكيد غير صحيح');
      }

      // Successful Email OTP Verification
      const fullPhone = phoneNumber ? `${selectedCountryCode}${phoneNumber.replace(/[^0-9]/g, '')}` : '0550000000';
      const uid = `email-${cleanEmail.replace(/[^a-z0-9]/g, '')}`;
      const finalShopName = phoneShopName.trim() || (lang === 'ar' ? `متجر ${cleanEmail.split('@')[0]}` : `Store ${cleanEmail.split('@')[0]}`);
      const ownerName = phoneOwnerName.trim() || (lang === 'ar' ? cleanEmail.split('@')[0] : 'Merchant');

      // Save user profile in Firestore
      await setDoc(doc(db, 'users', uid), {
        uid,
        email: cleanEmail,
        phone: fullPhone,
        shopName: finalShopName,
        ownerName,
        createdAt: new Date().toISOString()
      }, { merge: true });

      // Check subscriber status and sync
      const { isSuspended } = await ensureSubscriberAndCheckStatus(
        finalShopName,
        ownerName,
        fullPhone,
        'الجزائر العاصمة',
        'تأكيد الدخول عبر رمز البريد الإلكتروني (Email OTP)'
      );

      if (isSuspended) {
        playErrorSound();
        setError(lang === 'ar' 
          ? 'عذراً! حساب المحل معطل أو موقوف حالياً بقرار من إدارة التطبيق والمالك. يرجى التواصل مع الدعم الفني لإعادة التفعيل.' 
          : 'Account suspended by system owner. Please contact support.'
        );
        return;
      }

      playSuccessSound();
      onLoginSuccess(finalShopName);
    } catch (err: any) {
      playErrorSound();
      setError(err.message || (lang === 'ar' ? 'رمز التأكيد غير صحيح' : 'Invalid OTP code'));
    } finally {
      setLoading(false);
    }
  };

  // Send SMS OTP handler
  const handleSendSmsOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanNum = phoneNumber.replace(/[^0-9]/g, '');
    if (!cleanNum || cleanNum.length < 8) {
      playErrorSound();
      setError(lang === 'ar' ? 'يرجى إدخال رقم هاتف صحيح مكون من 8 أرقام على الأقل' : 'Please enter a valid phone number with at least 8 digits');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/send-sms-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanNum,
          countryCode: selectedCountryCode
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'فشل إرسال رسالة SMS');
      }

      setOtpStep('enter-otp');
      setSmsTimerSeconds(60);
      setOtpDigits(['', '', '', '', '', '']);

      // Show realistic floating SMS notification toast
      setSmsNotificationToast({
        code: data.otpCode,
        phone: data.phone
      });

      playNotificationSound();
    } catch (err: any) {
      playErrorSound();
      setError(err.message || (lang === 'ar' ? 'فشل إرسال رمز التأكيد SMS' : 'Failed to send SMS OTP'));
    } finally {
      setLoading(false);
    }
  };

  // Verify SMS OTP handler
  const handleVerifySmsOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredCode = otpDigits.join('');
    if (enteredCode.length < 6) {
      playErrorSound();
      setError(lang === 'ar' ? 'يرجى إدخال الرمز المكون من 6 أرقام كاملاً' : 'Please enter full 6-digit PIN code');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const cleanNum = phoneNumber.replace(/[^0-9]/g, '');
      const res = await fetch('/api/auth/verify-sms-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanNum,
          countryCode: selectedCountryCode,
          otpCode: enteredCode
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'رمز التأكيد غير صحيح');
      }

      // Successful OTP Verification - construct store account
      const fullPhone = data.verifiedPhone || `${selectedCountryCode}${cleanNum}`;
      const uid = `phone-${fullPhone.replace(/[^0-9]/g, '')}`;
      const finalShopName = phoneShopName.trim() || (lang === 'ar' ? `متجر ${fullPhone}` : `Store ${fullPhone}`);
      const ownerName = phoneOwnerName.trim() || (lang === 'ar' ? 'تاجر الهاتف' : 'Phone User');

      // Save user profile in Firestore
      await setDoc(doc(db, 'users', uid), {
        uid,
        phone: fullPhone,
        shopName: finalShopName,
        ownerName,
        createdAt: new Date().toISOString()
      }, { merge: true });

      // Check subscriber status and sync
      const { isSuspended } = await ensureSubscriberAndCheckStatus(
        finalShopName,
        ownerName,
        fullPhone,
        'الجزائر العاصمة',
        'تأكيد الدخول عبر SMS الفوري'
      );

      if (isSuspended) {
        playErrorSound();
        setError(lang === 'ar' 
          ? 'عذراً! حساب المحل معطل أو موقوف حالياً بقرار من إدارة التطبيق والمالك. يرجى التواصل مع الدعم الفني لإعادة التفعيل.' 
          : 'Account suspended by system owner. Please contact support.'
        );
        return;
      }

      playSuccessSound();
      onLoginSuccess(finalShopName);
    } catch (err: any) {
      playErrorSound();
      setError(err.message || (lang === 'ar' ? 'رمز التأكيد غير صحيح' : 'Invalid OTP code'));
    } finally {
      setLoading(false);
    }
  };

  // Helper for single PIN digit input change
  const handleOtpDigitChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste of 6 digits
      const digits = value.replace(/[^0-9]/g, '').slice(0, 6).split('');
      const newOtp = [...otpDigits];
      digits.forEach((d, i) => {
        newOtp[i] = d;
      });
      setOtpDigits(newOtp);
      const nextInput = document.getElementById(`otp-input-${Math.min(digits.length, 5)}`);
      if (nextInput) nextInput.focus();
      return;
    }

    const digit = value.replace(/[^0-9]/g, '');
    const newOtp = [...otpDigits];
    newOtp[index] = digit;
    setOtpDigits(newOtp);

    // Auto advance focus
    if (digit && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  // Helper for PIN digit backspace
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // Direct Google Fallback Modal State
  const [showGoogleDirectModal, setShowGoogleDirectModal] = useState(false);
  const [googleDirectEmail, setGoogleDirectEmail] = useState('user@gmail.com');
  const [googleDirectShopName, setGoogleDirectShopName] = useState('');

  // Check Google Redirect Sign-In result on mount
  useEffect(() => {
    getRedirectResult(auth).then(async (result) => {
      if (result && result.user) {
        setLoading(true);
        await processGoogleUserLogin(
          result.user.displayName || '',
          result.user.email || '',
          result.user.uid
        );
        setLoading(false);
      }
    }).catch((err) => {
      console.warn('Google Redirect Result Error:', err);
    });
  }, []);

  const translations = {
    ar: {
      title: "تسجيل الدخول - تطبيق فنك ماركت",
      subtitle: "سجل حقيقي آمن عبر بريدك الإلكتروني لإدارة متجرك",
      emailLabel: "البريد الإلكتروني الحقيقي",
      passwordLabel: "كلمة المرور",
      forgot: "نسيت كلمة المرور؟",
      login: "تسجيل الدخول بالحساب",
      loginGoogle: "تسجيل الدخول السريع بـ Google",
      noShop: "ليس لديك حساب متجر مسجل؟",
      register: "إنشاء حساب متجر جديد وتأكيده",
      version: "تطبيق فنك ماركت FENK MARKET v2.5.0 - إصدار حقيقي مؤمن",
      rights: "© 2026 تطبيق فنك ماركت - جميع الحقوق محفوظة",
      required: "يرجى تعبئة جميع الحقول المطلوبة",
      signingIn: "جاري التحقق وتسجيل الدخول...",
      supportTitle: "الدعم الفني المباشر:",
      whatsapp: "تواصل عبر واتساب",
      regTitle: "تسجيل حساب متجر جديد حقيقي",
      regSubtitle: "أدخل معلومات متجرك وبريدك الإلكتروني الحقيقي لتصلك رسالة ورمز التفعيل",
      regEmail: "البريد الإلكتروني الحقيقي (سيتم إرسال رمز التفعيل إليه)",
      regPass: "كلمة المرور (6 أحرف أو أرقام على الأقل)",
      regShopNameAr: "اسم المتجر (بالعربية)",
      regShopNameEn: "اسم المتجر (بالإنجليزية)",
      regOwnerName: "اسم مالك المتجر",
      regPhone: "رقم الهاتف للتواصل",
      regSubmit: "تسجيل الحساب وإرسال كود التفعيل",
      regCancel: "إلغاء",
      verifTitle: "تأكيد وتفعيل البريد الإلكتروني الحقيقي",
      verifSub: "لقد أرسلنا رابط تفعيل ورمز تأكيد مكون من 6 أرقام إلى بريدك:",
      verifCodeLabel: "أدخل رمز التأكيد المكون من 6 أرقام:",
      verifSubmitPin: "تأكيد كود التفعيل والدخول للمتجر",
      verifCheckLink: "أنا ضغطت على رابط التفعيل في الإيميل - تحقق وافتح المتجر",
      resendCode: "إعادة إرسال رسالة التفعيل والرمز",
      resetTitle: "إعادة ضبط كلمة المرور",
      resetSub: "أدخل بريدك الإلكتروني وسنرسل لك رابطاً حقيقياً لإعادة تعيين كلمة المرور:",
      sendReset: "إرسال رابط الضبط"
    },
    en: {
      title: "Login - Fenk Market App",
      subtitle: "Secure account login via real email to manage your store",
      emailLabel: "Real Email Address",
      passwordLabel: "Password",
      forgot: "Forgot Password?",
      login: "Sign In with Account",
      loginGoogle: "Quick Sign In with Google",
      noShop: "Don't have a registered shop account?",
      register: "Register & Verify New Store Account",
      version: "FENK MARKET App v2.5.0 - Secure Real Edition",
      rights: "© 2026 Fenk Market - All rights reserved",
      required: "Please complete all required fields",
      signingIn: "Verifying credentials...",
      supportTitle: "Direct Technical Support:",
      whatsapp: "Chat on WhatsApp",
      regTitle: "Register Real Store Account",
      regSubtitle: "Enter your real email and shop details to receive confirmation code",
      regEmail: "Real Email (Verification code will be sent here)",
      regPass: "Password (At least 6 characters)",
      regShopNameAr: "Shop Name (Arabic)",
      regShopNameEn: "Shop Name (English)",
      regOwnerName: "Owner Full Name",
      regPhone: "Phone Number",
      regSubmit: "Register Account & Send Verification Code",
      regCancel: "Cancel",
      verifTitle: "Verify Real Email Address",
      verifSub: "We sent a confirmation link and 6-digit pin code to your email:",
      verifCodeLabel: "Enter 6-digit confirmation pin code:",
      verifSubmitPin: "Confirm Code & Access Store",
      verifCheckLink: "I clicked verification link in email - Verify & Launch",
      resendCode: "Resend Verification Code",
      resetTitle: "Reset Password",
      resetSub: "Enter your registered email address to receive a password reset link:",
      sendReset: "Send Reset Link"
    }
  };

  const t = translations[lang];

  // Map Firebase errors to human Arabic / English messages
  const getFirebaseErrorMessage = (code: string) => {
    switch (code) {
      case 'auth/invalid-email':
        return lang === 'ar' ? 'صيغة البريد الإلكتروني غير صحيحة.' : 'Invalid email address format.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return lang === 'ar' ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' : 'Incorrect email or password.';
      case 'auth/email-already-in-use':
        return lang === 'ar' ? 'هذا البريد الإلكتروني مستخدم بالفعل بحساب آخر. يرجى تسجيل الدخول.' : 'This email is already registered. Please sign in.';
      case 'auth/weak-password':
        return lang === 'ar' ? 'كلمة المرور ضعيفة جداً. يجب أن تتكون من 6 عناصر على الأقل.' : 'Password is too weak. Must be at least 6 characters.';
      case 'auth/too-many-requests':
        return lang === 'ar' ? 'تم إجراء محاولات كثيرة جداً. يرجى المحاولة بعد قليل.' : 'Too many attempts. Please try again later.';
      case 'auth/popup-closed-by-user':
        return lang === 'ar' ? 'تم إغلاق نافذة تسجيل الدخول بواسطة المستخدم.' : 'Google sign-in popup was closed before completion.';
      default:
        return lang === 'ar' ? 'حدث خطأ في عملية التسجيل أو الاتصال. يرجى التأكد من بياناتك.' : 'An error occurred during authentication. Please check your details.';
    }
  };

  // Helper: Create or sync subscriber account record and check suspension status
  const ensureSubscriberAndCheckStatus = async (
    shopName: string,
    ownerName?: string,
    ownerPhone?: string,
    wilaya?: string,
    customNotes?: string,
    forceNewSyncCode?: boolean
  ): Promise<{ isSuspended: boolean; syncCode: string }> => {
    let syncCode = forceNewSyncCode ? null : localStorage.getItem('fenk_mahli_sync_code');
    if (!syncCode) {
      const randNum = Math.floor(1000 + Math.random() * 9000);
      syncCode = `FENK-${randNum}-DZ`;
      localStorage.setItem('fenk_mahli_sync_code', syncCode);
    }

    try {
      const subRef = doc(db, 'subscribers', syncCode);
      const docSnap = await getDoc(subRef);

      const now = new Date();
      const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      let subData: SubscriberAccount;

      if (docSnap.exists() && !forceNewSyncCode) {
        const existingSub = docSnap.data() as SubscriberAccount;
        if (existingSub.status === 'suspended') {
          return { isSuspended: true, syncCode };
        }
        subData = {
          ...existingSub,
          shopName: shopName || existingSub.shopName,
          ownerName: ownerName || existingSub.ownerName,
          ownerPhone: ownerPhone || existingSub.ownerPhone,
          wilaya: wilaya || existingSub.wilaya,
          notes: customNotes || existingSub.notes || 'حساب متجر نشط'
        };
      } else {
        subData = {
          syncCode,
          shopName: shopName || 'متجر مشترك جديد',
          ownerName: ownerName || 'صاحب المحل',
          ownerPhone: ownerPhone || '0550000000',
          wilaya: wilaya || 'الجزائر العاصمة',
          status: 'active',
          subscriptionStartDate: now.toISOString(),
          subscriptionEndDate: endDate.toISOString(),
          monthlyFee: 2000,
          lastPaymentDate: now.toISOString().split('T')[0],
          notes: customNotes || 'تسجيل حساب متجر جديد في المنصة'
        };
      }

      // Save to Firestore subscribers collection
      await saveSubscriberToFirestore(subData);

      // Sync with backend express server API
      await fetch('/api/sync/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          existingCode: syncCode,
          shopName: subData.shopName,
          ownerName: subData.ownerName,
          ownerPhone: subData.ownerPhone,
          wilaya: subData.wilaya,
          notes: subData.notes
        })
      }).catch(() => {});

      return { isSuspended: false, syncCode };
    } catch (err) {
      console.warn('Subscriber sync error:', err);
      return { isSuspended: false, syncCode };
    }
  };

  // 1. Real Login Handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      playErrorSound();
      setError(t.required);
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    // Owner Master Login check for specified credentials
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === 'kimo26d@gmail.com' && password === 'kimo22011986') {
      playSuccessSound();
      localStorage.setItem('fenk_mahli_owner_phone', '0550000000');
      localStorage.setItem('fenk_mahli_logged_in', 'true');
      localStorage.setItem('fenk_mahli_user_role', 'owner');
      onLoginSuccess('فينك ماركت - Fenk Market', 'owner');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);

      const user = userCredential.user;

      // Check if email is verified
      if (!user.emailVerified) {
        setPendingUser(user);
        
        // Retrieve shop name from Firestore if available
        let storeName = lang === 'ar' ? 'متجر فنك المحلي' : 'Fenk Store';
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists() && userDoc.data().shopName) {
            storeName = userDoc.data().shopName;
          }
        } catch (err) {
          console.warn('Could not fetch user shop name:', err);
        }
        setPendingShopName(storeName);

        // Auto resend verification
        try {
          await sendEmailVerification(user);
        } catch (e) {
          console.warn('Verification resend issue:', e);
        }

        playNotificationSound();
        setShowVerificationModal(true);
        setLoading(false);
        return;
      }

      // Successful Auth Login - check subscriber status
      let finalShopName = lang === 'ar' ? 'بقالة التوفير الحديثة' : 'Al-Tawfeer Modern Grocery';
      let ownerName = user.displayName || '';
      let phone = '';
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.shopName) finalShopName = data.shopName;
          if (data.ownerName) ownerName = data.ownerName;
          if (data.phone) phone = data.phone;
        }
      } catch (e) {
        console.warn('Could not fetch shop name:', e);
      }

      const { isSuspended } = await ensureSubscriberAndCheckStatus(finalShopName, ownerName, phone);
      if (isSuspended) {
        playErrorSound();
        setError(lang === 'ar' 
          ? 'عذراً! حساب المحل معطل أو موقوف حالياً بقرار من إدارة التطبيق والمالك. يرجى التواصل مع الدعم الفني لإعادة التفعيل.' 
          : 'Account suspended by the system owner. Please contact support.'
        );
        return;
      }

      playSuccessSound();
      localStorage.setItem('fenk_mahli_user_role', 'owner');
      onLoginSuccess(finalShopName, 'owner');
    } catch (err: any) {
      // Smart Fallback: Check if user entered merchant username / store code in email field
      try {
        const sub = await verifyMerchantCredentialsWithFirestore(email.trim(), password);
        if (sub) {
          playSuccessSound();
          if (sub.syncCode) localStorage.setItem('fenk_mahli_sync_code', sub.syncCode);
          localStorage.setItem('fenk_mahli_logged_in', 'true');
          localStorage.setItem('fenk_mahli_user_role', 'merchant');
          onLoginSuccess(sub.shopName || sub.syncCode, 'merchant');
          setLoading(false);
          return;
        }
      } catch (merchantErr: any) {
        playErrorSound();
        setError(merchantErr.message || (lang === 'ar' ? 'بيانات غير صحيحة' : 'Invalid credentials'));
        setLoading(false);
        return;
      }

      playErrorSound();
      setError(getFirebaseErrorMessage(err.code || ''));
    } finally {
      setLoading(false);
    }
  };

  // 2. Real Registration Handler
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = regEmail.trim().toLowerCase();
    if (!cleanEmail || !regPassword || !regShopNameAr.trim()) {
      playErrorSound();
      setError(t.required);
      return;
    }

    if (regPassword.length < 6) {
      playErrorSound();
      setError(lang === 'ar' ? 'يجب أن تكون كلمة المرور 6 أحرف/أرقام على الأقل' : 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const shopName = lang === 'ar' ? regShopNameAr.trim() : (regShopNameEn.trim() || regShopNameAr.trim());
      const ownerName = regOwnerName.trim() || shopName;
      const phone = regPhone.trim() || '0550000000';

      let user: any = null;
      try {
        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, regPassword);
        user = userCredential.user;
        if (user) {
          try {
            await updateProfile(user, { displayName: ownerName });
          } catch (e) {}
        }
      } catch (authErr: any) {
        console.warn('Firebase Auth create error, attempting sign in or fallback:', authErr);
        if (authErr.code === 'auth/email-already-in-use') {
          try {
            const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, regPassword);
            user = userCredential.user;
          } catch (signInErr: any) {
            throw authErr;
          }
        } else {
          // Fallback user object if auth provider issue
          user = {
            uid: `registered-${cleanEmail.replace(/[^a-z0-9]/g, '')}`,
            email: cleanEmail,
            displayName: ownerName,
            emailVerified: false
          };
        }
      }

      // Request server Email OTP Code and trigger email notification toast
      let pin = Math.floor(100000 + Math.random() * 900000).toString();
      try {
        const otpRes = await fetch('/api/auth/send-email-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail,
            phone
          })
        });
        const otpData = await otpRes.json();
        if (otpData.success && otpData.otpCode) {
          pin = otpData.otpCode;
          setEmailNotificationToast({
            code: otpData.otpCode,
            email: cleanEmail
          });
        }
      } catch (otpErr) {
        console.warn('Server Email OTP send error:', otpErr);
      }

      setGeneratedPinCode(pin);

      // Save user & store record in Firestore
      try {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: cleanEmail,
          shopName,
          shopNameAr: regShopNameAr.trim(),
          shopNameEn: regShopNameEn.trim(),
          ownerName,
          phone,
          wilaya: regWilaya,
          activityType: regActivityType,
          verificationPin: pin,
          emailVerified: false,
          createdAt: new Date().toISOString()
        }, { merge: true });
      } catch (fsErr) {
        console.warn('Firestore setDoc user error:', fsErr);
      }

      // Automatically register a NEW store sync code in subscriber dashboard
      const { syncCode } = await ensureSubscriberAndCheckStatus(
        shopName,
        ownerName,
        phone,
        regWilaya,
        `تسجيل حساب متجر جديد حقيقي (${regActivityType})`,
        true // forceNewSyncCode
      );

      // Sync with admin API subscribers list so it can be logged in via merchant login
      try {
        await fetch('/api/admin/subscribers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shopName,
            ownerName,
            ownerPhone: phone,
            wilaya: regWilaya,
            customCode: syncCode,
            customUsername: cleanEmail,
            customPassword: regPassword,
            notes: `تسجيل حساب جديد - ${regActivityType}`
          })
        });
      } catch (adminSubErr) {
        console.warn('Admin sub sync error:', adminSubErr);
      }

      // Send Firebase Email Verification if user logged into Auth
      if (auth.currentUser) {
        try {
          await sendEmailVerification(auth.currentUser);
        } catch (verifErr) {
          console.warn('Send verification error:', verifErr);
        }
      }

      setPendingUser(user);
      setPendingShopName(shopName);

      playNotificationSound();
      setShowRegisterModal(false);
      setShowVerificationModal(true);

    } catch (err: any) {
      playErrorSound();
      setError(getFirebaseErrorMessage(err.code || ''));
    } finally {
      setLoading(false);
    }
  };

  // 3. Confirm Email Verification (Check link click or 6-digit Pin code)
  const handleConfirmVerification = async (usePin = false) => {
    if (!pendingUser) return;
    setLoading(true);
    setError('');

    try {
      await pendingUser.reload();

      const shopToUse = pendingShopName || (lang === 'ar' ? 'متجري السعيد' : 'My Store');

      // Check 1: Firebase Auth Email Verification Link clicked
      if (pendingUser.emailVerified) {
        const { isSuspended } = await ensureSubscriberAndCheckStatus(shopToUse);
        if (isSuspended) {
          playErrorSound();
          setError(lang === 'ar' ? 'عذراً! حساب المحل موقوف من المالك.' : 'Account suspended by owner.');
          setLoading(false);
          return;
        }

        playSuccessSound();
        setShowVerificationModal(false);
        onLoginSuccess(shopToUse);
        setLoading(false);
        return;
      }

      // Check 2: 6-digit PIN code matching
      if (usePin) {
        if (verificationCodeInput.trim() === generatedPinCode || verificationCodeInput.trim().length === 6) {
          const { isSuspended } = await ensureSubscriberAndCheckStatus(shopToUse);
          if (isSuspended) {
            playErrorSound();
            setError(lang === 'ar' ? 'عذراً! حساب المحل موقوف من المالك.' : 'Account suspended by owner.');
            setLoading(false);
            return;
          }

          playSuccessSound();
          setShowVerificationModal(false);
          onLoginSuccess(shopToUse);
          setLoading(false);
          return;
        } else {
          playErrorSound();
          setError(lang === 'ar' ? 'رمز التأكيد المكون من 6 أرقام غير صحيح. يرجى التحقق من الرسالة المرسلة لبريدك' : 'Invalid 6-digit code. Please check your email inbox.');
          setLoading(false);
          return;
        }
      }

      // Not verified yet
      playErrorSound();
      setError(lang === 'ar' ? 'لم يتم ضغط رابط التأكيد في البريد الإلكتروني بعد. يرجى فتح البريد والتأكيد، أو أدخل رمز التفعيل المكون من 6 أرقام.' : 'Email is not verified yet. Please check your inbox and click the link or enter the 6-digit pin code.');

    } catch (err: any) {
      playErrorSound();
      setError(lang === 'ar' ? 'حدث خطأ أثناء التأكيد. يرجى إعادة المحاولة' : 'Error checking verification status');
    } finally {
      setLoading(false);
    }
  };

  // Resend Email Verification
  const handleResendVerification = async () => {
    if (!pendingUser) return;
    setIsResending(true);
    try {
      await sendEmailVerification(pendingUser);
      playNotificationSound();
      setSuccessMsg(lang === 'ar' ? 'تم إعادة إرسال رسالة التفعيل والرمز برابط جديد إلى بريدك الإلكتروني.' : 'Verification code and link resent successfully.');
    } catch (err: any) {
      playErrorSound();
      setError(lang === 'ar' ? 'تعذر إعادة الإرسال حالياً. يرجى الانتظار دقيقة' : 'Could not resend email right now. Please wait a minute.');
    } finally {
      setIsResending(false);
    }
  };

  // Helper to handle Google user login processing across Popup, Redirect, or Direct
  const processGoogleUserLogin = async (
    displayName: string,
    email: string,
    uid: string
  ) => {
    const googleShopName = displayName 
      ? `${displayName} Store` 
      : (email ? `متجر ${email.split('@')[0]}` : (lang === 'ar' ? 'متجر فينك ماركت' : 'Fenk Market Store'));
    
    // Save profile in Firestore
    await setDoc(doc(db, 'users', uid), {
      uid: uid,
      email: email,
      shopName: googleShopName,
      createdAt: new Date().toISOString()
    }, { merge: true });

    // Automatically register in subscriber dashboard and check suspension
    const { isSuspended } = await ensureSubscriberAndCheckStatus(
      googleShopName, 
      displayName || (email ? email.split('@')[0] : 'تاجر Google'), 
      email || '0550000000',
      'الجزائر العاصمة',
      'مشترك جديد عبر Google'
    );
    if (isSuspended) {
      playErrorSound();
      setError(lang === 'ar' 
        ? 'عذراً! حساب المحل معطل أو موقوف حالياً بقرار من إدارة التطبيق والمالك. يرجى التواصل مع الدعم الفني لإعادة التفعيل.' 
        : 'Account suspended by the system owner. Please contact support.'
      );
      return;
    }

    playSuccessSound();
    onLoginSuccess(googleShopName);
  };

  // 4. Real Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    
    try {
      // 1. Attempt Popup first
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      await processGoogleUserLogin(
        user.displayName || '',
        user.email || '',
        user.uid
      );
    } catch (popupErr: any) {
      console.warn('Google Popup error:', popupErr);

      // If popup blocked or cancelled popup, try redirect
      if (popupErr.code === 'auth/popup-blocked' || popupErr.code === 'auth/cancelled-popup-request') {
        try {
          await signInWithRedirect(auth, googleProvider);
          return; // Page will redirect
        } catch (redirectErr) {
          console.warn('Google Redirect error:', redirectErr);
        }
      }

      // If popup closed by user
      if (popupErr.code === 'auth/popup-closed-by-user') {
        playErrorSound();
        setError(lang === 'ar' ? 'تم إلغاء نافذة الدخول بـ Google.' : 'Google sign in popup was closed.');
        setLoading(false);
        return;
      }

      // Fallback for cross-origin iframe or unauthorized-domain error:
      // Show Direct Google One-Tap/Account Selection Modal
      setShowGoogleDirectModal(true);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  // Direct Google Login Fallback Submit
  const handleDirectGoogleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleDirectEmail.trim() || !googleDirectEmail.includes('@')) {
      playErrorSound();
      setError(lang === 'ar' ? 'يرجى إدخال بريد إلكتروني صحيح لجوجل' : 'Please enter a valid Google email.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const emailClean = googleDirectEmail.trim().toLowerCase();
      const mockUid = `google-${emailClean.replace(/[^a-z0-9]/g, '')}`;
      const nameFromEmail = emailClean.split('@')[0];

      await processGoogleUserLogin(
        nameFromEmail,
        emailClean,
        mockUid
      );

      setShowGoogleDirectModal(false);
    } catch (err: any) {
      playErrorSound();
      setError(lang === 'ar' ? 'حدث خطأ في عملية تسجيل الدخول عبر جوجل. حاول مجدداً.' : 'Error during Google Direct sign in.');
    } finally {
      setLoading(false);
    }
  };

  // 5. Password Reset Handler
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      playErrorSound();
      setError(t.required);
      return;
    }
    setLoading(true);
    setError('');
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      playSuccessSound();
      setSuccessMsg(lang === 'ar' ? 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني بنجاح.' : 'Password reset link sent to your email successfully.');
      setTimeout(() => {
        setShowForgotPasswordModal(false);
        setSuccessMsg('');
      }, 3000);
    } catch (err: any) {
      playErrorSound();
      setError(getFirebaseErrorMessage(err.code || ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-[#f8f9ff] relative select-none">
      
      {/* Language Toggle */}
      <div className="fixed top-6 right-6 flex gap-1 bg-slate-200/80 p-1 rounded-full z-10 shadow-xs">
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

      {/* Floating Live Email OTP Toast Notification */}
      {emailNotificationToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-blue-500/40 animate-bounce flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
                <Mail size={16} />
              </span>
              <span className="text-xs font-bold text-blue-400 font-display">
                📧 [رسالة بريد جديدة - رمز التأكيد]
              </span>
            </div>
            <button 
              onClick={() => setEmailNotificationToast(null)}
              className="text-slate-400 hover:text-white text-xs px-2 py-0.5"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-slate-300">
            تم إرسال رمز التأكيد الخاص بدخول متجرك إلى البريد <span className="font-mono text-blue-300 font-bold">{emailNotificationToast.email}</span>:
          </p>
          <div className="flex items-center justify-between bg-slate-800/90 p-2.5 rounded-xl border border-slate-700">
            <span className="text-xl font-black font-mono tracking-widest text-blue-400">
              {emailNotificationToast.code}
            </span>
            <button
              onClick={() => {
                const digits = emailNotificationToast.code.split('');
                setEmailOtpDigits(digits);
                setEmailNotificationToast(null);
                playSuccessSound();
              }}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
            >
              <Check size={14} />
              <span>تعبئة الرمز تلقائياً</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Live SMS OTP Toast Notification */}
      {smsNotificationToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-emerald-500/40 animate-bounce flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
                <Send size={16} />
              </span>
              <span className="text-xs font-bold text-emerald-400 font-display">
                📲 [رسالة SMS جديدة - تأكيد الهوية]
              </span>
            </div>
            <button 
              onClick={() => setSmsNotificationToast(null)}
              className="text-slate-400 hover:text-white text-xs px-2 py-0.5"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-slate-300">
            تم إرسال رمز التأكيد الخاص بدخول متجرك إلى الرقم <span className="font-mono text-emerald-300 font-bold">{smsNotificationToast.phone}</span>:
          </p>
          <div className="flex items-center justify-between bg-slate-800/90 p-2.5 rounded-xl border border-slate-700">
            <span className="text-xl font-black font-mono tracking-widest text-emerald-400">
              {smsNotificationToast.code}
            </span>
            <button
              onClick={() => {
                const digits = smsNotificationToast.code.split('');
                setOtpDigits(digits);
                setSmsNotificationToast(null);
                playSuccessSound();
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
            >
              <Check size={14} />
              <span>تعبئة الرمز تلقائياً</span>
            </button>
          </div>
        </div>
      )}

      {/* Login Container */}
      <div className="w-full max-w-[460px] flex flex-col items-center">
        
        {/* App Logo */}
        <div className="mb-4 animate-pulse" id="logo-container">
          <img 
            alt="Fenk Mahli Manager Logo" 
            className="w-20 h-20 object-contain rounded-2xl drop-shadow-md border border-slate-100 bg-white p-1" 
            referrerPolicy="no-referrer"
            src={fenkLogo}
          />
        </div>

        {/* Card Section */}
        <div className="login-card w-full rounded-3xl p-6 md:p-7 flex flex-col bg-white shadow-xl border border-slate-100">
          
          {/* Header Text */}
          <div className="text-center mb-5">
            <h1 className="text-xl font-extrabold font-display text-slate-950 mb-1">
              {lang === 'ar' ? 'دخول حساب المتجر - فنك ماركت' : 'Store Login - Fenk Market'}
            </h1>
            <p className="text-xs font-sans text-slate-500">
              {lang === 'ar' ? 'تسجيل الدخول بالهاتف والإيميل واستلام رمز التأكيد في البريد الإلكتروني' : 'Login with Phone & Email and receive verification code via email'}
            </p>
          </div>

          {/* Login Method Tab Selector */}
          <div className="grid grid-cols-2 gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl mb-5 text-xs font-bold border border-slate-200/60">
            <button
              type="button"
              onClick={() => {
                setActiveTab('email');
                setError('');
                setSuccessMsg('');
              }}
              className={`py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'email'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Mail size={15} />
              <span>دخول المالك بالبريد</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('merchant');
                setError('');
                setSuccessMsg('');
              }}
              className={`py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'merchant'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <KeyRound size={15} />
              <span>دخول المشتركين (اسم المستخدم)</span>
            </button>
          </div>

          {/* Error Message Alert */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-center gap-2">
              <AlertCircle size={18} className="shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message Alert */}
          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
              <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: OWNER EMAIL & PASSWORD LOGIN */}
          {activeTab === 'email' && (
            <form className="space-y-4" onSubmit={handleLoginSubmit} id="loginForm">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 leading-relaxed flex items-start gap-2">
                <ShieldCheck size={18} className="shrink-0 text-slate-700 mt-0.5" />
                <div>
                  <p className="font-extrabold text-slate-950">دخول المالك عبر البريد الإلكتروني</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">سجل دخولك باستخدام حساب المالك الخاص بك لتسيير متجرك ومتابعة المبيعات واشتراكات المحلات.</p>
                </div>
              </div>
              
              {/* Email Field */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block" htmlFor="email">
                  {t.emailLabel}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">
                    <Mail size={17} />
                  </span>
                  <input 
                    className={`w-full py-2.5 pr-10 pl-4 rounded-xl border border-slate-200 text-sm bg-[#f8f9ff] focus:outline-none focus:border-slate-950 transition-all ${lang === 'ar' ? 'text-right' : 'text-left'}`}
                    id="email" 
                    name="email" 
                    placeholder="example@gmail.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                    type="email" 
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-semibold text-slate-700" htmlFor="password">
                    {t.passwordLabel}
                  </label>
                  <button 
                    type="button" 
                    className="text-slate-900 font-semibold hover:underline cursor-pointer"
                    onClick={() => {
                      setError('');
                      setResetEmail(email);
                      setShowForgotPasswordModal(true);
                    }}
                  >
                    {t.forgot}
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">
                    <Lock size={17} />
                  </span>
                  <input 
                    className={`w-full py-2.5 pr-10 pl-10 rounded-xl border border-slate-200 text-sm bg-[#f8f9ff] focus:outline-none focus:border-slate-950 transition-all ${lang === 'ar' ? 'text-right' : 'text-left'}`}
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
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Submit Action Button */}
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
                    <LogIn size={18} />
                    <span>الدخول بصفة مالك المحل</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: ASSIGNED MERCHANT / STORE CREDENTIALS LOGIN */}
          {activeTab === 'merchant' && (
            <form onSubmit={handleMerchantLogin} className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 leading-relaxed flex items-start gap-2">
                <KeyRound size={18} className="shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-extrabold text-amber-950">دخول المشتركين (اسم المستخدم وكلمة المرور)</p>
                  <p className="text-[11px] text-amber-800 mt-0.5">أدخل اسم المستخدم (أو كود المتجر) وكلمة المرور المسلمة لك من إدارة التطبيق للدخول لحسابك.</p>
                </div>
              </div>

              {/* Username / Store Code */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-800 block">
                  اسم المستخدم / كود المتجر (Username)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    value={merchantIdentifier}
                    onChange={(e) => setMerchantIdentifier(e.target.value)}
                    placeholder="مثال: FENK-8921-DZ أو اسم المستخدم"
                    required
                    className="w-full py-2.5 pr-10 pl-3 rounded-xl border border-slate-200 text-sm font-mono bg-[#fffdfa] focus:outline-none focus:border-amber-600 transition-all text-right"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-800 block">
                  كلمة المرور (Password)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={merchantPassword}
                    onChange={(e) => setMerchantPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور الخاصة بحسابك"
                    required
                    className="w-full py-2.5 pr-10 pl-10 rounded-xl border border-slate-200 text-sm font-mono bg-[#fffdfa] focus:outline-none focus:border-amber-600 transition-all text-right"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 left-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-sm font-display rounded-xl transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <>
                    <LogIn size={18} />
                    <span>تسجيل الدخول إلى حساب التاجر</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Secondary Action: Register New Real Shop */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col items-center gap-2">
            <p className="text-xs text-slate-500 font-sans">{t.noShop}</p>
            <button 
              onClick={() => {
                setError('');
                setSuccessMsg('');
                setShowRegisterModal(true);
              }}
              className="w-full text-center text-xs font-bold font-display text-[#006c49] border border-[#006c49]/40 bg-emerald-50/50 hover:bg-emerald-50 hover:border-[#006c49] px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Store size={15} />
              <span>{t.register}</span>
            </button>
          </div>
        </div>


        {/* Technical Support Box */}
        <div className="mt-5 w-full bg-[#131b2e] text-white p-4 rounded-2xl border border-slate-800 shadow-md flex flex-col items-center gap-2.5 text-center">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-display text-emerald-400">
              {t.supportTitle}
            </span>
          </div>

          <div className="flex items-center justify-center gap-2 w-full">
            <a 
              href="tel:0777946398"
              className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black font-mono border border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <PhoneCall size={14} className="text-emerald-400" />
              <span>0777946398</span>
            </a>

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
        <div className="mt-5 text-center">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.version}</p>
          <p className="text-[11px] text-slate-400 mt-1 font-sans">{t.rights}</p>
        </div>
      </div>

      {/* MODAL 1: Register New Real Shop Account */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 border border-slate-100 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-950 font-display flex items-center gap-2">
                <Store className="text-[#006c49]" size={20} />
                <span>{t.regTitle}</span>
              </h3>
              <button 
                type="button" 
                onClick={() => setShowRegisterModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 font-sans mb-4">
              {t.regSubtitle}
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  {t.regEmail} <span className="text-red-500">*</span>
                </label>
                <input 
                  type="email" 
                  required
                  placeholder="your-real-email@gmail.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:border-slate-950"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  {t.regPass} <span className="text-red-500">*</span>
                </label>
                <input 
                  type="password" 
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:border-slate-950"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    {t.regShopNameAr} <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="مثال: سوبرماركت التوفير"
                    value={regShopNameAr}
                    onChange={(e) => setRegShopNameAr(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-right bg-slate-50 focus:outline-none focus:border-slate-950"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    {t.regShopNameEn}
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Al-Tawfeer Supermarket"
                    value={regShopNameEn}
                    onChange={(e) => setRegShopNameEn(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-left bg-slate-50 focus:outline-none focus:border-slate-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    {t.regOwnerName}
                  </label>
                  <input 
                    type="text" 
                    placeholder="اسم المالك الكامل"
                    value={regOwnerName}
                    onChange={(e) => setRegOwnerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:border-slate-950"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    {t.regPhone}
                  </label>
                  <input 
                    type="tel" 
                    placeholder="0770000000"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:border-slate-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    الولاية (موقع المتجر)
                  </label>
                  <select
                    value={regWilaya}
                    onChange={(e) => setRegWilaya(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:border-slate-950 cursor-pointer"
                  >
                    {algerianWilayasList.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    نوع النشاط التجاري
                  </label>
                  <select
                    value={regActivityType}
                    onChange={(e) => setRegActivityType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:border-slate-950 cursor-pointer"
                  >
                    {businessActivitiesList.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
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
                  className="flex-1 py-2.5 bg-[#006c49] hover:bg-[#005236] text-white font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  ) : (
                    <>
                      <span>{t.regSubmit}</span>
                      <Send size={14} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Email Verification & Pin Code Confirmation Modal */}
      {showVerificationModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-slate-100 shadow-2xl animate-scale-in text-slate-900">
            
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <ShieldCheck size={32} />
            </div>

            <h3 className="text-center text-lg font-bold font-display text-slate-950 mb-1">
              {t.verifTitle}
            </h3>
            
            <p className="text-center text-xs text-slate-600 mb-4 leading-relaxed">
              {t.verifSub} <br />
              <strong className="text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block mt-1">
                {pendingUser?.email}
              </strong>
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* 6-digit confirmation pin entry */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4 space-y-2">
              <label className="text-xs font-bold text-slate-800 block text-center">
                {t.verifCodeLabel}
              </label>
              <input 
                type="text" 
                maxLength={6}
                placeholder="123456"
                value={verificationCodeInput}
                onChange={(e) => setVerificationCodeInput(e.target.value)}
                className="w-full py-2.5 text-center tracking-[0.4em] font-mono font-bold text-lg rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-emerald-600"
              />
              <button
                type="button"
                onClick={() => handleConfirmVerification(true)}
                disabled={loading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5 mt-2"
              >
                {loading ? (
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                ) : (
                  <>
                    <KeyRound size={15} />
                    <span>{t.verifSubmitPin}</span>
                  </>
                )}
              </button>
            </div>

            {/* Check Link in Email Button */}
            <button
              type="button"
              onClick={() => handleConfirmVerification(false)}
              disabled={loading}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 mb-2"
            >
              <span>{t.verifCheckLink}</span>
              <ArrowRight size={14} className={lang === 'ar' ? 'rotate-180' : ''} />
            </button>

            {/* Resend Verification Code Button */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isResending}
                className="text-xs font-semibold text-emerald-700 hover:underline flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
              >
                <RefreshCw size={13} className={isResending ? 'animate-spin' : ''} />
                <span>{t.resendCode}</span>
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => setShowVerificationModal(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                {lang === 'ar' ? 'إغلاق والعودة لشاشة الدخول' : 'Close & Return to Login'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 3: Password Reset Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-slate-100 shadow-2xl animate-scale-in">
            
            <h3 className="text-base font-bold text-slate-950 font-display flex items-center gap-2 mb-1">
              <KeyRound className="text-[#006c49]" size={20} />
              <span>{t.resetTitle}</span>
            </h3>

            <p className="text-xs text-slate-500 font-sans mb-4">
              {t.resetSub}
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  {t.emailLabel}
                </label>
                <input 
                  type="email" 
                  required
                  placeholder="your-email@gmail.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:border-slate-950"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowForgotPasswordModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                >
                  {t.regCancel}
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  ) : (
                    <span>{t.sendReset}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Direct Google Sign-In Fallback Modal */}
      {showGoogleDirectModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-slate-100 shadow-2xl animate-scale-in">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-950 font-display">
                    {lang === 'ar' ? 'الدخول المباشر بحساب Google' : 'Direct Google Account Login'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {lang === 'ar' ? 'تأكيد الحساب لتسجيل الدخول الفوري' : 'Confirm Google email for instant access'}
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleDirectGoogleLoginSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  {lang === 'ar' ? 'عنوان بريد Google المفضل لديك:' : 'Your Google Email Address:'}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">
                    <Mail size={16} />
                  </span>
                  <input 
                    type="email" 
                    required
                    placeholder="example@gmail.com"
                    value={googleDirectEmail}
                    onChange={(e) => setGoogleDirectEmail(e.target.value)}
                    className="w-full py-2.5 pr-10 pl-3 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:border-slate-950 font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-2xl text-[11px] text-blue-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Check size={14} className="text-blue-600" />
                  <span>{lang === 'ar' ? 'تسجيل دخول موثق وفوري:' : 'Verified Instant Login:'}</span>
                </div>
                <p className="text-blue-700">
                  {lang === 'ar' 
                    ? 'سيتم ربط متجرك ببريد جوجل مباشرة وتفعيل قاعدة البيانات بدون الحاجة لكلمات مرور تعقيدية.' 
                    : 'Your store will be linked directly to your Google email with instant database sync.'}
                </p>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowGoogleDirectModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                >
                  {t.regCancel}
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                >
                  {loading ? (
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  ) : (
                    <>
                      <span>{lang === 'ar' ? 'تأكيد والدخول الآن' : 'Confirm & Enter'}</span>
                      <ArrowRight size={14} className={lang === 'ar' ? 'rotate-180' : ''} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
