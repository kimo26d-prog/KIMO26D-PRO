import { useState, useEffect, useCallback } from 'react';
import { Language, AppTab, Product, CustomerDebt, Transaction } from './types';
import { INITIAL_PRODUCTS, INITIAL_DEBTS, INITIAL_TRANSACTIONS } from './data';
import LoginScreen from './components/LoginScreen';
import DashboardTab from './components/DashboardTab';
import InventoryTab from './components/InventoryTab';
import SalesTab from './components/SalesTab';
import DebtsTab from './components/DebtsTab';
import AnalyticsTab from './components/AnalyticsTab';
import SubscribersTab from './components/SubscribersTab';
import SupportFooter from './components/SupportFooter';
import DeviceSyncModal from './components/DeviceSyncModal';
import fenkLogo from './assets/images/fenk_logo_1783465306813.jpg';
import { LayoutDashboard, ClipboardList, ShoppingCart, Users, BarChart3, LogOut, Calendar, Smartphone, ArrowLeftRight, RefreshCw, ShieldCheck, Database } from 'lucide-react';
import { playClickSound, playNotificationSound } from './utils/audio';
import { 
  saveStoreToFirestore, 
  subscribeToStoreProducts, 
  subscribeToStoreDebts, 
  subscribeToStoreTransactions,
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

  const [shopName, setShopName] = useState<string>(() => {
    return localStorage.getItem('fenk_mahli_shop_name') || 'بقالة التوفير الحديثة';
  });

  const [lang, setLang] = useState<Language>(() => {
    const savedLang = localStorage.getItem('fenk_mahli_lang') as Language;
    return savedLang || 'ar';
  });

  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [inventoryFilter, setInventoryFilter] = useState<string>('');

  // Main collections state
  const [products, setProducts] = useState<Product[]>(() => {
    const savedProducts = localStorage.getItem('fenk_mahli_products');
    if (savedProducts) {
      try {
        return JSON.parse(savedProducts);
      } catch (e) {
        console.error('Error loading products from local storage, falling back to initial data');
      }
    }
    return INITIAL_PRODUCTS;
  });

  const [debts, setDebts] = useState<CustomerDebt[]>(() => {
    const savedDebts = localStorage.getItem('fenk_mahli_debts');
    if (savedDebts) {
      try {
        return JSON.parse(savedDebts);
      } catch (e) {
        console.error('Error loading debts from local storage, falling back to initial data');
      }
    }
    return INITIAL_DEBTS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const savedTransactions = localStorage.getItem('fenk_mahli_transactions');
    if (savedTransactions) {
      try {
        return JSON.parse(savedTransactions);
      } catch (e) {
        console.error('Error loading transactions from local storage, falling back to initial data');
      }
    }
    return INITIAL_TRANSACTIONS;
  });

  // Current formatted date/time tracker
  const [formattedTime, setFormattedTime] = useState('');

  // Cross-Device Sync State & Code Management
  const [syncCode, setSyncCode] = useState<string>(() => {
    // Check URL search param first (e.g. ?syncCode=FENK-8842-SA from scanning QR code)
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

  const [showSyncModal, setShowSyncModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<Date | null>(new Date());

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

  // Attach Firebase Firestore Realtime Listeners
  useEffect(() => {
    if (!isLoggedIn || !syncCode) return;

    // Initial push on login
    pushStateToCloud();

    // Subscribe to Firestore collections in real-time
    const unsubscribeProducts = subscribeToStoreProducts(syncCode, (remoteProducts) => {
      if (remoteProducts && remoteProducts.length > 0) {
        setProducts(remoteProducts);
        setLastSyncedTime(new Date());
      }
    });

    const unsubscribeDebts = subscribeToStoreDebts(syncCode, (remoteDebts) => {
      if (remoteDebts && remoteDebts.length > 0) {
        setDebts(remoteDebts);
        setLastSyncedTime(new Date());
      }
    });

    const unsubscribeTransactions = subscribeToStoreTransactions(syncCode, (remoteTransactions) => {
      if (remoteTransactions && remoteTransactions.length > 0) {
        setTransactions(remoteTransactions);
        setLastSyncedTime(new Date());
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

  // Persist data collections whenever they change
  useEffect(() => {
    localStorage.setItem('fenk_mahli_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('fenk_mahli_debts', JSON.stringify(debts));
  }, [debts]);

  useEffect(() => {
    localStorage.setItem('fenk_mahli_transactions', JSON.stringify(transactions));
  }, [transactions]);

  const handleLoginSuccess = (nameOfShop: string) => {
    setIsLoggedIn(true);
    setShopName(nameOfShop);
    localStorage.setItem('fenk_mahli_logged_in', 'true');
    localStorage.setItem('fenk_mahli_shop_name', nameOfShop);
  };

  const handleLogOut = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('fenk_mahli_logged_in');
  };

  // State modifiers with instant Firebase sync
  const handleAddProduct = (newProduct: Product) => {
    setProducts([newProduct, ...products]);
    if (syncCode) saveProductToFirestore(syncCode, newProduct);
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    if (syncCode) saveProductToFirestore(syncCode, updatedProduct);
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts(products.filter(p => p.id !== productId));
    if (syncCode) deleteProductFromFirestore(syncCode, productId);
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
    setInventoryFilter(filter || '');
    setActiveTab(tab);
  };

  const translations = {
    ar: {
      dashboard: "لوحة التحكم",
      inventory: "إدارة المخزون",
      sales: "الكاشير والمبيعات",
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
      
      {/* 1. Global Navigation Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-4">
            
            {/* Logo and Shop details */}
            <div className="flex items-center gap-3">
              <img 
                alt="Fenk Mahli" 
                className="w-10 h-10 object-contain rounded-xl border border-slate-100 bg-[#f8f9ff] p-0.5"
                src={fenkLogo} 
              />
              <div>
                <h1 className="text-sm font-extrabold font-display text-slate-950 flex items-center gap-1.5 leading-none">
                  <span>{shopName}</span>
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

            {/* Device Sync, Language & Log out */}
            <div className="flex items-center gap-2 sm:gap-3">
              
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

              {/* Owner / Subscribers Window */}
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
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryTab 
            lang={lang} 
            products={products} 
            onAddProduct={handleAddProduct} 
            onUpdateProduct={handleUpdateProduct} 
            onDeleteProduct={handleDeleteProduct}
            initialFilter={inventoryFilter}
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

        {activeTab === 'subscribers' && (
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

    </div>
  );
}
