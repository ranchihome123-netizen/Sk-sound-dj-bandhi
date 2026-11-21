import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, RefreshCw, Tag, Lock } from 'lucide-react';
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

  // Sync initial props (locked non-editable base amount)
  useEffect(() => {
    const safeInitial = Math.max(0, Math.round(initialAmount || 0));
    setBasePayable(safeInitial);
    setPaymentSplit('full');
    if (initialNote) {
      setNote(initialNote);
    }
    setPromoInput('');
    setPromoError('');
    setAppliedPromoMsg('');
  }, [initialAmount, initialNote, isOpen]);

  const fullAmount = Math.max(0, basePayable);
  const halfAmount = Math.ceil(fullAmount / 2);
  const amount = paymentSplit === 'half' ? halfAmount : fullAmount;

  // Construct standard NPCI UPI URI with permanently fixed UPI ID
  const upiUri = `upi://pay?pa=${encodeURIComponent(FIXED_UPI_ID)}&pn=${encodeURIComponent(
    FIXED_PAYEE_NAME
  )}&am=${amount > 0 ? amount.toFixed(2) : ''}&cu=INR&tn=${encodeURIComponent(note || 'DJ Booking')}`;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-700/80 rounded-2xl shadow-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="px-5 py-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DJLogo size={36} />
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <span>SK Sound UPI QR Scanner</span>
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-1.5 py-0.5 rounded">
                  Fixed Official UPI
                </span>
              </h3>
              <p className="text-xs text-neutral-400">
                Sikandra Kumar Pandit · Bandhi, Khorimahuwa, Rajdhanwar
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          
          {/* Locked Payment Amount: Strictly Half (50%) or Full (100%) — Non-Editable */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Payment Option चुनें (पैसा Edit नहीं हो सकता):</span>
              </label>
              <span className="text-[11px] font-mono text-neutral-400">
                कुल देय: ₹{fullAmount.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPaymentSplit('half')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  paymentSplit === 'half'
                    ? 'bg-amber-400 text-black border-amber-400 shadow'
                    : 'bg-neutral-950 text-neutral-200 border-neutral-800 hover:border-neutral-600'
                }`}
              >
                <div className={`text-[11px] font-bold ${paymentSplit === 'half' ? 'text-black/80' : 'text-amber-300'}`}>
                  Half Payment (50%)
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
                    ? 'bg-emerald-500 text-black border-emerald-400 shadow'
                    : 'bg-neutral-950 text-neutral-200 border-neutral-800 hover:border-neutral-600'
                }`}
              >
                <div className={`text-[11px] font-bold ${paymentSplit === 'full' ? 'text-black/80' : 'text-emerald-400'}`}>
                  Full Payment (पूरा 100%)
                </div>
                <div className="font-mono font-extrabold text-lg tabular-nums mt-0.5">
                  ₹{fullAmount.toLocaleString('en-IN')}
                </div>
              </button>
            </div>

            <div className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between">
              <span className="text-xs text-neutral-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>QR Payable Amount (Fixed):</span>
              </span>
              <span className="font-mono font-extrabold text-lg text-white tabular-nums">
                ₹{amount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Discount Code Section in UPI Payment Mode */}
          {existingDiscountCode && (existingDiscountAmount || 0) > 0 ? (
            <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-700/60 text-xs text-emerald-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-semibold">
                <Tag className="w-3.5 h-3.5 text-emerald-400" />
                <span>Discount Code ({existingDiscountCode}) Applied</span>
              </span>
              <span className="font-mono font-bold text-emerald-400">
                -₹{existingDiscountAmount?.toLocaleString('en-IN')}
              </span>
            </div>
          ) : activeModalCoupons.length > 0 && !appliedPromoMsg ? (
            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
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
            <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-700/60 text-xs text-emerald-300 flex items-center gap-1.5 font-semibold">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{appliedPromoMsg}</span>
            </div>
          ) : null}

          {/* QR Code Canvas Box */}
          <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 flex flex-col items-center text-center space-y-3">
            <div className="relative p-2.5 bg-white rounded-xl shadow-inner flex items-center justify-center">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="SK Sound UPI QR Code"
                  className="w-52 h-52 sm:w-60 sm:h-60 object-contain"
                />
              ) : (
                <div className="w-52 h-52 sm:w-60 sm:h-60 flex items-center justify-center text-neutral-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
                </div>
              )}
            </div>

            <div className="text-xs text-neutral-300 space-y-1">
              <div className="font-bold text-white text-sm">
                Scan with Any UPI App
              </div>
              <div className="text-[11px] text-neutral-400">
                PhonePe · Google Pay · Paytm · BHIM · Airtel Thanks · Cred
              </div>
            </div>

            {/* Permanent Fixed UPI ID Bar (Immutable) */}
            <div className="w-full pt-1 flex items-center justify-between px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-[11px] text-neutral-400 font-medium">Permanent UPI ID:</span>
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
          <form onSubmit={handleSubmitUtr} className="space-y-2.5 pt-1 border-t border-neutral-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-300">
                पेमेंट हो गया? बुकिंग कन्फर्म करने के लिए 12-अंकों का UTR No. डालें:
              </label>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                placeholder="12-digit UTR or Reference Number"
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

      </div>
    </div>
  );
};
