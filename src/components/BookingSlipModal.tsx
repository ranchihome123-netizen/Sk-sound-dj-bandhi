import React, { useState } from 'react';
import { X, Printer, Share2, MapPin, Shield, Camera, Palette } from 'lucide-react';
import { DJLogo } from './DJLogo';
import { Booking, BusinessConfig } from '../types';
import { getBookingRewardEarned } from '../utils/rewardUtils';

interface BookingSlipModalProps {
  booking: Booking | null;
  onClose: () => void;
  business: BusinessConfig;
  rewardPercent?: number;
}

type SlipBackgroundTheme = 'royal_gold' | 'emerald_mint' | 'midnight_dark';

export const BookingSlipModal: React.FC<BookingSlipModalProps> = ({
  booking,
  onClose,
  business,
  rewardPercent = 5
}) => {
  const [slipTheme, setSlipTheme] = useState<SlipBackgroundTheme>('royal_gold');

  if (!booking) return null;

  const handlePrint = () => {
    window.print();
  };

  const getEventLabel = (b: Booking) => {
    if (b.requirementPhoto) return 'Paper Slip (Custom)';
    switch (b.eventType) {
      case 'custom_items':
        return 'Box Setup & Lighting (Pcs)';
      case 'birthday':
        return 'Birthday Party (Only Night)';
      case 'wedding':
        return 'Wedding (शादी)';
      case 'party':
        return 'Party / Function';
      default:
        return b.eventType;
    }
  };

  const dateRangeText =
    booking.eventEndDate && booking.eventEndDate !== booking.eventDate
      ? `${booking.eventDate} to ${booking.eventEndDate} (${booking.totalDays || 1} Days)`
      : `${booking.eventDate} (${booking.totalDays || 1} Day)`;

  const ownerPhotoSrc = business.ownerPhoto?.includes('/public/')
    ? '/owner_sikandar_pandit.jpg'
    : (business.ownerPhoto || '/owner_sikandar_pandit.jpg');

  const earnedReward = getBookingRewardEarned(booking, rewardPercent);

  const buildSlipWhatsAppUrl = () => {
    const itemsLine =
      booking.selectedItems && booking.selectedItems.length > 0
        ? `\n*Selected Items:* ${booking.selectedItems.map((i) => `${i.name} × ${i.qty}`).join(', ')}`
        : '';

    const rewardOffLine =
      (booking.rewardUsed || 0) > 0
        ? `*${rewardPercent}% Reward Off Applied:* -₹${booking.rewardUsed?.toLocaleString('en-IN')}\n`
        : '';
    const rewardEarnLine =
      earnedReward > 0
        ? `\n*${rewardPercent}% Reward Earned (Next Booking):* +₹${earnedReward.toLocaleString('en-IN')}`
        : '';

    const text = `*${business.businessNameEn || 'SK Sound DJ Bandhi'} - Official Booking Slip*
-------------------------------
*Booking No:* ${booking.bookingNumber}
*Customer:* ${booking.customerName} (${booking.customerPhone})
*Event Dates:* ${dateRangeText}
*Booking Type:* ${getEventLabel(booking)}
*Location:* ${booking.location}${itemsLine}
${booking.requirementItemsText ? `*Requested Items:* ${booking.requirementItemsText}` : ''}
-------------------------------
*Payment Mode:* ${booking.paymentMode}
${booking.discountCode && (booking.discountAmount || 0) > 0 ? `*Subtotal:* ₹${(booking.subtotalAmount || booking.totalAmount + (booking.discountAmount || 0) + (booking.rewardUsed || 0)).toLocaleString('en-IN')}\n*Discount (${booking.discountCode}):* -₹${booking.discountAmount?.toLocaleString('en-IN')}\n` : ''}${rewardOffLine}*Total Agreed Amount:* ${booking.totalAmount === 0 ? '₹00 (Owner Rate Pending)' : `₹${booking.totalAmount.toLocaleString('en-IN')}`}
*Verified Paid:* ₹${booking.advancePaid.toLocaleString('en-IN')}
*Balance Due:* ${booking.totalAmount === 0 ? 'Rate Pending' : `₹${booking.balanceDue.toLocaleString('en-IN')}`}${rewardEarnLine}
-------------------------------
*Proprietor:* Sikandra Kumar Pandit
*Address:* Bandhi, Khorimahuwa, Rajdhanwar
*Phone / WhatsApp:* +91 ${business.phone}`;

    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  const isDarkSlip = slipTheme === 'midnight_dark';

  const slipContainerThemeClass =
    slipTheme === 'royal_gold'
      ? 'bg-gradient-to-br from-[#fffdf6] via-[#fbf0d4] to-[#f3deaa] text-neutral-900 border-4 border-double border-amber-700/90'
      : slipTheme === 'emerald_mint'
      ? 'bg-gradient-to-br from-[#f5fef9] via-[#e2f7ec] to-[#c9eedc] text-neutral-900 border-4 border-double border-emerald-700/90'
      : 'bg-gradient-to-br from-[#070b14] via-[#0e1525] to-[#151f36] text-slate-100 border-2 border-amber-500/70';

  const headerBannerThemeClass =
    slipTheme === 'emerald_mint'
      ? 'bg-gradient-to-r from-[#05261c] via-[#0c3f30] to-[#05261c] text-white border border-emerald-400/50'
      : 'bg-gradient-to-r from-[#090f1d] via-[#131d36] to-[#090f1d] text-white border border-amber-400/50';

  const dividerClass = isDarkSlip ? 'border-slate-700/80' : 'border-amber-800/20';
  const labelMutedClass = isDarkSlip ? 'text-slate-400' : 'text-neutral-600';
  const headingStrongClass = isDarkSlip ? 'text-white' : 'text-neutral-950';
  const bodyTextClass = isDarkSlip ? 'text-slate-300' : 'text-neutral-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl overflow-hidden my-6">
        
        {/* Top Action Bar (no-print) */}
        <div className="no-print px-4 sm:px-5 py-3 bg-neutral-950 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-amber-400">
              Official Digital Booking Receipt Slip
            </span>

            {/* Slip Background Theme Switcher */}
            <div className="flex items-center gap-1 ml-1 pl-2 border-l border-neutral-800">
              <Palette className="w-3.5 h-3.5 text-neutral-400 mr-0.5 hidden sm:inline" />
              {[
                { key: 'royal_gold', label: 'Royal Gold' },
                { key: 'emerald_mint', label: 'Emerald' },
                { key: 'midnight_dark', label: 'Midnight' }
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setSlipTheme(t.key as SlipBackgroundTheme)}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                    slipTheme === t.key
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-neutral-800 text-neutral-300 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
            <a
              href={buildSlipWhatsAppUrl()}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share on WhatsApp</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* The Printable Slip Body with Changed Official Background */}
        <div
          id="booking-slip"
          className={`relative p-5 sm:p-6 font-sans overflow-hidden ${slipContainerThemeClass}`}
        >
          {/* Subtle Diagonal Background Watermark */}
          <div
            aria-hidden="true"
            className="pointer-events-none select-none absolute inset-0 flex items-center justify-center overflow-hidden"
          >
            <div
              className={`text-3xl sm:text-4xl font-extrabold tracking-[0.25em] uppercase -rotate-24 whitespace-nowrap ${
                isDarkSlip ? 'text-amber-400/[0.04]' : 'text-amber-900/[0.06]'
              }`}
            >
              SK SOUND DJ BANDHI
            </div>
          </div>

          <div className="relative z-10">
            {/* Dark Official Header Banner */}
            <div className={`p-4 rounded-xl flex items-start justify-between gap-3 shadow-md ${headerBannerThemeClass}`}>
              <div className="flex items-center gap-3">
                <DJLogo size={50} />
                <div>
                  <h1 className="text-lg sm:text-xl font-extrabold text-amber-300 tracking-tight">
                    {(business.businessNameEn || 'SK Sound DJ Bandhi').toUpperCase()}
                  </h1>
                  <p className="text-[11px] sm:text-xs text-slate-200 font-medium">
                    Box Setup, LED & Sharpy Lighting, Wedding & Baraat DJ Service
                  </p>
                  <div className="text-[10px] sm:text-[11px] text-slate-300 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>Bandhi, Jharkhand Dham Road, Khorimahuwa, Rajdhanwar (Giridih)</span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-[10px] uppercase font-bold text-amber-300/80 tracking-wider">
                  Official Receipt
                </div>
                <div className="text-sm font-extrabold text-amber-300 font-mono">
                  {booking.bookingNumber}
                </div>
                <div className="text-[11px] text-slate-300">
                  Date: {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}
                </div>
              </div>
            </div>

            {/* Owner & Customer Grid with OWNER PHOTO */}
            <div className={`grid grid-cols-2 gap-4 py-4 border-b ${dividerClass} text-xs`}>
              <div>
                <span className={`text-[10px] uppercase font-bold block ${labelMutedClass}`}>
                  Booked For Customer:
                </span>
                <strong className={`text-sm block mt-0.5 ${headingStrongClass}`}>
                  {booking.customerName}
                </strong>
                <div className={`font-mono mt-0.5 ${bodyTextClass}`}>
                  Mobile: +91 {booking.customerPhone}
                </div>
                <div className={`mt-0.5 ${labelMutedClass}`}>
                  Location: {booking.location}
                </div>
              </div>

              {/* Owner Details with Photo */}
              <div className="flex items-center gap-3 justify-end text-right">
                <div>
                  <span className={`text-[10px] uppercase font-bold block ${labelMutedClass}`}>
                    Proprietor / Owner:
                  </span>
                  <strong className={`text-sm block mt-0.5 ${headingStrongClass}`}>
                    Sikandra Kumar Pandit
                  </strong>
                  <div className={`mt-0.5 font-mono text-[11px] ${bodyTextClass}`}>
                    Phone: +91 {business.phone}
                  </div>
                </div>
                <img
                  src={ownerPhotoSrc}
                  alt="Sikandra Kumar Pandit"
                  className="w-14 h-18 rounded-lg object-cover object-top border-2 border-amber-500 shrink-0 shadow"
                />
              </div>
            </div>

            {/* Event Details */}
            <div className={`py-4 border-b ${dividerClass} text-xs space-y-2`}>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <span className={`block text-[10px] uppercase font-bold ${labelMutedClass}`}>
                    Event Dates (कब से कब तक)
                  </span>
                  <span className={`font-bold font-mono text-sm ${headingStrongClass}`}>{dateRangeText}</span>
                </div>
                <div>
                  <span className={`block text-[10px] uppercase font-bold ${labelMutedClass}`}>
                    Event Type
                  </span>
                  <span className={`font-bold ${headingStrongClass}`}>{getEventLabel(booking)}</span>
                </div>
              </div>

              {booking.requirementPhoto && (
                <div
                  className={`mt-2 p-2.5 rounded-lg border flex items-center gap-3 ${
                    isDarkSlip ? 'bg-slate-900/70 border-slate-700' : 'bg-white/70 border-amber-700/30'
                  }`}
                >
                  <img
                    src={booking.requirementPhoto}
                    alt="Customer Slip"
                    className="w-12 h-16 object-cover rounded border border-amber-500/60"
                  />
                  <div className="text-[11px]">
                    <div className={`font-bold flex items-center gap-1 ${headingStrongClass}`}>
                      <Camera className="w-3.5 h-3.5 text-amber-500" />
                      <span>Customer Handwritten Order Slip Attached</span>
                    </div>
                    {booking.requirementItemsText && (
                      <div className={`italic mt-0.5 ${bodyTextClass}`}>
                        Items: {booking.requirementItemsText}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {booking.specialNotes && (
                <div className={`pt-1 text-[11px] italic ${labelMutedClass}`}>
                  Note: {booking.specialNotes}
                </div>
              )}

              {booking.editedByCustomer && (
                <div
                  className={`mt-2 p-2 rounded border text-[11px] ${
                    isDarkSlip
                      ? 'bg-amber-950/50 border-amber-500/40 text-amber-200'
                      : 'bg-amber-100/80 border-amber-400 text-amber-950'
                  }`}
                >
                  <span className="font-bold">Edited by Customer ({booking.editCount || 1}×)</span>
                  {booking.customerEditedAt && (
                    <span className="ml-1.5 opacity-85">
                      on {new Date(booking.customerEditedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  {booking.editSummary && (
                    <div className="mt-0.5 opacity-90">{booking.editSummary}</div>
                  )}
                </div>
              )}
            </div>

            {/* Financial & Item Breakdown Table */}
            <div className={`py-4 border-b-2 ${isDarkSlip ? 'border-amber-500/40' : 'border-amber-900/40'}`}>
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className={`border-b ${dividerClass} text-[10px] uppercase ${labelMutedClass}`}>
                    <th className="py-1">Item / Description</th>
                    <th className="py-1 text-center">Qty (Pcs)</th>
                    <th className="py-1 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkSlip ? 'divide-slate-800' : 'divide-amber-900/10'}`}>
                  {booking.selectedItems && booking.selectedItems.length > 0 ? (
                    booking.selectedItems.map((it) => (
                      <tr key={it.id}>
                        <td className={`py-1.5 font-medium ${headingStrongClass}`}>
                          {it.name} <span className={`text-[10px] ${labelMutedClass}`}>(₹{it.unitPrice.toLocaleString('en-IN')} / {it.unitLabel})</span>
                        </td>
                        <td className="py-1.5 text-center font-mono">{it.qty}</td>
                        <td className={`py-1.5 text-right font-mono font-semibold ${headingStrongClass}`}>
                          ₹{it.subtotal.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className={`py-1.5 font-medium ${headingStrongClass}`} colSpan={2}>
                        {getEventLabel(booking)}
                      </td>
                      <td className={`py-1.5 text-right font-mono font-semibold ${headingStrongClass}`}>
                        {booking.totalAmount === 0 ? '₹00 (Quote Pending)' : `₹${booking.totalAmount.toLocaleString('en-IN')}`}
                      </td>
                    </tr>
                  )}

                  {((booking.discountCode && (booking.discountAmount || 0) > 0) || (booking.rewardUsed || 0) > 0) && (
                    <>
                      <tr className={`border-t ${dividerClass} ${bodyTextClass}`}>
                        <td className="py-1" colSpan={2}>Subtotal (Before Discount / Reward):</td>
                        <td className="py-1 text-right font-mono">
                          ₹{(booking.subtotalAmount || booking.totalAmount + (booking.discountAmount || 0) + (booking.rewardUsed || 0)).toLocaleString('en-IN')}
                        </td>
                      </tr>
                      {booking.discountCode && (booking.discountAmount || 0) > 0 && (
                        <tr className={`font-semibold ${isDarkSlip ? 'text-emerald-400' : 'text-emerald-700'}`}>
                          <td className="py-1" colSpan={2}>Discount Applied ({booking.discountCode}):</td>
                          <td className="py-1 text-right font-mono">
                            -₹{booking.discountAmount?.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      )}
                      {(booking.rewardUsed || 0) > 0 && (
                        <tr className={`font-semibold ${isDarkSlip ? 'text-emerald-400' : 'text-emerald-700'}`}>
                          <td className="py-1" colSpan={2}>{rewardPercent}% Customer Reward Redeemed (Off):</td>
                          <td className="py-1 text-right font-mono">
                            -₹{booking.rewardUsed?.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      )}
                    </>
                  )}

                  <tr className={`border-t-2 ${dividerClass} font-bold ${headingStrongClass}`}>
                    <td className="py-2" colSpan={2}>
                      Total Booking Amount <span className={`text-[10px] font-normal ${labelMutedClass}`}>({booking.paymentMode} Mode)</span>:
                    </td>
                    <td className="py-2 text-right font-mono text-sm">
                      {booking.totalAmount === 0 ? '₹00 (Owner Rate Pending)' : `₹${booking.totalAmount.toLocaleString('en-IN')}`}
                    </td>
                  </tr>
                  {earnedReward > 0 && (
                    <tr className={`font-semibold ${isDarkSlip ? 'text-amber-300 bg-amber-500/10' : 'text-amber-900 bg-amber-200/50'}`}>
                      <td className="py-1" colSpan={2}>{rewardPercent}% Reward Earned (Usable on Next Booking):</td>
                      <td className="py-1 text-right font-mono">
                        +₹{earnedReward.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  )}
                  <tr className={`font-semibold ${isDarkSlip ? 'text-emerald-400' : 'text-emerald-800'}`}>
                    <td className="py-1" colSpan={2}>
                      Verified Paid Amount {booking.upiRefNumber ? `(UTR: ${booking.upiRefNumber})` : ''}:
                    </td>
                    <td className="py-1 text-right font-mono">
                      ₹{booking.advancePaid.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  {booking.status === 'utr_submitted' && booking.pendingUtrNumber && (
                    <tr className={`font-semibold ${isDarkSlip ? 'text-cyan-300' : 'text-cyan-800'}`}>
                      <td className="py-1" colSpan={2}>
                        Submitted UTR (Owner Verification Pending): {booking.pendingUtrNumber}
                      </td>
                      <td className="py-1 text-right font-mono">
                        ₹{(booking.pendingPaymentAmount || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  )}
                  <tr className={`font-bold border-t ${dividerClass} ${isDarkSlip ? 'text-amber-300' : 'text-amber-900'}`}>
                    <td className="py-1.5" colSpan={2}>Net Balance Due:</td>
                    <td className="py-1.5 text-right font-mono text-sm">
                      {booking.totalAmount === 0 ? 'Pending Quote' : `₹${booking.balanceDue.toLocaleString('en-IN')}`}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Verification & Footer */}
            <div className={`pt-4 flex items-center justify-between text-[11px] ${labelMutedClass}`}>
              <div>
                <div className={`flex items-center gap-1 font-semibold ${headingStrongClass}`}>
                  <Shield className={`w-3.5 h-3.5 ${isDarkSlip ? 'text-emerald-400' : 'text-emerald-700'}`} />
                  <span>Digitally Verified by {business.businessNameEn || 'SK Sound DJ Bandhi'}</span>
                </div>
                <div className="text-[10px] mt-0.5">
                  Official Address: Bandhi, Khorimahuwa, Rajdhanwar · Mob: +91 {business.phone}
                </div>
              </div>

              <div className="text-right">
                <div className={`h-8 border-b border-dashed w-32 ml-auto ${isDarkSlip ? 'border-slate-500' : 'border-amber-800/50'}`} />
                <div className={`text-[10px] font-bold mt-1 ${headingStrongClass}`}>
                  Sikandra Kumar Pandit (Authorized)
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
