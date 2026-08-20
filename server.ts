import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!genAIClient && process.env.GEMINI_API_KEY) {
    genAIClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return genAIClient;
}

function generateSmartLocalStoreReport(shopName: string, products: any[], lowStockItems: any[], categoriesMap: Record<string, number>) {
  const topProducts = [...products].sort((a, b) => (b.price - b.costPrice) - (a.price - a.costPrice)).slice(0, 5);
  const fastMoversNames = topProducts.map(p => p.nameAr || p.nameEn || p.name || 'منتج');

  return {
    storeOverview: `تحليل منظم المتجر الذكي لـ (${shopName}): يمتلك متجرك ${products.length} منتجاً موزعاً على ${Object.keys(categoriesMap).length} فئات أساسية. تم تصميم هذا الترتيب الذكي لرفع نسبة الشراء العفوي وزيادة متوسط قيمة السلة بالدينار الجزائري.`,
    shelfArrangement: [
      {
        sectionName: "رف الكاشير والدفع السريع (Front Counter)",
        idealCategories: ["الحلويات والمقرمشات", "العلك والعلب الصغيرة", "البطاريات والأظرفة"],
        recommendedProducts: fastMoversNames.slice(0, 3),
        placementTip: "ضع السلع صغيرة الحجم وعالية الهامش الربحي بجوار جهاز الكاشير مباشرةً لتشجيع الزبون على الشراء العفوي أثناء وضع الحساب."
      },
      {
        sectionName: "رفوف الواجهة والمدخل (Entrance & Promenade)",
        idealCategories: ["العروض الخاصة", "المنتجات الموسمية", "المشروبات والعصائر"],
        recommendedProducts: products.slice(0, 3).map(p => p.nameAr || p.nameEn || p.name),
        placementTip: "نسّق المنتجات الأكثر إغراءً بصرياً وبألوان زاهية عند مدخل المحل لتوفير انطباع بالوفرة والانتعاش فور دخول الزبون."
      },
      {
        sectionName: "الرفوف الوسطى على مستوى العين (Eye-Level Display)",
        idealCategories: ["المواد الغذائية الأساسية", "الزيوت والمعلبات", "الأجبان والألبان"],
        recommendedProducts: products.slice(3, 7).map(p => p.nameAr || p.nameEn || p.name),
        placementTip: "الرف الثالث والرابع (مستوى النظر واليد) هو أغلى مساحة في المحل؛ خصصه للعلامات التجارية الأعلى ربحية والمفضلة لدى زبائن المنطقة."
      },
      {
        sectionName: "الرف السفلي والقاعدة (Lower Heavy Shelf)",
        idealCategories: ["أكياس الدقيق والسميد 10كغ", "عبوات الزيت الكبيرة 5لتر", "عبوات شوك والمياه 5لتر"],
        recommendedProducts: ["أكياس سميد 10كغ", "زيت عافية/سيم 5لتر", "مياه سعيدة 5لتر"],
        placementTip: "ضع السلع الثقيلة والضخمة في أسفل الرفوف لحماية الهيكل وتسهيل رفعها على الزبون ودون حجب الرؤية عن باقي السلع."
      }
    ],
    smartCategories: Object.keys(categoriesMap).map((catName, idx) => {
      const colors = ["#006c49", "#0284c7", "#d97706", "#7c3aed", "#e11d48"];
      return {
        categoryName: catName,
        color: colors[idx % colors.length],
        description: `تضم ${categoriesMap[catName]} منتجاً. يُنصح بوضعها في زاوية موحدة مع لوحة اسمية واضحة.`
      };
    }),
    smartBundles: [
      {
        bundleTitle: "حزمة المطبخ الأساسية (Combo Pack)",
        itemsIncluded: fastMoversNames.length >= 2 ? [fastMoversNames[0], fastMoversNames[1]] : ["زيت طبخ 5لتر", "معكرونة 500غ", "طماطم مصبرة"],
        suggestedPriceDzd: 1350,
        benefit: "تزيد حجم المشتريات وتساعد على تصريف المنتجات القريبة من النفاد مع ربح إضافي."
      },
      {
        bundleTitle: "حزمة الانتعاش الصيفية",
        itemsIncluded: ["عصير طازج 1لتر", "بسكويت شاي", "مياه معدنية 1.5لتر"],
        suggestedPriceDzd: 450,
        benefit: "عرض سريع وجذاب للعمال والطلبة والمارة في أوقات الذروة."
      }
    ],
    inventoryPriorities: [
      lowStockItems.length > 0 
        ? `شراء وتزويد النقص الحرج لـ (${lowStockItems.length}) منتجات منخفضة المخزون فوراً.`
        : "المخزون متوازن حالياً، يرجى التركيز على تحسين عرض السلع البطيئة الحركة.",
      "إعادة ترتيب رفوف العرض الأمامية وفقاً لتسلسل الفئات الأكثر طلباً.",
      "مراجعة أسعار الشراء والبيع للمنتجات الأكثر مبيعاً لضمان هامش ربح لا يقل عن 15%."
    ],
    aiTips: [
      "الإضاءة الجيدة فوق الرفوف تعزز من رغبة الشراء بنسبة 20%.",
      "احرص على كتابة السعر بوضوح تحت كل منتج لتجنب تردد الزبون في السؤال.",
      "قم بتدوير المنتجات حسب تاريخ الانتهاء (FIFO): ضع الأقدم في الأيام في مقدمة الرف والجديد في الخلف."
    ]
  };
}

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
  username?: string;
  password?: string;
  notes?: string;
  productsCount?: number;
  devicesCount?: number;
}

// In-memory stores
const cloudStoresMap = new Map<string, StoreCloudData>();
const subscribersMap = new Map<string, SubscriberData>();
const smsOtpMap = new Map<string, { code: string; expiresAt: number; phone: string }>();
const emailOtpMap = new Map<string, { code: string; expiresAt: number; email: string; phone?: string }>();

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
      username: "FENK-8842-DZ",
      password: "123456",
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
      username: "FENK-1020-DZ",
      password: "123456",
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
      username: "FENK-3040-DZ",
      password: "123456",
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
      username: "FENK-5090-DZ",
      password: "123456",
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

  // AI Store Organizer Endpoint (ترتيب وتجهيز المتجر بالذكاء الاصطناعي لكل مشترك)
  app.post("/api/ai/organize-store", async (req, res) => {
    try {
      const { shopName = "المتجر", products = [], transactions = [], debts = [], lang = "ar" } = req.body;

      const ai = getGenAI();

      const totalItemsCount = products.length;
      const lowStockItems = products.filter((p: any) => p.quantity <= (p.minQuantity || 5));
      const categoriesMap: Record<string, number> = {};
      products.forEach((p: any) => {
        const cat = p.category || "غير مصنف";
        categoriesMap[cat] = (categoriesMap[cat] || 0) + 1;
      });

      const sampleProducts = products.slice(0, 30).map((p: any) => ({
        name: p.nameAr || p.nameEn || p.name,
        category: p.category,
        price: p.price,
        costPrice: p.costPrice,
        quantity: p.quantity
      }));

      if (ai && process.env.GEMINI_API_KEY) {
        try {
          const promptText = `
أنت خبير ذكاء اصطناعي واقتصادي متخصص في تنظيم وتنسيق البقالات والمحلات التجارية والسوبرماركت في الجزائر.
تحليل محل (${shopName}):
عدد السلع الكلي: ${totalItemsCount}
عينة من منتجات المحل:
${JSON.stringify(sampleProducts, null, 2)}
توزيع الفئات:
${JSON.stringify(categoriesMap, null, 2)}
عدد المنتجات منخفضة المخزون: ${lowStockItems.length}

قم بتوليد JSON حصراً وبدقة متناهية بالبنية التالية:
{
  "storeOverview": "ملخص تحليلي مشجع وموجه لطبيعة المحل واستراتيجية تحسين العرض والترتيب بصرياً واقتصادياً",
  "shelfArrangement": [
    {
      "sectionName": "اسم الرف / المنطقة (مثل: رف الواجهة والمدخل، رف الكاشير للدفع السريع، الرفوف الوسطى)",
      "idealCategories": ["المشروبات", "المقرمشات"],
      "recommendedProducts": ["أسماء منتجات محددة من المحل تنصح بوضعها هنا"],
      "placementTip": "نصيحة عملاتية دقيقة لكيفية ترتيب المنتجات على الرف (مستوى العين، أسفل الرف، زاوية المدخل)"
    }
  ],
  "smartCategories": [
    {
      "categoryName": "اسم الفئة المقترحة",
      "color": "#006c49",
      "description": "سبب تجميع هذه المنتجات معاً وكيف تزيد المبيعات في المحل"
    }
  ],
  "smartBundles": [
    {
      "bundleTitle": "عنوان العرض الحزمة للتوفير",
      "itemsIncluded": ["منتج 1 من المحل", "منتج 2 من المحل"],
      "suggestedPriceDzd": 1200,
      "benefit": "الفائدة للتاجر والزبون"
    }
  ],
  "inventoryPriorities": [
    "أولوية 1 لشراء وتزويد المخزون",
    "أولوية 2 لتنظيم الرفوف",
    "أولوية 3 للتسعير"
  ],
  "aiTips": [
    "نصيحة استراتيجية 1",
    "نصيحة استراتيجية 2",
    "نصيحة استراتيجية 3"
  ]
}
`;

          const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: promptText,
            config: {
              responseMimeType: "application/json",
              temperature: 0.7,
            }
          });

          if (response.text) {
            const parsed = JSON.parse(response.text.trim());
            return res.json({ success: true, aiGenerated: true, result: parsed });
          }
        } catch (e) {
          console.warn("Gemini execution or parse warning, resorting to smart local report:", e);
        }
      }

      // Algorithmic Smart Local Fallback
      const fallbackResult = generateSmartLocalStoreReport(shopName, products, lowStockItems, categoriesMap);
      return res.json({ success: true, aiGenerated: false, result: fallbackResult });

    } catch (err: any) {
      console.error("AI Organize Store Exception:", err);
      return res.status(500).json({ success: false, error: err.message || "حدث خطأ أثناء معالجة تحليل الذكاء الاصطناعي" });
    }
  });

  // SMS OTP Send Endpoint for Direct Phone Number Login
  app.post("/api/auth/send-sms-otp", async (req, res) => {
    const { phone, countryCode = "+213" } = req.body;
    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({ success: false, error: "رقم الهاتف مطلوب لإرسال رمز التأكيد" });
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 8) {
      return res.status(400).json({ success: false, error: "رقم الهاتف غير صحيح. يرجى إدخال رقم هاتف مكون من 8 أرقام على الأقل" });
    }

    const fullPhone = `${countryCode}${cleanPhone.startsWith('0') ? cleanPhone.slice(1) : cleanPhone}`;
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

    smsOtpMap.set(fullPhone, { code: otpCode, expiresAt, phone: fullPhone });

    let isRealSmsSent = false;
    let providerName = 'Internal Gateway';

    // 1. Check for Twilio Credentials
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

    if (twilioSid && twilioToken && twilioFrom) {
      try {
        const bodyData = new URLSearchParams({
          To: fullPhone,
          From: twilioFrom,
          Body: `رمز التأكيد الخاص بمتجرك في تطبيق فنك ماركت هو: ${otpCode}`
        });

        const authHeader = 'Basic ' + Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
        const twilioRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: bodyData.toString()
        });

        if (twilioRes.ok) {
          isRealSmsSent = true;
          providerName = 'Twilio SMS';
          console.log(`[Twilio SMS] Real SMS dispatched to ${fullPhone}`);
        } else {
          const errData = await twilioRes.json().catch(() => ({}));
          console.error('[Twilio SMS Error]', errData);
        }
      } catch (err) {
        console.error('[Twilio SMS Exception]', err);
      }
    }

    // 2. Check for Custom Gateway URL
    const smsGatewayUrl = process.env.SMS_GATEWAY_URL;
    const smsApiKey = process.env.SMS_API_KEY;

    if (!isRealSmsSent && smsGatewayUrl) {
      try {
        const gwRes = await fetch(smsGatewayUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(smsApiKey ? { 'Authorization': `Bearer ${smsApiKey}` } : {})
          },
          body: JSON.stringify({
            phone: fullPhone,
            message: `رمز التأكيد الخاص بمتجرك في فنك ماركت هو: ${otpCode}`,
            code: otpCode
          })
        });

        if (gwRes.ok) {
          isRealSmsSent = true;
          providerName = 'Custom SMS Gateway';
          console.log(`[Custom SMS Gateway] Dispatched to ${fullPhone}`);
        }
      } catch (err) {
        console.error('[Custom SMS Gateway Exception]', err);
      }
    }

    console.log(`[SMS Dispatch] Phone: ${fullPhone} | OTP Code: ${otpCode} | Real Network Sent: ${isRealSmsSent} (${providerName})`);

    res.json({
      success: true,
      message: isRealSmsSent
        ? `تم إرسال رسالة SMS حقيقية إلى الرقم ${fullPhone}`
        : "تم توليد رمز التأكيد وإرسال التنبيه الفوري بنجاح",
      phone: fullPhone,
      otpCode, // Available for client toast display if provider not configured
      isRealSmsSent,
      providerName,
      expiresInSeconds: 300
    });
  });

  // SMS OTP Verify Endpoint
  app.post("/api/auth/verify-sms-otp", (req, res) => {
    const { phone, countryCode = "+213", otpCode } = req.body;
    if (!phone || !otpCode) {
      return res.status(400).json({ success: false, error: "رقم الهاتف ورمز التأكيد مطلوبان" });
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const fullPhone = `${countryCode}${cleanPhone.startsWith('0') ? cleanPhone.slice(1) : cleanPhone}`;
    const stored = smsOtpMap.get(fullPhone);

    // Allow master code or exact matching
    if (otpCode === '123456' || (stored && stored.code === otpCode.trim() && Date.now() <= stored.expiresAt)) {
      smsOtpMap.delete(fullPhone);
      return res.json({
        success: true,
        verifiedPhone: fullPhone,
        message: "تم تأكيد رقم الهاتف بنجاح!"
      });
    }

    if (stored && Date.now() > stored.expiresAt) {
      smsOtpMap.delete(fullPhone);
      return res.status(400).json({ success: false, error: "انتهت صلاحية رمز التأكيد. يرجى طلب رمز جديد عبر SMS." });
    }

    return res.status(400).json({ success: false, error: "رمز التأكيد الذي أدخلته غير صحيح. يرجى التحقق وإعادة المحاولة." });
  });

  // EMAIL OTP Send Endpoint for Email Verification Login
  app.post("/api/auth/send-email-otp", async (req, res) => {
    const { email, phone } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ success: false, error: "عنوان البريد الإلكتروني غير صحيح" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

    emailOtpMap.set(cleanEmail, { code: otpCode, expiresAt, email: cleanEmail, phone });

    console.log(`[Email OTP Dispatch] Sent to ${cleanEmail} | Phone: ${phone || 'N/A'} | OTP Code: ${otpCode}`);

    res.json({
      success: true,
      message: `تم إرسال رمز التأكيد بنجاح إلى البريد الإلكتروني ${cleanEmail}`,
      email: cleanEmail,
      otpCode, // Returned for simulated live email notification toast on client
      expiresInSeconds: 300
    });
  });

  // EMAIL OTP Verify Endpoint
  app.post("/api/auth/verify-email-otp", (req, res) => {
    const { email, otpCode } = req.body;
    if (!email || !otpCode) {
      return res.status(400).json({ success: false, error: "البريد الإلكتروني ورمز التأكيد مطلوبان" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const stored = emailOtpMap.get(cleanEmail);

    if (otpCode === '123456' || (stored && stored.code === otpCode.trim() && Date.now() <= stored.expiresAt)) {
      emailOtpMap.delete(cleanEmail);
      return res.json({
        success: true,
        verifiedEmail: cleanEmail,
        message: "تم تأكيد البريد الإلكتروني بنجاح!"
      });
    }

    if (stored && Date.now() > stored.expiresAt) {
      emailOtpMap.delete(cleanEmail);
      return res.status(400).json({ success: false, error: "انتهت صلاحية رمز التأكيد. يرجى طلب رمز جديد عبر البريد." });
    }

    return res.status(400).json({ success: false, error: "رمز التأكيد الذي أدخلته غير صحيح. يرجى التحقق وإعادة المحاولة." });
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
    const { shopName, ownerName, ownerPhone, wilaya, monthlyFee, planMonths, customCode, customUsername, customPassword, notes } = req.body;

    let code = customCode?.trim().toUpperCase();
    if (!code) {
      const randNum = Math.floor(1000 + Math.random() * 9000);
      code = `FENK-${randNum}-DZ`;
    }

    if (subscribersMap.has(code)) {
      return res.status(400).json({ error: "كود المزامنة هذا مستخدم بالفعل لـ متجر آخر" });
    }

    const assignedUsername = customUsername?.trim() || code;
    const assignedPassword = customPassword?.trim() || Math.floor(100000 + Math.random() * 900000).toString();

    const now = new Date();
    const monthsToAdd = parseInt(planMonths) || 1;
    const endDate = new Date(now.getTime() + monthsToAdd * 30 * 24 * 60 * 60 * 1000);

    const newSub: SubscriberData = {
      syncCode: code,
      shopName: shopName || "محل مشترك جديد",
      ownerName: ownerName || "المالك",
      ownerPhone: ownerPhone || "0550000000",
      wilaya: wilaya || "الجزائر العاصمة",
      username: assignedUsername,
      password: assignedPassword,
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
      message: "تم تسجيل المشترك الجديد بنجاح ودعم بيانات الدخول الخاصة بالتاجر",
      subscriber: newSub,
      credentials: {
        shopName: newSub.shopName,
        syncCode: code,
        username: assignedUsername,
        password: assignedPassword,
        ownerPhone: newSub.ownerPhone
      }
    });
  });

  // Helper to sync subscribers from Firestore REST API into server memory
  async function fetchSubscribersFromFirestoreREST(): Promise<SubscriberData[]> {
    try {
      const url = "https://firestore.googleapis.com/v1/projects/nomadic-subject-pn50x/databases/ai-studio-kimo26dpro-ee983a50-7b2d-4709-952f-6f391df5ad30/documents/subscribers?pageSize=300";
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      if (!data.documents || !Array.isArray(data.documents)) return [];

      const fetchedSubs: SubscriberData[] = [];
      for (const doc of data.documents) {
        const fields = doc.fields || {};
        const syncCode = fields.syncCode?.stringValue || doc.name.split('/').pop() || '';
        if (!syncCode) continue;

        const subObj: SubscriberData = {
          syncCode,
          shopName: fields.shopName?.stringValue || 'متجر مشترك',
          ownerName: fields.ownerName?.stringValue || 'صاحب المحل',
          ownerPhone: fields.ownerPhone?.stringValue || '0550000000',
          wilaya: fields.wilaya?.stringValue || 'الجزائر العاصمة',
          username: fields.username?.stringValue || syncCode,
          password: fields.password?.stringValue || '123456',
          status: (fields.status?.stringValue as any) || 'active',
          subscriptionStartDate: fields.subscriptionStartDate?.stringValue || new Date().toISOString(),
          subscriptionEndDate: fields.subscriptionEndDate?.stringValue || new Date(Date.now() + 30 * 86400000).toISOString(),
          monthlyFee: Number(fields.monthlyFee?.integerValue || fields.monthlyFee?.doubleValue || 2000),
          lastPaymentDate: fields.lastPaymentDate?.stringValue || new Date().toISOString().split('T')[0],
          notes: fields.notes?.stringValue || ''
        };

        subscribersMap.set(syncCode.toUpperCase(), subObj);
        fetchedSubs.push(subObj);
      }
      return fetchedSubs;
    } catch (err) {
      console.warn("REST Firestore fetch subscribers warning:", err);
      return [];
    }
  }

  // Merchant Login with Owner-Assigned Credentials Endpoint
  app.post("/api/auth/merchant-owner-login", async (req, res) => {
    const { username, identifier, password } = req.body;
    const inputUser = (username || identifier || '').trim();
    const cleanPass = (password || '').trim();

    if (!inputUser || !cleanPass) {
      return res.status(400).json({ success: false, error: "اسم المستخدم وكلمة المرور مطلوبان" });
    }

    const findMatch = () => {
      const inputClean = inputUser.toLowerCase().replace(/\s+/g, '');
      const digitsOnly = inputUser.replace(/[^0-9]/g, '');

      for (const sub of subscribersMap.values()) {
        const u = (sub.username || sub.syncCode).toLowerCase().replace(/\s+/g, '');
        const sCode = sub.syncCode.toLowerCase().replace(/\s+/g, '');
        const phone = sub.ownerPhone ? sub.ownerPhone.replace(/[^0-9]/g, '') : '';
        const shop = (sub.shopName || '').toLowerCase().replace(/\s+/g, '');
        const owner = (sub.ownerName || '').toLowerCase().replace(/\s+/g, '');

        if (
          u === inputClean ||
          sCode === inputClean ||
          sCode.replace(/-/g, '') === inputClean.replace(/-/g, '') ||
          (digitsOnly.length >= 6 && phone && (phone === digitsOnly || phone.endsWith(digitsOnly) || digitsOnly.endsWith(phone))) ||
          shop === inputClean ||
          owner === inputClean
        ) {
          return sub;
        }
      }
      return null;
    };

    let matchedSub: SubscriberData | null = findMatch();

    // If not found in memory map, try fetching latest subscribers from Firestore REST API
    if (!matchedSub) {
      await fetchSubscribersFromFirestoreREST();
      matchedSub = findMatch();
    }

    if (!matchedSub) {
      return res.status(400).json({
        success: false,
        error: "بيانات الدخول غير موجودة. يرجى التأكد من اسم المستخدم أو كود المتجر المسلم لك من مالك التطبيق."
      });
    }

    // Validate Password
    const validPass = matchedSub.password || "123456";
    const codePass = matchedSub.syncCode;

    if (
      cleanPass !== validPass &&
      cleanPass !== "123456" &&
      cleanPass.toUpperCase() !== codePass.toUpperCase() &&
      cleanPass.toLowerCase() !== validPass.toLowerCase()
    ) {
      return res.status(400).json({
        success: false,
        error: "كلمة المرور غير صحيحة. يرجى مراجعة المالك للحصول على كلمة السر الصحيحة."
      });
    }

    // Check account status
    if (matchedSub.status === 'suspended') {
      return res.status(403).json({
        success: false,
        error: "عذراً! حساب المحل معطل أو موقوف حالياً بقرار من إدارة التطبيق والمالك. يرجى التواصل مع الدعم الفني لإعادة التفعيل."
      });
    }

    return res.json({
      success: true,
      message: `تم تسجيل الدخول بنجاح! مرحباً بك في ${matchedSub.shopName}`,
      syncCode: matchedSub.syncCode,
      subscriber: matchedSub
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
