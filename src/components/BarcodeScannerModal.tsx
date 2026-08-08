import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, RefreshCw, Zap, Volume2, CheckCircle2, AlertCircle, Barcode, FlipHorizontal } from 'lucide-react';
import { Language } from '../types';
import { playBeepSound, playCameraStartSound, playErrorSound, playClickSound } from '../utils/audio';

interface BarcodeScannerModalProps {
  lang: Language;
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (scannedCode: string) => void;
  title?: string;
  continuous?: boolean;
}

export default function BarcodeScannerModal({
  lang,
  isOpen,
  onClose,
  onScanSuccess,
  title,
  continuous = false
}: BarcodeScannerModalProps) {
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [torchOn, setTorchOn] = useState(false);

  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'fenk-barcode-scanner-region';

  const translations = {
    ar: {
      defaultTitle: "مسح باركود المنتج بالكاميرا",
      subtitle: "وجّه كاميرا الهاتف أو الجهاز مباشرة نحو رمز الباركود",
      continuousSub: "وضع الكاشير المستمر: يتم إضافة السلعة تلقائياً عند كل مسح",
      manualTitle: "أو أدخل رقم الباركود يدوياً",
      manualPlaceholder: "مثال: 6281000112233",
      submitManual: "إدخال",
      lastScanned: "تم مسح الرمز:",
      cameraPermissionErr: "تعذر الوصول للكاميرا. يرجى التأكد من السماح بالوصول بالكاميرا من إعدادات المتصفح.",
      close: "إغلاق",
      switchCam: "تبديل الكاميرا",
      torch: "الفلاش",
      scanningActive: "جاري البحث عن باركود..."
    },
    en: {
      defaultTitle: "Scan Product Barcode with Camera",
      subtitle: "Point your camera at the product barcode label",
      continuousSub: "Continuous Register Mode: Items added automatically on each scan",
      manualTitle: "Or enter barcode manually",
      manualPlaceholder: "e.g., 6281000112233",
      submitManual: "Submit Code",
      lastScanned: "Scanned Code:",
      cameraPermissionErr: "Camera access denied. Please grant camera permissions in your browser settings.",
      close: "Close Scanner",
      switchCam: "Flip Camera",
      torch: "Flashlight",
      scanningActive: "Scanning for barcodes..."
    }
  };

  const t = translations[lang];

  // Initialize and start scanner when opened
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setScannerError(null);
    setLastScannedCode(null);

    const initScanner = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (!isMounted) return;

        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer environment (back) camera if available
          const backCam = devices.find(d => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('rear') || 
            d.label.toLowerCase().includes('خلفية')
          );
          const chosenCamId = backCam ? backCam.id : devices[devices.length - 1].id;
          setSelectedCameraId(chosenCamId);
          await startScanning(chosenCamId);
        } else {
          // Fallback to environment facing mode
          await startScanning({ facingMode: "environment" });
        }
      } catch (err: any) {
        console.warn("Camera init error:", err);
        // Fallback to facing mode
        try {
          await startScanning({ facingMode: "environment" });
        } catch (fallbackErr: any) {
          if (isMounted) {
            setScannerError(t.cameraPermissionErr);
          }
        }
      }
    };

    // Small delay to ensure modal DOM container is mounted
    const timer = setTimeout(() => {
      initScanner();
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen]);

  const startScanning = async (cameraIdOrConfig: string | { facingMode: string }) => {
    try {
      if (html5QrcodeRef.current) {
        await stopScanner();
      }

      const html5Qrcode = new Html5Qrcode(scannerContainerId);
      html5QrcodeRef.current = html5Qrcode;

      const config = {
        fps: 15,
        qrbox: { width: 280, height: 160 },
        aspectRatio: 1.0,
      };

      setIsScanning(true);
      playCameraStartSound();

      await html5Qrcode.start(
        cameraIdOrConfig,
        config,
        (decodedText) => {
          handleScan(decodedText);
        },
        () => {
          // Ignore frame decode failures
        }
      );
    } catch (err: any) {
      console.error("Scanner start error:", err);
      playErrorSound();
      setScannerError(t.cameraPermissionErr);
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
      try {
        await html5QrcodeRef.current.stop();
        html5QrcodeRef.current.clear();
      } catch (err) {
        console.warn("Scanner stop error:", err);
      } finally {
        html5QrcodeRef.current = null;
        setIsScanning(false);
      }
    }
  };

  const handleScan = (scannedCode: string) => {
    if (!scannedCode) return;
    
    // Play audio beep feedback
    playBeepSound();
    setLastScannedCode(scannedCode);

    onScanSuccess(scannedCode);

    if (!continuous) {
      stopScanner();
      onClose();
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleScan(manualCode.trim());
    setManualCode('');
  };

  const handleSwitchCamera = async () => {
    if (cameras.length <= 1) return;
    playClickSound();
    const currentIndex = cameras.findIndex(c => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCam = cameras[nextIndex];
    setSelectedCameraId(nextCam.id);
    await startScanning(nextCam.id);
  };

  const handleToggleTorch = async () => {
    if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
      try {
        playClickSound();
        const newTorchState = !torchOn;
        await html5QrcodeRef.current.applyVideoConstraints({
          advanced: [{ torch: newTorchState } as any]
        });
        setTorchOn(newTorchState);
      } catch (e) {
        console.warn("Torch not supported on this device/browser");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex justify-center items-center p-3 sm:p-4 z-50 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Camera size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold font-display text-white">
                {title || t.defaultTitle}
              </h3>
              <p className="text-[10px] text-slate-400">
                {continuous ? t.continuousSub : t.subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Video Camera Region */}
        <div className="relative bg-black flex-1 min-h-[260px] flex items-center justify-center overflow-hidden">
          
          <div id={scannerContainerId} className="w-full h-full object-cover"></div>

          {/* Target Scan Frame Overlay */}
          {isScanning && !scannerError && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              
              {/* Scan box frame */}
              <div className="relative w-64 h-36 border-2 border-emerald-400/80 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] overflow-hidden flex items-center justify-center">
                
                {/* Laser scan line animation */}
                <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_12px_#10b981] animate-pulse"></div>
                
                {/* Corner reticles */}
                <span className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-emerald-400"></span>
                <span className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-emerald-400"></span>
                <span className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-emerald-400"></span>
                <span className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-emerald-400"></span>
              </div>

              <div className="mt-3 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur px-3 py-1 rounded-full border border-slate-700/50 text-[11px] font-medium text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>{t.scanningActive}</span>
              </div>
            </div>
          )}

          {/* Camera Controls Bar (Flip & Torch) */}
          {isScanning && (
            <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center z-10 pointer-events-auto">
              {cameras.length > 1 ? (
                <button
                  type="button"
                  onClick={handleSwitchCamera}
                  className="px-3 py-1.5 bg-slate-900/80 hover:bg-slate-800 text-white rounded-xl text-xs font-medium border border-slate-700 backdrop-blur flex items-center gap-1.5 cursor-pointer"
                >
                  <FlipHorizontal size={14} />
                  <span>{t.switchCam}</span>
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={handleToggleTorch}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border backdrop-blur flex items-center gap-1.5 cursor-pointer ${
                  torchOn ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-900/80 text-white border-slate-700 hover:bg-slate-800'
                }`}
              >
                <Zap size={14} />
                <span>{t.torch}</span>
              </button>
            </div>
          )}

          {/* Camera Permission / Error message */}
          {scannerError && (
            <div className="absolute inset-0 bg-slate-900/95 p-6 flex flex-col justify-center items-center text-center space-y-3 z-20">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <AlertCircle size={24} />
              </div>
              <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
                {scannerError}
              </p>
              <button
                type="button"
                onClick={() => startScanning({ facingMode: "environment" })}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer mt-2"
              >
                <RefreshCw size={14} />
                <span>إعادة المحاولة</span>
              </button>
            </div>
          )}
        </div>

        {/* Feedback notification when scanned */}
        {lastScannedCode && (
          <div className="bg-emerald-950/60 border-t border-emerald-800/50 p-2.5 px-4 flex items-center justify-between text-emerald-300 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>{t.lastScanned}</span>
              <strong className="font-mono bg-emerald-900/80 px-2 py-0.5 rounded text-white border border-emerald-700">
                {lastScannedCode}
              </strong>
            </div>
            <Volume2 size={14} className="text-emerald-400 animate-pulse" />
          </div>
        )}

        {/* Manual Fallback Bar */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-2">
          <p className="text-[11px] font-semibold text-slate-400">
            {t.manualTitle}
          </p>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 right-3 flex items-center text-slate-500">
                <Barcode size={16} />
              </span>
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder={t.manualPlaceholder}
                className="w-full py-2 pr-9 pl-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer whitespace-nowrap"
            >
              {t.submitManual}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
