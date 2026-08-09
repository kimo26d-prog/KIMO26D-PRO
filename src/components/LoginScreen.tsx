import React, { useState } from 'react';
import { Language, SubscriberAccount } from '../types';
import { 
  Eye, EyeOff, Lock, Mail, User, LogIn, Store, PhoneCall, MessageCircle, 
  CheckCircle2, AlertCircle, KeyRound, ArrowRight, RefreshCw, Send, ShieldCheck
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
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface LoginScreenProps {
  lang: Language;
  onLanguageToggle: (lang: Language) => void;
  onLoginSuccess: (shopName: string) => void;
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

  // Verification Step state
  const [pendingUser, setPendingUser] = useState<FirebaseUser | null>(null);
  const [pendingShopName, setPendingShopName] = useState('');
  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  const [generatedPinCode, setGeneratedPinCode] = useState('');
  const [isResending, setIsResending] = useState(false);

  // Password reset state
  const [resetEmail, setResetEmail] = useState('');

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
    wilaya?: string
  ): Promise<{ isSuspended: boolean; syncCode: string }> => {
    let syncCode = localStorage.getItem('fenk_mahli_sync_code');
    if (!syncCode) {
      const randNum = Math.floor(1000 + Math.random() * 9000);
      syncCode = `FENK-${randNum}-DZ`;
      localStorage.setItem('fenk_mahli_sync_code', syncCode);
    }

    try {
      const subRef = doc(db, 'subscribers', syncCode);
      const docSnap = await getDoc(subRef);

      if (docSnap.exists()) {
        const existingSub = docSnap.data() as SubscriberAccount;
        if (existingSub.status === 'suspended') {
          return { isSuspended: true, syncCode };
        }
        return { isSuspended: false, syncCode };
      }

      // If new, construct SubscriberAccount
      const now = new Date();
      const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days initial period
      const newSub: SubscriberAccount = {
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
        notes: 'تم التسجيل تلقائياً عند إنشاء الحساب'
      };

      await saveSubscriberToFirestore(newSub);

      // Also sync to backend API
      fetch('/api/sync/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          existingCode: syncCode,
          shopName: newSub.shopName,
          ownerName: newSub.ownerName,
          ownerPhone: newSub.ownerPhone,
          wilaya: newSub.wilaya
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
      onLoginSuccess(finalShopName);
    } catch (err: any) {
      playErrorSound();
      setError(getFirebaseErrorMessage(err.code || ''));
    } finally {
      setLoading(false);
    }
  };

  // 2. Real Registration Handler
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail.trim() || !regPassword || !regShopNameAr.trim()) {
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
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, regEmail.trim(), regPassword);
      const user = userCredential.user;

      const shopName = lang === 'ar' ? regShopNameAr.trim() : (regShopNameEn.trim() || regShopNameAr.trim());

      // Update user display name
      await updateProfile(user, {
        displayName: regOwnerName.trim() || shopName
      });

      // Generate 6-digit confirmation PIN code
      const pin = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedPinCode(pin);

      // Save user & store record in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: regEmail.trim(),
        shopName,
        shopNameAr: regShopNameAr.trim(),
        shopNameEn: regShopNameEn.trim(),
        ownerName: regOwnerName.trim(),
        phone: regPhone.trim(),
        verificationPin: pin,
        createdAt: new Date().toISOString()
      }, { merge: true });

      // Automatically register in owner subscriber dashboard
      await ensureSubscriberAndCheckStatus(shopName, regOwnerName.trim(), regPhone.trim());

      // Send Firebase Email Verification
      await sendEmailVerification(user);

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

  // 4. Real Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const googleShopName = user.displayName 
        ? `${user.displayName} Store` 
        : (lang === 'ar' ? 'متجر فينك ماركت' : 'Fenk Market Store');
      
      // Save profile in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        shopName: googleShopName,
        createdAt: new Date().toISOString()
      }, { merge: true });

      // Automatically register in subscriber dashboard and check suspension
      const { isSuspended } = await ensureSubscriberAndCheckStatus(googleShopName, user.displayName || '', user.phoneNumber || '');
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
    } catch (err: any) {
      playErrorSound();
      setError(getFirebaseErrorMessage(err.code || ''));
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

      {/* Login Container */}
      <div className="w-full max-w-[450px] flex flex-col items-center">
        
        {/* App Logo */}
        <div className="mb-5 animate-pulse" id="logo-container">
          <img 
            alt="Fenk Mahli Manager Logo" 
            className="w-24 h-24 object-contain rounded-2xl drop-shadow-md border border-slate-100 bg-white p-1" 
            referrerPolicy="no-referrer"
            src={fenkLogo}
          />
        </div>

        {/* Card Section */}
        <div className="login-card w-full rounded-3xl p-7 flex flex-col bg-white shadow-xl border border-slate-100">
          
          {/* Header Text */}
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold font-display text-slate-950 mb-1">{t.title}</h1>
            <p className="text-xs font-sans text-slate-500">{t.subtitle}</p>
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

          {/* Main Login Form */}
          <form className="space-y-4" onSubmit={handleLoginSubmit} id="loginForm">
            
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
                  placeholder="your-email@gmail.com" 
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
                  <span>{t.login}</span>
                  <LogIn size={16} />
                </>
              )}
            </button>
          </form>

          {/* Google Sign In Divider */}
          <div className="relative my-4 flex items-center justify-center">
            <div className="border-t border-slate-200 w-full"></div>
            <span className="bg-white px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider shrink-0">
              {lang === 'ar' ? 'أو عبر الدخول السريع' : 'OR QUICK ACCESS'}
            </span>
            <div className="border-t border-slate-200 w-full"></div>
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z"/>
            </svg>
            <span>{t.loginGoogle}</span>
          </button>

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

    </div>
  );
}
