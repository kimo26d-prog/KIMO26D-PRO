import { useState, useEffect, useCallback } from 'react';
import { Language, AppTab, Product, CustomerDebt, Transaction, SHOP_TYPES } from './types';
import { INITIAL_PRODUCTS, INITIAL_DEBTS, INITIAL_TRANSACTIONS } from './data';
import LoginScreen from './components/LoginScreen';
import DashboardTab from './components/DashboardTab';
import InventoryTab from './components/InventoryTab';
import SalesTab from './components/SalesTab';
import DebtsTab from './components/DebtsTab';
import AnalyticsTab from './components/AnalyticsTab';
import SubscribersTab from './components/SubscribersTab';
import WholesaleTab from './components/WholesaleTab';
import SupportFooter from './components/SupportFooter';
import DeviceSyncModal from './components/DeviceSyncModal';
import StoreSettingsModal from './components/StoreSettingsModal';
import AIStoreOrganizerModal from './components/AIStoreOrganizerModal';
import fenkLogo from './assets/images/fenk_logo_1783465306813.jpg';
import { LayoutDashboard, ClipboardList, ShoppingCart, Users, BarChart3, LogOut, Calendar, Smartphone, ArrowLeftRight, RefreshCw, ShieldCheck, Database, Settings, Sparkles, Boxes } from 'lucide-react';
import { playClickSound, playNotificationSound } from './utils/audio';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  saveStoreToFirestore, 
  subscribeToStoreProducts, 
  subscribeToStoreDebts, 
  subscribeToStoreTransactions,
  subscribeToSingleSubscriber,
  saveProductToFirestore,
  deleteProductFromFirestore,
  saveDebtToFirestore,
  saveTransactionToFirestore
} from './lib/firestoreSync';

export default function App() {
  // Persistence state
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('fenk_mahli_logged_in') === 'true';
  });

  // Cross-Device Sync State & Code Management
  const [syncCode, setSyncCode] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const codeFromUrl = urlParams.get('syncCode');
      if (codeFromUrl) {
        localStorage.setItem('fenk_mahli_sync_code', codeFromUrl.toUpperCase());
        return codeFromUrl.toUpperCase();
      }
    }
    const savedCode = localStorage.getItem('fenk_mahli_sync_code');
    if (savedCode) return savedCode;
    const newRandCode = `FENK-${Math.floor(1000 + Math.random() * 9000)}-DZ`;
    localStorage.setItem('fenk_mahli_sync_code', newRandCode);
    return newRandCode;
  });

  const [shopName, setShopName] = useState<string>(() => {
    const code = localStorage.getItem('fenk_mahli_sync_code') || 'DEFAULT';
    return localStorage.getItem(`fenk_mahli_shop_name_${code}`) || localStorage.getItem('fenk_mahli_shop_name') || 'بقالة التوفير الحديثة';
  });

  const [shopType, setShopType] = useState<string>(() => {
    const code = localStorage.getItem('fenk_mahli_sync_code') || 'DEFAULT';
    return localStorage.getItem(`fenk_mahli_shop_type_${code}`) || localStorage.getItem('fenk_mahli_shop_type') || 'grocery';
  });

  const [shopLogo, setShopLogo] = useState<string>(() => {
    const code = localStorage.getItem('fenk_mahli_sync_code') || 'DEFAULT';
    return localStorage.getItem(`fenk_mahli_shop_logo_${code}`) || localStorage.getItem('fenk_mahli_shop_logo') || fenkLogo;
  });

  const [shopPhone, setShopPhone] = useState<string>(() => {
    const code = localStorage.getItem('fenk_mahli_sync_code') || 'DEFAULT';
    return localStorage.getItem(`fenk_mahli_shop_phone_${code}`) || localStorage.getItem('fenk_mahli_shop_phone') || '0550 00 00 00';
  });

  const [shopAddress, setShopAddress] = useState<string>(() => {
    const code = localStorage.getItem('fenk_mahli_sync_code') || 'DEFAULT';
    return localStorage.getItem(`fenk_mahli_shop_address_${code}`) || localStorage.getItem('fenk_mahli_shop_address') || 'الجزائر العاصمة';
  });

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAIOrganizerModal, setShowAIOrganizerModal] = useState(false);

  const [lang, setLang] = useState<Language>(() => {
    const savedLang = localStorage.getItem('fenk_mahli_lang') as Language;
    return savedLang || 'ar';
  });

  const [userRole, setUserRole] = useState<'owner' | 'merchant'>(() => {
    return (localStorage.getItem('fenk_mahli_user_role') as 'owner' | 'merchant') || 'owner';
  });

  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [inventoryFilter, setInventoryFilter] = useState<string>('');

  // Scoped Store Loaders to prevent data leakage between stores and clear initial mock data
  const loadScopedProducts = (code: string): Product[] => {
    const filterMock = (arr: any[]): Product[] => {
      if (!Array.isArray(arr)) return [];
      return arr.filter((p: Product) => p && p.id && !['prod-1', 'prod-2', 'prod-3', 'prod-4', 'prod-5', 'prod-6', 'prod-7', 'prod-8'].includes(p.id));
    };

    const saved = localStorage.getItem(`fenk_mahli_products_${code}`);
    if (saved) {
      try { return filterMock(JSON.parse(saved)); } catch (e) {}
    }
    const legacy = localStorage.getItem('fenk_mahli_products');
    if (legacy) {
      try { return filterMock(JSON.parse(legacy)); } catch (e) {}
    }
    return [];
  };

  const loadScopedDebts = (code: string): CustomerDebt[] => {
    const filterMock = (arr: any[]): CustomerDebt[] => {
      if (!Array.isArray(arr)) return [];
      return arr.filter((d: CustomerDebt) => d && d.id && !['debt-1', 'debt-2', 'debt-3'].includes(d.id));
    };

    const saved = localStorage.getItem(`fenk_mahli_debts_${code}`);
    if (saved) {
      try { return filterMock(JSON.parse(saved)); } catch (e) {}
    }
    const legacy = localStorage.getItem('fenk_mahli_debts');
    if (legacy) {
      try { return filterMock(JSON.parse(legacy)); } catch (e) {}
    }
    return [];
  };

  const loadScopedTransactions = (code: string): Transaction[] => {
    const filterMock = (arr: any[]): Transaction[] => {
      if (!Array.isArray(arr)) return [];
      return arr.filter((t: Transaction) => t && t.id && !['tx-1', 'tx-2', 'tx-3', 'tx-4', 'tx-5'].includes(t.id));
    };

    const saved = localStorage.getItem(`fenk_mahli_transactions_${code}`);
    if (saved) {
      try { return filterMock(JSON.parse(saved)); } catch (e) {}
    }
    const legacy = localStorage.getItem('fenk_mahli_transactions');
    if (legacy) {
      try { return filterMock(JSON.parse(legacy)); } catch (e) {}
    }
    return [];
  };

  // Main collections state scoped strictly to current store
  const [products, setProducts] = useState<Product[]>(() => {
    const code = localStorage.getItem('fenk_mahli_sync_code') || 'DEFAULT';
    return loadScopedProducts(code);
  });

  const [debts, setDebts] = useState<CustomerDebt[]>(() => {
    const code = localStorage.getItem('fenk_mahli_sync_code') || 'DEFAULT';
    return loadScopedDebts(code);
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const code = localStorage.getItem('fenk_mahli_sync_code') || 'DEFAULT';
    return loadScopedTransactions(code);
  });

  // Current formatted date/time tracker
  const [formattedTime, setFormattedTime] = useState('');

  const [showSyncModal, setShowSyncModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<Date | null>(new Date());
  const [isStoreSuspended, setIsStoreSuspended] = useState(false);

  // Realtime subscription listener for single store suspension status
  useEffect(() => {
    if (!syncCode) return;
    const unsubscribe = subscribeToSingleSubscriber(syncCode, (sub) => {
      if (sub && sub.status === 'suspended') {
        setIsStoreSuspended(true);
      } else {
        setIsStoreSuspended(false);
      }
    });
    return () => unsubscribe();
  }, [syncCode]);

  // Push local state to cloud and Firestore
  const pushStateToCloud = useCallback(async (codeToUse?: string) => {
    const code = codeToUse || syncCode;
    if (!code) return;
    try {
      setIsSyncing(true);
      // Save directly to Firebase Firestore
      await saveStoreToFirestore(code, shopName, products, debts, transactions);

      // Also call backend sync endpoint for subscriber updates
      const res = await fetch('/api/sync/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syncCode: code,
          shopName,
          products,
          debts,
          transactions,
          clientTimestamp: Date.now()
        })
      });
      if (res.ok) {
        setLastSyncedTime(new Date());
      }
    } catch (e) {
      console.warn('Cloud sync push error:', e);
    } finally {
      setIsSyncing(false);
    }
  }, [syncCode, shopName, products, debts, transactions]);

  // Pull state from cloud
  const pullStateFromCloud = useCallback(async (codeToUse?: string) => {
    const code = codeToUse || syncCode;
    if (!code) return false;
    try {
      const res = await fetch(`/api/sync/store?syncCode=${encodeURIComponent(code)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.store) {
          if (data.store.products && data.store.products.length > 0) {
            setProducts(data.store.products);
          }
          if (data.store.debts && data.store.debts.length > 0) {
            setDebts(data.store.debts);
          }
          if (data.store.transactions && data.store.transactions.length > 0) {
            setTransactions(data.store.transactions);
          }
          if (data.store.shopName) {
            setShopName(data.store.shopName);
          }
          setLastSyncedTime(new Date(data.store.lastUpdated || Date.now()));
          return true;
        }
      }
    } catch (e) {
      console.warn('Cloud sync pull error:', e);
    }
    return false;
  }, [syncCode]);

  // Pair or switch to a new sync code
  const handleInitiatePairing = async (codeToJoin?: string): Promise<boolean> => {
    if (!codeToJoin) return false;
    const cleanCode = codeToJoin.trim().toUpperCase();
    const success = await pullStateFromCloud(cleanCode);
    if (success) {
      setSyncCode(cleanCode);
      localStorage.setItem('fenk_mahli_sync_code', cleanCode);
      // Automatically auto-login if URL opened
      setIsLoggedIn(true);
      localStorage.setItem('fenk_mahli_logged_in', 'true');
      return true;
    }
    // If not found yet, push current local state under new code
    await pushStateToCloud(cleanCode);
    setSyncCode(cleanCode);
    localStorage.setItem('fenk_mahli_sync_code', cleanCode);
    return true;
  };

  // Attach Firebase Firestore Realtime Listeners with strict store isolation
  useEffect(() => {
    if (!isLoggedIn || !syncCode) return;

    // Load store-scoped local storage data first upon switching store code
    const scopedP = loadScopedProducts(syncCode);
    const scopedD = loadScopedDebts(syncCode);
    const scopedT = loadScopedTransactions(syncCode);

    setProducts(scopedP);
    setDebts(scopedD);
    setTransactions(scopedT);

    // Initial push to cloud only if store has data
    if (scopedP.length > 0 || scopedD.length > 0 || scopedT.length > 0) {
      pushStateToCloud();
    }

    // Subscribe to Firestore collections in real-time
    const unsubscribeProducts = subscribeToStoreProducts(syncCode, (remoteProducts) => {
      if (Array.isArray(remoteProducts)) {
        const cleanRemote = remoteProducts.filter((p: Product) => p && p.id && !['prod-1', 'prod-2', 'prod-3', 'prod-4', 'prod-5', 'prod-6', 'prod-7', 'prod-8'].includes(p.id));
        if (cleanRemote.length > 0) {
          setProducts(cleanRemote);
          setLastSyncedTime(new Date());
        } else {
          const localScoped = loadScopedProducts(syncCode);
          if (localScoped.length > 0) {
            localScoped.forEach(p => saveProductToFirestore(syncCode, p));
            setProducts(localScoped);
          } else {
            setProducts([]);
          }
        }
      }
    });

    const unsubscribeDebts = subscribeToStoreDebts(syncCode, (remoteDebts) => {
      if (Array.isArray(remoteDebts)) {
        const cleanRemote = remoteDebts.filter((d: CustomerDebt) => d && d.id && !['debt-1', 'debt-2', 'debt-3'].includes(d.id));
        if (cleanRemote.length > 0) {
          setDebts(cleanRemote);
          setLastSyncedTime(new Date());
        } else {
          const localScoped = loadScopedDebts(syncCode);
          if (localScoped.length > 0) {
            localScoped.forEach(d => saveDebtToFirestore(syncCode, d));
            setDebts(localScoped);
          } else {
            setDebts([]);
          }
        }
      }
    });

    const unsubscribeTransactions = subscribeToStoreTransactions(syncCode, (remoteTransactions) => {
      if (Array.isArray(remoteTransactions)) {
        const cleanRemote = remoteTransactions.filter((t: Transaction) => t && t.id && !['tx-1', 'tx-2', 'tx-3', 'tx-4', 'tx-5'].includes(t.id));
        if (cleanRemote.length > 0) {
          setTransactions(cleanRemote);
          setLastSyncedTime(new Date());
        } else {
          const localScoped = loadScopedTransactions(syncCode);
          if (localScoped.length > 0) {
            localScoped.forEach(t => saveTransactionToFirestore(syncCode, t));
            setTransactions(localScoped);
          } else {
            setTransactions([]);
          }
        }
      }
    });

    return () => {
      unsubscribeProducts();
      unsubscribeDebts();
      unsubscribeTransactions();
    };
  }, [isLoggedIn, syncCode]);

  // Sync RTL and general attributes with lang
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    localStorage.setItem('fenk_mahli_lang', lang);
  }, [lang]);

  // Handle clock update
  useEffect(() => {
    const updateTime = () => {
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      };
      setFormattedTime(new Date().toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', options));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [lang]);

  // Persist data collections whenever they change (scoped by syncCode)
  useEffect(() => {
    if (!syncCode) return;
    localStorage.setItem(`fenk_mahli_products_${syncCode}`, JSON.stringify(products));
    localStorage.setItem('fenk_mahli_products', JSON.stringify(products));
  }, [products, syncCode]);

  useEffect(() => {
    if (!syncCode) return;
    localStorage.setItem(`fenk_mahli_debts_${syncCode}`, JSON.stringify(debts));
    localStorage.setItem('fenk_mahli_debts', JSON.stringify(debts));
  }, [debts, syncCode]);

  useEffect(() => {
    if (!syncCode) return;
    localStorage.setItem(`fenk_mahli_transactions_${syncCode}`, JSON.stringify(transactions));
    localStorage.setItem('fenk_mahli_transactions', JSON.stringify(transactions));
  }, [transactions, syncCode]);

  // Monitor Firebase Auth state change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && (user.emailVerified || user.providerData.some(p => p.providerId === 'google.com'))) {
        setIsLoggedIn(true);
        localStorage.setItem('fenk_mahli_logged_in', 'true');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (nameOfShop: string, role: 'owner' | 'merchant' = 'owner') => {
    const currentCode = localStorage.getItem('fenk_mahli_sync_code') || syncCode;
    setIsLoggedIn(true);
    setUserRole(role);
    setShopName(nameOfShop);

    if (currentCode !== syncCode) {
      setSyncCode(currentCode);
    }

    // Instantly load data for the newly logged-in store code
    const loadedProds = loadScopedProducts(currentCode);
    const loadedDebts = loadScopedDebts(currentCode);
    const loadedTx = loadScopedTransactions(currentCode);
    setProducts(loadedProds);
    setDebts(loadedDebts);
    setTransactions(loadedTx);

    const logo = localStorage.getItem(`fenk_mahli_shop_logo_${currentCode}`) || localStorage.getItem('fenk_mahli_shop_logo') || fenkLogo;
    const type = localStorage.getItem(`fenk_mahli_shop_type_${currentCode}`) || localStorage.getItem('fenk_mahli_shop_type') || 'grocery';
    setShopLogo(logo);
    setShopType(type);

    localStorage.setItem('fenk_mahli_logged_in', 'true');
    localStorage.setItem('fenk_mahli_shop_name', nameOfShop);
    localStorage.setItem(`fenk_mahli_shop_name_${currentCode}`, nameOfShop);
    localStorage.setItem('fenk_mahli_user_role', role);

    if (role === 'merchant') {
      setActiveTab('dashboard');
    }
  };

  const handleLogOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('SignOut error:', e);
    }
    setIsLoggedIn(false);
    setUserRole('owner');
    // Clear state in memory so no store data remains visible on logout
    setProducts([]);
    setDebts([]);
    setTransactions([]);
    localStorage.removeItem('fenk_mahli_logged_in');
    localStorage.removeItem('fenk_mahli_user_role');
  };

  // State modifiers with instant Firebase sync & local storage persistence
  const handleAddProduct = (newProduct: Product) => {
    const updated = [newProduct, ...products];
    setProducts(updated);
    if (syncCode) {
      localStorage.setItem(`fenk_mahli_products_${syncCode}`, JSON.stringify(updated));
      localStorage.setItem('fenk_mahli_products', JSON.stringify(updated));
      saveProductToFirestore(syncCode, newProduct);
    }
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    const updated = products.map(p => p.id === updatedProduct.id ? updatedProduct : p);
    setProducts(updated);
    if (syncCode) {
      localStorage.setItem(`fenk_mahli_products_${syncCode}`, JSON.stringify(updated));
      localStorage.setItem('fenk_mahli_products', JSON.stringify(updated));
      saveProductToFirestore(syncCode, updatedProduct);
    }
  };

  const handleDeleteProduct = (productId: string) => {
    const updated = products.filter(p => p.id !== productId);
    setProducts(updated);
    if (syncCode) {
      localStorage.setItem(`fenk_mahli_products_${syncCode}`, JSON.stringify(updated));
      localStorage.setItem('fenk_mahli_products', JSON.stringify(updated));
      deleteProductFromFirestore(syncCode, productId);
    }
  };

  const handleAddCustomer = (newCustomer: CustomerDebt) => {
    setDebts([newCustomer, ...debts]);
    if (syncCode) saveDebtToFirestore(syncCode, newCustomer);
  };

  const handleUpdateDebts = (updatedDebts: CustomerDebt[]) => {
    setDebts(updatedDebts);
    if (syncCode) {
      updatedDebts.forEach(d => saveDebtToFirestore(syncCode, d));
    }
  };

  const handleCompleteSale = (transaction: Transaction, updatedProducts: Product[], updatedDebts?: CustomerDebt[]) => {
    setTransactions([transaction, ...transactions]);
    setProducts(updatedProducts);
    if (syncCode) {
      saveTransactionToFirestore(syncCode, transaction);
      updatedProducts.forEach(p => saveProductToFirestore(syncCode, p));
    }
    if (updatedDebts) {
      setDebts(updatedDebts);
      if (syncCode) {
        updatedDebts.forEach(d => saveDebtToFirestore(syncCode, d));
      }
    }
  };

  // Switch tabs cleanly, allowing filtered entries (e.g., jump from low stock warnings to filtered inventory list)
  const handleNavigate = (tab: AppTab, filter?: string) => {
    playClickSound();
    if (tab === 'subscribers' && userRole !== 'owner') {
      setActiveTab('dashboard');
      return;
    }
    setInventoryFilter(filter || '');
    setActiveTab(tab);
  };

  const translations = {
    ar: {
      dashboard: "لوحة التحكم",
      inventory: "إدارة المخزون",
      sales: "الكاشير والمبيعات",
      wholesale: "البيع بالجملة (Gros)",
      debts: "دفتر الديون",
      analytics: "التقارير والتحليلات",
      subscribers: "لوحة المالك (إدارة المشتركين)",
      logout: "تسجيل الخروج",
      welcomeMsg: "مرحباً بك في لوحة الإدارة",
      activeBadge: "متجر نشط"
    },
    en: {
      dashboard: "Dashboard",
      inventory: "Inventory Control",
      sales: "POS Cashier",
      wholesale: "Wholesale & Bulk",
      debts: "Debtor Book",
      analytics: "Reports & Audits",
      subscribers: "Owner Portal (Subscribers)",
      logout: "Log Out",
      welcomeMsg: "Welcome to your Retail Dashboard",
      activeBadge: "Active Store"
    }
  };

  const t = translations[lang];

  // If not logged in, render the beautiful bilingual Fenk Mahli Login Screen
  if (!isLoggedIn) {
    return (
      <LoginScreen 
        lang={lang} 
        onLanguageToggle={setLang} 
        onLoginSuccess={handleLoginSuccess} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex flex-col text-slate-900 select-none pb-12">
      
      {/* Account Suspended Overlay */}
      {isStoreSuspended && activeTab !== 'subscribers' && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/50 rounded-3xl max-w-lg w-full p-6 text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-red-500/20 text-red-500 flex items-center justify-center mx-auto border border-red-500/40">
              <ShieldCheck size={36} />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-black font-display text-white">
                {lang === 'ar' ? 'حساب المحل معطل وموقوف بقرار من المالك' : 'Store Account Suspended'}
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
                {lang === 'ar' 
                  ? 'تم إيقاف اشتراك هذا المتجر مؤقتاً من طرف مالك وإدارة تطبيق فنك ماركت بسبب عدم تسديد التكاليف الشهرية أو بقرار إداري. يرجى التواصل لإعادة التفعيل.'
                  : 'Your store subscription has been suspended by the application owner. Please contact support to reactivate.'
                }
              </p>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs text-emerald-400 font-mono font-bold">
              {lang === 'ar' ? 'كود المزامنة الخاص بك:' : 'Sync Code:'} <span className="text-white bg-slate-800 px-2 py-0.5 rounded">{syncCode}</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a 
                href="https://wa.me/213550000000" 
                target="_blank" 
                rel="noreferrer"
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>{lang === 'ar' ? 'التواصل مع المالك (واتساب)' : 'Contact Owner WhatsApp'}</span>
              </a>

              {userRole === 'owner' && (
                <button
                  onClick={() => setActiveTab('subscribers')}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all border border-slate-700 cursor-pointer"
                >
                  <span>{lang === 'ar' ? 'دخول لوحة المالك (PIN)' : 'Owner Panel Access'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 1. Global Navigation Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-4">
            
            {/* Logo and Shop details */}
            <div className="flex items-center gap-3">
              <img 
                alt="Fenk Mahli" 
                className="w-10 h-10 object-contain rounded-xl border border-slate-200/80 bg-white p-0.5 shadow-2xs cursor-pointer hover:opacity-90 transition-opacity"
                src={shopLogo}
                onClick={() => setShowSettingsModal(true)}
                title={lang === 'ar' ? 'تغيير شعار وإعدادات المتجر' : 'Change Store Logo & Settings'}
              />
              <div>
                <h1 className="text-sm font-extrabold font-display text-slate-950 flex flex-wrap items-center gap-1.5 leading-none">
                  <span>{shopName}</span>
                  {(() => {
                    const currentSt = SHOP_TYPES.find(st => st.id === shopType) || SHOP_TYPES[0];
                    return (
                      <span className="bg-amber-50 text-amber-900 border border-amber-200/80 text-[9px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1" title={lang === 'ar' ? `نشاط المحل: ${currentSt.nameAr}` : `Shop Type: ${currentSt.nameEn}`}>
                        <span>{currentSt.icon}</span>
                        <span>{lang === 'ar' ? currentSt.nameAr : currentSt.nameEn}</span>
                      </span>
                    );
                  })()}
                  <span className="bg-emerald-100 text-[#006c49] text-[9px] px-2 py-0.5 rounded-full font-sans font-bold">
                    {t.activeBadge}
                  </span>
                  <span className="bg-sky-100 text-sky-800 text-[9px] px-2 py-0.5 rounded-full font-sans font-bold flex items-center gap-1" title="Firebase Firestore Database Connected">
                    <Database size={10} />
                    <span>Firebase</span>
                  </span>
                </h1>
                <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                  <Calendar size={11} />
                  <span>{formattedTime}</span>
                </p>
              </div>
            </div>

            {/* Device Sync, Settings, Language & Log out */}
            <div className="flex items-center gap-2 sm:gap-3">
              
              {/* AI Store Organizer Header Button */}
              <button
                onClick={() => {
                  playClickSound();
                  setShowAIOrganizerModal(true);
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold font-display transition-all cursor-pointer flex items-center gap-1.5 shadow-xs border border-emerald-400/30"
                title={lang === 'ar' ? 'مُنظّم المتجر بالذكاء الاصطناعي' : 'AI Store Organizer'}
              >
                <Sparkles size={14} className="text-emerald-200 animate-pulse" />
                <span className="hidden sm:inline">
                  {lang === 'ar' ? 'مُنظّم المتجر (AI)' : 'AI Organizer'}
                </span>
              </button>

              {/* Store & Invoice Logo Settings Button */}
              <button
                onClick={() => {
                  playClickSound();
                  setShowSettingsModal(true);
                }}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/90 rounded-xl text-xs font-bold font-display transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                title={lang === 'ar' ? 'إعدادات المتجر وشعار الفاتورة' : 'Store & Logo Settings'}
              >
                <Settings size={14} className="text-[#006c49]" />
                <span className="hidden sm:inline">
                  {lang === 'ar' ? 'شعار وإعدادات الفاتورة' : 'Store & Logo'}
                </span>
              </button>

              {/* Cross-Device Link Button */}
              <button 
                onClick={() => setShowSyncModal(true)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold font-display transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                title={lang === 'ar' ? 'ربط الهاتف بالكمبيوتر والتزامن المباشر' : 'Link phone & desktop sync'}
              >
                <Smartphone size={14} className="text-emerald-400" />
                <span className="hidden md:inline">
                  {lang === 'ar' ? 'ربط الهاتف بالكمبيوتر' : 'Sync Phone & PC'}
                </span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </button>

              {/* Language Switch */}
              <button 
                onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold font-display hover:bg-slate-50 transition-all cursor-pointer"
              >
                {lang === 'ar' ? 'English' : 'العربية'}
              </button>

              {/* Log out */}
              <button 
                onClick={handleLogOut}
                className="p-2 border border-slate-200 text-slate-500 hover:text-red-600 rounded-xl hover:bg-red-50/50 transition-all cursor-pointer"
                title={t.logout}
              >
                <LogOut size={16} />
              </button>
            </div>

          </div>
        </div>

        {/* 2. Visual Tab Selectors */}
        <div className="bg-slate-50 border-t border-slate-200/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex gap-1 sm:gap-2 -mb-px overflow-x-auto py-2 no-scrollbar" aria-label="Tabs">
              {/* Dashboard */}
              <button
                onClick={() => handleNavigate('dashboard')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold font-display transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'dashboard' 
                    ? 'bg-[#131b2e] text-white shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                }`}
              >
                <LayoutDashboard size={14} />
                <span>{t.dashboard}</span>
              </button>

              {/* Inventory */}
              <button
                onClick={() => handleNavigate('inventory')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold font-display transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'inventory' 
                    ? 'bg-[#131b2e] text-white shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                }`}
              >
                <ClipboardList size={14} />
                <span>{t.inventory}</span>
              </button>

              {/* POS Sales */}
              <button
                onClick={() => handleNavigate('sales')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold font-display transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'sales' 
                    ? 'bg-[#131b2e] text-white shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                }`}
              >
                <ShoppingCart size={14} />
                <span>{t.sales}</span>
              </button>

              {/* Wholesale / Bulk Sales */}
              <button
                onClick={() => handleNavigate('wholesale')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold font-display transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'wholesale' 
                    ? 'bg-indigo-900 text-white shadow-sm ring-1 ring-indigo-500/30' 
                    : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                }`}
              >
                <Boxes size={14} className={activeTab === 'wholesale' ? 'text-indigo-300' : 'text-indigo-600'} />
                <span>{t.wholesale}</span>
              </button>

              {/* Debts */}
              <button
                onClick={() => handleNavigate('debts')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold font-display transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'debts' 
                    ? 'bg-amber-600 text-white shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                }`}
              >
                <Users size={14} />
                <span>{t.debts}</span>
              </button>

              {/* Analytics */}
              <button
                onClick={() => handleNavigate('analytics')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold font-display transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'analytics' 
                    ? 'bg-[#131b2e] text-white shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                }`}
              >
                <BarChart3 size={14} />
                <span>{t.analytics}</span>
              </button>

              {/* Owner / Subscribers Window - ONLY for App Owner */}
              {userRole === 'owner' && (
                <button
                  onClick={() => handleNavigate('subscribers')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold font-display transition-all whitespace-nowrap cursor-pointer border ${
                    activeTab === 'subscribers' 
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm' 
                      : 'bg-emerald-50 text-emerald-950 border-emerald-200 hover:bg-emerald-100/80'
                  }`}
                >
                  <ShieldCheck size={15} className={activeTab === 'subscribers' ? 'text-white' : 'text-emerald-700'} />
                  <span>{t.subscribers}</span>
                </button>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* 3. Main Content Container Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {activeTab === 'dashboard' && (
          <DashboardTab 
            lang={lang} 
            products={products} 
            debts={debts} 
            transactions={transactions} 
            onNavigate={handleNavigate}
            onUpdateProduct={handleUpdateProduct}
            onOpenAIOrganizer={() => setShowAIOrganizerModal(true)}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryTab 
            lang={lang} 
            shopType={shopType}
            products={products} 
            onAddProduct={handleAddProduct} 
            onUpdateProduct={handleUpdateProduct} 
            onDeleteProduct={handleDeleteProduct}
            initialFilter={inventoryFilter}
            onOpenAIOrganizer={() => setShowAIOrganizerModal(true)}
          />
        )}

        {activeTab === 'sales' && (
          <SalesTab 
            lang={lang} 
            products={products} 
            debts={debts} 
            onCompleteSale={handleCompleteSale}
            onAddCustomer={handleAddCustomer}
          />
        )}

        {activeTab === 'wholesale' && (
          <WholesaleTab 
            lang={lang} 
            shopName={shopName}
            shopPhone={shopPhone}
            shopAddress={shopAddress}
            shopLogo={shopLogo}
            products={products} 
            debts={debts} 
            transactions={transactions}
            onCompleteSale={handleCompleteSale}
            onUpdateProduct={handleUpdateProduct}
            onAddCustomer={handleAddCustomer}
          />
        )}

        {activeTab === 'debts' && (
          <DebtsTab 
            lang={lang} 
            debts={debts} 
            onAddDebtCustomer={handleAddCustomer} 
            onUpdateCustomerDebts={handleUpdateDebts}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab 
            lang={lang} 
            transactions={transactions} 
          />
        )}

        {activeTab === 'subscribers' && userRole === 'owner' && (
          <SubscribersTab 
            lang={lang} 
          />
        )}
      </main>

      {/* Technical Support & App Branding Footer */}
      <SupportFooter lang={lang} />

      {/* Cross-Device Account Sync Modal */}
      {showSyncModal && (
        <DeviceSyncModal
          lang={lang}
          isOpen={showSyncModal}
          onClose={() => setShowSyncModal(false)}
          syncCode={syncCode}
          isSyncing={isSyncing}
          lastSyncedTime={lastSyncedTime}
          onInitiatePairing={handleInitiatePairing}
          onForceSync={() => pushStateToCloud()}
          shopName={shopName}
        />
      )}

      {/* Store Logo & Printed Invoice Settings Modal */}
      {showSettingsModal && (
        <StoreSettingsModal
          lang={lang}
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          shopName={shopName}
          shopType={shopType}
          syncCode={syncCode}
          onUpdateSettings={(newSettings) => {
            setShopName(newSettings.shopName);
            setShopType(newSettings.shopType);
            setShopLogo(newSettings.shopLogo);
            if (newSettings.shopPhone) setShopPhone(newSettings.shopPhone);
            if (newSettings.shopAddress) setShopAddress(newSettings.shopAddress);
          }}
        />
      )}

      {/* AI Store Organizer Modal */}
      {showAIOrganizerModal && (
        <AIStoreOrganizerModal
          lang={lang}
          shopName={shopName}
          products={products}
          transactions={transactions}
          debts={debts}
          isOpen={showAIOrganizerModal}
          onClose={() => setShowAIOrganizerModal(false)}
        />
      )}

    </div>
  );
}
