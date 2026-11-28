import React, { useState, useEffect, useRef } from 'react';
import { 
  BUSINESS_CONFIG, 
  DJ_RATE_PLANS, 
  INITIAL_BOOKINGS, 
  INITIAL_STAFF,
  INITIAL_CUSTOMERS,
  INITIAL_DISCOUNT_CODES
} from './data/initialData';
import { 
  Booking, 
  DJRatePlan, 
  DiscountCode,
  PriceCategoryMeta,
  StaffMember, 
  StaffDutyRecord, 
  StaffPaymentRecord, 
  CustomerUser, 
  AuthSession,
  BusinessConfig,
  OfferBroadcast,
  CustomerNotification
} from './types';
import { PRICE_CATEGORIES } from './utils/rateCategories';
import { evaluateDiscountCode } from './utils/discountUtils';
import { calculateBookingReward, getCustomerRewardSummary } from './utils/rewardUtils';
import {
  buildBookingSuccessMessage,
  buildBookingCancelMessage,
  buildWhatsAppUrl
} from './utils/whatsappUtils';
import { Navbar } from './components/Navbar';
import { PricingPackages } from './components/PricingPackages';
import { CustomerBooking } from './components/CustomerBooking';
import { LocationContact } from './components/LocationContact';
import { OwnerPortalWorkspace, OwnerSectionId } from './components/OwnerPortalWorkspace';
import { Footer } from './components/Footer';
import { UPIScannerModal } from './components/UPIScannerModal';
import { BookingSlipModal } from './components/BookingSlipModal';
import { AuthScreen } from './components/AuthScreen';
import { CustomerDashboard, CustomerPortalTab } from './components/CustomerDashboard';
import { OfflineIndicator } from './components/PWAInstallButton';

export default function App() {
  const [lang, setLang] = useState<'hi' | 'en'>('en');
  const [activeSection, setActiveSection] = useState<string>('home');

  // Business Config (Owner: Sikandra Kumar Pandit, Phone: 9973492726, Address: Bandhi, Khorimahuwa, Rajdhanwar)
  const [business, setBusiness] = useState<BusinessConfig>(() => {
    const saved = localStorage.getItem('sk_sound_business_v4');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.ownerPhoto || parsed.ownerPhoto.includes('/public/')) {
          parsed.ownerPhoto = '/owner_sikandar_pandit.jpg';
        }
        return {
          ...BUSINESS_CONFIG,
          ...parsed,
          rewardPercent: parsed.rewardPercent ?? BUSINESS_CONFIG.rewardPercent ?? 5
        };
      } catch (e) {
        return BUSINESS_CONFIG;
      }
    }
    return BUSINESS_CONFIG;
  });

  // Price Categories (Owner can add/edit/delete; synced live to Customers)
  const [categories, setCategories] = useState<PriceCategoryMeta[]>(() => {
    const saved = localStorage.getItem('sk_sound_categories_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {
        // fallback to default categories
      }
    }
    return PRICE_CATEGORIES;
  });

  // DJ Rate Plans (Owner can edit; Customer views live synced rates)
  const [ratePlans, setRatePlans] = useState<DJRatePlan[]>(() => {
    const saved = localStorage.getItem('sk_sound_rates_v5');
    if (!saved) {
      localStorage.setItem('sk_sound_rates_v6_seeded', '1');
      return DJ_RATE_PLANS;
    }
    try {
      const parsed: DJRatePlan[] = JSON.parse(saved);
      const defaultsById = new Map(DJ_RATE_PLANS.map((p) => [p.id, p]));
      // Backfill new bilingual/category metadata on existing defaults without touching owner prices/photos
      const upgraded = parsed.map((item) => {
        const def = defaultsById.get(item.id);
        if (!def) return item;
        return {
          ...item,
          category: !item.category || item.category === 'equipment' || item.category === 'event' ? def.category : item.category,
          descriptionEn: item.descriptionEn || def.descriptionEn,
          durationLabel: item.durationLabel || def.durationLabel,
          unitLabel: item.unitLabel || def.unitLabel
        };
      });

      if (!localStorage.getItem('sk_sound_rates_v6_seeded')) {
        const existingIds = new Set(upgraded.map((i) => i.id));
        const missingDefaults = DJ_RATE_PLANS.filter((d) => !existingIds.has(d.id));
        localStorage.setItem('sk_sound_rates_v6_seeded', '1');
        return [...upgraded, ...missingDefaults];
      }
      return upgraded;
    } catch {
      return DJ_RATE_PLANS;
    }
  });

  // Bookings list with LocalStorage persistence
  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem('sk_sound_bookings_v5');
    return saved ? JSON.parse(saved) : INITIAL_BOOKINGS;
  });

  // Staff members list with LocalStorage persistence (Owner Managed)
  const [staffList, setStaffList] = useState<StaffMember[]>(() => {
    const saved = localStorage.getItem('sk_sound_staff_v3');
    return saved ? JSON.parse(saved) : INITIAL_STAFF;
  });

  // Registered Customer accounts list
  const [customerList, setCustomerList] = useState<CustomerUser[]>(() => {
    const saved = localStorage.getItem('sk_sound_customers_v3');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  // Active Authenticated Session
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => {
    const saved = localStorage.getItem('sk_sound_session_v3');
    return saved ? JSON.parse(saved) : null;
  });

  // Owner-Created Discount Codes with LocalStorage persistence
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>(() => {
    const saved = localStorage.getItem('sk_sound_discounts_v1');
    return saved ? JSON.parse(saved) : INITIAL_DISCOUNT_CODES;
  });

  // Customer Notifications (WhatsApp booking success / cancellation / offer broadcasts)
  const [notifications, setNotifications] = useState<CustomerNotification[]>(() => {
    const saved = localStorage.getItem('sk_sound_notifications_v1');
    return saved ? JSON.parse(saved) : [];
  });

  // Owner Offer Broadcast History
  const [offerBroadcasts, setOfferBroadcasts] = useState<OfferBroadcast[]>(() => {
    const saved = localStorage.getItem('sk_sound_offer_broadcasts_v1');
    return saved ? JSON.parse(saved) : [];
  });

  // Owner-side WhatsApp dispatch alert when Owner verifies UTR or cancels a booking
  const [lastOwnerWhatsappNotice, setLastOwnerWhatsappNotice] = useState<CustomerNotification | null>(null);

  // Modals state
  const [upiModalOpen, setUpiModalOpen] = useState(false);
  const [upiModalAmount, setUpiModalAmount] = useState<number>(2000);
  const [upiModalNote, setUpiModalNote] = useState<string>('SK Sound DJ Bandhi Advance');
  const [activeBookingForUPI, setActiveBookingForUPI] = useState<Booking | null>(null);
  const [selectedSlipBooking, setSelectedSlipBooking] = useState<Booking | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  // Customer Portal & Owner Portal workspace state + Big Booking Popup state
  const [customerTab, setCustomerTab] = useState<CustomerPortalTab>('overview');
  const [ownerSection, setOwnerSection] = useState<OwnerSectionId | null>(null);
  const [bookingPopupOpen, setBookingPopupOpen] = useState(false);
  const [preselectedPlan, setPreselectedPlan] = useState<DJRatePlan | null>(null);
  const [preselectedCouponCode, setPreselectedCouponCode] = useState<string>('');
  const [openPaperSlipNonce, setOpenPaperSlipNonce] = useState(0);
  const [exitToast, setExitToast] = useState(false);

  const backPressedOnceRef = useRef(false);
  const exitToastTimerRef = useRef<number | null>(null);
  const backStateRef = useRef({
    authSession,
    selectedSlipBooking,
    upiModalOpen,
    bookingPopupOpen,
    editingBooking,
    customerTab,
    ownerSection,
    activeSection
  });

  backStateRef.current = {
    authSession,
    selectedSlipBooking,
    upiModalOpen,
    bookingPopupOpen,
    editingBooking,
    customerTab,
    ownerSection,
    activeSection
  };

  const armHistoryGuard = () => {
    if (!window.history.state?.skAppGuard) {
      window.history.pushState({ skAppGuard: true }, '');
    }
  };

  // Push a fresh user-gesture history guard whenever interactive modals/views open
  useEffect(() => {
    if (!authSession) return;
    if (
      upiModalOpen ||
      bookingPopupOpen ||
      editingBooking ||
      selectedSlipBooking ||
      customerTab !== 'overview' ||
      ownerSection !== null
    ) {
      armHistoryGuard();
    }
  }, [
    authSession,
    upiModalOpen,
    bookingPopupOpen,
    editingBooking,
    selectedSlipBooking,
    customerTab,
    ownerSection
  ]);

  // Global Back Button Guard (prevents single Back press from closing entire app)
  useEffect(() => {
    if (!authSession) return;

    armHistoryGuard();

    const handleUserGesture = () => {
      if (!backPressedOnceRef.current) {
        armHistoryGuard();
      }
    };

    const handlePopState = () => {
      const s = backStateRef.current;
      if (!s.authSession) return;

      // 1. Close open top-level modals first
      if (s.selectedSlipBooking) {
        setSelectedSlipBooking(null);
        window.history.pushState({ skAppGuard: true }, '');
        return;
      }

      if (s.upiModalOpen) {
        setUpiModalOpen(false);
        window.history.pushState({ skAppGuard: true }, '');
        return;
      }

      if (s.bookingPopupOpen || s.editingBooking) {
        setBookingPopupOpen(false);
        setEditingBooking(null);
        setPreselectedPlan(null);
        setPreselectedCouponCode('');
        window.history.pushState({ skAppGuard: true }, '');
        return;
      }

      // 2. Ask child components (product zoom, date calendar, customer/owner modals) to close any open popup
      const closeChildEvt = new CustomEvent('sk-close-child-modal', { cancelable: true });
      const notCancelled = window.dispatchEvent(closeChildEvt);
      if (!notCancelled) {
        window.history.pushState({ skAppGuard: true }, '');
        return;
      }

      // 3. Return from sub-tabs back to Home / Owner Menu
      if (s.authSession.role === 'customer' && s.customerTab !== 'overview') {
        setCustomerTab('overview');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        window.history.pushState({ skAppGuard: true }, '');
        return;
      }

      if (s.authSession.role === 'owner' && s.ownerSection !== null) {
        setOwnerSection(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        window.history.pushState({ skAppGuard: true }, '');
        return;
      }

      // 4. At root view: require double Back within 2.5s to exit app
      if (!backPressedOnceRef.current) {
        backPressedOnceRef.current = true;
        setExitToast(true);
        if (exitToastTimerRef.current) {
          window.clearTimeout(exitToastTimerRef.current);
        }
        exitToastTimerRef.current = window.setTimeout(() => {
          backPressedOnceRef.current = false;
          setExitToast(false);
          armHistoryGuard();
        }, 2500);
      }
    };

    window.addEventListener('pointerdown', handleUserGesture, { passive: true });
    window.addEventListener('keydown', handleUserGesture, { passive: true });
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('pointerdown', handleUserGesture);
      window.removeEventListener('keydown', handleUserGesture);
      window.removeEventListener('popstate', handlePopState);
      if (exitToastTimerRef.current) {
        window.clearTimeout(exitToastTimerRef.current);
      }
    };
  }, [authSession]);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('sk_sound_business_v4', JSON.stringify(business));
  }, [business]);

  useEffect(() => {
    localStorage.setItem('sk_sound_categories_v1', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('sk_sound_rates_v5', JSON.stringify(ratePlans));
  }, [ratePlans]);

  useEffect(() => {
    localStorage.setItem('sk_sound_bookings_v5', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('sk_sound_staff_v3', JSON.stringify(staffList));
  }, [staffList]);

  useEffect(() => {
    localStorage.setItem('sk_sound_customers_v3', JSON.stringify(customerList));
  }, [customerList]);

  useEffect(() => {
    localStorage.setItem('sk_sound_discounts_v1', JSON.stringify(discountCodes));
  }, [discountCodes]);

  useEffect(() => {
    localStorage.setItem('sk_sound_notifications_v1', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('sk_sound_offer_broadcasts_v1', JSON.stringify(offerBroadcasts));
  }, [offerBroadcasts]);

  useEffect(() => {
    if (authSession) {
      localStorage.setItem('sk_sound_session_v3', JSON.stringify(authSession));
    } else {
      localStorage.removeItem('sk_sound_session_v3');
    }
  }, [authSession]);

  // Business Name update handler
  const handleUpdateBusinessName = (newName: string) => {
    setBusiness((prev) => ({
      ...prev,
      businessNameEn: newName,
      businessNameHi: newName
    }));
  };

  // Auth Handlers
  const handleLoginSuccess = (session: AuthSession) => {
    setAuthSession(session);
  };

  const handleLogout = () => {
    setEditingBooking(null);
    setBookingPopupOpen(false);
    setPreselectedPlan(null);
    setPreselectedCouponCode('');
    setCustomerTab('overview');
    setOwnerSection(null);
    setAuthSession(null);
  };

  const handleRegisterCustomer = (newCustomer: CustomerUser) => {
    setCustomerList((prev) => [newCustomer, ...prev]);
  };

  const handleResetCustomerPassword = (mobile: string, newPass: string): boolean => {
    const exists = customerList.some((c) => c.mobile.trim() === mobile.trim());
    if (!exists) return false;

    setCustomerList((prev) =>
      prev.map((c) => (c.mobile.trim() === mobile.trim() ? { ...c, password: newPass } : c))
    );
    return true;
  };

  // UPI Scanner Trigger
  const handleOpenUPI = (amount = 2000, note = 'SK Sound DJ Bandhi Advance') => {
    setActiveBookingForUPI(null);
    setUpiModalAmount(amount);
    setUpiModalNote(note);
    setUpiModalOpen(true);
  };

  const handleOpenUPIForBooking = (booking: Booking, amount: number) => {
    setActiveBookingForUPI(booking);
    setUpiModalAmount(amount);
    setUpiModalNote(`SK Sound Booking ${booking.bookingNumber} - ${booking.customerName}`);
    setUpiModalOpen(true);
  };

  const handlePaymentConfirmed = ({ amount, utr }: { amount: number; utr: string; note: string }) => {
    if (!activeBookingForUPI) return;
    const nowIso = new Date().toISOString();

    if (authSession?.role === 'customer') {
      // Customer submits UTR -> goes to Owner for verification & Payment Success click
      setBookings((prev) =>
        prev.map((b) => {
          if (b.id === activeBookingForUPI.id) {
            return {
              ...b,
              pendingUtrNumber: utr,
              pendingPaymentAmount: amount,
              upiRefNumber: utr,
              status: 'utr_submitted'
            };
          }
          return b;
        })
      );
    } else {
      // Owner directly verifies/records payment
      setBookings((prev) =>
        prev.map((b) => {
          if (b.id === activeBookingForUPI.id) {
            const newPaid = (b.advancePaid || 0) + amount;
            const newBalance = Math.max(0, b.totalAmount - newPaid);
            const existingHistory = b.paymentHistory || [];
            return {
              ...b,
              advancePaid: newPaid,
              balanceDue: newBalance,
              upiRefNumber: utr,
              pendingUtrNumber: undefined,
              pendingPaymentAmount: undefined,
              paymentVerifiedAt: nowIso,
              paymentHistory: [
                ...existingHistory,
                { id: 'pay_' + Date.now(), amount, utr, verifiedAt: nowIso, mode: 'UPI' }
              ],
              status: 'confirmed'
            };
          }
          return b;
        })
      );
    }
  };

  const activeRewardPercent = business.rewardPercent ?? 5;

  const resolveCustomerRegisteredMobile = (booking: Booking): string => {
    const matched = customerList.find(
      (c) => (booking.customerId && c.id === booking.customerId) || c.mobile === booking.customerPhone
    );
    return (matched?.mobile || booking.customerPhone || '').trim();
  };

  const pushBookingNotification = (
    booking: Booking,
    type: 'booking_success' | 'booking_cancelled',
    showOwnerNotice = false
  ) => {
    const targetMobile = resolveCustomerRegisteredMobile(booking);
    if (!targetMobile) return;

    const bizName = business.businessNameEn || 'SK Sound DJ Bandhi';
    const message =
      type === 'booking_success'
        ? buildBookingSuccessMessage(booking, bizName, business.phone, activeRewardPercent)
        : buildBookingCancelMessage(booking, bizName, business.phone);

    const notif: CustomerNotification = {
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      customerId: booking.customerId,
      customerPhone: targetMobile,
      customerName: booking.customerName,
      type,
      title:
        type === 'booking_success'
          ? `बुकिंग सफल (${booking.bookingNumber})`
          : `बुकिंग रद्द (${booking.bookingNumber})`,
      message,
      whatsappUrl: buildWhatsAppUrl(targetMobile, message),
      bookingNumber: booking.bookingNumber,
      createdAt: new Date().toISOString(),
      read: false
    };

    setNotifications((prev) => [notif, ...prev]);
    if (showOwnerNotice) {
      setLastOwnerWhatsappNotice(notif);
    }
  };

  // Owner verifies customer's UTR and clicks "Payment Success" -> Booking becomes successfully confirmed!
  const handleOwnerApproveUtrPayment = (bookingId: string) => {
    const nowIso = new Date().toISOString();
    const targetBooking = bookings.find((b) => b.id === bookingId);
    let updatedSnapshot: Booking | null = null;

    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          const creditAmt = b.pendingPaymentAmount || b.balanceDue || 0;
          const newPaid = (b.advancePaid || 0) + creditAmt;
          const newBalance = Math.max(0, b.totalAmount - newPaid);
          const utr = b.pendingUtrNumber || b.upiRefNumber || 'UPI-VERIFIED';
          const existingHistory = b.paymentHistory || [];
          updatedSnapshot = {
            ...b,
            advancePaid: newPaid,
            balanceDue: newBalance,
            upiRefNumber: utr,
            pendingUtrNumber: undefined,
            pendingPaymentAmount: undefined,
            paymentVerifiedAt: nowIso,
            paymentHistory: creditAmt > 0
              ? [...existingHistory, { id: 'pay_' + Date.now(), amount: creditAmt, utr, verifiedAt: nowIso, mode: 'UPI' }]
              : existingHistory,
            status: 'confirmed'
          };
          return updatedSnapshot;
        }
        return b;
      })
    );

    if (targetBooking) {
      pushBookingNotification(
        updatedSnapshot || { ...targetBooking, status: 'confirmed' },
        'booking_success',
        true
      );
    }
  };

  // Rate plans & categories update handlers (Owner Only)
  const handleUpdateRatePlans = (newPlans: DJRatePlan[]) => {
    setRatePlans(newPlans);
  };

  const handleUpdateCategories = (newCats: PriceCategoryMeta[]) => {
    setCategories(newCats);
  };

  // Customer adds a new booking -> sends success WhatsApp notification to registered mobile & auto opens QR modal when payable amount > 0
  const handleCustomerAddBooking = (newBooking: Booking, autoOpenQrAmount?: number) => {
    setBookings((prev) => [newBooking, ...prev]);
    pushBookingNotification(newBooking, 'booking_success', false);
    if (autoOpenQrAmount && autoOpenQrAmount > 0) {
      setActiveBookingForUPI(newBooking);
      setUpiModalAmount(autoOpenQrAmount);
      setUpiModalNote(`SK Sound Booking ${newBooking.bookingNumber} - ${newBooking.customerName}`);
      setUpiModalOpen(true);
    } else {
      setSelectedSlipBooking(newBooking);
    }
  };

  // Customer opens Big Booking Popup from any CTA (Book DJ, Rate Item, Offer Coupon, Paper Slip)
  const handleOpenBookingPopup = (options?: {
    couponCode?: string;
    plan?: DJRatePlan;
    openPaperSlip?: boolean;
  }) => {
    setEditingBooking(null);
    setPreselectedPlan(options?.plan ?? null);
    setPreselectedCouponCode(options?.couponCode ?? '');
    if (options?.openPaperSlip) {
      setOpenPaperSlipNonce((n) => n + 1);
    }
    setBookingPopupOpen(true);
  };

  // Customer edits an unpaid booking before payment (opens Big Booking Popup directly)
  const handleStartEditBooking = (booking: Booking) => {
    setBookingPopupOpen(false);
    setPreselectedPlan(null);
    setPreselectedCouponCode('');
    setEditingBooking(booking);
  };

  const handleCancelEditBooking = () => {
    setEditingBooking(null);
    setBookingPopupOpen(false);
  };

  const handleUpdateCustomerBooking = (updatedBooking: Booking) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b))
    );
    setSelectedSlipBooking((prev) => (prev && prev.id === updatedBooking.id ? updatedBooking : prev));
    setActiveBookingForUPI((prev) => (prev && prev.id === updatedBooking.id ? updatedBooking : prev));
    setEditingBooking(null);
  };

  const handleMarkEditReviewed = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, ownerEditReviewed: true } : b))
    );
  };

  // Cancel Booking (by Customer or Owner) -> sets status 'cancelled' and dispatches WhatsApp notification to registered mobile
  const handleCancelBooking = (bookingId: string, showOwnerNotice = false) => {
    const targetBooking = bookings.find((b) => b.id === bookingId);
    if (!targetBooking || targetBooking.status === 'cancelled') return;

    const cancelledBooking: Booking = {
      ...targetBooking,
      status: 'cancelled',
      pendingUtrNumber: undefined,
      pendingPaymentAmount: undefined
    };

    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? cancelledBooking : b))
    );
    setSelectedSlipBooking((prev) => (prev && prev.id === bookingId ? cancelledBooking : prev));
    if (editingBooking && editingBooking.id === bookingId) {
      setEditingBooking(null);
    }
    pushBookingNotification(cancelledBooking, 'booking_cancelled', showOwnerNotice);
  };

  // Owner booking list actions: Add or Subtract
  const handleOwnerAddBookingToList = (newBooking: Booking) => {
    setBookings((prev) => [newBooking, ...prev]);
  };

  const handleOwnerDeleteBookingFromList = (bookingId: string) => {
    setBookings((prev) => prev.filter((b) => b.id !== bookingId));
  };

  const handleOwnerUpdateStatus = (bookingId: string, status: Booking['status']) => {
    if (status === 'cancelled') {
      handleCancelBooking(bookingId, true);
      return;
    }
    const target = bookings.find((b) => b.id === bookingId);
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
    );
    if (status === 'confirmed' && target && target.status !== 'confirmed') {
      pushBookingNotification({ ...target, status: 'confirmed' }, 'booking_success', true);
    }
  };

  // Owner Discount Code Management Handlers (Owner Only)
  const handleAddDiscountCode = (newCode: DiscountCode) => {
    setDiscountCodes((prev) => [newCode, ...prev]);
  };

  const handleToggleDiscountCode = (id: string) => {
    setDiscountCodes((prev) =>
      prev.map((d) => (d.id === id ? { ...d, active: !d.active } : d))
    );
  };

  const handleDeleteDiscountCode = (id: string) => {
    setDiscountCodes((prev) => prev.filter((d) => d.id !== id));
  };

  // Owner-Only Offer % & Broadcast-to-All Handlers
  const handleSaveOfferPercent = (percent: number, offerNote: string) => {
    setBusiness((prev) => ({
      ...prev,
      rewardPercent: percent,
      activeOfferNote: offerNote
    }));
  };

  const handleBroadcastOfferToAll = (payload: {
    offerPercent: number;
    message: string;
    selectedCustomerIds?: string[];
  }) => {
    const nowIso = new Date().toISOString();
    const targetCustomers =
      payload.selectedCustomerIds && payload.selectedCustomerIds.length > 0
        ? customerList.filter((c) => payload.selectedCustomerIds?.includes(c.id))
        : customerList;

    const newBroadcast: OfferBroadcast = {
      id: 'offer_' + Date.now(),
      offerPercent: payload.offerPercent,
      title: `${payload.offerPercent}% स्पेशल बुकिंग ऑफर`,
      message: payload.message,
      sentAt: nowIso,
      recipientCount: targetCustomers.length
    };

    setBusiness((prev) => ({
      ...prev,
      rewardPercent: payload.offerPercent,
      activeOfferNote: `${payload.offerPercent}% डिस्काउंट / रिवॉर्ड ऑफर अभी चालू है`
    }));
    setOfferBroadcasts((prev) => [newBroadcast, ...prev]);

    const broadcastNotifications: CustomerNotification[] = targetCustomers.map((cust) => ({
      id: `notif_${Date.now()}_${cust.id}`,
      customerId: cust.id,
      customerPhone: cust.mobile,
      customerName: cust.name,
      type: 'offer_broadcast',
      title: `${payload.offerPercent}% स्पेशल ऑफर`,
      message: payload.message,
      whatsappUrl: buildWhatsAppUrl(cust.mobile, payload.message),
      createdAt: nowIso,
      read: false
    }));

    setNotifications((prev) => [...broadcastNotifications, ...prev]);
  };

  const handleApplyDiscountToActiveUpiBooking = (
    code: string,
    discountAmount: number,
    newPayableAmount: number
  ) => {
    if (!activeBookingForUPI) return;
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === activeBookingForUPI.id) {
          const baseTotal = b.subtotalAmount || b.totalAmount + (b.discountAmount || 0) + (b.rewardUsed || 0);
          const updatedTotal = Math.max(0, baseTotal - discountAmount - (b.rewardUsed || 0));
          const updatedBalance = Math.max(0, updatedTotal - (b.advancePaid || 0));
          return {
            ...b,
            subtotalAmount: baseTotal,
            discountCode: code,
            discountAmount,
            rewardEarned: calculateBookingReward(updatedTotal, activeRewardPercent),
            totalAmount: updatedTotal,
            balanceDue: updatedBalance
          };
        }
        return b;
      })
    );
    setActiveBookingForUPI((prev) => {
      if (!prev) return null;
      const baseTotal = prev.subtotalAmount || prev.totalAmount + (prev.discountAmount || 0) + (prev.rewardUsed || 0);
      const updatedTotal = Math.max(0, baseTotal - discountAmount - (prev.rewardUsed || 0));
      return {
        ...prev,
        subtotalAmount: baseTotal,
        discountCode: code,
        discountAmount,
        rewardEarned: calculateBookingReward(updatedTotal, activeRewardPercent),
        totalAmount: updatedTotal,
        balanceDue: Math.max(0, updatedTotal - (prev.advancePaid || 0))
      };
    });
    setUpiModalAmount(newPayableAmount);
  };

  // Owner enters price (e.g. ₹5,000) for booking/custom photo slip/wedding/party
  const handleOwnerUpdateBookingPrice = (bookingId: string, newTotalAmount: number, newPaidAmount?: number) => {
    const nowIso = new Date().toISOString();
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          const paid = newPaidAmount !== undefined ? newPaidAmount : b.advancePaid;
          const delta = paid - (b.advancePaid || 0);

          let finalTotalAmount = newTotalAmount;
          let finalSubtotalAmount = b.subtotalAmount;
          let finalDiscountAmount = b.discountAmount;
          let finalRewardUsed = b.rewardUsed || 0;

          if (b.discountCode && !(b.discountAmount && b.discountAmount > 0)) {
            const evalRes = evaluateDiscountCode(
              b.discountCode,
              discountCodes,
              newTotalAmount,
              b.paymentMode
            );
            if (evalRes.valid && evalRes.discountAmount > 0) {
              finalSubtotalAmount = newTotalAmount;
              finalDiscountAmount = evalRes.discountAmount;
              finalTotalAmount = evalRes.finalTotal;
            }
          }

          if (b.applyAvailableRewardOnQuote && finalRewardUsed === 0) {
            const summary = getCustomerRewardSummary(
              prev,
              b.customerId,
              b.customerPhone,
              b.id,
              activeRewardPercent
            );
            if (summary.availableReward > 0) {
              finalSubtotalAmount = finalSubtotalAmount || newTotalAmount;
              finalRewardUsed = Math.min(summary.availableReward, finalTotalAmount);
              finalTotalAmount = Math.max(0, finalTotalAmount - finalRewardUsed);
            }
          }

          const finalRewardEarned =
            b.bookedByRole === 'customer'
              ? calculateBookingReward(finalTotalAmount, activeRewardPercent)
              : (b.rewardEarned || 0);

          const bal = Math.max(0, finalTotalAmount - paid);
          const existingHistory = b.paymentHistory || [];
          const nextHistory =
            delta > 0
              ? [...existingHistory, { id: 'pay_' + Date.now(), amount: delta, utr: 'OWNER-UPDATED', verifiedAt: nowIso, mode: 'Cash' as const }]
              : existingHistory;
          return {
            ...b,
            subtotalAmount: finalSubtotalAmount,
            discountAmount: finalDiscountAmount,
            rewardUsed: finalRewardUsed > 0 ? finalRewardUsed : undefined,
            rewardEarned: finalRewardEarned,
            applyAvailableRewardOnQuote: false,
            totalAmount: finalTotalAmount,
            advancePaid: paid,
            balanceDue: bal,
            paymentHistory: nextHistory,
            paymentVerifiedAt: delta > 0 ? nowIso : b.paymentVerifiedAt,
            status:
              b.status === 'quote_pending'
                ? paid > 0
                  ? 'confirmed'
                  : 'pending_payment'
                : b.status,
            ownerQuotedAt: nowIso
          };
        }
        return b;
      })
    );
  };

  // Staff management actions (Owner Only)
  const handleAddStaff = (newStaff: StaffMember) => {
    setStaffList((prev) => [...prev, newStaff]);
  };

  const handleDeleteStaff = (staffId: string) => {
    setStaffList((prev) => prev.filter((st) => st.id !== staffId));
  };

  const handleRecordDuty = (staffId: string, duty: StaffDutyRecord) => {
    setStaffList((prev) =>
      prev.map((st) => {
        if (st.id === staffId) {
          const updatedEarned = st.totalEarned + duty.wageAmount;
          const updatedBalance = updatedEarned - st.advanceGiven;
          return {
            ...st,
            totalEarned: updatedEarned,
            balanceDue: updatedBalance,
            dutyHistory: [duty, ...st.dutyHistory]
          };
        }
        return st;
      })
    );
  };

  const handleRecordPayment = (staffId: string, payment: StaffPaymentRecord) => {
    setStaffList((prev) =>
      prev.map((st) => {
        if (st.id === staffId) {
          const updatedAdvance = st.advanceGiven + payment.amount;
          const updatedBalance = st.totalEarned - updatedAdvance;
          return {
            ...st,
            advanceGiven: updatedAdvance,
            balanceDue: updatedBalance,
            paymentHistory: [payment, ...st.paymentHistory]
          };
        }
        return st;
      })
    );
  };

  // Gated login entry upon site open:
  // "ye website jaise khule Customer ko seedha login karna padega uske baad vah sab kuch dekh sakta"
  if (!authSession) {
    return (
      <>
        <AuthScreen
          business={business}
          customerList={customerList}
          onLoginSuccess={handleLoginSuccess}
          onRegisterCustomer={handleRegisterCustomer}
          onResetCustomerPassword={handleResetCustomerPassword}
        />
        <OfflineIndicator />
      </>
    );
  }

  // Find customer object if customer is logged in
  const loggedInCustomer =
    authSession.role === 'customer'
      ? customerList.find(
          (c) => c.id === authSession.user.id || c.mobile === authSession.user.mobile
        ) || {
          id: authSession.user.id,
          name: authSession.user.name,
          mobile: authSession.user.mobile || '',
          photoUrl: authSession.user.photoUrl,
          password: '',
          createdAt: ''
        }
      : null;

  const customerBookings = loggedInCustomer
    ? bookings.filter(
        (b) => b.customerId === loggedInCustomer.id || b.customerPhone === loggedInCustomer.mobile
      )
    : [];

  const bellNotifications =
    authSession.role === 'customer' && loggedInCustomer
      ? notifications.filter(
          (n) =>
            (n.customerId && n.customerId === loggedInCustomer.id) ||
            n.customerPhone === loggedInCustomer.mobile
        )
      : notifications;

  const handleMarkNotificationRead = (notifId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllNotificationsRead = () => {
    const visibleIds = new Set(bellNotifications.map((n) => n.id));
    setNotifications((prev) =>
      prev.map((n) => (visibleIds.has(n.id) ? { ...n, read: true } : n))
    );
  };

  const customerActiveNavSection =
    customerTab === 'overview'
      ? 'home'
      : customerTab === 'rates'
      ? 'packages'
      : customerTab === 'bookings'
      ? 'booking'
      : customerTab === 'location'
      ? 'location'
      : 'home';

  const ownerActiveNavSection =
    ownerSection === null
      ? 'home'
      : ownerSection === 'income'
      ? 'owner-income'
      : ownerSection === 'upcoming'
      ? 'upcoming-bookings'
      : ownerSection === 'discounts'
      ? 'owner-discounts'
      : ownerSection === 'rates'
      ? 'packages'
      : ownerSection === 'bookings'
      ? 'booking'
      : ownerSection === 'staff'
      ? 'staff'
      : ownerSection === 'location'
      ? 'location'
      : 'home';

  const handleSetActiveSection = (sec: string) => {
    setActiveSection(sec);
    if (authSession.role === 'customer') {
      if (sec === 'home') setCustomerTab('overview');
      else if (sec === 'packages') setCustomerTab('rates');
      else if (sec === 'booking') setCustomerTab('bookings');
      else if (sec === 'location') setCustomerTab('location');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (authSession.role === 'owner') {
      if (sec === 'home') setOwnerSection(null);
      else if (sec === 'owner-income') setOwnerSection('income');
      else if (sec === 'upcoming-bookings') setOwnerSection('upcoming');
      else if (sec === 'owner-discounts') setOwnerSection('discounts');
      else if (sec === 'packages') setOwnerSection('rates');
      else if (sec === 'booking') setOwnerSection('bookings');
      else if (sec === 'staff') setOwnerSection('staff');
      else if (sec === 'location') setOwnerSection('location');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-amber-400 selection:text-black">
      
      {/* Navigation Top Bar */}
      <Navbar
        business={business}
        onOpenBooking={() => handleOpenBookingPopup()}
        onOpenUPI={() => handleOpenUPI(2000, 'SK Sound DJ Bandhi Advance')}
        onOpenAuth={() => {}}
        authSession={authSession}
        onLogout={handleLogout}
        activeSection={authSession.role === 'customer' ? customerActiveNavSection : ownerActiveNavSection}
        setActiveSection={handleSetActiveSection}
        lang={lang}
        setLang={setLang}
        notifications={bellNotifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        theme="dark"
      />

      <main>
        {/* CUSTOMER PORTAL (Original Dark Obsidian & Amber Gold DJ Theme) */}
        {authSession.role === 'customer' && loggedInCustomer ? (
          <div>
            {/* 1. Customer Hero Account, Workspace Tabs, Active Coupon Discounts & Overview */}
            <CustomerDashboard
              currentCustomer={loggedInCustomer}
              myBookings={customerBookings}
              business={business}
              ratePlans={ratePlans}
              categories={categories}
              discountCodes={discountCodes}
              latestOfferBroadcast={offerBroadcasts[0] || null}
              activeTab={customerTab}
              onChangeTab={(tab) => {
                setCustomerTab(tab);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenBookingForm={(options) => handleOpenBookingPopup(options)}
              onEditBooking={handleStartEditBooking}
              onCancelBooking={(bookingId) => handleCancelBooking(bookingId, false)}
              onOpenUPIForBooking={handleOpenUPIForBooking}
              onOpenUPI={handleOpenUPI}
              onViewSlip={(b) => setSelectedSlipBooking(b)}
              onLogout={handleLogout}
              lang={lang}
            />

            {/* 2. Rate List Workspace Tab */}
            {customerTab === 'rates' && (
              <PricingPackages
                ratePlans={ratePlans}
                categories={categories}
                onSelectPlanForBooking={(plan, openPaperSlip) =>
                  handleOpenBookingPopup({ plan, openPaperSlip })
                }
                onOpenUPIWithAmount={(amount, note) => handleOpenUPI(amount, note)}
                lang={lang}
                theme="dark"
              />
            )}

            {/* 3. Big Centered Booking Popup (Always mounted) + My Bookings Ledger Tab */}
            <CustomerBooking
              bookings={bookings}
              currentUserRole="customer"
              currentUserId={loggedInCustomer.id}
              currentUserName={loggedInCustomer.name}
              currentUserMobile={loggedInCustomer.mobile}
              rewardPercent={activeRewardPercent}
              ratePlans={ratePlans}
              categories={categories}
              discountCodes={discountCodes}
              editingBooking={editingBooking}
              isModalOpen={bookingPopupOpen}
              preselectedPlan={preselectedPlan}
              preselectedCouponCode={preselectedCouponCode}
              openPaperSlipNonce={openPaperSlipNonce}
              showLedger={customerTab === 'bookings'}
              onOpenModal={() => handleOpenBookingPopup()}
              onCloseModal={() => {
                setBookingPopupOpen(false);
                setPreselectedPlan(null);
                setPreselectedCouponCode('');
              }}
              onStartEditBooking={handleStartEditBooking}
              onCancelEditBooking={handleCancelEditBooking}
              onUpdateCustomerBooking={handleUpdateCustomerBooking}
              onCancelBooking={(bookingId) => handleCancelBooking(bookingId, false)}
              onAddNewBooking={handleCustomerAddBooking}
              onOpenUPIForBooking={handleOpenUPIForBooking}
              onViewSlip={(b) => setSelectedSlipBooking(b)}
              lang={lang}
            />

            {/* 4. Location & Contact Workspace Tab */}
            {customerTab === 'location' && (
              <LocationContact
                business={business}
                onOpenUPI={() => handleOpenUPI(2000, 'SK Sound DJ Bandhi Advance')}
                lang={lang}
                theme="dark"
              />
            )}
          </div>
        ) : (
          /* OWNER PORTAL (Tap-to-Open Hub Workspace) */
          <OwnerPortalWorkspace
            activeSection={ownerSection}
            onSelectSection={setOwnerSection}
            business={business}
            activeRewardPercent={activeRewardPercent}
            bookings={bookings}
            ratePlans={ratePlans}
            categories={categories}
            discountCodes={discountCodes}
            customerList={customerList}
            offerBroadcasts={offerBroadcasts}
            staffList={staffList}
            lastOwnerWhatsappNotice={lastOwnerWhatsappNotice}
            lang={lang}
            onUpdateBusinessName={handleUpdateBusinessName}
            onUpdateRatePlans={handleUpdateRatePlans}
            onUpdateCategories={handleUpdateCategories}
            onAddBookingToList={handleOwnerAddBookingToList}
            onDeleteBookingFromList={handleOwnerDeleteBookingFromList}
            onUpdateBookingStatus={handleOwnerUpdateStatus}
            onUpdateBookingPrice={handleOwnerUpdateBookingPrice}
            onApproveUtrPayment={handleOwnerApproveUtrPayment}
            onMarkEditReviewed={handleMarkEditReviewed}
            onDismissWhatsappDispatch={() => setLastOwnerWhatsappNotice(null)}
            onViewSlip={(b) => setSelectedSlipBooking(b)}
            onOpenUPIForBooking={handleOpenUPIForBooking}
            onOpenUPI={handleOpenUPI}
            onAddDiscountCode={handleAddDiscountCode}
            onToggleDiscountCode={handleToggleDiscountCode}
            onDeleteDiscountCode={handleDeleteDiscountCode}
            onSaveOfferPercent={handleSaveOfferPercent}
            onBroadcastOfferToAll={handleBroadcastOfferToAll}
            onAddStaff={handleAddStaff}
            onDeleteStaff={handleDeleteStaff}
            onRecordDuty={handleRecordDuty}
            onRecordPayment={handleRecordPayment}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        business={business}
        onOpenUPI={() => handleOpenUPI(2000, 'SK Sound DJ Bandhi Payment')}
        lang={lang}
        theme="dark"
      />

      {/* Dynamic UPI Scanner Modal (UPI ID is shown ONLY here on Payment click) */}
      <UPIScannerModal
        isOpen={upiModalOpen}
        onClose={() => setUpiModalOpen(false)}
        business={business}
        userRole={authSession.role}
        initialAmount={upiModalAmount}
        initialNote={upiModalNote}
        discountCodes={discountCodes}
        bookingTotal={activeBookingForUPI?.subtotalAmount || activeBookingForUPI?.totalAmount}
        existingDiscountCode={activeBookingForUPI?.discountCode}
        existingDiscountAmount={activeBookingForUPI?.discountAmount}
        onApplyDiscount={handleApplyDiscountToActiveUpiBooking}
        onPaymentConfirmed={handlePaymentConfirmed}
      />

      {/* Printable Booking Slip Modal */}
      <BookingSlipModal
        booking={selectedSlipBooking}
        onClose={() => setSelectedSlipBooking(null)}
        business={business}
        rewardPercent={activeRewardPercent}
      />

      <OfflineIndicator />

      {exitToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] px-4 py-2.5 rounded-full bg-neutral-900 border border-amber-400/70 text-amber-300 text-xs font-bold shadow-2xl whitespace-nowrap animate-pulse">
          ऐप बंद करने के लिए 1 बार और Back दबाएँ · Press Back again to exit
        </div>
      )}

    </div>
  );
}
