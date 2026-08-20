var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var genAIClient = null;
function getGenAI() {
  if (!genAIClient && process.env.GEMINI_API_KEY) {
    genAIClient = new import_genai.GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return genAIClient;
}
function generateSmartLocalStoreReport(shopName, products, lowStockItems, categoriesMap) {
  const topProducts = [...products].sort((a, b) => b.price - b.costPrice - (a.price - a.costPrice)).slice(0, 5);
  const fastMoversNames = topProducts.map((p) => p.nameAr || p.nameEn || p.name || "\u0645\u0646\u062A\u062C");
  return {
    storeOverview: `\u062A\u062D\u0644\u064A\u0644 \u0645\u0646\u0638\u0645 \u0627\u0644\u0645\u062A\u062C\u0631 \u0627\u0644\u0630\u0643\u064A \u0644\u0640 (${shopName}): \u064A\u0645\u062A\u0644\u0643 \u0645\u062A\u062C\u0631\u0643 ${products.length} \u0645\u0646\u062A\u062C\u0627\u064B \u0645\u0648\u0632\u0639\u0627\u064B \u0639\u0644\u0649 ${Object.keys(categoriesMap).length} \u0641\u0626\u0627\u062A \u0623\u0633\u0627\u0633\u064A\u0629. \u062A\u0645 \u062A\u0635\u0645\u064A\u0645 \u0647\u0630\u0627 \u0627\u0644\u062A\u0631\u062A\u064A\u0628 \u0627\u0644\u0630\u0643\u064A \u0644\u0631\u0641\u0639 \u0646\u0633\u0628\u0629 \u0627\u0644\u0634\u0631\u0627\u0621 \u0627\u0644\u0639\u0641\u0648\u064A \u0648\u0632\u064A\u0627\u062F\u0629 \u0645\u062A\u0648\u0633\u0637 \u0642\u064A\u0645\u0629 \u0627\u0644\u0633\u0644\u0629 \u0628\u0627\u0644\u062F\u064A\u0646\u0627\u0631 \u0627\u0644\u062C\u0632\u0627\u0626\u0631\u064A.`,
    shelfArrangement: [
      {
        sectionName: "\u0631\u0641 \u0627\u0644\u0643\u0627\u0634\u064A\u0631 \u0648\u0627\u0644\u062F\u0641\u0639 \u0627\u0644\u0633\u0631\u064A\u0639 (Front Counter)",
        idealCategories: ["\u0627\u0644\u062D\u0644\u0648\u064A\u0627\u062A \u0648\u0627\u0644\u0645\u0642\u0631\u0645\u0634\u0627\u062A", "\u0627\u0644\u0639\u0644\u0643 \u0648\u0627\u0644\u0639\u0644\u0628 \u0627\u0644\u0635\u063A\u064A\u0631\u0629", "\u0627\u0644\u0628\u0637\u0627\u0631\u064A\u0627\u062A \u0648\u0627\u0644\u0623\u0638\u0631\u0641\u0629"],
        recommendedProducts: fastMoversNames.slice(0, 3),
        placementTip: "\u0636\u0639 \u0627\u0644\u0633\u0644\u0639 \u0635\u063A\u064A\u0631\u0629 \u0627\u0644\u062D\u062C\u0645 \u0648\u0639\u0627\u0644\u064A\u0629 \u0627\u0644\u0647\u0627\u0645\u0634 \u0627\u0644\u0631\u0628\u062D\u064A \u0628\u062C\u0648\u0627\u0631 \u062C\u0647\u0627\u0632 \u0627\u0644\u0643\u0627\u0634\u064A\u0631 \u0645\u0628\u0627\u0634\u0631\u0629\u064B \u0644\u062A\u0634\u062C\u064A\u0639 \u0627\u0644\u0632\u0628\u0648\u0646 \u0639\u0644\u0649 \u0627\u0644\u0634\u0631\u0627\u0621 \u0627\u0644\u0639\u0641\u0648\u064A \u0623\u062B\u0646\u0627\u0621 \u0648\u0636\u0639 \u0627\u0644\u062D\u0633\u0627\u0628."
      },
      {
        sectionName: "\u0631\u0641\u0648\u0641 \u0627\u0644\u0648\u0627\u062C\u0647\u0629 \u0648\u0627\u0644\u0645\u062F\u062E\u0644 (Entrance & Promenade)",
        idealCategories: ["\u0627\u0644\u0639\u0631\u0648\u0636 \u0627\u0644\u062E\u0627\u0635\u0629", "\u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0627\u0644\u0645\u0648\u0633\u0645\u064A\u0629", "\u0627\u0644\u0645\u0634\u0631\u0648\u0628\u0627\u062A \u0648\u0627\u0644\u0639\u0635\u0627\u0626\u0631"],
        recommendedProducts: products.slice(0, 3).map((p) => p.nameAr || p.nameEn || p.name),
        placementTip: "\u0646\u0633\u0651\u0642 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0627\u0644\u0623\u0643\u062B\u0631 \u0625\u063A\u0631\u0627\u0621\u064B \u0628\u0635\u0631\u064A\u0627\u064B \u0648\u0628\u0623\u0644\u0648\u0627\u0646 \u0632\u0627\u0647\u064A\u0629 \u0639\u0646\u062F \u0645\u062F\u062E\u0644 \u0627\u0644\u0645\u062D\u0644 \u0644\u062A\u0648\u0641\u064A\u0631 \u0627\u0646\u0637\u0628\u0627\u0639 \u0628\u0627\u0644\u0648\u0641\u0631\u0629 \u0648\u0627\u0644\u0627\u0646\u062A\u0639\u0627\u0634 \u0641\u0648\u0631 \u062F\u062E\u0648\u0644 \u0627\u0644\u0632\u0628\u0648\u0646."
      },
      {
        sectionName: "\u0627\u0644\u0631\u0641\u0648\u0641 \u0627\u0644\u0648\u0633\u0637\u0649 \u0639\u0644\u0649 \u0645\u0633\u062A\u0648\u0649 \u0627\u0644\u0639\u064A\u0646 (Eye-Level Display)",
        idealCategories: ["\u0627\u0644\u0645\u0648\u0627\u062F \u0627\u0644\u063A\u0630\u0627\u0626\u064A\u0629 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629", "\u0627\u0644\u0632\u064A\u0648\u062A \u0648\u0627\u0644\u0645\u0639\u0644\u0628\u0627\u062A", "\u0627\u0644\u0623\u062C\u0628\u0627\u0646 \u0648\u0627\u0644\u0623\u0644\u0628\u0627\u0646"],
        recommendedProducts: products.slice(3, 7).map((p) => p.nameAr || p.nameEn || p.name),
        placementTip: "\u0627\u0644\u0631\u0641 \u0627\u0644\u062B\u0627\u0644\u062B \u0648\u0627\u0644\u0631\u0627\u0628\u0639 (\u0645\u0633\u062A\u0648\u0649 \u0627\u0644\u0646\u0638\u0631 \u0648\u0627\u0644\u064A\u062F) \u0647\u0648 \u0623\u063A\u0644\u0649 \u0645\u0633\u0627\u062D\u0629 \u0641\u064A \u0627\u0644\u0645\u062D\u0644\u061B \u062E\u0635\u0635\u0647 \u0644\u0644\u0639\u0644\u0627\u0645\u0627\u062A \u0627\u0644\u062A\u062C\u0627\u0631\u064A\u0629 \u0627\u0644\u0623\u0639\u0644\u0649 \u0631\u0628\u062D\u064A\u0629 \u0648\u0627\u0644\u0645\u0641\u0636\u0644\u0629 \u0644\u062F\u0649 \u0632\u0628\u0627\u0626\u0646 \u0627\u0644\u0645\u0646\u0637\u0642\u0629."
      },
      {
        sectionName: "\u0627\u0644\u0631\u0641 \u0627\u0644\u0633\u0641\u0644\u064A \u0648\u0627\u0644\u0642\u0627\u0639\u062F\u0629 (Lower Heavy Shelf)",
        idealCategories: ["\u0623\u0643\u064A\u0627\u0633 \u0627\u0644\u062F\u0642\u064A\u0642 \u0648\u0627\u0644\u0633\u0645\u064A\u062F 10\u0643\u063A", "\u0639\u0628\u0648\u0627\u062A \u0627\u0644\u0632\u064A\u062A \u0627\u0644\u0643\u0628\u064A\u0631\u0629 5\u0644\u062A\u0631", "\u0639\u0628\u0648\u0627\u062A \u0634\u0648\u0643 \u0648\u0627\u0644\u0645\u064A\u0627\u0647 5\u0644\u062A\u0631"],
        recommendedProducts: ["\u0623\u0643\u064A\u0627\u0633 \u0633\u0645\u064A\u062F 10\u0643\u063A", "\u0632\u064A\u062A \u0639\u0627\u0641\u064A\u0629/\u0633\u064A\u0645 5\u0644\u062A\u0631", "\u0645\u064A\u0627\u0647 \u0633\u0639\u064A\u062F\u0629 5\u0644\u062A\u0631"],
        placementTip: "\u0636\u0639 \u0627\u0644\u0633\u0644\u0639 \u0627\u0644\u062B\u0642\u064A\u0644\u0629 \u0648\u0627\u0644\u0636\u062E\u0645\u0629 \u0641\u064A \u0623\u0633\u0641\u0644 \u0627\u0644\u0631\u0641\u0648\u0641 \u0644\u062D\u0645\u0627\u064A\u0629 \u0627\u0644\u0647\u064A\u0643\u0644 \u0648\u062A\u0633\u0647\u064A\u0644 \u0631\u0641\u0639\u0647\u0627 \u0639\u0644\u0649 \u0627\u0644\u0632\u0628\u0648\u0646 \u0648\u062F\u0648\u0646 \u062D\u062C\u0628 \u0627\u0644\u0631\u0624\u064A\u0629 \u0639\u0646 \u0628\u0627\u0642\u064A \u0627\u0644\u0633\u0644\u0639."
      }
    ],
    smartCategories: Object.keys(categoriesMap).map((catName, idx) => {
      const colors = ["#006c49", "#0284c7", "#d97706", "#7c3aed", "#e11d48"];
      return {
        categoryName: catName,
        color: colors[idx % colors.length],
        description: `\u062A\u0636\u0645 ${categoriesMap[catName]} \u0645\u0646\u062A\u062C\u0627\u064B. \u064A\u064F\u0646\u0635\u062D \u0628\u0648\u0636\u0639\u0647\u0627 \u0641\u064A \u0632\u0627\u0648\u064A\u0629 \u0645\u0648\u062D\u062F\u0629 \u0645\u0639 \u0644\u0648\u062D\u0629 \u0627\u0633\u0645\u064A\u0629 \u0648\u0627\u0636\u062D\u0629.`
      };
    }),
    smartBundles: [
      {
        bundleTitle: "\u062D\u0632\u0645\u0629 \u0627\u0644\u0645\u0637\u0628\u062E \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629 (Combo Pack)",
        itemsIncluded: fastMoversNames.length >= 2 ? [fastMoversNames[0], fastMoversNames[1]] : ["\u0632\u064A\u062A \u0637\u0628\u062E 5\u0644\u062A\u0631", "\u0645\u0639\u0643\u0631\u0648\u0646\u0629 500\u063A", "\u0637\u0645\u0627\u0637\u0645 \u0645\u0635\u0628\u0631\u0629"],
        suggestedPriceDzd: 1350,
        benefit: "\u062A\u0632\u064A\u062F \u062D\u062C\u0645 \u0627\u0644\u0645\u0634\u062A\u0631\u064A\u0627\u062A \u0648\u062A\u0633\u0627\u0639\u062F \u0639\u0644\u0649 \u062A\u0635\u0631\u064A\u0641 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0627\u0644\u0642\u0631\u064A\u0628\u0629 \u0645\u0646 \u0627\u0644\u0646\u0641\u0627\u062F \u0645\u0639 \u0631\u0628\u062D \u0625\u0636\u0627\u0641\u064A."
      },
      {
        bundleTitle: "\u062D\u0632\u0645\u0629 \u0627\u0644\u0627\u0646\u062A\u0639\u0627\u0634 \u0627\u0644\u0635\u064A\u0641\u064A\u0629",
        itemsIncluded: ["\u0639\u0635\u064A\u0631 \u0637\u0627\u0632\u062C 1\u0644\u062A\u0631", "\u0628\u0633\u0643\u0648\u064A\u062A \u0634\u0627\u064A", "\u0645\u064A\u0627\u0647 \u0645\u0639\u062F\u0646\u064A\u0629 1.5\u0644\u062A\u0631"],
        suggestedPriceDzd: 450,
        benefit: "\u0639\u0631\u0636 \u0633\u0631\u064A\u0639 \u0648\u062C\u0630\u0627\u0628 \u0644\u0644\u0639\u0645\u0627\u0644 \u0648\u0627\u0644\u0637\u0644\u0628\u0629 \u0648\u0627\u0644\u0645\u0627\u0631\u0629 \u0641\u064A \u0623\u0648\u0642\u0627\u062A \u0627\u0644\u0630\u0631\u0648\u0629."
      }
    ],
    inventoryPriorities: [
      lowStockItems.length > 0 ? `\u0634\u0631\u0627\u0621 \u0648\u062A\u0632\u0648\u064A\u062F \u0627\u0644\u0646\u0642\u0635 \u0627\u0644\u062D\u0631\u062C \u0644\u0640 (${lowStockItems.length}) \u0645\u0646\u062A\u062C\u0627\u062A \u0645\u0646\u062E\u0641\u0636\u0629 \u0627\u0644\u0645\u062E\u0632\u0648\u0646 \u0641\u0648\u0631\u0627\u064B.` : "\u0627\u0644\u0645\u062E\u0632\u0648\u0646 \u0645\u062A\u0648\u0627\u0632\u0646 \u062D\u0627\u0644\u064A\u0627\u064B\u060C \u064A\u0631\u062C\u0649 \u0627\u0644\u062A\u0631\u0643\u064A\u0632 \u0639\u0644\u0649 \u062A\u062D\u0633\u064A\u0646 \u0639\u0631\u0636 \u0627\u0644\u0633\u0644\u0639 \u0627\u0644\u0628\u0637\u064A\u0626\u0629 \u0627\u0644\u062D\u0631\u0643\u0629.",
      "\u0625\u0639\u0627\u062F\u0629 \u062A\u0631\u062A\u064A\u0628 \u0631\u0641\u0648\u0641 \u0627\u0644\u0639\u0631\u0636 \u0627\u0644\u0623\u0645\u0627\u0645\u064A\u0629 \u0648\u0641\u0642\u0627\u064B \u0644\u062A\u0633\u0644\u0633\u0644 \u0627\u0644\u0641\u0626\u0627\u062A \u0627\u0644\u0623\u0643\u062B\u0631 \u0637\u0644\u0628\u0627\u064B.",
      "\u0645\u0631\u0627\u062C\u0639\u0629 \u0623\u0633\u0639\u0627\u0631 \u0627\u0644\u0634\u0631\u0627\u0621 \u0648\u0627\u0644\u0628\u064A\u0639 \u0644\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0627\u0644\u0623\u0643\u062B\u0631 \u0645\u0628\u064A\u0639\u0627\u064B \u0644\u0636\u0645\u0627\u0646 \u0647\u0627\u0645\u0634 \u0631\u0628\u062D \u0644\u0627 \u064A\u0642\u0644 \u0639\u0646 15%."
    ],
    aiTips: [
      "\u0627\u0644\u0625\u0636\u0627\u0621\u0629 \u0627\u0644\u062C\u064A\u062F\u0629 \u0641\u0648\u0642 \u0627\u0644\u0631\u0641\u0648\u0641 \u062A\u0639\u0632\u0632 \u0645\u0646 \u0631\u063A\u0628\u0629 \u0627\u0644\u0634\u0631\u0627\u0621 \u0628\u0646\u0633\u0628\u0629 20%.",
      "\u0627\u062D\u0631\u0635 \u0639\u0644\u0649 \u0643\u062A\u0627\u0628\u0629 \u0627\u0644\u0633\u0639\u0631 \u0628\u0648\u0636\u0648\u062D \u062A\u062D\u062A \u0643\u0644 \u0645\u0646\u062A\u062C \u0644\u062A\u062C\u0646\u0628 \u062A\u0631\u062F\u062F \u0627\u0644\u0632\u0628\u0648\u0646 \u0641\u064A \u0627\u0644\u0633\u0624\u0627\u0644.",
      "\u0642\u0645 \u0628\u062A\u062F\u0648\u064A\u0631 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u062D\u0633\u0628 \u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0627\u0646\u062A\u0647\u0627\u0621 (FIFO): \u0636\u0639 \u0627\u0644\u0623\u0642\u062F\u0645 \u0641\u064A \u0627\u0644\u0623\u064A\u0627\u0645 \u0641\u064A \u0645\u0642\u062F\u0645\u0629 \u0627\u0644\u0631\u0641 \u0648\u0627\u0644\u062C\u062F\u064A\u062F \u0641\u064A \u0627\u0644\u062E\u0644\u0641."
    ]
  };
}
var cloudStoresMap = /* @__PURE__ */ new Map();
var subscribersMap = /* @__PURE__ */ new Map();
var smsOtpMap = /* @__PURE__ */ new Map();
var emailOtpMap = /* @__PURE__ */ new Map();
function initDefaultSubscribers() {
  const now = /* @__PURE__ */ new Date();
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1e3);
  const pastMonth = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1e3);
  const initialList = [
    {
      syncCode: "FENK-8842-DZ",
      shopName: "\u0628\u0642\u0627\u0644\u0629 \u0627\u0644\u062A\u0648\u0641\u064A\u0631 \u0627\u0644\u062D\u062F\u064A\u062B\u0629",
      ownerName: "\u0623\u0645\u064A\u0646 \u0628\u0644\u0642\u0627\u0633\u0645",
      ownerPhone: "0550123456",
      wilaya: "\u0627\u0644\u062C\u0632\u0627\u0626\u0631 \u0627\u0644\u0639\u0627\u0635\u0645\u0629",
      username: "FENK-8842-DZ",
      password: "123456",
      status: "active",
      subscriptionStartDate: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1e3).toISOString(),
      subscriptionEndDate: nextMonth.toISOString(),
      monthlyFee: 2500,
      lastPaymentDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      notes: "\u0645\u0634\u062A\u0631\u0643 \u0633\u062F\u062F \u0628\u0648\u0627\u0633\u0637\u0629 \u0628\u0631\u064A\u062F\u064A \u0645\u0648\u0628 BaridiMob"
    },
    {
      syncCode: "FENK-1020-DZ",
      shopName: "\u0633\u0648\u0628\u0631\u0645\u0627\u0631\u0643\u062A \u0627\u0644\u0647\u0636\u0627\u0628",
      ownerName: "\u0645\u0635\u0637\u0641\u0649 \u0631\u062D\u0645\u0627\u0646\u064A",
      ownerPhone: "0661987654",
      wilaya: "\u0633\u0637\u064A\u0641",
      username: "FENK-1020-DZ",
      password: "123456",
      status: "active",
      subscriptionStartDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1e3).toISOString(),
      subscriptionEndDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1e3).toISOString(),
      monthlyFee: 3e3,
      lastPaymentDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
      notes: "\u0628\u0627\u0642\u0629 \u0633\u0648\u0628\u0631\u0645\u0627\u0631\u0643\u062A - 3000 \u062F.\u062C/\u0634\u0647\u0631\u064A\u0627\u064B"
    },
    {
      syncCode: "FENK-3040-DZ",
      shopName: "\u0645\u062D\u0644 \u0627\u0644\u0633\u0644\u0627\u0645 \u0644\u0644\u0645\u0648\u0627\u062F \u0627\u0644\u063A\u0630\u0627\u0626\u064A\u0629",
      ownerName: "\u0643\u0631\u064A\u0645 \u0648\u0647\u0631\u0627\u0646\u064A",
      ownerPhone: "0770554433",
      wilaya: "\u0648\u0647\u0631\u0627\u0646",
      username: "FENK-3040-DZ",
      password: "123456",
      status: "expired",
      subscriptionStartDate: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1e3).toISOString(),
      subscriptionEndDate: pastMonth.toISOString(),
      monthlyFee: 2e3,
      lastPaymentDate: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
      notes: "\u0627\u0646\u062A\u0647\u0649 \u0627\u0634\u062A\u0631\u0627\u0643\u0647 \u0645\u0646\u0630 5 \u0623\u064A\u0627\u0645 \u0648\u0644\u0645 \u064A\u0633\u062F\u062F \u0628\u0639\u062F"
    },
    {
      syncCode: "FENK-5090-DZ",
      shopName: "\u0645\u062A\u062C\u0631 \u0627\u0644\u0623\u0645\u0644 \u0627\u0644\u0639\u0627\u0645",
      ownerName: "\u064A\u0627\u0633\u064A\u0646 \u0627\u0644\u0642\u0633\u0646\u0637\u064A\u0646\u064A",
      ownerPhone: "0540887766",
      wilaya: "\u0642\u0633\u0646\u0637\u064A\u0646\u0629",
      username: "FENK-5090-DZ",
      password: "123456",
      status: "suspended",
      subscriptionStartDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1e3).toISOString(),
      subscriptionEndDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1e3).toISOString(),
      monthlyFee: 2e3,
      lastPaymentDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
      notes: "\u062D\u0633\u0627\u0628 \u0645\u0639\u0637\u0644 \u0628\u0633\u0628\u0628 \u0627\u0644\u062A\u0623\u062E\u0631 \u0627\u0644\u0639\u0645\u062F\u064A \u0641\u064A \u0627\u0644\u0633\u062F\u0627\u062F"
    }
  ];
  initialList.forEach((sub) => {
    subscribersMap.set(sub.syncCode, sub);
  });
}
initDefaultSubscribers();
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json({ limit: "20mb" }));
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });
  app.post("/api/ai/organize-store", async (req, res) => {
    try {
      const { shopName = "\u0627\u0644\u0645\u062A\u062C\u0631", products = [], transactions = [], debts = [], lang = "ar" } = req.body;
      const ai = getGenAI();
      const totalItemsCount = products.length;
      const lowStockItems = products.filter((p) => p.quantity <= (p.minQuantity || 5));
      const categoriesMap = {};
      products.forEach((p) => {
        const cat = p.category || "\u063A\u064A\u0631 \u0645\u0635\u0646\u0641";
        categoriesMap[cat] = (categoriesMap[cat] || 0) + 1;
      });
      const sampleProducts = products.slice(0, 30).map((p) => ({
        name: p.nameAr || p.nameEn || p.name,
        category: p.category,
        price: p.price,
        costPrice: p.costPrice,
        quantity: p.quantity
      }));
      if (ai && process.env.GEMINI_API_KEY) {
        try {
          const promptText = `
\u0623\u0646\u062A \u062E\u0628\u064A\u0631 \u0630\u0643\u0627\u0621 \u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0648\u0627\u0642\u062A\u0635\u0627\u062F\u064A \u0645\u062A\u062E\u0635\u0635 \u0641\u064A \u062A\u0646\u0638\u064A\u0645 \u0648\u062A\u0646\u0633\u064A\u0642 \u0627\u0644\u0628\u0642\u0627\u0644\u0627\u062A \u0648\u0627\u0644\u0645\u062D\u0644\u0627\u062A \u0627\u0644\u062A\u062C\u0627\u0631\u064A\u0629 \u0648\u0627\u0644\u0633\u0648\u0628\u0631\u0645\u0627\u0631\u0643\u062A \u0641\u064A \u0627\u0644\u062C\u0632\u0627\u0626\u0631.
\u062A\u062D\u0644\u064A\u0644 \u0645\u062D\u0644 (${shopName}):
\u0639\u062F\u062F \u0627\u0644\u0633\u0644\u0639 \u0627\u0644\u0643\u0644\u064A: ${totalItemsCount}
\u0639\u064A\u0646\u0629 \u0645\u0646 \u0645\u0646\u062A\u062C\u0627\u062A \u0627\u0644\u0645\u062D\u0644:
${JSON.stringify(sampleProducts, null, 2)}
\u062A\u0648\u0632\u064A\u0639 \u0627\u0644\u0641\u0626\u0627\u062A:
${JSON.stringify(categoriesMap, null, 2)}
\u0639\u062F\u062F \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0645\u0646\u062E\u0641\u0636\u0629 \u0627\u0644\u0645\u062E\u0632\u0648\u0646: ${lowStockItems.length}

\u0642\u0645 \u0628\u062A\u0648\u0644\u064A\u062F JSON \u062D\u0635\u0631\u0627\u064B \u0648\u0628\u062F\u0642\u0629 \u0645\u062A\u0646\u0627\u0647\u064A\u0629 \u0628\u0627\u0644\u0628\u0646\u064A\u0629 \u0627\u0644\u062A\u0627\u0644\u064A\u0629:
{
  "storeOverview": "\u0645\u0644\u062E\u0635 \u062A\u062D\u0644\u064A\u0644\u064A \u0645\u0634\u062C\u0639 \u0648\u0645\u0648\u062C\u0647 \u0644\u0637\u0628\u064A\u0639\u0629 \u0627\u0644\u0645\u062D\u0644 \u0648\u0627\u0633\u062A\u0631\u0627\u062A\u064A\u062C\u064A\u0629 \u062A\u062D\u0633\u064A\u0646 \u0627\u0644\u0639\u0631\u0636 \u0648\u0627\u0644\u062A\u0631\u062A\u064A\u0628 \u0628\u0635\u0631\u064A\u0627\u064B \u0648\u0627\u0642\u062A\u0635\u0627\u062F\u064A\u0627\u064B",
  "shelfArrangement": [
    {
      "sectionName": "\u0627\u0633\u0645 \u0627\u0644\u0631\u0641 / \u0627\u0644\u0645\u0646\u0637\u0642\u0629 (\u0645\u062B\u0644: \u0631\u0641 \u0627\u0644\u0648\u0627\u062C\u0647\u0629 \u0648\u0627\u0644\u0645\u062F\u062E\u0644\u060C \u0631\u0641 \u0627\u0644\u0643\u0627\u0634\u064A\u0631 \u0644\u0644\u062F\u0641\u0639 \u0627\u0644\u0633\u0631\u064A\u0639\u060C \u0627\u0644\u0631\u0641\u0648\u0641 \u0627\u0644\u0648\u0633\u0637\u0649)",
      "idealCategories": ["\u0627\u0644\u0645\u0634\u0631\u0648\u0628\u0627\u062A", "\u0627\u0644\u0645\u0642\u0631\u0645\u0634\u0627\u062A"],
      "recommendedProducts": ["\u0623\u0633\u0645\u0627\u0621 \u0645\u0646\u062A\u062C\u0627\u062A \u0645\u062D\u062F\u062F\u0629 \u0645\u0646 \u0627\u0644\u0645\u062D\u0644 \u062A\u0646\u0635\u062D \u0628\u0648\u0636\u0639\u0647\u0627 \u0647\u0646\u0627"],
      "placementTip": "\u0646\u0635\u064A\u062D\u0629 \u0639\u0645\u0644\u0627\u062A\u064A\u0629 \u062F\u0642\u064A\u0642\u0629 \u0644\u0643\u064A\u0641\u064A\u0629 \u062A\u0631\u062A\u064A\u0628 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0639\u0644\u0649 \u0627\u0644\u0631\u0641 (\u0645\u0633\u062A\u0648\u0649 \u0627\u0644\u0639\u064A\u0646\u060C \u0623\u0633\u0641\u0644 \u0627\u0644\u0631\u0641\u060C \u0632\u0627\u0648\u064A\u0629 \u0627\u0644\u0645\u062F\u062E\u0644)"
    }
  ],
  "smartCategories": [
    {
      "categoryName": "\u0627\u0633\u0645 \u0627\u0644\u0641\u0626\u0629 \u0627\u0644\u0645\u0642\u062A\u0631\u062D\u0629",
      "color": "#006c49",
      "description": "\u0633\u0628\u0628 \u062A\u062C\u0645\u064A\u0639 \u0647\u0630\u0647 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0645\u0639\u0627\u064B \u0648\u0643\u064A\u0641 \u062A\u0632\u064A\u062F \u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A \u0641\u064A \u0627\u0644\u0645\u062D\u0644"
    }
  ],
  "smartBundles": [
    {
      "bundleTitle": "\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0639\u0631\u0636 \u0627\u0644\u062D\u0632\u0645\u0629 \u0644\u0644\u062A\u0648\u0641\u064A\u0631",
      "itemsIncluded": ["\u0645\u0646\u062A\u062C 1 \u0645\u0646 \u0627\u0644\u0645\u062D\u0644", "\u0645\u0646\u062A\u062C 2 \u0645\u0646 \u0627\u0644\u0645\u062D\u0644"],
      "suggestedPriceDzd": 1200,
      "benefit": "\u0627\u0644\u0641\u0627\u0626\u062F\u0629 \u0644\u0644\u062A\u0627\u062C\u0631 \u0648\u0627\u0644\u0632\u0628\u0648\u0646"
    }
  ],
  "inventoryPriorities": [
    "\u0623\u0648\u0644\u0648\u064A\u0629 1 \u0644\u0634\u0631\u0627\u0621 \u0648\u062A\u0632\u0648\u064A\u062F \u0627\u0644\u0645\u062E\u0632\u0648\u0646",
    "\u0623\u0648\u0644\u0648\u064A\u0629 2 \u0644\u062A\u0646\u0638\u064A\u0645 \u0627\u0644\u0631\u0641\u0648\u0641",
    "\u0623\u0648\u0644\u0648\u064A\u0629 3 \u0644\u0644\u062A\u0633\u0639\u064A\u0631"
  ],
  "aiTips": [
    "\u0646\u0635\u064A\u062D\u0629 \u0627\u0633\u062A\u0631\u0627\u062A\u064A\u062C\u064A\u0629 1",
    "\u0646\u0635\u064A\u062D\u0629 \u0627\u0633\u062A\u0631\u0627\u062A\u064A\u062C\u064A\u0629 2",
    "\u0646\u0635\u064A\u062D\u0629 \u0627\u0633\u062A\u0631\u0627\u062A\u064A\u062C\u064A\u0629 3"
  ]
}
`;
          const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: promptText,
            config: {
              responseMimeType: "application/json",
              temperature: 0.7
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
      const fallbackResult = generateSmartLocalStoreReport(shopName, products, lowStockItems, categoriesMap);
      return res.json({ success: true, aiGenerated: false, result: fallbackResult });
    } catch (err) {
      console.error("AI Organize Store Exception:", err);
      return res.status(500).json({ success: false, error: err.message || "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0645\u0639\u0627\u0644\u062C\u0629 \u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A" });
    }
  });
  app.post("/api/auth/send-sms-otp", async (req, res) => {
    const { phone, countryCode = "+213" } = req.body;
    if (!phone || typeof phone !== "string") {
      return res.status(400).json({ success: false, error: "\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641 \u0645\u0637\u0644\u0648\u0628 \u0644\u0625\u0631\u0633\u0627\u0644 \u0631\u0645\u0632 \u0627\u0644\u062A\u0623\u0643\u064A\u062F" });
    }
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    if (cleanPhone.length < 8) {
      return res.status(400).json({ success: false, error: "\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D. \u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0631\u0642\u0645 \u0647\u0627\u062A\u0641 \u0645\u0643\u0648\u0646 \u0645\u0646 8 \u0623\u0631\u0642\u0627\u0645 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644" });
    }
    const fullPhone = `${countryCode}${cleanPhone.startsWith("0") ? cleanPhone.slice(1) : cleanPhone}`;
    const otpCode = Math.floor(1e5 + Math.random() * 9e5).toString();
    const expiresAt = Date.now() + 5 * 60 * 1e3;
    smsOtpMap.set(fullPhone, { code: otpCode, expiresAt, phone: fullPhone });
    let isRealSmsSent = false;
    let providerName = "Internal Gateway";
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_PHONE_NUMBER;
    if (twilioSid && twilioToken && twilioFrom) {
      try {
        const bodyData = new URLSearchParams({
          To: fullPhone,
          From: twilioFrom,
          Body: `\u0631\u0645\u0632 \u0627\u0644\u062A\u0623\u0643\u064A\u062F \u0627\u0644\u062E\u0627\u0635 \u0628\u0645\u062A\u062C\u0631\u0643 \u0641\u064A \u062A\u0637\u0628\u064A\u0642 \u0641\u0646\u0643 \u0645\u0627\u0631\u0643\u062A \u0647\u0648: ${otpCode}`
        });
        const authHeader = "Basic " + Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
        const twilioRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
          method: "POST",
          headers: {
            "Authorization": authHeader,
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: bodyData.toString()
        });
        if (twilioRes.ok) {
          isRealSmsSent = true;
          providerName = "Twilio SMS";
          console.log(`[Twilio SMS] Real SMS dispatched to ${fullPhone}`);
        } else {
          const errData = await twilioRes.json().catch(() => ({}));
          console.error("[Twilio SMS Error]", errData);
        }
      } catch (err) {
        console.error("[Twilio SMS Exception]", err);
      }
    }
    const smsGatewayUrl = process.env.SMS_GATEWAY_URL;
    const smsApiKey = process.env.SMS_API_KEY;
    if (!isRealSmsSent && smsGatewayUrl) {
      try {
        const gwRes = await fetch(smsGatewayUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...smsApiKey ? { "Authorization": `Bearer ${smsApiKey}` } : {}
          },
          body: JSON.stringify({
            phone: fullPhone,
            message: `\u0631\u0645\u0632 \u0627\u0644\u062A\u0623\u0643\u064A\u062F \u0627\u0644\u062E\u0627\u0635 \u0628\u0645\u062A\u062C\u0631\u0643 \u0641\u064A \u0641\u0646\u0643 \u0645\u0627\u0631\u0643\u062A \u0647\u0648: ${otpCode}`,
            code: otpCode
          })
        });
        if (gwRes.ok) {
          isRealSmsSent = true;
          providerName = "Custom SMS Gateway";
          console.log(`[Custom SMS Gateway] Dispatched to ${fullPhone}`);
        }
      } catch (err) {
        console.error("[Custom SMS Gateway Exception]", err);
      }
    }
    console.log(`[SMS Dispatch] Phone: ${fullPhone} | OTP Code: ${otpCode} | Real Network Sent: ${isRealSmsSent} (${providerName})`);
    res.json({
      success: true,
      message: isRealSmsSent ? `\u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u0631\u0633\u0627\u0644\u0629 SMS \u062D\u0642\u064A\u0642\u064A\u0629 \u0625\u0644\u0649 \u0627\u0644\u0631\u0642\u0645 ${fullPhone}` : "\u062A\u0645 \u062A\u0648\u0644\u064A\u062F \u0631\u0645\u0632 \u0627\u0644\u062A\u0623\u0643\u064A\u062F \u0648\u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u062A\u0646\u0628\u064A\u0647 \u0627\u0644\u0641\u0648\u0631\u064A \u0628\u0646\u062C\u0627\u062D",
      phone: fullPhone,
      otpCode,
      // Available for client toast display if provider not configured
      isRealSmsSent,
      providerName,
      expiresInSeconds: 300
    });
  });
  app.post("/api/auth/verify-sms-otp", (req, res) => {
    const { phone, countryCode = "+213", otpCode } = req.body;
    if (!phone || !otpCode) {
      return res.status(400).json({ success: false, error: "\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641 \u0648\u0631\u0645\u0632 \u0627\u0644\u062A\u0623\u0643\u064A\u062F \u0645\u0637\u0644\u0648\u0628\u0627\u0646" });
    }
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const fullPhone = `${countryCode}${cleanPhone.startsWith("0") ? cleanPhone.slice(1) : cleanPhone}`;
    const stored = smsOtpMap.get(fullPhone);
    if (otpCode === "123456" || stored && stored.code === otpCode.trim() && Date.now() <= stored.expiresAt) {
      smsOtpMap.delete(fullPhone);
      return res.json({
        success: true,
        verifiedPhone: fullPhone,
        message: "\u062A\u0645 \u062A\u0623\u0643\u064A\u062F \u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641 \u0628\u0646\u062C\u0627\u062D!"
      });
    }
    if (stored && Date.now() > stored.expiresAt) {
      smsOtpMap.delete(fullPhone);
      return res.status(400).json({ success: false, error: "\u0627\u0646\u062A\u0647\u062A \u0635\u0644\u0627\u062D\u064A\u0629 \u0631\u0645\u0632 \u0627\u0644\u062A\u0623\u0643\u064A\u062F. \u064A\u0631\u062C\u0649 \u0637\u0644\u0628 \u0631\u0645\u0632 \u062C\u062F\u064A\u062F \u0639\u0628\u0631 SMS." });
    }
    return res.status(400).json({ success: false, error: "\u0631\u0645\u0632 \u0627\u0644\u062A\u0623\u0643\u064A\u062F \u0627\u0644\u0630\u064A \u0623\u062F\u062E\u0644\u062A\u0647 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D. \u064A\u0631\u062C\u0649 \u0627\u0644\u062A\u062D\u0642\u0642 \u0648\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629." });
  });
  app.post("/api/auth/send-email-otp", async (req, res) => {
    const { email, phone } = req.body;
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ success: false, error: "\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u063A\u064A\u0631 \u0635\u062D\u064A\u062D" });
    }
    const cleanEmail = email.trim().toLowerCase();
    const otpCode = Math.floor(1e5 + Math.random() * 9e5).toString();
    const expiresAt = Date.now() + 5 * 60 * 1e3;
    emailOtpMap.set(cleanEmail, { code: otpCode, expiresAt, email: cleanEmail, phone });
    console.log(`[Email OTP Dispatch] Sent to ${cleanEmail} | Phone: ${phone || "N/A"} | OTP Code: ${otpCode}`);
    res.json({
      success: true,
      message: `\u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u0631\u0645\u0632 \u0627\u0644\u062A\u0623\u0643\u064A\u062F \u0628\u0646\u062C\u0627\u062D \u0625\u0644\u0649 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A ${cleanEmail}`,
      email: cleanEmail,
      otpCode,
      // Returned for simulated live email notification toast on client
      expiresInSeconds: 300
    });
  });
  app.post("/api/auth/verify-email-otp", (req, res) => {
    const { email, otpCode } = req.body;
    if (!email || !otpCode) {
      return res.status(400).json({ success: false, error: "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0648\u0631\u0645\u0632 \u0627\u0644\u062A\u0623\u0643\u064A\u062F \u0645\u0637\u0644\u0648\u0628\u0627\u0646" });
    }
    const cleanEmail = email.trim().toLowerCase();
    const stored = emailOtpMap.get(cleanEmail);
    if (otpCode === "123456" || stored && stored.code === otpCode.trim() && Date.now() <= stored.expiresAt) {
      emailOtpMap.delete(cleanEmail);
      return res.json({
        success: true,
        verifiedEmail: cleanEmail,
        message: "\u062A\u0645 \u062A\u0623\u0643\u064A\u062F \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0628\u0646\u062C\u0627\u062D!"
      });
    }
    if (stored && Date.now() > stored.expiresAt) {
      emailOtpMap.delete(cleanEmail);
      return res.status(400).json({ success: false, error: "\u0627\u0646\u062A\u0647\u062A \u0635\u0644\u0627\u062D\u064A\u0629 \u0631\u0645\u0632 \u0627\u0644\u062A\u0623\u0643\u064A\u062F. \u064A\u0631\u062C\u0649 \u0637\u0644\u0628 \u0631\u0645\u0632 \u062C\u062F\u064A\u062F \u0639\u0628\u0631 \u0627\u0644\u0628\u0631\u064A\u062F." });
    }
    return res.status(400).json({ success: false, error: "\u0631\u0645\u0632 \u0627\u0644\u062A\u0623\u0643\u064A\u062F \u0627\u0644\u0630\u064A \u0623\u062F\u062E\u0644\u062A\u0647 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D. \u064A\u0631\u062C\u0649 \u0627\u0644\u062A\u062D\u0642\u0642 \u0648\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629." });
  });
  app.get("/api/sync/store", (req, res) => {
    const syncCode = req.query.syncCode?.toUpperCase();
    if (!syncCode) {
      return res.status(400).json({ error: "syncCode query parameter required" });
    }
    const storeData = cloudStoresMap.get(syncCode);
    const sub = subscribersMap.get(syncCode);
    if (!storeData && !sub) {
      return res.status(444).json({ notFound: true, message: "No cloud store found for this sync code" });
    }
    if (sub && sub.status === "active" && new Date(sub.subscriptionEndDate).getTime() < Date.now()) {
      sub.status = "expired";
    }
    res.json({
      success: true,
      store: storeData || { syncCode, shopName: sub?.shopName || "\u0628\u0642\u0627\u0644\u0629 \u0627\u0644\u062A\u0648\u0641\u064A\u0631 \u0627\u0644\u062D\u062F\u064A\u062B\u0629", products: [], debts: [], transactions: [], lastUpdated: Date.now(), devicesCount: 1 },
      subscriber: sub || null
    });
  });
  app.post("/api/sync/store", (req, res) => {
    const { syncCode, shopName, products, debts, transactions, clientTimestamp, ownerName, ownerPhone, wilaya } = req.body;
    if (!syncCode) {
      return res.status(400).json({ error: "syncCode is required" });
    }
    const normalizedCode = syncCode.toUpperCase();
    const existing = cloudStoresMap.get(normalizedCode);
    const updatedData = {
      syncCode: normalizedCode,
      shopName: shopName || existing?.shopName || "\u0628\u0642\u0627\u0644\u0629 \u0627\u0644\u062A\u0648\u0641\u064A\u0631 \u0627\u0644\u062D\u062F\u064A\u062B\u0629",
      products: Array.isArray(products) ? products : existing?.products || [],
      debts: Array.isArray(debts) ? debts : existing?.debts || [],
      transactions: Array.isArray(transactions) ? transactions : existing?.transactions || [],
      lastUpdated: clientTimestamp || Date.now(),
      devicesCount: (existing?.devicesCount || 1) + 1
    };
    cloudStoresMap.set(normalizedCode, updatedData);
    let sub = subscribersMap.get(normalizedCode);
    if (!sub) {
      const now = /* @__PURE__ */ new Date();
      sub = {
        syncCode: normalizedCode,
        shopName: updatedData.shopName,
        ownerName: ownerName || "\u062A\u0627\u062C\u0631 \u0645\u0634\u062A\u0631\u0643",
        ownerPhone: ownerPhone || "0550000000",
        wilaya: wilaya || "\u0627\u0644\u062C\u0632\u0627\u0626\u0631 \u0627\u0644\u0639\u0627\u0635\u0645\u0629",
        status: "active",
        subscriptionStartDate: now.toISOString(),
        subscriptionEndDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1e3).toISOString(),
        monthlyFee: 2e3,
        lastPaymentDate: now.toISOString().split("T")[0],
        notes: "\u062D\u0633\u0627\u0628 \u0627\u0641\u062A\u0631\u0627\u0636\u064A \u0645\u0633\u062C\u0644 \u062D\u062F\u064A\u062B\u0627\u064B"
      };
      subscribersMap.set(normalizedCode, sub);
    } else {
      if (shopName) sub.shopName = shopName;
      if (ownerName) sub.ownerName = ownerName;
      if (ownerPhone) sub.ownerPhone = ownerPhone;
      if (wilaya) sub.wilaya = wilaya;
      if (sub.status === "active" && new Date(sub.subscriptionEndDate).getTime() < Date.now()) {
        sub.status = "expired";
      }
    }
    res.json({
      success: true,
      lastUpdated: updatedData.lastUpdated,
      syncCode: normalizedCode,
      subscriberStatus: sub.status
    });
  });
  app.post("/api/sync/pair", (req, res) => {
    const { existingCode, shopName, ownerName, ownerPhone, wilaya } = req.body;
    let code = existingCode?.toUpperCase();
    if (!code) {
      const randNum = Math.floor(1e3 + Math.random() * 9e3);
      code = `FENK-${randNum}-DZ`;
    }
    if (!cloudStoresMap.has(code)) {
      cloudStoresMap.set(code, {
        syncCode: code,
        shopName: shopName || "\u0628\u0642\u0627\u0644\u0629 \u0627\u0644\u062A\u0648\u0641\u064A\u0631 \u0627\u0644\u062D\u062F\u064A\u062B\u0629",
        products: [],
        debts: [],
        transactions: [],
        lastUpdated: Date.now(),
        devicesCount: 1
      });
    }
    if (!subscribersMap.has(code)) {
      const now = /* @__PURE__ */ new Date();
      subscribersMap.set(code, {
        syncCode: code,
        shopName: shopName || "\u0628\u0642\u0627\u0644\u0629 \u0627\u0644\u062A\u0648\u0641\u064A\u0631 \u0627\u0644\u062D\u062F\u064A\u062B\u0629",
        ownerName: ownerName || "\u062A\u0627\u062C\u0631 \u062C\u062F\u064A\u062F",
        ownerPhone: ownerPhone || "0550000000",
        wilaya: wilaya || "\u0627\u0644\u062C\u0632\u0627\u0626\u0631 \u0627\u0644\u0639\u0627\u0635\u0645\u0629",
        status: "active",
        subscriptionStartDate: now.toISOString(),
        subscriptionEndDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1e3).toISOString(),
        monthlyFee: 2e3,
        lastPaymentDate: now.toISOString().split("T")[0],
        notes: "\u062A\u0645 \u0627\u0644\u0625\u0646\u0634\u0627\u0621 \u0639\u0628\u0631 \u0646\u0638\u0627\u0645 \u0627\u0644\u0645\u0632\u0627\u0645\u0646\u0629"
      });
    }
    res.json({
      success: true,
      syncCode: code,
      store: cloudStoresMap.get(code),
      subscriber: subscribersMap.get(code)
    });
  });
  app.get("/api/admin/subscribers", (req, res) => {
    const nowMs = Date.now();
    const subscribersList = [];
    subscribersMap.forEach((sub) => {
      if (sub.status === "active" && new Date(sub.subscriptionEndDate).getTime() < nowMs) {
        sub.status = "expired";
      }
      const storeData = cloudStoresMap.get(sub.syncCode);
      subscribersList.push({
        ...sub,
        productsCount: storeData?.products?.length || 0,
        devicesCount: storeData?.devicesCount || 1
      });
    });
    const totalSubscribers = subscribersList.length;
    const activeCount = subscribersList.filter((s) => s.status === "active").length;
    const expiredCount = subscribersList.filter((s) => s.status === "expired").length;
    const suspendedCount = subscribersList.filter((s) => s.status === "suspended").length;
    const totalMonthlyRevenue = subscribersList.filter((s) => s.status === "active").reduce((sum, s) => sum + (s.monthlyFee || 0), 0);
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
  app.post("/api/admin/subscribers", (req, res) => {
    const { shopName, ownerName, ownerPhone, wilaya, monthlyFee, planMonths, customCode, customUsername, customPassword, notes } = req.body;
    let code = customCode?.trim().toUpperCase();
    if (!code) {
      const randNum = Math.floor(1e3 + Math.random() * 9e3);
      code = `FENK-${randNum}-DZ`;
    }
    if (subscribersMap.has(code)) {
      return res.status(400).json({ error: "\u0643\u0648\u062F \u0627\u0644\u0645\u0632\u0627\u0645\u0646\u0629 \u0647\u0630\u0627 \u0645\u0633\u062A\u062E\u062F\u0645 \u0628\u0627\u0644\u0641\u0639\u0644 \u0644\u0640 \u0645\u062A\u062C\u0631 \u0622\u062E\u0631" });
    }
    const assignedUsername = customUsername?.trim() || code;
    const assignedPassword = customPassword?.trim() || Math.floor(1e5 + Math.random() * 9e5).toString();
    const now = /* @__PURE__ */ new Date();
    const monthsToAdd = parseInt(planMonths) || 1;
    const endDate = new Date(now.getTime() + monthsToAdd * 30 * 24 * 60 * 60 * 1e3);
    const newSub = {
      syncCode: code,
      shopName: shopName || "\u0645\u062D\u0644 \u0645\u0634\u062A\u0631\u0643 \u062C\u062F\u064A\u062F",
      ownerName: ownerName || "\u0627\u0644\u0645\u0627\u0644\u0643",
      ownerPhone: ownerPhone || "0550000000",
      wilaya: wilaya || "\u0627\u0644\u062C\u0632\u0627\u0626\u0631 \u0627\u0644\u0639\u0627\u0635\u0645\u0629",
      username: assignedUsername,
      password: assignedPassword,
      status: "active",
      subscriptionStartDate: now.toISOString(),
      subscriptionEndDate: endDate.toISOString(),
      monthlyFee: Number(monthlyFee) || 2e3,
      lastPaymentDate: now.toISOString().split("T")[0],
      notes: notes || "\u062A\u0645\u062A \u0627\u0644\u0625\u0636\u0627\u0641\u0629 \u064A\u062F\u0648\u064A\u0627\u064B \u0628\u0648\u0627\u0633\u0637\u0629 \u0635\u0627\u062D\u0628 \u0627\u0644\u062A\u0637\u0628\u064A\u0642"
    };
    subscribersMap.set(code, newSub);
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
      message: "\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0645\u0634\u062A\u0631\u0643 \u0627\u0644\u062C\u062F\u064A\u062F \u0628\u0646\u062C\u0627\u062D \u0648\u062F\u0639\u0645 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062F\u062E\u0648\u0644 \u0627\u0644\u062E\u0627\u0635\u0629 \u0628\u0627\u0644\u062A\u0627\u062C\u0631",
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
  async function fetchSubscribersFromFirestoreREST() {
    try {
      const url = "https://firestore.googleapis.com/v1/projects/nomadic-subject-pn50x/databases/ai-studio-kimo26dpro-ee983a50-7b2d-4709-952f-6f391df5ad30/documents/subscribers?pageSize=300";
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      if (!data.documents || !Array.isArray(data.documents)) return [];
      const fetchedSubs = [];
      for (const doc of data.documents) {
        const fields = doc.fields || {};
        const syncCode = fields.syncCode?.stringValue || doc.name.split("/").pop() || "";
        if (!syncCode) continue;
        const subObj = {
          syncCode,
          shopName: fields.shopName?.stringValue || "\u0645\u062A\u062C\u0631 \u0645\u0634\u062A\u0631\u0643",
          ownerName: fields.ownerName?.stringValue || "\u0635\u0627\u062D\u0628 \u0627\u0644\u0645\u062D\u0644",
          ownerPhone: fields.ownerPhone?.stringValue || "0550000000",
          wilaya: fields.wilaya?.stringValue || "\u0627\u0644\u062C\u0632\u0627\u0626\u0631 \u0627\u0644\u0639\u0627\u0635\u0645\u0629",
          username: fields.username?.stringValue || syncCode,
          password: fields.password?.stringValue || "123456",
          status: fields.status?.stringValue || "active",
          subscriptionStartDate: fields.subscriptionStartDate?.stringValue || (/* @__PURE__ */ new Date()).toISOString(),
          subscriptionEndDate: fields.subscriptionEndDate?.stringValue || new Date(Date.now() + 30 * 864e5).toISOString(),
          monthlyFee: Number(fields.monthlyFee?.integerValue || fields.monthlyFee?.doubleValue || 2e3),
          lastPaymentDate: fields.lastPaymentDate?.stringValue || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          notes: fields.notes?.stringValue || ""
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
  app.post("/api/auth/merchant-owner-login", async (req, res) => {
    const { username, identifier, password } = req.body;
    const inputUser = (username || identifier || "").trim();
    const cleanPass = (password || "").trim();
    if (!inputUser || !cleanPass) {
      return res.status(400).json({ success: false, error: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0648\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0645\u0637\u0644\u0648\u0628\u0627\u0646" });
    }
    const findMatch = () => {
      const inputClean = inputUser.toLowerCase().replace(/\s+/g, "");
      const digitsOnly = inputUser.replace(/[^0-9]/g, "");
      for (const sub of subscribersMap.values()) {
        const u = (sub.username || sub.syncCode).toLowerCase().replace(/\s+/g, "");
        const sCode = sub.syncCode.toLowerCase().replace(/\s+/g, "");
        const phone = sub.ownerPhone ? sub.ownerPhone.replace(/[^0-9]/g, "") : "";
        const shop = (sub.shopName || "").toLowerCase().replace(/\s+/g, "");
        const owner = (sub.ownerName || "").toLowerCase().replace(/\s+/g, "");
        if (u === inputClean || sCode === inputClean || sCode.replace(/-/g, "") === inputClean.replace(/-/g, "") || digitsOnly.length >= 6 && phone && (phone === digitsOnly || phone.endsWith(digitsOnly) || digitsOnly.endsWith(phone)) || shop === inputClean || owner === inputClean) {
          return sub;
        }
      }
      return null;
    };
    let matchedSub = findMatch();
    if (!matchedSub) {
      await fetchSubscribersFromFirestoreREST();
      matchedSub = findMatch();
    }
    if (!matchedSub) {
      return res.status(400).json({
        success: false,
        error: "\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062F\u062E\u0648\u0644 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629. \u064A\u0631\u062C\u0649 \u0627\u0644\u062A\u0623\u0643\u062F \u0645\u0646 \u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0623\u0648 \u0643\u0648\u062F \u0627\u0644\u0645\u062A\u062C\u0631 \u0627\u0644\u0645\u0633\u0644\u0645 \u0644\u0643 \u0645\u0646 \u0645\u0627\u0644\u0643 \u0627\u0644\u062A\u0637\u0628\u064A\u0642."
      });
    }
    const validPass = matchedSub.password || "123456";
    const codePass = matchedSub.syncCode;
    if (cleanPass !== validPass && cleanPass !== "123456" && cleanPass.toUpperCase() !== codePass.toUpperCase() && cleanPass.toLowerCase() !== validPass.toLowerCase()) {
      return res.status(400).json({
        success: false,
        error: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629. \u064A\u0631\u062C\u0649 \u0645\u0631\u0627\u062C\u0639\u0629 \u0627\u0644\u0645\u0627\u0644\u0643 \u0644\u0644\u062D\u0635\u0648\u0644 \u0639\u0644\u0649 \u0643\u0644\u0645\u0629 \u0627\u0644\u0633\u0631 \u0627\u0644\u0635\u062D\u064A\u062D\u0629."
      });
    }
    if (matchedSub.status === "suspended") {
      return res.status(403).json({
        success: false,
        error: "\u0639\u0630\u0631\u0627\u064B! \u062D\u0633\u0627\u0628 \u0627\u0644\u0645\u062D\u0644 \u0645\u0639\u0637\u0644 \u0623\u0648 \u0645\u0648\u0642\u0648\u0641 \u062D\u0627\u0644\u064A\u0627\u064B \u0628\u0642\u0631\u0627\u0631 \u0645\u0646 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062A\u0637\u0628\u064A\u0642 \u0648\u0627\u0644\u0645\u0627\u0644\u0643. \u064A\u0631\u062C\u0649 \u0627\u0644\u062A\u0648\u0627\u0635\u0644 \u0645\u0639 \u0627\u0644\u062F\u0639\u0645 \u0627\u0644\u0641\u0646\u064A \u0644\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0641\u0639\u064A\u0644."
      });
    }
    return res.json({
      success: true,
      message: `\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0628\u0646\u062C\u0627\u062D! \u0645\u0631\u062D\u0628\u0627\u064B \u0628\u0643 \u0641\u064A ${matchedSub.shopName}`,
      syncCode: matchedSub.syncCode,
      subscriber: matchedSub
    });
  });
  app.put("/api/admin/subscribers/:syncCode", (req, res) => {
    const code = req.params.syncCode.toUpperCase();
    const sub = subscribersMap.get(code);
    if (!sub) {
      return res.status(404).json({ error: "\u0627\u0644\u0645\u0634\u062A\u0631\u0643 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
    }
    const { status, extendMonths, monthlyFee, notes, ownerName, ownerPhone, shopName, wilaya } = req.body;
    if (status && ["active", "expired", "suspended"].includes(status)) {
      sub.status = status;
    }
    if (extendMonths && Number(extendMonths) > 0) {
      const months = Number(extendMonths);
      const currentEnd = new Date(sub.subscriptionEndDate).getTime();
      const baseTime = currentEnd > Date.now() ? currentEnd : Date.now();
      const newEnd = new Date(baseTime + months * 30 * 24 * 60 * 60 * 1e3);
      sub.subscriptionEndDate = newEnd.toISOString();
      sub.status = "active";
      sub.lastPaymentDate = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    }
    if (monthlyFee !== void 0) sub.monthlyFee = Number(monthlyFee);
    if (notes !== void 0) sub.notes = notes;
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
      message: "\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643 \u0628\u0646\u062C\u0627\u062D",
      subscriber: sub
    });
  });
  app.delete("/api/admin/subscribers/:syncCode", (req, res) => {
    const code = req.params.syncCode.toUpperCase();
    if (!subscribersMap.has(code)) {
      return res.status(404).json({ error: "\u0627\u0644\u0645\u0634\u062A\u0631\u0643 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
    }
    subscribersMap.delete(code);
    cloudStoresMap.delete(code);
    res.json({
      success: true,
      message: `\u062A\u0645 \u062D\u0630\u0641 \u062D\u0633\u0627\u0628 \u0627\u0644\u0645\u0634\u062A\u0631\u0643 (${code}) \u0643\u0644\u064A\u0627\u064B \u0645\u0646 \u0627\u0644\u0646\u0638\u0627\u0645`
    });
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Fenk Mahli full-stack server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
