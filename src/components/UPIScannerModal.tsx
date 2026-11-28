import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, RefreshCw, Tag, Lock, Smartphone, AlertCircle } from 'lucide-react';
import { DJLogo } from './DJLogo';
import { BusinessConfig, DiscountCode } from '../types';
import { evaluateDiscountCode } from '../utils/discountUtils';

interface UPIScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  business: BusinessConfig;
  userRole?: 'owner' | 'customer';
  initialAmount?: number;
  initialNote?: string;
  discountCodes?: DiscountCode[];
  bookingTotal?: number;
  existingDiscountCode?: string;
  existingDiscountAmount?: number;
  onApplyDiscount?: (code: string, discountAmount: number, newPayableAmount: number) => void;
  onPaymentConfirmed?: (details: { amount: number; utr: string; note: string }) => void;
}

// Permanently fixed official UPI ID: 9973492726@airtel
const FIXED_UPI_ID = '9973492726@airtel';
const FIXED_PAYEE_NAME = 'SK SOUND DJ BANDI';

export const UPIScannerModal: React.FC<UPIScannerModalProps> = ({
  isOpen,
  onClose,
  userRole = 'customer',
  initialAmount = 2000,
  initialNote = 'SK Sound DJ Bandhi Payment',
  discountCodes = [],
  bookingTotal,
  existingDiscountCode,
  existingDiscountAmount,
  onApplyDiscount,
  onPaymentConfirmed
}) => {
  const [basePayable, setBasePayable] = useState<number>(initialAmount);
  const [paymentSplit, setPaymentSplit] = useState<'full' | 'half'>('full');
  const [note, setNote] = useState<string>(initialNote);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [isSubmittingUtr, setIsSubmittingUtr] = useState<boolean>(false);
  const [utrSuccess, setUtrSuccess] = useState<boolean>(false);
  const [promoInput, setPromoInput] = useState<string>('');
  const [promoError, setPromoError] = useState<string>('');
  const [appliedPromoMsg, setAppliedPromoMsg] = useState<string>('');
  const [trRef, setTrRef] = useState<string>(() => `SKD${Date.now().toString().slice(-8)}`);
  const [showOnlyQr, setShowOnlyQr] = useState<boolean>(false);
  const [unavailableAppMsg, setUnavailableAppMsg] = useState<string>('');
  const qrBoxRef = useRef<HTMLDivElement>(null);
  const launchCleanupRef = useRef<(() => void) | null>(null);

  const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
  const isMobileDevice =
    typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // Sync initial props (locked non-editable base amount)
  useEffect(() => {
    if (!isOpen) return;
    const safeInitial = Math.max(0, Math.round(initialAmount || 0));
    setBasePayable(safeInitial);
    setPaymentSplit('full');
    if (initialNote) {
      setNote(initialNote);
    }
    setPromoInput('');
    setPromoError('');
    setAppliedPromoMsg('');
    setTrRef(`SKD${Date.now().toString().slice(-8)}`);
    if (!isMobileDevice) {
      setShowOnlyQr(true);
      setUnavailableAppMsg(
        'PhonePe / UPI Apps are not downloaded or supported on your system. कृपया नीचे दिए गए QR Code को स्कैन करके पेमेंट करें।'
      );
    } else {
      setShowOnlyQr(false);
      setUnavailableAppMsg('');
    }
  }, [initialAmount, initialNote, isOpen, isMobileDevice]);

  useEffect(() => {
    return () => {
      if (launchCleanupRef.current) {
        launchCleanupRef.current();
        launchCleanupRef.current = null;
      }
    };
  }, []);

  const fullAmount = Math.max(0, basePayable);
  const halfAmount = Math.ceil(fullAmount / 2);
  const amount = paymentSplit === 'half' ? halfAmount : fullAmount;

  // Construct standard NPCI UPI URI + Android Intent / iOS deep links for selected Half/Full amount
  const upiQuery = `pa=${encodeURIComponent(FIXED_UPI_ID)}&pn=${encodeURIComponent(
    FIXED_PAYEE_NAME
  )}&tr=${encodeURIComponent(trRef)}&am=${amount > 0 ? amount.toFixed(2) : ''}&cu=INR&tn=${encodeURIComponent(
    note || 'DJ Booking'
  )}`;
  const upiUri = `upi://pay?${upiQuery}`;

  const phonepeUri = isAndroid
    ? `intent://pay?${upiQuery}#Intent;scheme=upi;package=com.phonepe.app;end`
    : `phonepe://pay?${upiQuery}`;
  const gpayUri = isAndroid
    ? `intent://pay?${upiQuery}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`
    : `tez://upi/pay?${upiQuery}`;
  const paytmUri = isAndroid
    ? `intent://pay?${upiQuery}#Intent;scheme=upi;package=net.one97.paytm;end`
    : `paytmmp://pay?${upiQuery}`;

  const handleUpiAppTap = (e: React.MouseEvent<HTMLAnchorElement>, appName: string) => {
    if (launchCleanupRef.current) {
      launchCleanupRef.current();
      launchCleanupRef.current = null;
    }

    if (!isMobileDevice) {
      e.preventDefault();
      setShowOnlyQr(true);
      setUnavailableAppMsg(
        `${appName} not downloaded or supported on your system. कृपया नीचे दिए गए QR Code को स्कैन करके पेमेंट करें।`
      );
      window.setTimeout(() => {
        qrBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 60);
      return;
    }

    let didLeavePage = false;
    const markLeft = () => {
      if (document.visibilityState === 'hidden') {
        didLeavePage = true;
      }
    };
    const markBlur = () => {
      didLeavePage = true;
    };

    document.addEventListener('visibilitychange', markLeft);
    window.addEventListener('blur', markBlur);

    const timerId = window.setTimeout(() => {
      cleanup();
      if (!didLeavePage && document.visibilityState === 'visible') {
        setShowOnlyQr(true);
        setUnavailableAppMsg(
          `${appName} not downloaded or supported on your system. कृपया नीचे दिए गए QR Code को स्कैन करके पेमेंट करें।`
        );
        qrBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 1000);

    const cleanup = () => {
      window.clearTimeout(timerId);
      document.removeEventListener('visibilitychange', markLeft);
      window.removeEventListener('blur', markBlur);
    };
    launchCleanupRef.current = cleanup;
  };

  // Generate QR Code data URL dynamically
  useEffect(() => {
    if (!isOpen) return;

    QRCode.toDataURL(upiUri, {
      width: 320,
      margin: 1.5,
      color: {
        dark: '#0B0B0E',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    })
      .then((url) => {
        setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('Failed to generate QR code:', err);
      });
  }, [isOpen, upiUri]);

  if (!isOpen) return null;

  const handleCopyUPI = async () => {
    try {
      await navigator.clipboard.writeText(FIXED_UPI_ID);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = FIXED_UPI_ID;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const activeModalCoupons = discountCodes.filter(
    (c) => c.active && (c.paymentModeScope === 'ALL' || c.paymentModeScope === 'UPI')
  );

  const handleApplyPromoInModal = (codeOverride?: string) => {
    const codeToApply = (codeOverride ?? promoInput).trim().toUpperCase();
    setPromoError('');
    setAppliedPromoMsg('');
    if (!codeToApply) return;

    setPromoInput(codeToApply);
    const baseAmt = bookingTotal || basePayable;
    const res = evaluateDiscountCode(codeToApply, discountCodes, baseAmt, 'UPI');
    if (!res.valid || !res.discountCodeObj) {
      setPromoError(res.error || 'अमान्य डिस्काउंट कोड।');
      return;
    }
    const newPayable = Math.max(0, basePayable - res.discountAmount);
    setBasePayable(newPayable);
    setAppliedPromoMsg(
      `कोड ${res.discountCodeObj.code} लागू! ₹${res.discountAmount.toLocaleString('en-IN')} की छूट मिली।`
    );
    if (onApplyDiscount) {
      onApplyDiscount(res.discountCodeObj.code, res.discountAmount, newPayable);
    }
  };

  const handleSubmitUtr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrNumber || utrNumber.length < 6) return;

    setIsSubmittingUtr(true);
    setTimeout(() => {
      setIsSubmittingUtr(false);
      setUtrSuccess(true);
      if (onPaymentConfirmed) {
        onPaymentConfirmed({
          amount,
          utr: utrNumber,
          note
        });
      }
      setTimeout(() => {
        setUtrSuccess(false);
        setUtrNumber('');
        onClose();
      }, 2000);
    }, 800);
  };

  return (
    <div
      className="fixed inset-0 z-[65] flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg max-h-[92dvh] flex flex-col bg-neutral-900 border border-neutral-700/80 rounded-2xl shadow-2xl overflow-hidden"
      >
        
        {/* Sticky Header */}
        <div className="px-4 sm:px-5 py-3.5 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <DJLogo size={34} />
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5 flex-wrap">
                <span>SK Sound UPI QR Scanner</span>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-1.5 py-0.5 rounded">
                  Fixed Official UPI
                </span>
              </h3>
              <p className="text-[11px] text-neutral-400 truncate">
                Sikandra Kumar Pandit · Bandhi, Khorimahuwa, Rajdhanwar
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-300 hover:text-white rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* Locked Payment Amount: Strictly Half (50%) or Full (100%) — Always Visible at Top */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Half या Full Payment चुनें:</span>
              </label>
              <span className="text-[11px] font-mono text-neutral-400 shrink-0">
                कुल: ₹{fullAmount.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPaymentSplit('half')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  paymentSplit === 'half'
                    ? 'bg-amber-400 text-black border-amber-300 shadow-lg ring-2 ring-amber-400/40'
                    : 'bg-neutral-950 text-neutral-200 border-neutral-700 hover:border-amber-400/60'
                }`}
              >
                <div className={`text-[11px] font-extrabold ${paymentSplit === 'half' ? 'text-black' : 'text-amber-300'}`}>
                  Half Payment (50% आधा)
                </div>
                <div className="font-mono font-extrabold text-lg tabular-nums mt-0.5">
                  ₹{halfAmount.toLocaleString('en-IN')}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentSplit('full')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  paymentSplit === 'full'
                    ? 'bg-emerald-500 text-black border-emerald-400 shadow-lg ring-2 ring-emerald-400/40'
                    : 'bg-neutral-950 text-neutral-200 border-neutral-700 hover:border-emerald-400/60'
                }`}
              >
                <div className={`text-[11px] font-extrabold ${paymentSplit === 'full' ? 'text-black' : 'text-emerald-400'}`}>
                  Full Payment (100% पूरा)
                </div>
                <div className="font-mono font-extrabold text-lg tabular-nums mt-0.5">
                  ₹{fullAmount.toLocaleString('en-IN')}
                </div>
              </button>
            </div>

            <div className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between">
              <span className="text-xs text-neutral-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {paymentSplit === 'half' ? 'Half (50%) Payable Amount:' : 'Full (100%) Payable Amount:'}
                </span>
              </span>
              <span className="font-mono font-extrabold text-base sm:text-lg text-amber-300 tabular-nums">
                ₹{amount.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Direct Pay via PhonePe / Google Pay / Paytm / Any UPI App — Hidden if unsupported/not downloaded so ONLY QR shows */}
            {amount > 0 && !showOnlyQr && (
              <div className="p-3 rounded-xl bg-neutral-950 border border-amber-500/40 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>सीधा पेमेंट करें (Direct Pay ₹{amount.toLocaleString('en-IN')}):</span>
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-300 border border-amber-400/30">
                    {paymentSplit === 'half' ? 'HALF 50%' : 'FULL 100%'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <a
                    href={phonepeUri}
                    target="_top"
                    onClick={(e) => handleUpiAppTap(e, 'PhonePe')}
                    className="min-h-[38px] px-2.5 py-2 rounded-lg bg-[#5f259f] hover:bg-[#702eb8] text-white font-bold text-xs flex items-center justify-center gap-1.5 text-center shadow transition-colors"
                  >
                    <span>PhonePe</span>
                  </a>
                  <a
                    href={gpayUri}
                    target="_top"
                    onClick={(e) => handleUpiAppTap(e, 'Google Pay')}
                    className="min-h-[38px] px-2.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 text-center shadow transition-colors"
                  >
                    <span>Google Pay</span>
                  </a>
                  <a
                    href={paytmUri}
                    target="_top"
                    onClick={(e) => handleUpiAppTap(e, 'Paytm')}
                    className="min-h-[38px] px-2.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 text-center shadow transition-colors"
                  >
                    <span>Paytm</span>
                  </a>
                  <a
                    href={upiUri}
                    target="_top"
                    onClick={(e) => handleUpiAppTap(e, 'UPI App')}
                    className="min-h-[38px] px-2.5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 text-center shadow transition-colors"
                  >
                    <span>Any UPI</span>
                  </a>
                </div>
              </div>
            )}

            {showOnlyQr && unavailableAppMsg && (
              <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/50 text-xs text-amber-200 flex items-start justify-between gap-2.5">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 leading-snug">
                    <div className="font-bold text-amber-300">Scan QR Code Only / सिर्फ QR स्कैन करें</div>
                    <div>{unavailableAppMsg}</div>
                  </div>
                </div>
                {isMobileDevice && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowOnlyQr(false);
                      setUnavailableAppMsg('');
                    }}
                    className="px-2 py-1 rounded-md bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-[10px] font-bold text-neutral-200 shrink-0 cursor-pointer"
                  >
                    Retry
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Discount Code Section in UPI Payment Mode */}
          {existingDiscountCode && (existingDiscountAmount || 0) > 0 ? (
            <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-700/60 text-xs text-emerald-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-semibold">
                <Tag className="w-3.5 h-3.5 text-emerald-400" />
                <span>Discount Code ({existingDiscountCode}) Applied</span>
              </span>
              <span className="font-mono font-bold text-emerald-400">
                -₹{existingDiscountAmount?.toLocaleString('en-IN')}
              </span>
            </div>
          ) : activeModalCoupons.length > 0 && !appliedPromoMsg ? (
            <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-[11px] font-semibold text-amber-300 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Coupon Code:</span>
                </label>

                <div className="flex flex-wrap items-center gap-1.5">
                  {activeModalCoupons.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleApplyPromoInModal(c.code)}
                      className="px-2 py-0.5 rounded-md bg-neutral-900 hover:bg-amber-400 text-amber-300 hover:text-black border border-amber-400/50 font-mono font-bold text-[11px] cursor-pointer transition-colors"
                    >
                      {c.code}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  placeholder="Enter code"
                  className="flex-1 px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs font-mono font-bold uppercase text-white focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => handleApplyPromoInModal()}
                  className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs rounded-lg cursor-pointer"
                >
                  Apply
                </button>
              </div>
              {promoError && (
                <div className="text-[11px] text-rose-400">{promoError}</div>
              )}
            </div>
          ) : appliedPromoMsg ? (
            <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-700/60 text-xs text-emerald-300 flex items-center gap-1.5 font-semibold">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{appliedPromoMsg}</span>
            </div>
          ) : null}

          {/* QR Code Canvas Box */}
          <div
            ref={qrBoxRef}
            className="bg-neutral-950 p-3.5 rounded-2xl border border-amber-500/30 flex flex-col items-center text-center space-y-2.5"
          >
            <div className="relative p-2 bg-white rounded-xl shadow-inner flex items-center justify-center">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="SK Sound UPI QR Code"
                  className="w-44 h-44 sm:w-52 sm:h-52 object-contain"
                />
              ) : (
                <div className="w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center text-neutral-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
                </div>
              )}
            </div>

            <div className="text-xs text-neutral-300 space-y-0.5">
              <div className="font-bold text-white text-sm">
                {paymentSplit === 'half' ? 'Half (50%)' : 'Full (100%)'} Scan & Pay — ₹{amount.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-neutral-400">
                PhonePe · Google Pay · Paytm · BHIM · Airtel Thanks
              </div>
            </div>

            {/* Permanent Fixed UPI ID Bar (Immutable) */}
            <div className="w-full pt-1 flex items-center justify-between px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-[11px] text-neutral-400 font-medium">UPI ID:</span>
                <span className="font-mono text-xs font-bold text-amber-300 truncate">
                  {FIXED_UPI_ID}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyUPI}
                className="px-2.5 py-1 text-xs font-medium rounded-md bg-neutral-800 hover:bg-neutral-700 text-white flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* UTR / Transaction Submission */}
          <form id="upi-utr-form" onSubmit={handleSubmitUtr} className="space-y-2 pt-1 border-t border-neutral-800">
            <label className="block text-xs font-semibold text-neutral-300">
              पेमेंट हो गया? बुकिंग कन्फर्म करने के लिए 12-अंकों का UTR No. डालें:
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                placeholder="12-digit UTR / Ref No."
                className="flex-1 px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                disabled={!utrNumber || utrNumber.length < 6 || isSubmittingUtr}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold text-xs rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow"
              >
                {isSubmittingUtr ? 'Sending...' : userRole === 'owner' ? 'Payment Success' : 'Submit UTR'}
              </button>
            </div>

            {utrSuccess && (
              <div className="p-2.5 bg-emerald-950/80 border border-emerald-800 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  {userRole === 'owner'
                    ? 'Payment verified & booking confirmed successfully!'
                    : 'UTR No. भेज दिया गया है! जैसे ही मालिक (Sikandra Pandit) पेमेंट सफल करेंगे, आपकी बुकिंग कन्फर्म हो जाएगी।'}
                </span>
              </div>
            )}
          </form>

        </div>

        {/* Sticky Footer with Clear Cancel Button */}
        <div className="px-4 sm:px-5 py-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between gap-2.5 shrink-0">
          <div className="text-[11px] text-neutral-400 truncate">
            बाद में भी "My Bookings" से पेमेंट कर सकते हैं
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-rose-950/70 hover:bg-rose-900 text-rose-200 border border-rose-600/60 font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Cancel / बंद करें</span>
          </button>
        </div>

      </div>
    </div>
  );
};
