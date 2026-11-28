import React, { useState } from 'react';
import {
  CustomerUser,
  Booking,
  BusinessConfig,
  DJRatePlan,
  OfferBroadcast,
  DiscountCode,
  PriceCategoryMeta
} from '../types';
import { canCustomerEditBooking } from '../utils/bookingUtils';
import { getBookingRewardEarned, getCustomerRewardSummary } from '../utils/rewardUtils';
import { RATE_PLAN_IMAGES } from '../data/initialData';
import {
  PRICE_CATEGORIES,
  PriceCategoryFilter,
  PriceCategoryKey,
  PriceLanguageMode,
  getBilingualUnit,
  getCategoryLabel,
  resolveRateCategory
} from '../utils/rateCategories';
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
  User,
  Music2,
  Lightbulb,
  Utensils,
  Armchair,
  Shirt,
  Languages
} from 'lucide-react';

export type CustomerPortalTab = 'overview' | 'bookings' | 'rates' | 'coupons' | 'location';

interface CustomerDashboardProps {
  currentCustomer: CustomerUser;
  myBookings: Booking[];
  business: BusinessConfig;
  ratePlans: DJRatePlan[];
  categories?: PriceCategoryMeta[];
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
  categories = PRICE_CATEGORIES,
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
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [rateCategory, setRateCategory] = useState<PriceCategoryKey>(categories[0]?.key || 'dj');
  const [rateLangMode, setRateLangMode] = useState<PriceLanguageMode>('both');

  React.useEffect(() => {
    const handleBackClose = (e: Event) => {
      if (activePhotoUrl) {
        e.preventDefault();
        setActivePhotoUrl(null);
      }
    };
    window.addEventListener('sk-close-child-modal', handleBackClose);
    return () => window.removeEventListener('sk-close-child-modal', handleBackClose);
  }, [activePhotoUrl]);

  const getCategoryIcon = (cat: PriceCategoryKey, className = 'w-5 h-5 text-amber-400') => {
    switch (cat) {
      case 'light':
        return <Lightbulb className={className} />;
      case 'utensils':
        return <Utensils className={className} />;
      case 'table_chair':
        return <Armchair className={className} />;
      case 'clothes':
        return <Shirt className={className} />;
      case 'dj':
      default:
        return <Music2 className={className} />;
    }
  };

  const activeRateCategory = categories.some((c) => c.key === rateCategory)
    ? rateCategory
    : (categories[0]?.key || 'dj');

  const filteredOverviewRates = ratePlans.filter(
    (plan) => resolveRateCategory(plan, categories) === activeRateCategory
  );

  const getProductImage = (plan: DJRatePlan): string | undefined => {
    if (plan.imageUrl !== undefined) {
      return plan.imageUrl || undefined;
    }
    return RATE_PLAN_IMAGES[plan.id];
  };

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
    <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-lg space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <h3 className="text-sm font-extrabold text-white">
              Coupon Codes & {rewardPercent}% Reward
            </h3>
            <p className="text-[11px] text-neutral-400">
              {latestOfferBroadcast?.message || business.activeOfferNote || `हर बुकिंग पर ${rewardPercent}% रिवॉर्ड अगली बुकिंग में ऑफ़ होगा`}
            </p>
          </div>
        </div>

        {/* Reward Balance Moved Here Inside Coupon Section */}
        <div className="px-3 py-1.5 rounded-xl bg-emerald-950/50 border border-emerald-700/50 flex items-center gap-2 shrink-0 w-fit">
          <Gift className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="text-[11px] leading-tight">
            <span className="text-emerald-300 font-semibold">{rewardPercent}% Reward Balance: </span>
            <strong className="font-mono font-extrabold text-white tabular-nums">
              ₹{rewardSummary.availableReward.toLocaleString('en-IN')}
            </strong>
          </div>
        </div>
      </div>

      {activeCoupons.length === 0 ? (
        <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-400">
          अभी कोई अलग कूपन कोड सक्रिय नहीं है। आपकी हर बुकिंग पर <strong className="text-white">{rewardPercent}% रिवॉर्ड</strong> जुड़ेगा।
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
                className="p-2.5 rounded-xl bg-neutral-950 border border-amber-500/30 flex flex-col justify-between gap-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-extrabold font-mono text-emerald-400 tabular-nums">
                    {discountText}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCoupon(coupon.code)}
                    className="px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-700 text-amber-300 font-mono font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
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

                <div className="text-[10px] text-neutral-400 leading-snug line-clamp-2">
                  {coupon.paymentModeScope === 'ALL' ? 'UPI & Cash' : coupon.paymentModeScope}
                  {coupon.minOrderAmount && coupon.minOrderAmount > 0
                    ? ` · Min ₹${coupon.minOrderAmount.toLocaleString('en-IN')}`
                    : ''}
                  {coupon.description ? ` — ${coupon.description}` : ''}
                </div>

                <button
                  type="button"
                  onClick={() => onOpenBookingForm({ couponCode: coupon.code })}
                  className="w-full py-1.5 px-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
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
    <div id="home" className="pt-5 pb-4 bg-neutral-950 text-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        
        {/* 1. Welcome Customer Header (Original Dark & Gold DJ Theme) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-black text-white border border-neutral-800 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-amber-400 bg-neutral-950 flex items-center justify-center shrink-0">
              {currentCustomer.photoUrl ? (
                <img
                  src={currentCustomer.photoUrl}
                  alt={currentCustomer.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-7 h-7 text-amber-400" />
              )}
            </div>

            <div className="space-y-0.5 min-w-0">
              <div className="text-xs font-medium text-amber-400 flex items-center gap-2">
                <span>Customer Portal</span>
                <span aria-hidden="true" className="text-neutral-600">·</span>
                <span className="font-mono text-neutral-300">+91 {currentCustomer.mobile}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white truncate">
                Welcome, {currentCustomer.name}
              </h1>
              <p className="text-xs text-neutral-400">
                Bandhi, Khorimahuwa, Rajdhanwar
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onChangeTab('bookings')}
              className="min-h-[42px] px-4 py-2 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs flex items-center gap-1.5 border border-neutral-700 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>My Bookings ({myBookings.length})</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenBookingForm()}
              className="min-h-[42px] px-5 py-2 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer shadow-md"
            >
              <PlusCircle className="w-4 h-4" />
              <span>बुकिंग करें (Book DJ)</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="min-h-[42px] px-3.5 py-2 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-neutral-700 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* 2. BIG PROMINENT OWNER PROFILE CARD (Larger Owner Photo & Details) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-neutral-900 border-2 border-amber-500/40 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative shrink-0">
              <div className="w-24 h-28 sm:w-28 sm:h-32 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-lg bg-neutral-950">
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
                className="absolute -top-2 -right-2 bg-emerald-500 text-black p-1.5 rounded-full shadow"
                title="Verified Owner"
              >
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-1.5 min-w-0">
              <span className="inline-block px-2.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-[11px] uppercase tracking-wider">
                मालिक / Proprietor
              </span>
              <h2 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight">
                {business.ownerNameEn || 'Sikandra Kumar Pandit'}
              </h2>
              <div className="text-xs sm:text-sm text-neutral-300 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{business.addressEn || 'Bandhi, Khorimahuwa, Rajdhanwar'}</span>
              </div>
              <div className="text-sm sm:text-base font-mono font-extrabold text-emerald-400">
                +91 {business.phone}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
            <a
              href={`tel:${business.phone}`}
              className="flex-1 sm:flex-initial min-h-[44px] px-5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
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
        <div className="flex items-center justify-between gap-2 bg-neutral-900 p-2 rounded-2xl border border-neutral-800 shadow-sm overflow-x-auto">
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
                    ? 'bg-amber-400 text-black shadow-sm'
                    : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onOpenBookingForm()}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
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
            <div className="p-5 sm:p-6 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3.5">
                <div>
                  <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-amber-400" />
                    <span>My Bookings ({myBookings.length})</span>
                  </h3>
                  <p className="text-xs text-neutral-400">
                    अपनी बुकिंग देखें या नई बुकिंग करने के लिए "बुकिंग करें" दबाएँ
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenBookingForm()}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>बुकिंग करें (Book DJ)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onChangeTab('bookings')}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs flex items-center gap-1 border border-neutral-700 cursor-pointer"
                  >
                    <span>All ({myBookings.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {recentBookings.length === 0 ? (
                <div className="p-7 text-center bg-neutral-950 rounded-2xl border border-neutral-800 space-y-3">
                  <Calendar className="w-8 h-8 text-neutral-500 mx-auto" />
                  <p className="text-sm text-neutral-400">
                    अभी आपकी कोई बुकिंग नहीं है। नई बुकिंग करने के लिए नीचे बटन दबाएँ।
                  </p>
                  <button
                    type="button"
                    onClick={() => onOpenBookingForm()}
                    className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs rounded-xl cursor-pointer"
                  >
                    + बुकिंग करें (Book First Event)
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentBookings.map((b) => (
                    <div
                      key={b.id}
                      className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2 border-b border-neutral-800 pb-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-white text-xs">
                                {b.bookingNumber}
                              </span>
                              {b.editedByCustomer && (
                                <span className="text-[10px] font-semibold text-amber-400">
                                  · Edited
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3 text-amber-400" />
                              <span>
                                {b.eventDate}
                                {b.eventEndDate && b.eventEndDate !== b.eventDate ? ` → ${b.eventEndDate}` : ''}
                              </span>
                            </div>
                          </div>

                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                              b.status === 'cancelled'
                                ? 'bg-rose-950/60 text-rose-300 border-rose-700/60'
                                : b.status === 'confirmed' || b.status === 'completed'
                                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60'
                                : b.status === 'utr_submitted'
                                ? 'bg-cyan-950/60 text-cyan-300 border-cyan-700/60'
                                : 'bg-amber-950/60 text-amber-300 border-amber-700/60'
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
                          <div className="p-2 rounded-xl bg-neutral-900 border border-amber-500/30 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <img
                                src={b.requirementPhoto}
                                alt="Slip Photo"
                                onClick={() => setActivePhotoUrl(b.requirementPhoto || null)}
                                className="w-9 h-10 object-cover rounded border border-amber-400 cursor-pointer shrink-0"
                              />
                              <span className="text-[11px] font-bold text-neutral-200 truncate">
                                कॉपी पर्ची संलग्न
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setActivePhotoUrl(b.requirementPhoto || null)}
                              className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-md text-[10px] font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                            >
                              <Eye className="w-3 h-3" />
                              <span>देखें</span>
                            </button>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs bg-neutral-900 p-2.5 rounded-xl border border-neutral-800">
                          <div>
                            <span className="text-[10px] text-neutral-400 block">Total</span>
                            <span className="font-mono font-bold text-white tabular-nums">
                              {b.totalAmount === 0 || b.status === 'quote_pending'
                                ? '₹00'
                                : `₹${b.totalAmount.toLocaleString('en-IN')}`}
                            </span>
                            {getBookingRewardEarned(b, rewardPercent) > 0 && (
                              <span className="block text-[10px] font-mono text-emerald-400 font-semibold">
                                +₹{getBookingRewardEarned(b, rewardPercent).toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="text-[10px] text-neutral-400 block">Paid</span>
                            <span className="font-mono font-bold text-emerald-400 tabular-nums">
                              ₹{b.advancePaid.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-neutral-400 block">Due</span>
                            <span className="font-mono font-bold text-amber-400 tabular-nums">
                              {b.totalAmount === 0 || b.status === 'quote_pending'
                                ? '—'
                                : `₹${b.balanceDue.toLocaleString('en-IN')}`}
                            </span>
                          </div>
                        </div>

                        {b.status === 'utr_submitted' && (
                          <div className="p-2 rounded-lg bg-cyan-950/50 border border-cyan-700/50 text-[11px] text-cyan-200 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span>UTR: <strong>{b.pendingUtrNumber}</strong></span>
                          </div>
                        )}

                        {(b.totalAmount === 0 || b.status === 'quote_pending') && (
                          <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-600/40 text-[11px] text-amber-200 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>मालिक द्वारा रेट तय होने पर पेमेंट खुलेगा।</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {canCustomerEditBooking(b) && onEditBooking && (
                          <button
                            type="button"
                            onClick={() => onEditBooking(b)}
                            className="py-1.5 px-2.5 bg-amber-500/15 hover:bg-amber-400 text-amber-300 hover:text-black border border-amber-500/40 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onViewSlip(b)}
                          className="flex-1 py-1.5 px-2.5 bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <FileText className="w-3 h-3 text-amber-400" />
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
                                className="py-1 px-2 bg-neutral-800 text-neutral-300 rounded-md text-[10px] cursor-pointer"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmCancelId(b.id)}
                              className="py-1.5 px-2 bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 border border-rose-700/50 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
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

            {/* SECTION 2 (SECOND): BILINGUAL 5-CATEGORY RATE LIST WITH SMALL PRODUCT PHOTOS */}
            <div className="p-5 sm:p-6 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-amber-400" />
                    <span>Price List / रेट लिस्ट</span>
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    DJ · Light · बर्तन (Utensils) · टेबल-कुर्सी (Table & Chair) · कपड़ा (Clothes)
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Language Toggle (Both / Hindi / English) */}
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-neutral-950 border border-neutral-800">
                    <Languages className="w-3.5 h-3.5 text-amber-400 ml-1" />
                    {[
                      { key: 'both', label: 'HI+EN' },
                      { key: 'hi', label: 'हिंदी' },
                      { key: 'en', label: 'EN' }
                    ].map((m) => (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setRateLangMode(m.key as PriceLanguageMode)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                          rateLangMode === m.key
                            ? 'bg-amber-400 text-black'
                            : 'text-neutral-300 hover:text-white'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => onChangeTab('rates')}
                    className="text-xs font-bold text-amber-400 hover:text-amber-300 cursor-pointer flex items-center gap-1 px-2 py-1"
                  >
                    <span>Full List / पूरी लिस्ट</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Large Clickable Bilingual Category Cards (No 'All' button) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
                {categories.map((cat) => {
                  const cnt = ratePlans.filter((p) => resolveRateCategory(p, categories) === cat.key).length;
                  const active = activeRateCategory === cat.key;
                  const titlePrimary =
                    rateLangMode === 'hi' ? cat.labelHi : cat.labelEn;
                  const titleSecondary =
                    rateLangMode === 'both' && cat.labelHi && cat.labelHi !== cat.labelEn
                      ? cat.labelHi
                      : '';
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setRateCategory(cat.key)}
                      className={`p-3.5 sm:p-4 rounded-2xl border text-left flex flex-col justify-between gap-2.5 cursor-pointer transition-all ${
                        active
                          ? 'bg-amber-400 text-black border-amber-300 shadow-lg ring-2 ring-amber-400/40'
                          : 'bg-neutral-950 text-white border-neutral-800 hover:border-amber-500/50 hover:bg-neutral-900/90'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            active
                              ? 'bg-black/15 text-black'
                              : 'bg-amber-400/10 border border-amber-400/30 text-amber-400'
                          }`}
                        >
                          {getCategoryIcon(cat.key, `w-5 h-5 ${active ? 'text-black' : 'text-amber-400'}`)}
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[11px] font-extrabold font-mono ${
                            active
                              ? 'bg-black/15 text-black'
                              : 'bg-neutral-900 border border-neutral-800 text-amber-300'
                          }`}
                        >
                          {cnt} {rateLangMode === 'hi' ? 'आइटम' : 'Items'}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className={`text-sm sm:text-base font-extrabold leading-tight truncate ${active ? 'text-black' : 'text-white'}`}>
                          {titlePrimary}
                        </div>
                        {titleSecondary && (
                          <div className={`text-xs font-bold mt-0.5 truncate ${active ? 'text-neutral-900' : 'text-amber-300/90'}`}>
                            {titleSecondary}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Active Category Indicator */}
              <div className="flex items-center justify-between gap-2 px-1 pt-1">
                <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  {getCategoryIcon(activeRateCategory, 'w-4 h-4 text-amber-400')}
                  <span>
                    {getCategoryLabel(activeRateCategory, rateLangMode, categories)} ({filteredOverviewRates.length})
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {filteredOverviewRates.map((plan) => {
                  const imgSrc = getProductImage(plan);
                  const hasValidImage = Boolean(imgSrc && !failedImages[plan.id]);
                  const resolvedCat = resolveRateCategory(plan, categories);
                  const enTitle = (plan.nameEn || plan.nameHi || '').trim();
                  const hiTitle = (plan.nameHi || plan.nameEn || '').trim();

                  return (
                    <div
                      key={plan.id}
                      className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-amber-500/40 flex flex-col justify-between gap-2.5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {/* Small Compact Thumbnail Photo */}
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900 shrink-0 flex items-center justify-center relative">
                          {hasValidImage ? (
                            <img
                              src={imgSrc}
                              alt={enTitle}
                              referrerPolicy="no-referrer"
                              onError={() =>
                                setFailedImages((prev) => ({ ...prev, [plan.id]: true }))
                              }
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            getCategoryIcon(resolvedCat, 'w-5 h-5 text-amber-400')
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white truncate">
                              {rateLangMode === 'hi' ? hiTitle : enTitle}
                            </span>
                            {plan.popular && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-bold text-[9px] uppercase shrink-0">
                                Popular
                              </span>
                            )}
                          </div>
                          {rateLangMode === 'both' && hiTitle && hiTitle !== enTitle && (
                            <div className="text-[11px] font-medium text-amber-300/90 truncate">
                              {hiTitle}
                            </div>
                          )}
                          <div className="text-[10px] text-neutral-400 truncate mt-0.5">
                            {getCategoryLabel(resolvedCat, rateLangMode, categories)} · {getBilingualUnit(plan.unitLabel, rateLangMode)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-800/80">
                        <span className="font-mono font-extrabold text-sm text-amber-400 tabular-nums">
                          {plan.isOwnerQuoted || plan.price === 0
                            ? rateLangMode === 'hi'
                              ? 'मालिक तय करेंगे'
                              : 'Owner Set'
                            : `₹${plan.price.toLocaleString('en-IN')}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => onOpenBookingForm({ plan })}
                          className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs cursor-pointer transition-colors"
                        >
                          {rateLangMode === 'hi' ? 'बुक करें' : rateLangMode === 'en' ? 'Book' : 'Book / बुक'}
                        </button>
                      </div>
                    </div>
                  );
                })}
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
          <div className="relative max-w-2xl w-full bg-neutral-900 border border-neutral-700 rounded-2xl p-4 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Camera className="w-4 h-4 text-amber-400" />
                <span>Customer Handwritten Requirement Slip</span>
              </div>
              <button
                type="button"
                onClick={() => setActivePhotoUrl(null)}
                className="p-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-auto rounded-xl bg-neutral-950 flex items-center justify-center p-2 border border-neutral-800">
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
