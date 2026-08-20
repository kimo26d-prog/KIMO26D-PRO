import React, { useState, useEffect, useCallback } from 'react';
import { Language, SubscriberAccount } from '../types';
import { playSuccessSound, playErrorSound, playNotificationSound } from '../utils/audio';
import { subscribeToSubscribers, saveSubscriberToFirestore, deleteSubscriberFromFirestore } from '../lib/firestoreSync';
import { 
  Users, UserPlus, ShieldCheck, Search, Filter, 
  Trash2, RefreshCw, CheckCircle2, AlertTriangle, 
  XCircle, Clock, Calendar, DollarSign, Smartphone, 
  Key, Edit3, Plus, ArrowUpRight, Copy, Check, Lock, Unlock, PhoneCall
} from 'lucide-react';

interface SubscribersTabProps {
  lang: Language;
}

export default function SubscribersTab({ lang }: SubscribersTabProps) {
  // Admin PIN Unlock State (Default Owner PIN: 2026)
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Subscribers list & summary stats from server
  const [subscribers, setSubscribers] = useState<SubscriberAccount[]>([]);
  const [stats, setStats] = useState({
    totalSubscribers: 0,
    activeCount: 0,
    expiredCount: 0,
    suspendedCount: 0,
    totalMonthlyRevenue: 0
  });

  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'suspended'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSubForRenew, setSelectedSubForRenew] = useState<SubscriberAccount | null>(null);
  const [selectedSubForEdit, setSelectedSubForEdit] = useState<SubscriberAccount | null>(null);
  const [selectedSubForDelete, setSelectedSubForDelete] = useState<SubscriberAccount | null>(null);

  // Form states for adding subscriber
  const [newShopName, setNewShopName] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerPhone, setNewOwnerPhone] = useState('');
  const [newWilaya, setNewWilaya] = useState('الجزائر العاصمة');
  const [newMonthlyFee, setNewMonthlyFee] = useState('2000');
  const [newPlanMonths, setNewPlanMonths] = useState('1');
  const [newCustomCode, setNewCustomCode] = useState('');
  const [newCustomUsername, setNewCustomUsername] = useState('');
  const [newCustomPassword, setNewCustomPassword] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Credentials display modal
  const [credentialsModal, setCredentialsModal] = useState<{
    shopName: string;
    ownerName: string;
    ownerPhone: string;
    syncCode: string;
    username: string;
    password: string;
  } | null>(null);

  // Form states for editing
  const [editShopName, setEditShopName] = useState('');
  const [editOwnerName, setEditOwnerName] = useState('');
  const [editOwnerPhone, setEditOwnerPhone] = useState('');
  const [editWilaya, setEditWilaya] = useState('');
  const [editMonthlyFee, setEditMonthlyFee] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Copied code feedback state
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // States for server & firestore subscribers
  const [serverSubs, setServerSubs] = useState<SubscriberAccount[]>([]);
  const [firestoreSubs, setFirestoreSubs] = useState<SubscriberAccount[]>([]);

  // Helper to merge and sort subscribers from server and firestore
  const combineAndSetSubscribers = useCallback((sSubs: SubscriberAccount[], fSubs: SubscriberAccount[]) => {
    const map = new Map<string, SubscriberAccount>();
    
    // Add server subscribers first
    sSubs.forEach(s => {
      if (s.syncCode) map.set(s.syncCode.toUpperCase(), s);
    });

    // Add/Overwrite with Firestore subscribers
    fSubs.forEach(s => {
      if (s.syncCode) {
        const key = s.syncCode.toUpperCase();
        map.set(key, { ...map.get(key), ...s });
      }
    });

    const combined = Array.from(map.values());

    // Sort descending by subscription start date (newest first)
    combined.sort((a, b) => {
      const timeA = new Date(a.subscriptionStartDate || 0).getTime();
      const timeB = new Date(b.subscriptionStartDate || 0).getTime();
      return timeB - timeA;
    });

    setSubscribers(combined);

    // Recalculate stats
    const totalSubscribers = combined.length;
    const activeCount = combined.filter(s => s.status === 'active').length;
    const expiredCount = combined.filter(s => s.status === 'expired').length;
    const suspendedCount = combined.filter(s => s.status === 'suspended').length;
    const totalMonthlyRevenue = combined
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + (s.monthlyFee || 0), 0);

    setStats({
      totalSubscribers,
      activeCount,
      expiredCount,
      suspendedCount,
      totalMonthlyRevenue
    });
  }, []);

  // Fetch subscribers from backend server
  const fetchSubscribers = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/subscribers');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.subscribers)) {
          setServerSubs(data.subscribers);
          combineAndSetSubscribers(data.subscribers, firestoreSubs);
        }
      }
    } catch (e) {
      console.warn('Error fetching subscribers:', e);
    } finally {
      setIsLoading(false);
    }
  }, [firestoreSubs, combineAndSetSubscribers]);

  useEffect(() => {
    if (!isUnlocked) return;
    
    fetchSubscribers();

    // Subscribe to Firestore for real-time subscribers updates
    const unsubscribe = subscribeToSubscribers(
      (remoteSubscribers) => {
        if (remoteSubscribers) {
          setFirestoreSubs(remoteSubscribers);
          combineAndSetSubscribers(serverSubs, remoteSubscribers);
        }
      },
      (err) => {
        console.warn('Firestore subscribers subscription warning:', err);
      }
    );

    return () => unsubscribe();
  }, [isUnlocked, combineAndSetSubscribers]);

  const showToast = (msg: string) => {
    playNotificationSound();
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handle PIN Unlock
  const handleUnlockPin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedInput = pinInput.trim();
    if (cleanedInput === 'kimo22011986' || cleanedInput.toLowerCase() === 'kimo22011986' || cleanedInput === '2026') {
      playSuccessSound();
      setIsUnlocked(true);
      setPinError(false);
      setPinInput('');
    } else {
      playErrorSound();
      setPinError(true);
    }
  };

  // Helper to share credentials via WhatsApp
  const handleShareCredentialsWhatsApp = (cred: { shopName: string; ownerName: string; ownerPhone: string; syncCode: string; username: string; password: string }) => {
    const message = `مرحباً بك أستاذ ${cred.ownerName || 'التاجر'} 👋\nتم تسجيل حساب متجرك (${cred.shopName}) بنجاح!\n\n🔑 **بيانات الدخول الخاصة بك للتطبيق:**\n• **اسم المستخدم / كود المتجر:** ${cred.username || cred.syncCode}\n• **كلمة السر المسلمة:** ${cred.password}\n• **كود المزامنة:** ${cred.syncCode}\n\nيرجى فتح التطبيق واختيار [دخول بالبيانات المسلمة من المالك] وإدخال اسم المستخدم وكلمة السر أعلاه للدخول لمتجرك مباشرة.`;
    
    let cleanPhone = cred.ownerPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '213' + cleanPhone.substring(1);
    }
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Add Subscriber
  const handleCreateSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShopName.trim() || !newOwnerPhone.trim()) {
      showToast(lang === 'ar' ? 'يرجى إدخال اسم المحل ورقم الهاتف' : 'Please enter shop name and phone');
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopName: newShopName,
          ownerName: newOwnerName || 'صاحب المحل',
          ownerPhone: newOwnerPhone,
          wilaya: newWilaya,
          monthlyFee: parseFloat(newMonthlyFee) || 2000,
          planMonths: parseInt(newPlanMonths) || 1,
          customCode: newCustomCode,
          customUsername: newCustomUsername,
          customPassword: newCustomPassword,
          notes: newNotes
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(lang === 'ar' ? 'تم تسجيل المشترك وتوليد بيانات الدخول بنجاح!' : 'Subscriber added successfully');
        setShowAddModal(false);

        const sub = data.subscriber || {};
        const creds = {
          shopName: sub.shopName || newShopName,
          ownerName: sub.ownerName || newOwnerName || 'صاحب المحل',
          ownerPhone: sub.ownerPhone || newOwnerPhone,
          syncCode: sub.syncCode || data.credentials?.syncCode || 'FENK-STORE',
          username: sub.username || sub.syncCode || data.credentials?.username || 'store_user',
          password: sub.password || data.credentials?.password || '123456'
        };

        setCredentialsModal(creds);

        // Save to Firestore as well
        if (sub.syncCode) {
          await saveSubscriberToFirestore({
            syncCode: sub.syncCode,
            shopName: sub.shopName,
            ownerName: sub.ownerName,
            ownerPhone: sub.ownerPhone,
            wilaya: sub.wilaya || newWilaya,
            status: 'active',
            subscriptionStartDate: sub.subscriptionStartDate || new Date().toISOString(),
            subscriptionEndDate: sub.subscriptionEndDate || new Date(Date.now() + 30 * 86400000).toISOString(),
            monthlyFee: sub.monthlyFee || 2000,
            lastPaymentDate: new Date().toISOString().split('T')[0],
            username: creds.username,
            password: creds.password,
            notes: sub.notes
          });
        }

        // Reset form
        setNewShopName('');
        setNewOwnerName('');
        setNewOwnerPhone('');
        setNewCustomCode('');
        setNewCustomUsername('');
        setNewCustomPassword('');
        setNewNotes('');
        fetchSubscribers();
      } else {
        showToast(data.error || 'فشل تسجيل المشترك');
      }
    } catch (e) {
      showToast(lang === 'ar' ? 'حدث خطأ في الاتصال بالسيرفر' : 'Server connection error');
    } finally {
      setIsLoading(false);
    }
  };

  // Renew Subscription
  const handleRenewSubscription = async (sub: SubscriberAccount, months: number) => {
    try {
      setIsLoading(true);
      const currentEnd = new Date(sub.subscriptionEndDate).getTime();
      const baseTime = currentEnd > Date.now() ? currentEnd : Date.now();
      const newEnd = new Date(baseTime + months * 30 * 24 * 60 * 60 * 1000).toISOString();
      const today = new Date().toISOString().split('T')[0];

      const updatedSub: SubscriberAccount = {
        ...sub,
        status: 'active',
        subscriptionEndDate: newEnd,
        lastPaymentDate: today
      };

      // Save to Firestore directly
      await saveSubscriberToFirestore(updatedSub);

      const res = await fetch(`/api/admin/subscribers/${sub.syncCode}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extendMonths: months,
          status: 'active'
        })
      });

      if (res.ok) {
        showToast(lang === 'ar' ? `تم تجديد اشتراك ${sub.shopName} بـ ${months} أشهر` : `Subscription extended by ${months} months`);
        setSelectedSubForRenew(null);
        fetchSubscribers();
      }
    } catch (e) {
      showToast('خطأ في التجديد');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle Status (Suspend / Activate)
  const handleToggleStatus = async (sub: SubscriberAccount) => {
    const newStatus = sub.status === 'suspended' ? 'active' : 'suspended';
    try {
      setIsLoading(true);
      const updatedSub: SubscriberAccount = { ...sub, status: newStatus as 'active' | 'expired' | 'suspended' };
      
      // Save directly to Firestore for immediate realtime sync
      await saveSubscriberToFirestore(updatedSub);

      const res = await fetch(`/api/admin/subscribers/${sub.syncCode}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        showToast(newStatus === 'suspended' 
          ? (lang === 'ar' ? `تم إيقاف حساب ${sub.shopName} بنجاح` : 'Account suspended')
          : (lang === 'ar' ? `تم إعادة تفعيل حساب ${sub.shopName} بنجاح` : 'Account activated')
        );
        fetchSubscribers();
      }
    } catch (e) {
      showToast('حدث خطأ أثناء تعديل حالة الحساب');
    } finally {
      setIsLoading(false);
    }
  };

  // Edit Subscriber Details
  const handleUpdateSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubForEdit) return;

    try {
      setIsLoading(true);
      const updatedSub: SubscriberAccount = {
        ...selectedSubForEdit,
        shopName: editShopName,
        ownerName: editOwnerName,
        ownerPhone: editOwnerPhone,
        wilaya: editWilaya,
        monthlyFee: parseFloat(editMonthlyFee) || 2000,
        notes: editNotes
      };

      await saveSubscriberToFirestore(updatedSub);

      const res = await fetch(`/api/admin/subscribers/${selectedSubForEdit.syncCode}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopName: editShopName,
          ownerName: editOwnerName,
          ownerPhone: editOwnerPhone,
          wilaya: editWilaya,
          monthlyFee: parseFloat(editMonthlyFee) || 2000,
          notes: editNotes
        })
      });

      if (res.ok) {
        showToast(lang === 'ar' ? 'تم تحديث بيانات المشترك' : 'Subscriber updated');
        setSelectedSubForEdit(null);
        fetchSubscribers();
      }
    } catch (e) {
      showToast('خطأ في تحديث البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete Subscriber
  const handleDeleteSubscriber = async () => {
    if (!selectedSubForDelete) return;

    try {
      setIsLoading(true);
      await deleteSubscriberFromFirestore(selectedSubForDelete.syncCode);

      const res = await fetch(`/api/admin/subscribers/${selectedSubForDelete.syncCode}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        showToast(lang === 'ar' ? `تم حذف حساب ${selectedSubForDelete.shopName} نهائياً` : 'Subscriber account deleted');
        setSelectedSubForDelete(null);
        fetchSubscribers();
      }
    } catch (e) {
      showToast('خطأ أثناء عملية الحذف');
    } finally {
      setIsLoading(false);
    }
  };

  // Copy code to clipboard
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Open edit modal
  const openEditModal = (sub: SubscriberAccount) => {
    setSelectedSubForEdit(sub);
    setEditShopName(sub.shopName);
    setEditOwnerName(sub.ownerName);
    setEditOwnerPhone(sub.ownerPhone);
    setEditWilaya(sub.wilaya);
    setEditMonthlyFee(sub.monthlyFee.toString());
    setEditNotes(sub.notes || '');
  };

  // Filter subscribers list
  const filteredSubscribers = subscribers.filter(s => {
    const matchesSearch = 
      s.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.ownerPhone.includes(searchQuery) ||
      s.wilaya.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.syncCode.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && s.status === statusFilter;
  });

  // Calculate days remaining
  const getDaysRemaining = (endDateStr: string) => {
    const end = new Date(endDateStr).getTime();
    const now = Date.now();
    const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Render Lock Screen if PIN not entered
  if (!isUnlocked) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200/90 shadow-xl max-w-md w-full text-center space-y-6 relative overflow-hidden">
          <div className="w-16 h-16 bg-[#131b2e] text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <Lock size={32} />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-extrabold font-display text-slate-900">
              {lang === 'ar' ? 'لوحة المالك: التحكم في المشتركين' : 'Owner Panel: Subscribers Control'}
            </h2>
            <p className="text-xs text-slate-500">
              {lang === 'ar' ? 'يرجى إدخال رمز الأمان (PIN) للوصول إلى لوحة تسيير اشتراكات المحلات والتطبيق' : 'Enter security PIN to access subscription management'}
            </p>
          </div>

          <form onSubmit={handleUnlockPin} className="space-y-4">
            <div>
              <input 
                type="password"
                maxLength={24}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder={lang === 'ar' ? 'أدخل الرمز السرّي الخاص بالمالك' : 'Enter Owner Access Password'}
                className="w-full text-center text-lg font-bold tracking-wider py-3.5 px-4 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:border-emerald-600 focus:bg-white"
                autoFocus
              />
              {pinError && (
                <p className="text-xs text-red-600 font-bold mt-2">
                  {lang === 'ar' ? 'رمز الأمان غير صحيح! يرجى إعادة المحاولة' : 'Invalid Password! Please try again.'}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#131b2e] hover:bg-slate-800 text-white font-extrabold font-display text-sm rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Key size={18} className="text-emerald-400" />
              <span>{lang === 'ar' ? 'دخول لوحة المالك' : 'Unlock Owner Panel'}</span>
            </button>
          </form>

          <p className="text-[11px] text-slate-400 border-t border-slate-100 pt-3">
            {lang === 'ar' ? 'منطقة محمية - مخصصة لمالك وإدارة التطبيق فقط' : 'Protected Area - Restricted to Application Owner Only'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#131b2e] text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2 text-xs font-bold font-display animate-bounce">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#131b2e] text-white p-6 rounded-3xl shadow-lg border border-slate-800 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-[11px] font-extrabold tracking-wider border border-emerald-500/30">
              {lang === 'ar' ? 'إدارة الاشتراكات والتطبيق' : 'SUBSCRIPTION MANAGER'}
            </span>
            <span className="text-xs text-slate-400">| {lang === 'ar' ? 'خاص بالمالك' : 'Owner Access'}</span>
          </div>
          <h2 className="text-2xl font-black font-display tracking-tight text-white flex items-center gap-2">
            <Users size={26} className="text-emerald-400" />
            <span>{lang === 'ar' ? 'لوحة المالك: التحكم بكل المشتركين' : 'Owner Portal: Manage All Subscribers'}</span>
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            {lang === 'ar' 
              ? 'مراقبة كافة المحلات والبقالات المشتركة، تجديد الاشتراكات الشهرية، أو حذف وإيقاف الحسابات التي لم تدفع التكاليف'
              : 'Monitor all subscribed store accounts, renew monthly payments, or suspend/delete unpaid subscriptions.'
            }
          </p>
        </div>

        <div className="flex items-center gap-2 z-10">
          <button
            onClick={() => fetchSubscribers()}
            disabled={isLoading}
            className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl transition-all cursor-pointer border border-slate-700 active:scale-95 flex items-center gap-1.5 text-xs font-bold"
            title={lang === 'ar' ? 'تحديث البيانات' : 'Refresh'}
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin text-emerald-400' : ''} />
            <span className="hidden sm:inline">{lang === 'ar' ? 'تحديث' : 'Refresh'}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs font-display rounded-2xl transition-all cursor-pointer shadow-md active:scale-95 flex items-center gap-2 whitespace-nowrap"
          >
            <UserPlus size={18} />
            <span>{lang === 'ar' ? 'إضافة مشترك جديد' : 'Add New Subscriber'}</span>
          </button>
        </div>
      </div>

      {/* Top Key Performance Indicators (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Subscribers */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500">{lang === 'ar' ? 'إجمالي المحلات' : 'Total Stores'}</p>
            <p className="text-xl font-black font-display text-slate-900">{stats.totalSubscribers}</p>
          </div>
        </div>

        {/* Active Subscribers */}
        <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-emerald-800">{lang === 'ar' ? 'اشتراكات نشطة' : 'Active Paid'}</p>
            <p className="text-xl font-black font-display text-emerald-950">{stats.activeCount}</p>
          </div>
        </div>

        {/* Expired Subscribers */}
        <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center font-bold">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-amber-800">{lang === 'ar' ? 'منتهية الاشتراك' : 'Expired Unpaid'}</p>
            <p className="text-xl font-black font-display text-amber-950">{stats.expiredCount}</p>
          </div>
        </div>

        {/* Suspended Subscribers */}
        <div className="bg-red-50/60 p-4 rounded-2xl border border-red-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-700 flex items-center justify-center font-bold">
            <XCircle size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-red-800">{lang === 'ar' ? 'حسابات معطلة' : 'Suspended'}</p>
            <p className="text-xl font-black font-display text-red-950">{stats.suspendedCount}</p>
          </div>
        </div>

        {/* Monthly Subscription Revenue (DZD) */}
        <div className="bg-[#131b2e] text-white p-4 rounded-2xl border border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-300">{lang === 'ar' ? 'الدخل الشهري المتوقع' : 'Monthly Income'}</p>
            <p className="text-base font-black font-display text-emerald-400">
              {stats.totalMonthlyRevenue.toLocaleString()} <span className="text-[10px] font-sans text-slate-300">د.ج</span>
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 md:space-y-0 md:flex md:items-center md:justify-between gap-4">
        {/* Keyword Search */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">
            <Search size={18} />
          </span>
          <input 
            type="text" 
            placeholder={lang === 'ar' ? 'بحث باسم المحل، المالك، رقم الهاتف، أو كود المزامنة...' : 'Search shop, owner, phone, code...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-2.5 pr-10 pl-4 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:border-slate-900"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl overflow-x-auto text-xs font-bold font-display">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {lang === 'ar' ? `الكل (${subscribers.length})` : 'All'}
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${statusFilter === 'active' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {lang === 'ar' ? `النشطة (${stats.activeCount})` : 'Active'}
          </button>
          <button
            onClick={() => setStatusFilter('expired')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${statusFilter === 'expired' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {lang === 'ar' ? `منتهية (${stats.expiredCount})` : 'Expired'}
          </button>
          <button
            onClick={() => setStatusFilter('suspended')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${statusFilter === 'suspended' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {lang === 'ar' ? `معطلة (${stats.suspendedCount})` : 'Suspended'}
          </button>
        </div>
      </div>

      {/* Subscribers Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold font-display">
                <th className="py-3.5 px-4">{lang === 'ar' ? 'المحل والمالك' : 'Store & Owner'}</th>
                <th className="py-3.5 px-4">{lang === 'ar' ? 'ولاية المحل' : 'Wilaya'}</th>
                <th className="py-3.5 px-4">{lang === 'ar' ? 'كود المزامنة (ID)' : 'Sync Code'}</th>
                <th className="py-3.5 px-4">{lang === 'ar' ? 'الاشتراك الشهري' : 'Monthly Fee'}</th>
                <th className="py-3.5 px-4">{lang === 'ar' ? 'حالة الاشتراك وموعد الانتهاء' : 'Status & Expiration'}</th>
                <th className="py-3.5 px-4 text-center">{lang === 'ar' ? 'تحكم والمالك' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredSubscribers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users size={36} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-bold">{lang === 'ar' ? 'لا يوجد مشتركين طابقوا شروط البحث' : 'No subscribers match search'}</p>
                  </td>
                </tr>
              ) : (
                filteredSubscribers.map((sub) => {
                  const daysLeft = getDaysRemaining(sub.subscriptionEndDate);

                  return (
                    <tr key={sub.syncCode} className="hover:bg-slate-50/80 transition-colors">
                      {/* Store & Owner Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#131b2e] text-emerald-400 font-extrabold flex items-center justify-center shrink-0">
                            {sub.shopName.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-black text-slate-900 text-sm font-display">{sub.shopName}</p>
                              {sub.notes?.includes('Google') && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200/80 flex items-center gap-1">
                                  <svg className="w-3 h-3" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                                  </svg>
                                  <span>Google</span>
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-slate-500 mt-0.5">
                              <span>{sub.ownerName}</span>
                              <span>•</span>
                              <a href={`tel:${sub.ownerPhone}`} className="text-emerald-700 hover:underline flex items-center gap-1 font-mono font-semibold">
                                <PhoneCall size={12} />
                                <span>{sub.ownerPhone}</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Wilaya */}
                      <td className="py-3.5 px-4 font-bold text-slate-700">
                        {sub.wilaya}
                      </td>

                      {/* Sync Code */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-extrabold px-2 py-1 bg-slate-100 text-slate-800 rounded-lg border border-slate-200">
                            {sub.syncCode}
                          </span>
                          <button
                            onClick={() => handleCopyCode(sub.syncCode)}
                            className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                            title={lang === 'ar' ? 'نسخ كود المزامنة' : 'Copy code'}
                          >
                            {copiedCode === sub.syncCode ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </td>

                      {/* Monthly Fee */}
                      <td className="py-3.5 px-4 font-black text-slate-900 font-display">
                        {sub.monthlyFee.toLocaleString()} <span className="text-[10px] font-sans text-slate-500">د.ج/شهر</span>
                      </td>

                      {/* Subscription Status & Expiration */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {sub.status === 'active' && daysLeft > 0 && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[11px] font-extrabold">
                              <CheckCircle2 size={13} className="text-emerald-600" />
                              <span>{lang === 'ar' ? `نشط (متبقي ${daysLeft} يوم)` : `Active (${daysLeft}d left)`}</span>
                            </span>
                          )}

                          {sub.status === 'active' && daysLeft <= 0 && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-[11px] font-extrabold">
                              <Clock size={13} className="text-amber-600" />
                              <span>{lang === 'ar' ? 'ينتهي اليوم (يرجى التجديد)' : 'Expires today'}</span>
                            </span>
                          )}

                          {sub.status === 'expired' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-900 rounded-full text-[11px] font-extrabold">
                              <AlertTriangle size={13} className="text-amber-600" />
                              <span>{lang === 'ar' ? `انتهى الاشتراك (تأخر ${Math.abs(daysLeft)} يوم)` : `Expired (${Math.abs(daysLeft)}d ago)`}</span>
                            </span>
                          )}

                          {sub.status === 'suspended' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-800 rounded-full text-[11px] font-extrabold">
                              <XCircle size={13} className="text-red-600" />
                              <span>{lang === 'ar' ? 'حساب معطل بقرار المالك' : 'Suspended Account'}</span>
                            </span>
                          )}

                          <p className="text-[10px] text-slate-400 font-sans">
                            {lang === 'ar' ? `ينتهي بتاريخ: ${sub.subscriptionEndDate.split('T')[0]}` : `Ends: ${sub.subscriptionEndDate.split('T')[0]}`}
                          </p>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View Credentials */}
                          <button
                            onClick={() => setCredentialsModal({
                              shopName: sub.shopName,
                              ownerName: sub.ownerName,
                              ownerPhone: sub.ownerPhone,
                              syncCode: sub.syncCode,
                              username: sub.username || sub.syncCode,
                              password: sub.password || '123456'
                            })}
                            className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl cursor-pointer transition-colors"
                            title={lang === 'ar' ? 'عرض ومشاركة بيانات دخول التاجر' : 'View Credentials'}
                          >
                            <Key size={14} />
                          </button>

                          {/* Renew Button */}
                          <button
                            onClick={() => setSelectedSubForRenew(sub)}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold font-display transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1"
                            title={lang === 'ar' ? 'تجديد واستلام الاشتراك الشهري' : 'Renew Subscription'}
                          >
                            <DollarSign size={13} />
                            <span>{lang === 'ar' ? 'تجديد' : 'Renew'}</span>
                          </button>

                          {/* Toggle Suspend */}
                          <button
                            onClick={() => handleToggleStatus(sub)}
                            className={`p-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              sub.status === 'suspended'
                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                            }`}
                            title={sub.status === 'suspended' ? 'إعادة تفعيل الحساب' : 'إيقاف وتعطيل الحساب'}
                          >
                            {sub.status === 'suspended' ? <Unlock size={14} /> : <Lock size={14} />}
                          </button>

                          {/* Edit Details */}
                          <button
                            onClick={() => openEditModal(sub)}
                            className="p-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl cursor-pointer transition-colors"
                            title={lang === 'ar' ? 'تعديل البيانات' : 'Edit'}
                          >
                            <Edit3 size={14} />
                          </button>

                          {/* Delete Account */}
                          <button
                            onClick={() => setSelectedSubForDelete(sub)}
                            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl cursor-pointer transition-colors"
                            title={lang === 'ar' ? 'حذف حساب المشترك نهائياً' : 'Delete Account'}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL 1: ADD NEW SUBSCRIBER ================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in duration-150 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl font-bold">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black font-display text-slate-900">
                    {lang === 'ar' ? 'تسجيل محل / مشترك جديد' : 'Register New Store Subscriber'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {lang === 'ar' ? 'إنشاء حساب جديد للمحل وتحديد قيمة الاشتراك الشهري' : 'Create store subscription account'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubscriber} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Shop Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {lang === 'ar' ? 'اسم المحل / البقالة' : 'Store Name'} <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder={lang === 'ar' ? 'مثال: سوبرماركت النجم' : 'e.g. Supermarket Star'}
                    value={newShopName}
                    onChange={(e) => setNewShopName(e.target.value)}
                    className="w-full p-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-slate-900"
                  />
                </div>

                {/* Owner Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {lang === 'ar' ? 'اسم صاحب المحل' : 'Owner Name'}
                  </label>
                  <input 
                    type="text" 
                    placeholder={lang === 'ar' ? 'مثال: أحمد قواسمية' : 'e.g. Ahmed K.'}
                    value={newOwnerName}
                    onChange={(e) => setNewOwnerName(e.target.value)}
                    className="w-full p-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {lang === 'ar' ? 'رقم الهاتف' : 'Phone'} <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="tel" 
                    required
                    placeholder="0550123456"
                    value={newOwnerPhone}
                    onChange={(e) => setNewOwnerPhone(e.target.value)}
                    className="w-full p-2.5 text-sm font-mono rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-slate-900"
                  />
                </div>

                {/* Wilaya */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {lang === 'ar' ? 'الولاية / المدينة' : 'Wilaya / City'}
                  </label>
                  <input 
                    type="text" 
                    placeholder={lang === 'ar' ? 'مثال: الجزائر العاصمة، سطيف، وهران' : 'e.g. Algiers'}
                    value={newWilaya}
                    onChange={(e) => setNewWilaya(e.target.value)}
                    className="w-full p-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Monthly Fee */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {lang === 'ar' ? 'قيمة الاشتراك الشهري (د.ج)' : 'Monthly Fee (DZD)'}
                  </label>
                  <input 
                    type="number" 
                    value={newMonthlyFee}
                    onChange={(e) => setNewMonthlyFee(e.target.value)}
                    className="w-full p-2.5 text-sm font-bold font-mono rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-slate-900"
                  />
                </div>

                {/* Plan Months */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {lang === 'ar' ? 'مدة الاشتراك الأولى' : 'Initial Subscription Duration'}
                  </label>
                  <select
                    value={newPlanMonths}
                    onChange={(e) => setNewPlanMonths(e.target.value)}
                    className="w-full p-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-slate-900"
                  >
                    <option value="1">{lang === 'ar' ? 'شهر واحد (1)' : '1 Month'}</option>
                    <option value="3">{lang === 'ar' ? '3 أشهر' : '3 Months'}</option>
                    <option value="6">{lang === 'ar' ? '6 أشهر' : '6 Months'}</option>
                    <option value="12">{lang === 'ar' ? 'سنة كاملة (12 شهر)' : '1 Year (12 Months)'}</option>
                  </select>
                </div>
              </div>

              {/* Custom Sync Code, Username, and Password */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <p className="text-xs font-black text-slate-800 flex items-center gap-1.5 font-display">
                  <Key size={14} className="text-emerald-600" />
                  <span>{lang === 'ar' ? 'بيانات دخول التاجر المخصصة (توليد تلقائي بضغطة زر)' : 'Merchant Assigned Credentials'}</span>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      {lang === 'ar' ? 'اسم المستخدم / كود المزامنة' : 'Username / Sync Code'}
                    </label>
                    <input 
                      type="text" 
                      placeholder="FENK-8921-DZ"
                      value={newCustomCode}
                      onChange={(e) => {
                        setNewCustomCode(e.target.value);
                        if (!newCustomUsername) setNewCustomUsername(e.target.value);
                      }}
                      className="w-full p-2.5 text-xs font-mono uppercase rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      {lang === 'ar' ? 'كلمة السر المسلمة للتاجر' : 'Assigned Password'}
                    </label>
                    <input 
                      type="text" 
                      placeholder="توليد تلقائي (مثال: 849201)"
                      value={newCustomPassword}
                      onChange={(e) => setNewCustomPassword(e.target.value)}
                      className="w-full p-2.5 text-xs font-mono rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  {lang === 'ar' 
                    ? '💡 إن تركتها فارغة، سيقوم التطبيق بإنشاء اسم مستخدم وكلمة سر مكونة من 6 أرقام عشوائياً وتزويدك ببطاقة إرسالها للتاجر عبر الواتساب.' 
                    : 'If left blank, auto-generates 6-digit PIN and code for merchant login.'}
                </p>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {lang === 'ar' ? 'ملاحظات وتفاصيل الدفع' : 'Payment Notes'}
                </label>
                <textarea 
                  rows={2}
                  placeholder={lang === 'ar' ? 'مثال: تم الاستلام نقداً / تم الدفع بـ BaridiMob' : 'e.g. Paid cash or BaridiMob'}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 bg-[#131b2e] hover:bg-slate-800 text-white font-extrabold text-xs font-display rounded-xl transition-all shadow-md cursor-pointer active:scale-95 flex items-center gap-2"
                >
                  <UserPlus size={16} className="text-emerald-400" />
                  <span>{lang === 'ar' ? 'حفظ وتسجيل المشترك' : 'Save Subscriber'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: RENEW SUBSCRIPTION ================= */}
      {selectedSubForRenew && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl font-bold">
                  <DollarSign size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black font-display text-slate-900">
                    {lang === 'ar' ? `تجديد اشتراك: ${selectedSubForRenew.shopName}` : `Renew: ${selectedSubForRenew.shopName}`}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {lang === 'ar' ? `الاشتراك الحالي: ${selectedSubForRenew.monthlyFee.toLocaleString()} د.ج/شهر` : `Monthly fee: ${selectedSubForRenew.monthlyFee} DZD`}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedSubForRenew(null)} className="p-2 text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {lang === 'ar' 
                ? 'اختر عدد الأشهر المراد التمديد والتسديد لها، وسيتم تمديد صلوحية الحساب تلقائياً كـ (حساب نشط)'
                : 'Select the subscription extension duration to update account validity to active.'
              }
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleRenewSubscription(selectedSubForRenew, 1)}
                className="p-3.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-2xl text-slate-900 font-extrabold font-display text-xs transition-all text-center cursor-pointer shadow-2xs hover:shadow-md group"
              >
                <div className="text-lg font-black text-emerald-600 group-hover:scale-110 transition-transform">+1 {lang === 'ar' ? 'شهر' : 'Month'}</div>
                <div className="text-[11px] text-slate-500 mt-1">{selectedSubForRenew.monthlyFee.toLocaleString()} د.ج</div>
              </button>

              <button
                onClick={() => handleRenewSubscription(selectedSubForRenew, 3)}
                className="p-3.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-2xl text-slate-900 font-extrabold font-display text-xs transition-all text-center cursor-pointer shadow-2xs hover:shadow-md group"
              >
                <div className="text-lg font-black text-emerald-600 group-hover:scale-110 transition-transform">+3 {lang === 'ar' ? 'أشهر' : 'Months'}</div>
                <div className="text-[11px] text-slate-500 mt-1">{(selectedSubForRenew.monthlyFee * 3).toLocaleString()} د.ج</div>
              </button>

              <button
                onClick={() => handleRenewSubscription(selectedSubForRenew, 6)}
                className="p-3.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-2xl text-slate-900 font-extrabold font-display text-xs transition-all text-center cursor-pointer shadow-2xs hover:shadow-md group"
              >
                <div className="text-lg font-black text-emerald-600 group-hover:scale-110 transition-transform">+6 {lang === 'ar' ? 'أشهر' : 'Months'}</div>
                <div className="text-[11px] text-slate-500 mt-1">{(selectedSubForRenew.monthlyFee * 6).toLocaleString()} د.ج</div>
              </button>

              <button
                onClick={() => handleRenewSubscription(selectedSubForRenew, 12)}
                className="p-3.5 bg-[#131b2e] hover:bg-slate-800 text-white border border-slate-800 rounded-2xl font-extrabold font-display text-xs transition-all text-center cursor-pointer shadow-md group"
              >
                <div className="text-lg font-black text-emerald-400 group-hover:scale-110 transition-transform">+12 {lang === 'ar' ? 'شهر (سنة)' : 'Months'}</div>
                <div className="text-[11px] text-slate-300 mt-1">{(selectedSubForRenew.monthlyFee * 12).toLocaleString()} د.ج</div>
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedSubForRenew(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: EDIT SUBSCRIBER DETAILS ================= */}
      {selectedSubForEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black font-display text-slate-900">
                {lang === 'ar' ? 'تعديل بيانات المشترك' : 'Edit Subscriber'}
              </h3>
              <button onClick={() => setSelectedSubForEdit(null)} className="p-2 text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleUpdateSubscriber} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">{lang === 'ar' ? 'اسم المحل' : 'Shop Name'}</label>
                <input 
                  type="text" 
                  value={editShopName} 
                  onChange={(e) => setEditShopName(e.target.value)}
                  className="w-full p-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">{lang === 'ar' ? 'المالك' : 'Owner'}</label>
                  <input 
                    type="text" 
                    value={editOwnerName} 
                    onChange={(e) => setEditOwnerName(e.target.value)}
                    className="w-full p-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">{lang === 'ar' ? 'الهاتف' : 'Phone'}</label>
                  <input 
                    type="tel" 
                    value={editOwnerPhone} 
                    onChange={(e) => setEditOwnerPhone(e.target.value)}
                    className="w-full p-2.5 text-sm font-mono rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">{lang === 'ar' ? 'الولاية' : 'Wilaya'}</label>
                  <input 
                    type="text" 
                    value={editWilaya} 
                    onChange={(e) => setEditWilaya(e.target.value)}
                    className="w-full p-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">{lang === 'ar' ? 'الاشتراك الشهري' : 'Fee (DZD)'}</label>
                  <input 
                    type="number" 
                    value={editMonthlyFee} 
                    onChange={(e) => setEditMonthlyFee(e.target.value)}
                    className="w-full p-2.5 text-sm font-bold font-mono rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">{lang === 'ar' ? 'ملاحظات المالك' : 'Notes'}</label>
                <textarea 
                  rows={2} 
                  value={editNotes} 
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setSelectedSubForEdit(null)} className="px-4 py-2 text-xs font-bold text-slate-600">
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl">
                  {lang === 'ar' ? 'تحديث' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: DELETE CONFIRMATION ================= */}
      {selectedSubForDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-center animate-in fade-in zoom-in duration-150">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 size={28} />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-extrabold font-display text-slate-900">
                {lang === 'ar' ? `حذف حساب: ${selectedSubForDelete.shopName}؟` : `Delete ${selectedSubForDelete.shopName}?`}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {lang === 'ar' 
                  ? 'سيتم حذف حساب هذا المشترك نهائياً من قاعدة البيانات، ولن يتمكن من المزامنة أو استخدام الخدمة.'
                  : 'Permanently remove subscriber account and revoke sync privileges.'
                }
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedSubForDelete(null)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleDeleteSubscriber}
                disabled={isLoading}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs font-display rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
              >
                {lang === 'ar' ? 'تأكيد الحذف النهائي' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 5: MERCHANT CREDENTIALS DISPLAY ================= */}
      {credentialsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-2xl font-bold">
                  <Key size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black font-display text-slate-900">
                    {lang === 'ar' ? 'بطاقة بيانات دخول التاجر' : 'Merchant Login Credentials'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {credentialsModal.shopName} ({credentialsModal.ownerName})
                  </p>
                </div>
              </div>
              <button onClick={() => setCredentialsModal(null)} className="p-2 text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-3 shadow-inner">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-xs text-slate-400">{lang === 'ar' ? 'اسم المتجر:' : 'Shop Name:'}</span>
                <span className="font-extrabold text-sm text-emerald-400">{credentialsModal.shopName}</span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-xs text-slate-400">{lang === 'ar' ? 'اسم المستخدم / الكود:' : 'Username / Code:'}</span>
                <span className="font-mono font-black text-sm text-yellow-300 bg-slate-800 px-2.5 py-1 rounded-lg">
                  {credentialsModal.username || credentialsModal.syncCode}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-xs text-slate-400">{lang === 'ar' ? 'كلمة السر المسلمة:' : 'Password:'}</span>
                <span className="font-mono font-black text-base text-emerald-300 bg-slate-800 px-2.5 py-1 rounded-lg tracking-wider">
                  {credentialsModal.password}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">{lang === 'ar' ? 'كود المزامنة:' : 'Sync Code:'}</span>
                <span className="font-mono text-xs text-slate-300">{credentialsModal.syncCode}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-amber-50 p-3 rounded-xl border border-amber-200">
              {lang === 'ar' 
                ? '📌 يستطيع التاجر الدخول للتطبيق بفتح صفحة الدخول، واختيار [الدخول ببيانات المالك] ثم إدخال اسم المستخدم وكلمة السر الموضحة أعلاه.'
                : 'Merchant logs in via [Owner Credentials] option on Login screen using these exact details.'}
            </p>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleShareCredentialsWhatsApp(credentialsModal)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs font-display rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <span>إرسال ومشاركة مع التاجر عبر الواتساب 💬</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const text = `اسم المتجر: ${credentialsModal.shopName}\nاسم المستخدم: ${credentialsModal.username || credentialsModal.syncCode}\nكلمة السر: ${credentialsModal.password}\nكود المزامنة: ${credentialsModal.syncCode}`;
                  navigator.clipboard.writeText(text);
                  showToast(lang === 'ar' ? 'تم نسخ بيانات الدخول للحافظة' : 'Copied credentials to clipboard');
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Copy size={15} />
                <span>نسخ البيانات للحافظة</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
