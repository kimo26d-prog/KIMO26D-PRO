import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

interface StoreCloudData {
  syncCode: string;
  shopName: string;
  products: any[];
  debts: any[];
  transactions: any[];
  lastUpdated: number;
  devicesCount: number;
}

interface SubscriberData {
  syncCode: string;
  shopName: string;
  ownerName: string;
  ownerPhone: string;
  wilaya: string;
  status: 'active' | 'expired' | 'suspended';
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  monthlyFee: number; // in DZD
  lastPaymentDate: string;
  notes?: string;
  productsCount?: number;
  devicesCount?: number;
}

// In-memory stores
const cloudStoresMap = new Map<string, StoreCloudData>();
const subscribersMap = new Map<string, SubscriberData>();

// Initialize default Algerian subscriber accounts
function initDefaultSubscribers() {
  const now = new Date();
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const pastMonth = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

  const initialList: SubscriberData[] = [
    {
      syncCode: "FENK-8842-DZ",
      shopName: "بقالة التوفير الحديثة",
      ownerName: "أمين بلقاسم",
      ownerPhone: "0550123456",
      wilaya: "الجزائر العاصمة",
      status: "active",
      subscriptionStartDate: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      subscriptionEndDate: nextMonth.toISOString(),
      monthlyFee: 2500,
      lastPaymentDate: new Date().toISOString().split('T')[0],
      notes: "مشترك سدد بواسطة بريدي موب BaridiMob"
    },
    {
      syncCode: "FENK-1020-DZ",
      shopName: "سوبرماركت الهضاب",
      ownerName: "مصطفى رحماني",
      ownerPhone: "0661987654",
      wilaya: "سطيف",
      status: "active",
      subscriptionStartDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      subscriptionEndDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString(),
      monthlyFee: 3000,
      lastPaymentDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: "باقة سوبرماركت - 3000 د.ج/شهرياً"
    },
    {
      syncCode: "FENK-3040-DZ",
      shopName: "محل السلام للمواد الغذائية",
      ownerName: "كريم وهراني",
      ownerPhone: "0770554433",
      wilaya: "وهران",
      status: "expired",
      subscriptionStartDate: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000).toISOString(),
      subscriptionEndDate: pastMonth.toISOString(),
      monthlyFee: 2000,
      lastPaymentDate: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: "انتهى اشتراكه منذ 5 أيام ولم يسدد بعد"
    },
    {
      syncCode: "FENK-5090-DZ",
      shopName: "متجر الأمل العام",
      ownerName: "ياسين القسنطيني",
      ownerPhone: "0540887766",
      wilaya: "قسنطينة",
      status: "suspended",
      subscriptionStartDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      subscriptionEndDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      monthlyFee: 2000,
      lastPaymentDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: "حساب معطل بسبب التأخر العمدي في السداد"
    }
  ];

  initialList.forEach(sub => {
    subscribersMap.set(sub.syncCode, sub);
  });
}

initDefaultSubscribers();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "20mb" }));

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });

  // Get Store State by Sync Code
  app.get("/api/sync/store", (req, res) => {
    const syncCode = (req.query.syncCode as string)?.toUpperCase();
    if (!syncCode) {
      return res.status(400).json({ error: "syncCode query parameter required" });
    }

    const storeData = cloudStoresMap.get(syncCode);
    const sub = subscribersMap.get(syncCode);

    if (!storeData && !sub) {
      return res.status(444).json({ notFound: true, message: "No cloud store found for this sync code" });
    }

    // Auto update expired status if past end date
    if (sub && sub.status === 'active' && new Date(sub.subscriptionEndDate).getTime() < Date.now()) {
      sub.status = 'expired';
    }

    res.json({ 
      success: true, 
      store: storeData || { syncCode, shopName: sub?.shopName || "بقالة التوفير الحديثة", products: [], debts: [], transactions: [], lastUpdated: Date.now(), devicesCount: 1 },
      subscriber: sub || null
    });
  });

  // Push / Save Store State
  app.post("/api/sync/store", (req, res) => {
    const { syncCode, shopName, products, debts, transactions, clientTimestamp, ownerName, ownerPhone, wilaya } = req.body;

    if (!syncCode) {
      return res.status(400).json({ error: "syncCode is required" });
    }

    const normalizedCode = syncCode.toUpperCase();
    const existing = cloudStoresMap.get(normalizedCode);

    const updatedData: StoreCloudData = {
      syncCode: normalizedCode,
      shopName: shopName || existing?.shopName || "بقالة التوفير الحديثة",
      products: Array.isArray(products) ? products : existing?.products || [],
      debts: Array.isArray(debts) ? debts : existing?.debts || [],
      transactions: Array.isArray(transactions) ? transactions : existing?.transactions || [],
      lastUpdated: clientTimestamp || Date.now(),
      devicesCount: (existing?.devicesCount || 1) + 1,
    };

    cloudStoresMap.set(normalizedCode, updatedData);

    // Ensure subscriber account exists or is updated
    let sub = subscribersMap.get(normalizedCode);
    if (!sub) {
      const now = new Date();
      sub = {
        syncCode: normalizedCode,
        shopName: updatedData.shopName,
        ownerName: ownerName || "تاجر مشترك",
        ownerPhone: ownerPhone || "0550000000",
        wilaya: wilaya || "الجزائر العاصمة",
        status: "active",
        subscriptionStartDate: now.toISOString(),
        subscriptionEndDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        monthlyFee: 2000,
        lastPaymentDate: now.toISOString().split('T')[0],
        notes: "حساب افتراضي مسجل حديثاً"
      };
      subscribersMap.set(normalizedCode, sub);
    } else {
      if (shopName) sub.shopName = shopName;
      if (ownerName) sub.ownerName = ownerName;
      if (ownerPhone) sub.ownerPhone = ownerPhone;
      if (wilaya) sub.wilaya = wilaya;
      // Auto check expiration
      if (sub.status === 'active' && new Date(sub.subscriptionEndDate).getTime() < Date.now()) {
        sub.status = 'expired';
      }
    }

    res.json({
      success: true,
      lastUpdated: updatedData.lastUpdated,
      syncCode: normalizedCode,
      subscriberStatus: sub.status
    });
  });

  // Generate or Register new Sync Code
  app.post("/api/sync/pair", (req, res) => {
    const { existingCode, shopName, ownerName, ownerPhone, wilaya } = req.body;
    let code = existingCode?.toUpperCase();

    if (!code) {
      // Generate a clean store code like FENK-8921-DZ
      const randNum = Math.floor(1000 + Math.random() * 9000);
      code = `FENK-${randNum}-DZ`;
    }

    if (!cloudStoresMap.has(code)) {
      cloudStoresMap.set(code, {
        syncCode: code,
        shopName: shopName || "بقالة التوفير الحديثة",
        products: [],
        debts: [],
        transactions: [],
        lastUpdated: Date.now(),
        devicesCount: 1,
      });
    }

    if (!subscribersMap.has(code)) {
      const now = new Date();
      subscribersMap.set(code, {
        syncCode: code,
        shopName: shopName || "بقالة التوفير الحديثة",
        ownerName: ownerName || "تاجر جديد",
        ownerPhone: ownerPhone || "0550000000",
        wilaya: wilaya || "الجزائر العاصمة",
        status: "active",
        subscriptionStartDate: now.toISOString(),
        subscriptionEndDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        monthlyFee: 2000,
        lastPaymentDate: now.toISOString().split('T')[0],
        notes: "تم الإنشاء عبر نظام المزامنة"
      });
    }

    res.json({
      success: true,
      syncCode: code,
      store: cloudStoresMap.get(code),
      subscriber: subscribersMap.get(code)
    });
  });

  // ================= ADMIN / OWNER CONTROLLER ENDPOINTS =================

  // 1. Get All Subscribers + Stats
  app.get("/api/admin/subscribers", (req, res) => {
    const nowMs = Date.now();
    const subscribersList: SubscriberData[] = [];

    subscribersMap.forEach((sub) => {
      // Auto check expiration if active
      if (sub.status === 'active' && new Date(sub.subscriptionEndDate).getTime() < nowMs) {
        sub.status = 'expired';
      }
      
      const storeData = cloudStoresMap.get(sub.syncCode);
      subscribersList.push({
        ...sub,
        productsCount: storeData?.products?.length || 0,
        devicesCount: storeData?.devicesCount || 1,
      });
    });

    const totalSubscribers = subscribersList.length;
    const activeCount = subscribersList.filter(s => s.status === 'active').length;
    const expiredCount = subscribersList.filter(s => s.status === 'expired').length;
    const suspendedCount = subscribersList.filter(s => s.status === 'suspended').length;
    const totalMonthlyRevenue = subscribersList
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + (s.monthlyFee || 0), 0);

    res.json({
      success: true,
      subscribers: subscribersList,
      stats: {
        totalSubscribers,
        activeCount,
        expiredCount,
        suspendedCount,
        totalMonthlyRevenue
      }
    });
  });

  // 2. Add New Subscriber Account
  app.post("/api/admin/subscribers", (req, res) => {
    const { shopName, ownerName, ownerPhone, wilaya, monthlyFee, planMonths, customCode, notes } = req.body;

    let code = customCode?.trim().toUpperCase();
    if (!code) {
      const randNum = Math.floor(1000 + Math.random() * 9000);
      code = `FENK-${randNum}-DZ`;
    }

    if (subscribersMap.has(code)) {
      return res.status(400).json({ error: "كود المزامنة هذا مستخدم بالفعل لـ متجر آخر" });
    }

    const now = new Date();
    const monthsToAdd = parseInt(planMonths) || 1;
    const endDate = new Date(now.getTime() + monthsToAdd * 30 * 24 * 60 * 60 * 1000);

    const newSub: SubscriberData = {
      syncCode: code,
      shopName: shopName || "محل مشترك جديد",
      ownerName: ownerName || "المالك",
      ownerPhone: ownerPhone || "0550000000",
      wilaya: wilaya || "الجزائر العاصمة",
      status: "active",
      subscriptionStartDate: now.toISOString(),
      subscriptionEndDate: endDate.toISOString(),
      monthlyFee: Number(monthlyFee) || 2000,
      lastPaymentDate: now.toISOString().split('T')[0],
      notes: notes || "تمت الإضافة يدوياً بواسطة صاحب التطبيق"
    };

    subscribersMap.set(code, newSub);

    // Initialize cloud store
    cloudStoresMap.set(code, {
      syncCode: code,
      shopName: newSub.shopName,
      products: [],
      debts: [],
      transactions: [],
      lastUpdated: Date.now(),
      devicesCount: 1
    });

    res.json({
      success: true,
      message: "تم تسجيل المشترك الجديد بنجاح",
      subscriber: newSub
    });
  });

  // 3. Update / Renew Subscriber Subscription
  app.put("/api/admin/subscribers/:syncCode", (req, res) => {
    const code = req.params.syncCode.toUpperCase();
    const sub = subscribersMap.get(code);

    if (!sub) {
      return res.status(404).json({ error: "المشترك غير موجود" });
    }

    const { status, extendMonths, monthlyFee, notes, ownerName, ownerPhone, shopName, wilaya } = req.body;

    if (status && ['active', 'expired', 'suspended'].includes(status)) {
      sub.status = status;
    }

    if (extendMonths && Number(extendMonths) > 0) {
      const months = Number(extendMonths);
      const currentEnd = new Date(sub.subscriptionEndDate).getTime();
      const baseTime = currentEnd > Date.now() ? currentEnd : Date.now();
      const newEnd = new Date(baseTime + months * 30 * 24 * 60 * 60 * 1000);
      sub.subscriptionEndDate = newEnd.toISOString();
      sub.status = 'active';
      sub.lastPaymentDate = new Date().toISOString().split('T')[0];
    }

    if (monthlyFee !== undefined) sub.monthlyFee = Number(monthlyFee);
    if (notes !== undefined) sub.notes = notes;
    if (ownerName) sub.ownerName = ownerName;
    if (ownerPhone) sub.ownerPhone = ownerPhone;
    if (shopName) {
      sub.shopName = shopName;
      const store = cloudStoresMap.get(code);
      if (store) store.shopName = shopName;
    }
    if (wilaya) sub.wilaya = wilaya;

    res.json({
      success: true,
      message: "تم تحديث بيانات الاشتراك بنجاح",
      subscriber: sub
    });
  });

  // 4. Delete Subscriber Account
  app.delete("/api/admin/subscribers/:syncCode", (req, res) => {
    const code = req.params.syncCode.toUpperCase();
    if (!subscribersMap.has(code)) {
      return res.status(404).json({ error: "المشترك غير موجود" });
    }

    subscribersMap.delete(code);
    cloudStoresMap.delete(code);

    res.json({
      success: true,
      message: `تم حذف حساب المشترك (${code}) كلياً من النظام`
    });
  });

  // Vite middleware for development vs Static in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Fenk Mahli full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
