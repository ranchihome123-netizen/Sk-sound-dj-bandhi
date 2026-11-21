import React, { useState } from 'react';
import {
  CustomerUser,
  Booking,
  BusinessConfig,
  DJRatePlan,
  OfferBroadcast,
  DiscountCode
} from '../types';
import { canCustomerEditBooking } from '../utils/bookingUtils';
import { getBookingRewardEarned, getCustomerRewardSummary } from '../utils/rewardUtils';
import {
  Calendar,
  MapPin,
  Phone,
  FileText,
  QrCode,
  PlusCircle,
  MessageSquare,
  LogOut,
  Clock,
  Camera,
  AlertCircle,
  Eye,
  X,
  Edit3,
  Gift,
  XCircle,
  Tag,
  Copy,
  Check,
  ArrowRight,
  Layers,
  CheckCircle2,
  User
} from 'lucide-react';

export type CustomerPortalTab = 'overview' | 'bookings' | 'rates' | 'coupons' | 'location';

interface CustomerDashboardProps {
  currentCustomer: CustomerUser;
  myBookings: Booking[];
  business: BusinessConfig;
  ratePlans: DJRatePlan[];
  discountCodes?: DiscountCode[];
  latestOfferBroadcast?: OfferBroadcast | null;
  activeTab: CustomerPortalTab;
  onChangeTab: (tab: CustomerPortalTab) => void;
  onOpenBookingForm: (options?: { couponCode?: string; plan?: DJRatePlan }) => void;
  onEditBooking?: (booking: Booking) => void;
  onCancelBooking?: (bookingId: string) => void;
  onOpenUPIForBooking: (booking: Booking, amount: number) => void;
  onOpenUPI: (amount?: number, note?: string) => void;
  onViewSlip: (booking: Booking) => void;
  onLogout: () => void;
  lang?: 'hi' | 'en';
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  currentCustomer,
  myBookings,
  business,
  ratePlans,
  discountCodes = [],
  latestOfferBroadcast = null,
  activeTab,
  onChangeTab,
  onOpenBookingForm,
  onEditBooking,
  onCancelBooking,
  onOpenUPIForBooking,
  onViewSlip,
  onLogout
}) => {
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const rewardPercent = business.rewardPercent ?? 5;

  const ownerPhotoSrc = business.ownerPhoto?.includes('/public/')
    ? '/owner_sikandar_pandit.jpg'
    : (business.ownerPhoto || '/owner_sikandar_pandit.jpg');

  const rewardSummary = getCustomerRewardSummary(
    myBookings,
    currentCustomer.id,
    currentCustomer.mobile,
    undefined,
    rewardPercent
  );

  const activeCoupons = discountCodes.filter((c) => c.active);
  const recentBookings = myBookings.slice(0, 3);

  const handleCopyCoupon = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 1800);
    } catch {
      setCopiedCode(null);
    }
  };

  // Compact Coupons + Reward Card Block (Placed AFTER My Bookings & Rates)
  const renderCompactCouponsAndReward = () => (
    <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-stone-200">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-amber-600 shrink-0" />
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">
              Coupon Codes & {rewardPercent}% Reward
            </h3>
            <p className="text-[11px] text-slate-500">
              {latestOfferBroadcast?.message || business.activeOfferNote || `हर बुकिंग पर ${rewardPercent}% रिवॉर्ड अगली बुकिंग में ऑफ़ होगा`}
            </p>
          </div>
        </div>

        {/* Reward Balance Moved Here Inside Coupon Section */}
        <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 shrink-0 w-fit">
          <Gift className="w-4 h-4 text-emerald-700 shrink-0" />
          <div className="text-[11px] leading-tight">
            <span className="text-emerald-800 font-semibold">{rewardPercent}% Reward Balance: </span>
            <strong className="font-mono font-extrabold text-emerald-950 tabular-nums">
              ₹{rewardSummary.availableReward.toLocaleString('en-IN')}
            </strong>
          </div>
        </div>
      </div>

      {activeCoupons.length === 0 ? (
        <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-slate-600">
          अभी कोई अलग कूपन कोड सक्रिय नहीं है। आपकी हर बुकिंग पर <strong>{rewardPercent}% रिवॉर्ड</strong> जुड़ेगा।
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {activeCoupons.map((coupon) => {
            const discountText =
              coupon.discountType === 'percent'
                ? `${coupon.discountValue}% OFF`
                : `₹${coupon.discountValue.toLocaleString('en-IN')} OFF`;
            return (
              <div
                key={coupon.id}
                className="p-2.5 rounded-xl bg-stone-50 border border-amber-300/70 flex flex-col justify-between gap-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-extrabold font-mono text-emerald-700 tabular-nums">
                    {discountText}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCoupon(coupon.code)}
                    className="px-2 py-0.5 rounded-md bg-slate-900 text-amber-300 font-mono font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                    title="Copy Code"
                  >
                    <span>{coupon.code}</span>
                    {copiedCode === coupon.code ? (
                      <Check className="w-2.5 h-2.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-2.5 h-2.5" />
                    )}
                  </button>
                </div>

                <div className="text-[10px] text-slate-600 leading-snug line-clamp-2">
                  {coupon.paymentModeScope === 'ALL' ? 'UPI & Cash' : coupon.paymentModeScope}
                  {coupon.minOrderAmount && coupon.minOrderAmount > 0
                    ? ` · Min ₹${coupon.minOrderAmount.toLocaleString('en-IN')}`
                    : ''}
                  {coupon.description ? ` — ${coupon.description}` : ''}
                </div>

                <button
                  type="button"
                  onClick={() => onOpenBookingForm({ couponCode: coupon.code })}
                  className="w-full py-1.5 px-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <span>Use {coupon.code}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div id="home" className="pt-5 pb-4 bg-[#f4f2ec] text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        
        {/* 1. Welcome Customer Header (Clean — Reward removed from here) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-[#0f172a] text-white border border-slate-800 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-amber-400 bg-slate-800 flex items-center justify-center shrink-0">
              {currentCustomer.photoUrl ? (
                <img
                  src={currentCustomer.photoUrl}
                  alt={currentCustomer.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-7 h-7 text-amber-300" />
              )}
            </div>

            <div className="space-y-0.5 min-w-0">
              <div className="text-xs font-medium text-amber-300 flex items-center gap-2">
                <span>Customer Portal</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="font-mono text-slate-300">+91 {currentCustomer.mobile}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white truncate">
                Welcome, {currentCustomer.name}
              </h1>
              <p className="text-xs text-slate-300">
                Bandhi, Khorimahuwa, Rajdhanwar
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onChangeTab('bookings')}
              className="min-h-[42px] px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-amber-300" />
              <span>My Bookings ({myBookings.length})</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenBookingForm()}
              className="min-h-[42px] px-5 py-2 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer shadow-md"
            >
              <PlusCircle className="w-4 h-4" />
              <span>बुकिंग करें (Book DJ)</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="min-h-[42px] px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* 2. BIG PROMINENT OWNER PROFILE CARD (Larger Owner Photo & Details) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border-2 border-amber-400/70 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative shrink-0">
              <div className="w-24 h-28 sm:w-28 sm:h-32 rounded-2xl overflow-hidden border-2 border-amber-500 shadow-lg bg-slate-900">
                <img
                  src={ownerPhotoSrc}
                  alt="Sikandra Kumar Pandit"
                  className="w-full h-full object-cover object-top"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/owner_sikandar_pandit.jpg';
                  }}
                />
              </div>
              <div
                className="absolute -top-2 -right-2 bg-emerald-600 text-white p-1.5 rounded-full shadow"
                title="Verified Owner"
              >
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-1.5 min-w-0">
              <span className="inline-block px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[11px] uppercase tracking-wider">
                मालिक / Proprietor
              </span>
              <h2 className="text-lg sm:text-2xl font-extrabold text-slate-950 tracking-tight">
                {business.ownerNameEn || 'Sikandra Kumar Pandit'}
              </h2>
              <div className="text-xs sm:text-sm text-slate-600 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{business.addressEn || 'Bandhi, Khorimahuwa, Rajdhanwar'}</span>
              </div>
              <div className="text-sm sm:text-base font-mono font-extrabold text-emerald-700">
                +91 {business.phone}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
            <a
              href={`tel:${business.phone}`}
              className="flex-1 sm:flex-initial min-h-[44px] px-5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span>Call Owner</span>
            </a>

            <a
              href={`https://wa.me/${business.whatsapp}?text=Hello%20Sikandra%20ji,%20I%20would%20like%20to%20book%20SK%20Sound%20DJ.`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 sm:flex-initial min-h-[44px] px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

        {/* 3. WORKSPACE TABS BAR (Order: Overview -> My Bookings -> Book Now -> Rate List -> Coupons -> Location) */}
        <div className="flex items-center justify-between gap-2 bg-white p-2 rounded-2xl border border-stone-200 shadow-sm overflow-x-auto">
          <div className="flex items-center gap-1.5">
            {[
              { id: 'overview', label: 'Home' },
              { id: 'bookings', label: `My Bookings (${myBookings.length})` },
              { id: 'rates', label: `Rate List (${ratePlans.length})` },
              { id: 'coupons', label: `Coupons (${activeCoupons.length})` },
              { id: 'location', label: 'Location' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChangeTab(tab.id as CustomerPortalTab)}
                className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#0f172a] text-amber-300 shadow-sm'
                    : 'text-slate-600 hover:bg-stone-100 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onOpenBookingForm()}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>बुकिंग करें</span>
          </button>
        </div>

        {/* DEDICATED COUPONS TAB */}
        {activeTab === 'coupons' && (
          <div className="pb-6">
            {renderCompactCouponsAndReward()}
          </div>
        )}

        {/* OVERVIEW TAB: Strict Order -> 1. My Bookings & बुकिंग करें  ->  2. Rate List  ->  3. Compact Coupon Codes + Reward */}
        {activeTab === 'overview' && (
          <div className="space-y-6 pb-6">
            
            {/* SECTION 1 (FIRST): MY BOOKINGS & BOOK NOW */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-3.5">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-amber-600" />
                    <span>My Bookings ({myBookings.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    अपनी बुकिंग देखें या नई बुकिंग करने के लिए "बुकिंग करें" दबाएँ
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenBookingForm()}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>बुकिंग करें (Book DJ)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onChangeTab('bookings')}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-800 font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <span>All ({myBookings.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {recentBookings.length === 0 ? (
                <div className="p-7 text-center bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                  <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-sm text-slate-600">
                    अभी आपकी कोई बुकिंग नहीं है। नई बुकिंग करने के लिए नीचे बटन दबाएँ।
                  </p>
                  <button
                    type="button"
                    onClick={() => onOpenBookingForm()}
                    className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-xl cursor-pointer"
                  >
                    + बुकिंग करें (Book First Event)
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentBookings.map((b) => (
                    <div
                      key={b.id}
                      className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2 border-b border-stone-200 pb-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-slate-900 text-xs">
                                {b.bookingNumber}
                              </span>
                              {b.editedByCustomer && (
                                <span className="text-[10px] font-semibold text-amber-700">
                                  · Edited
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>
                                {b.eventDate}
                                {b.eventEndDate && b.eventEndDate !== b.eventDate ? ` → ${b.eventEndDate}` : ''}
                              </span>
                            </div>
                          </div>

                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                              b.status === 'cancelled'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : b.status === 'confirmed' || b.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : b.status === 'utr_submitted'
                                ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {b.status === 'cancelled'
                              ? 'Cancelled'
                              : b.status === 'quote_pending' || b.totalAmount === 0
                              ? 'Rate Pending'
                              : b.status === 'utr_submitted'
                              ? 'UTR Pending'
                              : b.status === 'confirmed'
                              ? 'Confirmed'
                              : b.status === 'completed'
                              ? 'Completed'
                              : 'Pay Pending'}
                          </span>
                        </div>

                        {b.requirementPhoto && (
                          <div className="p-2 rounded-xl bg-white border border-amber-200 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <img
                                src={b.requirementPhoto}
                                alt="Slip Photo"
                                onClick={() => setActivePhotoUrl(b.requirementPhoto || null)}
                                className="w-9 h-10 object-cover rounded border border-amber-400 cursor-pointer shrink-0"
                              />
                              <span className="text-[11px] font-bold text-slate-800 truncate">
                                कॉपी पर्ची संलग्न
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setActivePhotoUrl(b.requirementPhoto || null)}
                              className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-slate-800 rounded-md text-[10px] font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                            >
                              <Eye className="w-3 h-3" />
                              <span>देखें</span>
                            </button>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs bg-white p-2.5 rounded-xl border border-stone-200">
                          <div>
                            <span className="text-[10px] text-slate-500 block">Total</span>
                            <span className="font-mono font-bold text-slate-900 tabular-nums">
                              {b.totalAmount === 0 || b.status === 'quote_pending'
                                ? '₹00'
                                : `₹${b.totalAmount.toLocaleString('en-IN')}`}
                            </span>
                            {getBookingRewardEarned(b, rewardPercent) > 0 && (
                              <span className="block text-[10px] font-mono text-emerald-700 font-semibold">
                                +₹{getBookingRewardEarned(b, rewardPercent).toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Paid</span>
                            <span className="font-mono font-bold text-emerald-700 tabular-nums">
                              ₹{b.advancePaid.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 block">Due</span>
                            <span className="font-mono font-bold text-amber-700 tabular-nums">
                              {b.totalAmount === 0 || b.status === 'quote_pending'
                                ? '—'
                                : `₹${b.balanceDue.toLocaleString('en-IN')}`}
                            </span>
                          </div>
                        </div>

                        {b.status === 'utr_submitted' && (
                          <div className="p-2 rounded-lg bg-cyan-50 border border-cyan-200 text-[11px] text-cyan-900 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-cyan-700 shrink-0" />
                            <span>UTR: <strong>{b.pendingUtrNumber}</strong></span>
                          </div>
                        )}

                        {(b.totalAmount === 0 || b.status === 'quote_pending') && (
                          <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                            <span>मालिक द्वारा रेट तय होने पर पेमेंट खुलेगा।</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {canCustomerEditBooking(b) && onEditBooking && (
                          <button
                            type="button"
                            onClick={() => onEditBooking(b)}
                            className="py-1.5 px-2.5 bg-amber-100 hover:bg-amber-400 text-amber-900 hover:text-slate-950 border border-amber-300 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onViewSlip(b)}
                          className="flex-1 py-1.5 px-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <FileText className="w-3 h-3 text-amber-300" />
                          <span>Slip</span>
                        </button>

                        {b.status !== 'cancelled' && b.totalAmount > 0 && b.balanceDue > 0 && b.status !== 'utr_submitted' && (
                          <button
                            type="button"
                            onClick={() => onOpenUPIForBooking(b, b.balanceDue)}
                            className="py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <QrCode className="w-3 h-3" />
                            <span>Pay ₹{b.balanceDue.toLocaleString('en-IN')}</span>
                          </button>
                        )}

                        {onCancelBooking && b.status !== 'completed' && b.status !== 'cancelled' && (
                          confirmCancelId === b.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  onCancelBooking(b.id);
                                  setConfirmCancelId(null);
                                }}
                                className="py-1 px-2 bg-rose-600 text-white rounded-md text-[10px] font-bold cursor-pointer"
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmCancelId(null)}
                                className="py-1 px-2 bg-stone-200 text-slate-700 rounded-md text-[10px] cursor-pointer"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmCancelId(b.id)}
                              className="py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <XCircle className="w-3 h-3" />
                              <span>Cancel</span>
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECTION 2 (SECOND): RATE LIST */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-600" />
                  <span>DJ & Lighting Rate List</span>
                </h3>
                <button
                  type="button"
                  onClick={() => onChangeTab('rates')}
                  className="text-xs font-bold text-amber-700 hover:text-amber-600 cursor-pointer flex items-center gap-1"
                >
                  <span>All Rates ({ratePlans.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {ratePlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {plan.nameEn || plan.nameHi}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {plan.unitLabel || plan.durationLabel}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-200">
                      <span className="font-mono font-extrabold text-sm text-slate-900 tabular-nums">
                        {plan.isOwnerQuoted || plan.price === 0
                          ? 'Owner Set'
                          : `₹${plan.price.toLocaleString('en-IN')}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => onOpenBookingForm({ plan })}
                        className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs cursor-pointer transition-colors"
                      >
                        Book
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 3 (THIRD & COMPACT): COUPON CODES + REWARD WALLET */}
            {renderCompactCouponsAndReward()}

          </div>
        )}

      </div>

      {/* Full Photo Modal */}
      {activePhotoUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative max-w-2xl w-full bg-white border border-stone-300 rounded-2xl p-4 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Camera className="w-4 h-4 text-amber-600" />
                <span>Customer Handwritten Requirement Slip</span>
              </div>
              <button
                type="button"
                onClick={() => setActivePhotoUrl(null)}
                className="p-1.5 rounded-lg bg-stone-100 text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-auto rounded-xl bg-stone-100 flex items-center justify-center p-2 border border-stone-200">
              <img
                src={activePhotoUrl}
                alt="Enlarged Customer List"
                className="max-h-[70vh] w-auto object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
