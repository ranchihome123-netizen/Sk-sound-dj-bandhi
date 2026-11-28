import React from 'react';
import {
  Booking,
  BusinessConfig,
  CustomerNotification,
  CustomerUser,
  DJRatePlan,
  DiscountCode,
  OfferBroadcast,
  PriceCategoryMeta,
  StaffDutyRecord,
  StaffMember,
  StaffPaymentRecord
} from '../types';
import { OwnerIncomeSection } from './OwnerIncomeSection';
import { OwnerUpcomingBookings } from './OwnerUpcomingBookings';
import { OwnerDiscountManager } from './OwnerDiscountManager';
import { OwnerRateManager } from './OwnerRateManager';
import { OwnerBookingManager } from './OwnerBookingManager';
import { StaffManagement } from './StaffManagement';
import { LocationContact } from './LocationContact';
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Layers,
  MapPin,
  ShieldCheck,
  Tag,
  TrendingUp,
  Users
} from 'lucide-react';

export type OwnerSectionId =
  | 'upcoming'
  | 'discounts'
  | 'bookings'
  | 'income'
  | 'rates'
  | 'staff'
  | 'location';

interface OwnerPortalWorkspaceProps {
  activeSection: OwnerSectionId | null;
  onSelectSection: (sec: OwnerSectionId | null) => void;
  business: BusinessConfig;
  activeRewardPercent: number;
  bookings: Booking[];
  ratePlans: DJRatePlan[];
  categories: PriceCategoryMeta[];
  discountCodes: DiscountCode[];
  customerList: CustomerUser[];
  offerBroadcasts: OfferBroadcast[];
  staffList: StaffMember[];
  lastOwnerWhatsappNotice: CustomerNotification | null;
  lang: 'hi' | 'en';
  onUpdateBusinessName: (newName: string) => void;
  onUpdateRatePlans: (newPlans: DJRatePlan[]) => void;
  onUpdateCategories: (newCats: PriceCategoryMeta[]) => void;
  onAddBookingToList: (booking: Booking) => void;
  onDeleteBookingFromList: (bookingId: string) => void;
  onUpdateBookingStatus: (bookingId: string, status: Booking['status']) => void;
  onUpdateBookingPrice: (bookingId: string, newTotal: number, newPaid?: number) => void;
  onApproveUtrPayment: (bookingId: string) => void;
  onMarkEditReviewed: (bookingId: string) => void;
  onDismissWhatsappDispatch: () => void;
  onViewSlip: (booking: Booking) => void;
  onOpenUPIForBooking: (booking: Booking, amount: number) => void;
  onOpenUPI: (amount?: number, note?: string) => void;
  onAddDiscountCode: (newCode: DiscountCode) => void;
  onToggleDiscountCode: (id: string) => void;
  onDeleteDiscountCode: (id: string) => void;
  onSaveOfferPercent: (percent: number, offerNote: string) => void;
  onBroadcastOfferToAll: (payload: {
    offerPercent: number;
    message: string;
    selectedCustomerIds?: string[];
  }) => void;
  onAddStaff: (newStaff: StaffMember) => void;
  onDeleteStaff: (staffId: string) => void;
  onRecordDuty: (staffId: string, duty: StaffDutyRecord) => void;
  onRecordPayment: (staffId: string, payment: StaffPaymentRecord) => void;
}

const parseLocalDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
};

export const OwnerPortalWorkspace: React.FC<OwnerPortalWorkspaceProps> = ({
  activeSection,
  onSelectSection,
  business,
  activeRewardPercent,
  bookings,
  ratePlans,
  categories,
  discountCodes,
  customerList,
  offerBroadcasts,
  staffList,
  lastOwnerWhatsappNotice,
  lang,
  onUpdateBusinessName,
  onUpdateRatePlans,
  onUpdateCategories,
  onAddBookingToList,
  onDeleteBookingFromList,
  onUpdateBookingStatus,
  onUpdateBookingPrice,
  onApproveUtrPayment,
  onMarkEditReviewed,
  onDismissWhatsappDispatch,
  onViewSlip,
  onOpenUPIForBooking,
  onOpenUPI,
  onAddDiscountCode,
  onToggleDiscountCode,
  onDeleteDiscountCode,
  onSaveOfferPercent,
  onBroadcastOfferToAll,
  onAddStaff,
  onDeleteStaff,
  onRecordDuty,
  onRecordPayment
}) => {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfNext7Days = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);

  const upcomingCount = bookings.filter((b) => {
    if (b.status === 'cancelled') return false;
    const startDate = parseLocalDate(b.eventDate);
    if (!startDate) return false;
    const endDate = parseLocalDate(b.eventEndDate || b.eventDate) || startDate;
    return startDate <= endOfNext7Days && endDate >= startOfToday;
  }).length;

  const pendingActionCount = bookings.filter(
    (b) =>
      b.status === 'utr_submitted' ||
      b.status === 'quote_pending' ||
      (b.editedByCustomer && !b.ownerEditReviewed)
  ).length;

  let todayIncome = 0;
  let totalIncome = 0;
  bookings.forEach((b) => {
    if (b.paymentHistory && b.paymentHistory.length > 0) {
      b.paymentHistory.forEach((p) => {
        totalIncome += p.amount;
        if (p.verifiedAt.slice(0, 10) === todayStr) {
          todayIncome += p.amount;
        }
      });
    } else if (b.advancePaid > 0 && (b.status === 'confirmed' || b.status === 'completed')) {
      totalIncome += b.advancePaid;
      if ((b.paymentVerifiedAt || b.createdAt).slice(0, 10) === todayStr) {
        todayIncome += b.advancePaid;
      }
    }
  });

  const activeCodesCount = discountCodes.filter((d) => d.active).length;

  const ownerPhotoSrc = business.ownerPhoto?.includes('/public/')
    ? '/owner_sikandar_pandit.jpg'
    : (business.ownerPhoto || '/owner_sikandar_pandit.jpg');

  const menuCards: Array<{
    id: OwnerSectionId;
    titleEn: string;
    titleHi: string;
    subtitle: string;
    badge: string;
    urgentBadge?: string;
    icon: React.ReactNode;
    accentClass: string;
  }> = [
    {
      id: 'upcoming',
      titleEn: 'Upcoming Bookings',
      titleHi: 'आगामी बुकिंग (7 दिन)',
      subtitle: 'Next 7 days events, Call & WhatsApp',
      badge: `${upcomingCount} Upcoming`,
      urgentBadge: upcomingCount > 0 ? 'Active' : undefined,
      icon: <CalendarClock className="w-6 h-6 text-amber-400" />,
      accentClass: 'border-amber-500/40 hover:border-amber-400'
    },
    {
      id: 'discounts',
      titleEn: 'Create Discount & Send Offer',
      titleHi: 'डिस्काउंट व ऑफर भेजें',
      subtitle: 'Coupons, Offer % & WhatsApp Broadcast',
      badge: `${activeRewardPercent}% · ${activeCodesCount} Codes`,
      icon: <Tag className="w-6 h-6 text-emerald-400" />,
      accentClass: 'border-emerald-500/40 hover:border-emerald-400'
    },
    {
      id: 'bookings',
      titleEn: 'All Bookings & UTR Verify',
      titleHi: 'सभी बुकिंग रजिस्टर',
      subtitle: 'Manage bookings, set rate & verify UPI',
      badge: `${bookings.length} Bookings`,
      urgentBadge: pendingActionCount > 0 ? `${pendingActionCount} Pending` : undefined,
      icon: <ClipboardList className="w-6 h-6 text-amber-400" />,
      accentClass: 'border-neutral-800 hover:border-amber-400'
    },
    {
      id: 'income',
      titleEn: 'Income Report',
      titleHi: 'कमाई रिपोर्ट',
      subtitle: 'Today, Monthly, 6-Month & Annual',
      badge: `Today ₹${todayIncome.toLocaleString('en-IN')}`,
      icon: <TrendingUp className="w-6 h-6 text-emerald-400" />,
      accentClass: 'border-neutral-800 hover:border-emerald-400'
    },
    {
      id: 'rates',
      titleEn: 'Price List & Categories',
      titleHi: 'रेट लिस्ट व कैटेगरी',
      subtitle: 'DJ, Light, बर्तन, कुर्सी-टेबल, कपड़ा Edit',
      badge: `${categories.length} Cat. · ${ratePlans.length} Items`,
      icon: <Layers className="w-6 h-6 text-amber-400" />,
      accentClass: 'border-neutral-800 hover:border-amber-400'
    },
    {
      id: 'staff',
      titleEn: 'Staff Management',
      titleHi: 'स्टाफ ड्यूटी व हिसाब',
      subtitle: 'Duty log, advance & salary settlement',
      badge: `${staffList.length} Staff`,
      icon: <Users className="w-6 h-6 text-cyan-400" />,
      accentClass: 'border-neutral-800 hover:border-cyan-400'
    },
    {
      id: 'location',
      titleEn: 'Shop Location & Contact',
      titleHi: 'दुकान पता व संपर्क',
      subtitle: 'Bandhi, Khorimahuwa, Rajdhanwar',
      badge: `+91 ${business.phone}`,
      icon: <MapPin className="w-6 h-6 text-amber-400" />,
      accentClass: 'border-neutral-800 hover:border-amber-400'
    }
  ];

  const handleOpenCard = (id: OwnerSectionId) => {
    onSelectSection(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-[75vh] bg-neutral-950">
      {/* When NO specific section is selected, show the clean Large Card Owner Menu */}
      {activeSection === null ? (
        <section className="py-6 sm:py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            {/* Owner Welcome & Quick Summary Banner */}
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/35 border border-amber-500/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="relative shrink-0">
                  <img
                    src={ownerPhotoSrc}
                    alt="Sikandra Kumar Pandit"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/owner_sikandar_pandit.jpg';
                    }}
                    className="w-16 h-20 rounded-2xl object-cover object-top border-2 border-amber-400 shadow-lg"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-black p-1 rounded-full shadow">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-300 bg-amber-500/15 px-2.5 py-0.5 rounded-md border border-amber-500/30 mb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>Owner Portal · मालिक डैशबोर्ड</span>
                  </div>
                  <h1 className="text-lg sm:text-xl font-extrabold text-white truncate">
                    {business.businessNameEn || 'SK Sound DJ Bandhi'}
                  </h1>
                  <p className="text-xs text-neutral-300">
                    Sikandra Kumar Pandit · किसी भी ऑप्शन पर टच करें उसे खोलने के लिए
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:w-auto shrink-0">
                <div className="px-3.5 py-2 rounded-xl bg-neutral-950/90 border border-neutral-800">
                  <div className="text-[10px] text-neutral-400">Total Income (कुल)</div>
                  <div className="text-sm sm:text-base font-extrabold font-mono text-emerald-400">
                    ₹{totalIncome.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="px-3.5 py-2 rounded-xl bg-neutral-950/90 border border-neutral-800">
                  <div className="text-[10px] text-neutral-400">Pending Actions</div>
                  <div className={`text-sm sm:text-base font-extrabold font-mono ${pendingActionCount > 0 ? 'text-amber-400' : 'text-neutral-300'}`}>
                    {pendingActionCount} Alert{pendingActionCount === 1 ? '' : 's'}
                  </div>
                </div>
              </div>
            </div>

            {/* Large Tap-to-Open Owner Portal Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {menuCards.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => handleOpenCard(card.id)}
                  className={`p-4 sm:p-5 rounded-2xl bg-neutral-900 border text-left flex flex-col justify-between gap-3.5 cursor-pointer transition-all hover:-translate-y-0.5 hover:bg-neutral-900/95 shadow-lg ${card.accentClass}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-center shrink-0">
                      {card.icon}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="px-2 py-0.5 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] font-extrabold font-mono text-amber-300 whitespace-nowrap">
                        {card.badge}
                      </span>
                      {card.urgentBadge && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-400 text-black text-[10px] font-extrabold uppercase animate-pulse">
                          {card.urgentBadge}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="text-sm sm:text-base font-extrabold text-white leading-snug">
                      {card.titleEn}
                    </div>
                    <div className="text-xs font-bold text-amber-300/90 leading-snug">
                      {card.titleHi}
                    </div>
                    <div className="text-[11px] text-neutral-400 line-clamp-1 pt-0.5">
                      {card.subtitle}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : (
        /* Active Section View with Clean Back-to-Menu & Quick Switch Strip */
        <div>
          <div className="bg-neutral-900/95 border-b border-neutral-800 sticky top-18 z-30 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => {
                  onSelectSection(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer shadow"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Owner Menu / मेनू</span>
              </button>

              <div className="h-5 w-px bg-neutral-800 shrink-0" />

              {menuCards.map((card) => {
                const isActive = activeSection === card.id;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => handleOpenCard(card.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 border cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-amber-400/20 text-amber-300 border-amber-400/60'
                        : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-amber-500/40 hover:text-white'
                    }`}
                  >
                    {card.titleEn}
                  </button>
                );
              })}
            </div>
          </div>

          {activeSection === 'income' && <OwnerIncomeSection bookings={bookings} />}

          {activeSection === 'upcoming' && (
            <OwnerUpcomingBookings
              bookings={bookings}
              onViewSlip={onViewSlip}
              onOpenAllBookings={() => handleOpenCard('bookings')}
            />
          )}

          {activeSection === 'discounts' && (
            <OwnerDiscountManager
              discountCodes={discountCodes}
              rewardPercent={activeRewardPercent}
              activeOfferNote={business.activeOfferNote}
              customerList={customerList}
              offerBroadcasts={offerBroadcasts}
              businessName={business.businessNameEn}
              ownerPhone={business.phone}
              onAddDiscountCode={onAddDiscountCode}
              onToggleDiscountCode={onToggleDiscountCode}
              onDeleteDiscountCode={onDeleteDiscountCode}
              onSaveOfferPercent={onSaveOfferPercent}
              onBroadcastOfferToAll={onBroadcastOfferToAll}
            />
          )}

          {activeSection === 'rates' && (
            <OwnerRateManager
              ratePlans={ratePlans}
              categories={categories}
              onUpdateRatePlans={onUpdateRatePlans}
              onUpdateCategories={onUpdateCategories}
            />
          )}

          {activeSection === 'bookings' && (
            <OwnerBookingManager
              business={business}
              rewardPercent={activeRewardPercent}
              onUpdateBusinessName={onUpdateBusinessName}
              bookings={bookings}
              onAddBookingToList={onAddBookingToList}
              onDeleteBookingFromList={onDeleteBookingFromList}
              onUpdateBookingStatus={onUpdateBookingStatus}
              onUpdateBookingPrice={onUpdateBookingPrice}
              onApproveUtrPayment={onApproveUtrPayment}
              onMarkEditReviewed={onMarkEditReviewed}
              lastWhatsappDispatch={lastOwnerWhatsappNotice}
              onDismissWhatsappDispatch={onDismissWhatsappDispatch}
              onViewSlip={onViewSlip}
              onOpenUPIForBooking={onOpenUPIForBooking}
              lang={lang}
            />
          )}

          {activeSection === 'staff' && (
            <StaffManagement
              staffList={staffList}
              onAddStaff={onAddStaff}
              onDeleteStaff={onDeleteStaff}
              onRecordDuty={onRecordDuty}
              onRecordPayment={onRecordPayment}
              lang={lang}
            />
          )}

          {activeSection === 'location' && (
            <LocationContact
              business={business}
              onOpenUPI={() => onOpenUPI(2000, 'SK Sound DJ Bandhi Payment')}
              lang={lang}
            />
          )}
        </div>
      )}
    </div>
  );
};
