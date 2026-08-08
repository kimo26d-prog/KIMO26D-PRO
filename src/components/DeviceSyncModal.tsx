import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Smartphone, Monitor, RefreshCw, CheckCircle2, QrCode, Copy, Check, Link, ShieldCheck, AlertCircle, ArrowLeftRight, Camera } from 'lucide-react';
import { Language } from '../types';
import BarcodeScannerModal from './BarcodeScannerModal';
import { playSuccessSound, playErrorSound, playNotificationSound } from '../utils/audio';

interface DeviceSyncModalProps {
  lang: Language;
  isOpen: boolean;
  onClose: () => void;
  syncCode: string;
  isSyncing: boolean;
  lastSyncedTime: Date | null;
  onInitiatePairing: (codeToJoin?: string) => Promise<boolean>;
  onForceSync: () => void;
  shopName: string;
}

export default function DeviceSyncModal({
  lang,
  isOpen,
  onClose,
  syncCode,
  isSyncing,
  lastSyncedTime,
  onInitiatePairing,
  onForceSync,
  shopName
}: DeviceSyncModalProps) {
  const [copied, setCopied] = useState(false);
  const [inputPairCode, setInputPairCode] = useState('');
  const [pairingError, setPairingError] = useState<string | null>(null);
  const [pairingSuccess, setPairingSuccess] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);

  // Derive sync link URL for QR Code
  const originUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
  const syncLinkUrl = `${originUrl}?syncCode=${syncCode}`;

  const translations = {
    ar: {
      title: "ربط وتزامن الهاتف مع الكمبيوتر",
      subtitle: "مزامنة فورية حية بين هاتف المحمول وجهاز الكمبيوتر الخاص بالمتجر",
      activeCodeLabel: "رمز مزامنة الفرع الحالي",
      qrTitle: "امسح رمز QR لكاميرا الهاتف لربطه فوراً بالكمبيوتر",
      copyLink: "نسخ رابط الربط المباشر",
      copied: "تم النسخ!",
      forceSyncBtn: "مزامنة فورية الآن",
      enterCodeTitle: "هل تريد الربط بجهاز آخر أو هاتف فرعي؟",
      enterCodePlaceholder: "أدخل كود المزامنة (مثال: FENK-8842-DZ)",
      submitPairing: "ربط وتزامن الحساب",
      scanQrBtn: "مسح رمز QR بـ كاميرا الهاتف",
      statusConnected: "متصل ومُتزامن حياً مع السحابة",
      lastSyncLabel: "آخر تحديث متزامن:",
      deviceListTitle: "الأجهزة المرتبطة حالياً بالحساب",
      pcDevice: "كمبيوتر الكاشير الرئيسي (PC)",
      phoneDevice: "هاتف المحمول (Mobile)",
      close: "إغلاق",
      invalidCodeErr: "تعذر العثور على حساب بهذا الكود. يرجى التحقق من صحة الكود."
    },
    en: {
      title: "Link Mobile Phone & Desktop PC",
      subtitle: "Live real-time sync between cashier mobile phone and desktop computer",
      activeCodeLabel: "Active Store Sync Code",
      qrTitle: "Scan this QR code with phone camera to pair instantly",
      copyLink: "Copy Direct Link",
      copied: "Copied!",
      forceSyncBtn: "Force Sync Now",
      enterCodeTitle: "Want to link to another device or mobile phone?",
      enterCodePlaceholder: "Enter store sync code (e.g. FENK-8842-SA)",
      submitPairing: "Link & Sync Account",
      scanQrBtn: "Scan QR Code with Phone Camera",
      statusConnected: "Live Sync Connected Across Devices",
      lastSyncLabel: "Last synced at:",
      deviceListTitle: "Active Linked Devices",
      pcDevice: "Main Cashier Desktop (PC)",
      phoneDevice: "Mobile Phone (App)",
      close: "Close",
      invalidCodeErr: "Could not find a store account with this code. Please verify the sync code."
    }
  };

  const t = translations[lang];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(syncLinkUrl);
    playNotificationSound();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinByCode = async (codeToUse?: string) => {
    const code = codeToUse || inputPairCode.trim();
    if (!code) return;
    setPairingError(null);
    const success = await onInitiatePairing(code);
    if (success) {
      playSuccessSound();
      setPairingSuccess(true);
      setInputPairCode('');
      setTimeout(() => setPairingSuccess(false), 3000);
    } else {
      playErrorSound();
      setPairingError(t.invalidCodeErr);
    }
  };

  const handleQrScanResult = (scannedText: string) => {
    setShowQRScanner(false);
    // Parse syncCode query param or plain code
    let extractedCode = scannedText;
    if (scannedText.includes('syncCode=')) {
      const urlObj = new URL(scannedText);
      extractedCode = urlObj.searchParams.get('syncCode') || scannedText;
    }
    handleJoinByCode(extractedCode);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex justify-center items-center p-3 sm:p-4 z-50 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl border border-slate-200/80 my-auto">
        
        {/* Header */}
        <div className="p-5 bg-[#0f172a] text-white flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ArrowLeftRight size={22} />
            </div>
            <div>
              <h3 className="text-base font-extrabold font-display text-white flex items-center gap-2">
                <span>{t.title}</span>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  LIVE
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {t.subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sync Details Body */}
        <div className="p-6 space-y-6">
          
          {/* Active Status Badge */}
          <div className="bg-emerald-50 border border-emerald-200/80 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>
              </span>
              <div>
                <h4 className="text-xs font-bold font-display text-emerald-950">
                  {t.statusConnected}
                </h4>
                <p className="text-[11px] text-emerald-700 font-mono mt-0.5">
                  {t.lastSyncLabel} {lastSyncedTime ? lastSyncedTime.toLocaleTimeString() : 'الآن'}
                </p>
              </div>
            </div>

            <button
              onClick={onForceSync}
              disabled={isSyncing}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
            >
              <RefreshCw size={13} className={isSyncing ? "animate-spin" : ""} />
              <span>{t.forceSyncBtn}</span>
            </button>
          </div>

          {/* QR Code Section for Phone Scanner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center bg-slate-50 border border-slate-200/80 p-5 rounded-2xl">
            
            {/* Visual QR SVG */}
            <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-200/80 shadow-xs">
              <QRCodeSVG
                value={syncLinkUrl}
                size={140}
                level="H"
                marginSize={1}
                fgColor="#0f172a"
              />
              <span className="text-[10px] font-mono text-slate-400 mt-2">
                {syncCode}
              </span>
            </div>

            {/* QR Info and Link Copy */}
            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {t.activeCodeLabel}
                </span>
                <div className="text-lg font-extrabold font-mono text-slate-900 mt-0.5 flex items-center gap-2">
                  <span>{syncCode}</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                {t.qrTitle}
              </p>

              <div className="flex gap-2">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 py-2 px-3 border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  <span>{copied ? t.copied : t.copyLink}</span>
                </button>
              </div>
            </div>

          </div>

          {/* Connect Another Device Form or Scan Button */}
          <div className="space-y-3 pt-2 border-t border-slate-200/80">
            <h4 className="text-xs font-bold font-display text-slate-900">
              {t.enterCodeTitle}
            </h4>

            <div className="flex flex-col sm:flex-row gap-2">
              
              <button
                type="button"
                onClick={() => setShowQRScanner(true)}
                className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Camera size={16} className="text-emerald-400" />
                <span>{t.scanQrBtn}</span>
              </button>

              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={inputPairCode}
                  onChange={(e) => setInputPairCode(e.target.value)}
                  placeholder={t.enterCodePlaceholder}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-slate-900 uppercase"
                />
                <button
                  type="button"
                  onClick={() => handleJoinByCode()}
                  className="px-4 py-2 bg-[#006c49] hover:bg-[#005237] text-white font-bold text-xs rounded-xl transition-all cursor-pointer whitespace-nowrap"
                >
                  {t.submitPairing}
                </button>
              </div>

            </div>

            {pairingError && (
              <p className="text-xs text-red-600 flex items-center gap-1 font-medium pt-1">
                <AlertCircle size={14} />
                <span>{pairingError}</span>
              </p>
            )}

            {pairingSuccess && (
              <p className="text-xs text-emerald-600 flex items-center gap-1 font-bold pt-1">
                <CheckCircle2 size={14} />
                <span>تم ربط وتأكيد المزامنة مع الحساب بنجاح!</span>
              </p>
            )}
          </div>

          {/* Connected Devices List */}
          <div className="space-y-2 pt-2 border-t border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-500 font-display block">
              {t.deviceListTitle}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Monitor size={16} className="text-slate-700" />
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">{t.pcDevice}</h5>
                    <p className="text-[10px] text-slate-500">متصل (الفرع)</p>
                  </div>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Smartphone size={16} className="text-slate-700" />
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">{t.phoneDevice}</h5>
                    <p className="text-[10px] text-slate-500">تزامن مباشر حقيقي</p>
                  </div>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>

            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            {t.close}
          </button>
        </div>

      </div>

      {/* Camera QR Reader for Pair Linking */}
      {showQRScanner && (
        <BarcodeScannerModal
          lang={lang}
          isOpen={showQRScanner}
          onClose={() => setShowQRScanner(false)}
          onScanSuccess={handleQrScanResult}
          title="مسح كود QR المعتمد لربط الحساب"
        />
      )}

    </div>
  );
}
