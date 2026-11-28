import React, { useState, useRef, useEffect } from 'react';
import { Booking, BookingItem, DiscountCode, EventDuration, EventType, UserRole, DJRatePlan } from '../types';
import { 
  Calendar, 
  MapPin, 
  QrCode, 
  FileText, 
  PlusCircle, 
  Search, 
  CheckCircle, 
  Camera,
  Upload,
  X,
  Plus,
  Minus,
  Layers,
  Tag,
  CreditCard,
  Banknote,
  AlertCircle,
  Edit3,
  Gift,
  XCircle,
  Mic,
  MicOff
} from 'lucide-react';
import { RATE_PLAN_IMAGES } from '../data/initialData';
import { parseVoiceBookingCommand } from '../utils/voiceBookingParser';
import { DateRangeCalendarModal, getMinBookableDateStr, isBookableDate } from './DateRangeCalendarModal';
import { evaluateDiscountCode } from '../utils/discountUtils';
import { canCustomerEditBooking, buildCustomerEditSummary } from '../utils/bookingUtils';
import {
  calculateBookingReward,
  getBookingRewardEarned,
  getCustomerRewardSummary
} from '../utils/rewardUtils';

interface CustomerBookingProps {
  bookings: Booking[];
  currentUserRole?: UserRole;
  currentUserId?: string;
  currentUserName?: string;
  currentUserMobile?: string;
  rewardPercent?: number;
  ratePlans?: DJRatePlan[];
  discountCodes?: DiscountCode[];
  editingBooking?: Booking | null;
  isModalOpen?: boolean;
  preselectedPlan?: DJRatePlan | null;
  preselectedCouponCode?: string;
  openPaperSlipNonce?: number;
  showLedger?: boolean;
  onOpenModal?: () => void;
  onCloseModal?: () => void;
  onStartEditBooking?: (booking: Booking) => void;
  onCancelEditBooking?: () => void;
  onUpdateCustomerBooking?: (updatedBooking: Booking) => void;
  onCancelBooking?: (bookingId: string) => void;
  onAddNewBooking: (booking: Booking, autoOpenQrAmount?: number) => void;
  onOpenUPIForBooking: (booking: Booking, amount: number) => void;
  onViewSlip: (booking: Booking) => void;
  lang?: 'hi' | 'en';
}

export const CustomerBooking: React.FC<CustomerBookingProps> = ({
  bookings,
  currentUserRole = 'customer',
  currentUserId,
  currentUserName = '',
  currentUserMobile = '',
  rewardPercent = 5,
  ratePlans = [],
  discountCodes = [],
  editingBooking = null,
  isModalOpen = false,
  preselectedPlan = null,
  preselectedCouponCode = '',
  openPaperSlipNonce = 0,
  showLedger = true,
  onOpenModal,
  onCloseModal,
  onStartEditBooking,
  onCancelEditBooking,
  onUpdateCustomerBooking,
  onCancelBooking,
  onAddNewBooking,
  onOpenUPIForBooking,
  onViewSlip
}) => {
  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'utr_submitted' | 'pending_payment' | 'quote_pending' | 'cancelled'>('all');
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  
  // Image Viewer Modal state
  const [viewingPhotoUrl, setViewingPhotoUrl] = useState<string | null>(null);

  // Touch Calendar Modal state
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);

  // Form Error & Success Banner state
  const [formError, setFormError] = useState('');
  const [editSavedBanner, setEditSavedBanner] = useState<{ booking: Booking; message: string } | null>(null);

  // Form State
  const [customerName, setCustomerName] = useState(currentUserName || '');
  const [customerPhone, setCustomerPhone] = useState(currentUserMobile || '');
  const [eventDate, setEventDate] = useState('');
  const [eventEndDate, setEventEndDate] = useState('');
  const [totalDays, setTotalDays] = useState<number>(1);
  const [eventType, setEventType] = useState<EventType>('custom_items');
  const [location, setLocation] = useState('Bandhi, Khorimahuwa, Rajdhanwar');
  const [specialNotes, setSpecialNotes] = useState('');

  // Payment Mode, Discount Code & Reward Wallet state
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'Cash'>('UPI');
  const [discountCodeInput, setDiscountCodeInput] = useState('');
  const [appliedDiscountCode, setAppliedDiscountCode] = useState('');
  const [discountError, setDiscountError] = useState('');
  const [applyReward, setApplyReward] = useState<boolean>(true);
  const [rewardBanner, setRewardBanner] = useState<{
    bookingNumber: string;
    earned: number;
    used: number;
  } | null>(null);

  // Pcs quantities map: planId -> qty
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({
    rate_box_setup: 1
  });

  // Requirement Photo / Copy list state
  const [requirementPhoto, setRequirementPhoto] = useState<string>('');
  const [requirementItemsText, setRequirementItemsText] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const paperSlipSectionRef = useRef<HTMLDivElement>(null);

  // Voice Mic state
  const [isListening, setIsListening] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState<{
    text: string;
    type: 'info' | 'success' | 'error';
  } | null>(null);
  const speechRecognitionRef = useRef<any>(null);

  const modalVisible = isModalOpen || internalModalOpen || !!editingBooking;

  const openBookingPopup = () => {
    setFormError('');
    if (onOpenModal) {
      onOpenModal();
    } else {
      setInternalModalOpen(true);
    }
  };

  const stopVoiceRecognition = () => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {
        // Ignore already-stopped errors
      }
      speechRecognitionRef.current = null;
    }
    setIsListening(false);
  };

  useEffect(() => {
    return () => {
      stopVoiceRecognition();
    };
  }, []);

  const closeBookingPopup = () => {
    stopVoiceRecognition();
    setVoiceFeedback(null);
    setInternalModalOpen(false);
    if (onCloseModal) {
      onCloseModal();
    }
    resetFormToBlank();
    if (editingBooking && onCancelEditBooking) {
      onCancelEditBooking();
    }
  };

  const resetFormToBlank = () => {
    setCustomerName(currentUserName || '');
    setCustomerPhone(currentUserMobile || '');
    setEventDate('');
    setEventEndDate('');
    setTotalDays(1);
    setEventType('custom_items');
    setLocation('Bandhi, Khorimahuwa, Rajdhanwar');
    setSpecialNotes('');
    setPaymentMode('UPI');
    setDiscountCodeInput('');
    setAppliedDiscountCode('');
    setDiscountError('');
    setApplyReward(true);
    setItemQuantities({ rate_box_setup: 1 });
    setRequirementPhoto('');
    setRequirementItemsText('');
    setFormError('');
  };

  // Apply external preselected plan or coupon when big modal opens
  useEffect(() => {
    if (!isModalOpen || editingBooking) return;

    if (preselectedPlan) {
      if (preselectedPlan.id === 'rate_wedding') {
        setEventType('wedding');
      } else if (preselectedPlan.id === 'rate_party') {
        setEventType('party');
      } else if (preselectedPlan.id === 'rate_birthday') {
        setEventType('birthday');
      } else {
        setEventType('custom_items');
        setItemQuantities((prev) => ({
          ...prev,
          [preselectedPlan.id]: Math.max(1, prev[preselectedPlan.id] || 0)
        }));
      }
    }

    if (preselectedCouponCode) {
      setDiscountCodeInput(preselectedCouponCode.toUpperCase());
      setAppliedDiscountCode(preselectedCouponCode.toUpperCase());
      setDiscountError('');
    }
  }, [isModalOpen, preselectedPlan, preselectedCouponCode, editingBooking]);

  useEffect(() => {
    if (openPaperSlipNonce > 0 && modalVisible) {
      setTimeout(() => {
        paperSlipSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 120);
    }
  }, [openPaperSlipNonce, modalVisible]);

  // Pre-fill form whenever editingBooking is selected
  useEffect(() => {
    if (!editingBooking) return;
    setFormError('');
    setEditSavedBanner(null);
    setRewardBanner(null);
    setCustomerName(editingBooking.customerName);
    setCustomerPhone(editingBooking.customerPhone);
    setEventDate(editingBooking.eventDate);
    setEventEndDate(editingBooking.eventEndDate || editingBooking.eventDate);
    setTotalDays(editingBooking.totalDays || 1);
    setEventType(editingBooking.eventType);
    setLocation(editingBooking.location);
    setSpecialNotes(editingBooking.specialNotes || '');
    setPaymentMode(editingBooking.paymentMode || 'UPI');
    setDiscountCodeInput(editingBooking.discountCode || '');
    setAppliedDiscountCode(editingBooking.discountCode || '');
    setDiscountError('');
    setApplyReward(
      Boolean(editingBooking.rewardUsed && editingBooking.rewardUsed > 0) ||
      Boolean(editingBooking.applyAvailableRewardOnQuote)
    );
    setRequirementPhoto(editingBooking.requirementPhoto || '');
    setRequirementItemsText(editingBooking.requirementItemsText || '');

    const nextQtyMap: Record<string, number> = {};
    if (editingBooking.selectedItems && editingBooking.selectedItems.length > 0) {
      editingBooking.selectedItems.forEach((it) => {
        if (it.id !== 'rate_birthday') {
          nextQtyMap[it.id] = it.qty;
        }
      });
    }
    setItemQuantities(nextQtyMap);
  }, [editingBooking]);

  // Filter equipment plans
  const equipmentPlans = ratePlans.filter(
    (p) => !p.isOwnerQuoted && p.category !== 'event' && p.id !== 'rate_birthday'
  );
  const birthdayPlan = ratePlans.find((p) => p.id === 'rate_birthday');
  const birthdayPrice = birthdayPlan ? birthdayPlan.price : 6000;

  const isCustomPhoto = !!requirementPhoto;
  const isOwnerQuotedEvent = eventType === 'wedding' || eventType === 'party' || isCustomPhoto;

  // Calculate total from selected items or Birthday Party
  const selectedBookingItems: BookingItem[] = [];
  if (!isOwnerQuotedEvent) {
    if (eventType === 'birthday') {
      selectedBookingItems.push({
        id: 'rate_birthday',
        name: 'Birthday Party (Only Night)',
        qty: 1,
        unitPrice: birthdayPrice,
        unitLabel: 'Only Night',
        subtotal: birthdayPrice
      });
    }

    equipmentPlans.forEach((plan) => {
      const qty = itemQuantities[plan.id] || 0;
      if (qty > 0) {
        selectedBookingItems.push({
          id: plan.id,
          name: plan.nameEn || plan.nameHi,
          qty,
          unitPrice: plan.price,
          unitLabel: plan.unitLabel || 'Per Pc',
          subtotal: qty * plan.price
        });
      }
    });
  }

  const calculatedTotal = isOwnerQuotedEvent
    ? 0
    : selectedBookingItems.reduce((sum, item) => sum + item.subtotal, 0);

  // Evaluate currently applied Discount Code live against Payment Mode & Subtotal
  const activeDiscountEval = appliedDiscountCode
    ? evaluateDiscountCode(
        appliedDiscountCode,
        discountCodes,
        calculatedTotal,
        paymentMode,
        isOwnerQuotedEvent
      )
    : null;

  const effectiveDiscountCode = activeDiscountEval?.valid
    ? activeDiscountEval.discountCodeObj?.code
    : undefined;
  const effectiveDiscountAmount =
    !isOwnerQuotedEvent && activeDiscountEval?.valid ? activeDiscountEval.discountAmount : 0;

  // Reward Wallet evaluation for this customer
  const rewardSummary = getCustomerRewardSummary(
    bookings,
    currentUserId,
    customerPhone || currentUserMobile,
    editingBooking?.id,
    rewardPercent
  );
  const afterDiscountTotal = isOwnerQuotedEvent
    ? 0
    : Math.max(0, calculatedTotal - effectiveDiscountAmount);
  const appliedRewardAmount =
    !isOwnerQuotedEvent && applyReward && rewardSummary.availableReward > 0
      ? Math.min(rewardSummary.availableReward, afterDiscountTotal)
      : 0;

  const finalTotal = isOwnerQuotedEvent
    ? 0
    : Math.max(0, afterDiscountTotal - appliedRewardAmount);
  const currentBookingRewardEarned = isOwnerQuotedEvent
    ? 0
    : calculateBookingReward(finalTotal, rewardPercent);

  const handleApplyDiscount = (codeOverride?: string) => {
    const targetCode = (codeOverride ?? discountCodeInput).trim().toUpperCase();
    setDiscountError('');
    if (!targetCode) return;

    const matchedObj = discountCodes.find((d) => d.code.toUpperCase() === targetCode);
    const nextPaymentMode =
      matchedObj && matchedObj.paymentModeScope !== 'ALL'
        ? matchedObj.paymentModeScope
        : paymentMode;
    if (nextPaymentMode !== paymentMode) {
      setPaymentMode(nextPaymentMode);
    }

    const res = evaluateDiscountCode(
      targetCode,
      discountCodes,
      calculatedTotal,
      nextPaymentMode,
      isOwnerQuotedEvent
    );
    if (!res.valid || !res.discountCodeObj) {
      setDiscountError(res.error || 'अमान्य डिस्काउंट कोड।');
      setAppliedDiscountCode('');
      setDiscountCodeInput(targetCode);
      return;
    }
    setAppliedDiscountCode(res.discountCodeObj.code);
    setDiscountCodeInput(res.discountCodeObj.code);
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscountCode('');
    setDiscountCodeInput('');
    setDiscountError('');
  };

  const updateItemQty = (planId: string, delta: number) => {
    setItemQuantities((prev) => {
      const next = Math.max(0, (prev[planId] || 0) + delta);
      return { ...prev, [planId]: next };
    });
  };

  const setExactItemQty = (planId: string, val: number) => {
    setItemQuantities((prev) => ({
      ...prev,
      [planId]: Math.max(0, isNaN(val) ? 0 : val)
    }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setRequirementPhoto(result);
      if (!requirementItemsText) {
        setRequirementItemsText('कॉपी में लिखा सामान (पर्ची फोटो संलग्न)');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setRequirementPhoto('');
    setRequirementItemsText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const applyVoiceTranscript = (transcript: string) => {
    const parsed = parseVoiceBookingCommand(transcript, ratePlans);

    if (parsed.matchedItems.length > 0) {
      setEventType('custom_items');
      setItemQuantities((prev) => {
        const next = { ...prev };
        for (const { plan, qty } of parsed.matchedItems) {
          next[plan.id] = qty;
        }
        return next;
      });
      const summary = parsed.matchedItems
        .map(({ plan, qty }) => `${plan.nameEn || plan.nameHi} × ${qty}`)
        .join(', ');
      setVoiceFeedback({
        text: `"${transcript}" → जोड़ा गया: ${summary}`,
        type: 'success'
      });
      return;
    }

    if (parsed.detectedEventType) {
      setEventType(parsed.detectedEventType);
      setVoiceFeedback({
        text: `"${transcript}" → Booking Type: ${parsed.detectedEventType}`,
        type: 'success'
      });
      return;
    }

    setVoiceFeedback({
      text: `"${transcript}" सुना गया — कृपया ऐसे बोलें: "Horn 100 pcs, Box set, Light 50"`,
      type: 'error'
    });
  };

  const handleToggleVoiceMic = () => {
    if (isListening) {
      stopVoiceRecognition();
      return;
    }

    const win = window as any;
    const SpeechRecognitionCtor = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setVoiceFeedback({
        text: 'आपके ब्राउज़र में Voice Mic सपोर्ट उपलब्ध नहीं है (Chrome/Android उपयोग करें)।',
        type: 'error'
      });
      return;
    }

    try {
      const recognition = new SpeechRecognitionCtor();
      recognition.lang = 'hi-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceFeedback({
          text: 'सुन रहे हैं... बोलें जैसे: "Horn 100 pcs, Box set, 50 Light"',
          type: 'info'
        });
      };

      recognition.onresult = (event: any) => {
        const transcript = event?.results?.[0]?.[0]?.transcript || '';
        setIsListening(false);
        speechRecognitionRef.current = null;
        if (transcript.trim()) {
          applyVoiceTranscript(transcript.trim());
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        speechRecognitionRef.current = null;
        const errCode = event?.error;
        if (errCode === 'not-allowed' || errCode === 'service-not-allowed') {
          setVoiceFeedback({
            text: 'माइक की अनुमति (Microphone Permission) बंद है। कृपया अनुमति दें।',
            type: 'error'
          });
        } else if (errCode === 'no-speech') {
          setVoiceFeedback({
            text: 'आवाज़ सुनाई नहीं दी — दोबारा Mic दबाकर बोलें।',
            type: 'error'
          });
        } else {
          setVoiceFeedback({
            text: 'माइक से आवाज़ पहचानने में समस्या आई, दोबारा प्रयास करें।',
            type: 'error'
          });
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        speechRecognitionRef.current = null;
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
      setVoiceFeedback({
        text: 'Voice Mic शुरू करने में त्रुटि हुई।',
        type: 'error'
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!customerName.trim() || !customerPhone.trim() || !eventDate) {
      setFormError('कृपया नाम, मोबाइल नंबर और कैलेंडर से तारीख (कब से कब तक) चुनें।');
      return;
    }

    const minBookable = getMinBookableDateStr();
    const dateChangedWhileEditing = editingBooking && eventDate !== editingBooking.eventDate;
    if ((!editingBooking || dateChangedWhileEditing) && !isBookableDate(eventDate)) {
      setFormError(
        `पिछली या आज की तारीख की बुकिंग नहीं हो सकती। कृपया कल (${minBookable}) या उसके बाद की तारीख चुनें।`
      );
      return;
    }

    if (!isOwnerQuotedEvent && calculatedTotal <= 0) {
      setFormError('कृपया कम से कम 1 सामान (Pcs) या Birthday Party चुनें।');
      return;
    }

    const bookingDuration: EventDuration = isCustomPhoto
      ? 'none'
      : eventType === 'birthday'
      ? 'night_shift'
      : 'custom_days';

    // Handle Customer Editing Existing Unpaid Booking
    if (editingBooking) {
      if (!canCustomerEditBooking(editingBooking)) {
        setFormError('पेमेंट हो जाने या UTR भेजने के बाद बुकिंग एडिट नहीं की जा सकती।');
        return;
      }

      const draftUpdated: Booking = {
        ...editingBooking,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        eventDate,
        eventEndDate: eventEndDate || eventDate,
        totalDays: totalDays || 1,
        eventType,
        duration: bookingDuration,
        location: location.trim(),
        selectedItems: selectedBookingItems.length > 0 ? selectedBookingItems : undefined,
        subtotalAmount: isOwnerQuotedEvent ? undefined : calculatedTotal,
        discountCode: effectiveDiscountCode,
        discountAmount: effectiveDiscountAmount > 0 ? effectiveDiscountAmount : undefined,
        rewardUsed: appliedRewardAmount > 0 ? appliedRewardAmount : undefined,
        rewardEarned: currentBookingRewardEarned,
        applyAvailableRewardOnQuote: isOwnerQuotedEvent && applyReward && rewardSummary.availableReward > 0,
        totalAmount: finalTotal,
        advancePaid: 0,
        balanceDue: finalTotal,
        paymentMode,
        status: isOwnerQuotedEvent ? 'quote_pending' : 'pending_payment',
        specialNotes: specialNotes.trim(),
        requirementPhoto: requirementPhoto || undefined,
        requirementItemsText: requirementItemsText.trim() || undefined,
        isCustomPhotoQuote: isOwnerQuotedEvent,
      };

      const editSummary = buildCustomerEditSummary(editingBooking, draftUpdated);
      const finalizedUpdated: Booking = {
        ...draftUpdated,
        editedByCustomer: true,
        customerEditedAt: new Date().toISOString(),
        editCount: (editingBooking.editCount || 0) + 1,
        editSummary,
        ownerEditReviewed: false,
      };

      if (onUpdateCustomerBooking) {
        onUpdateCustomerBooking(finalizedUpdated);
      }

      closeBookingPopup();
      setEditSavedBanner({
        booking: finalizedUpdated,
        message: `बुकिंग ${finalizedUpdated.bookingNumber} सफलतापूर्वक एडिट हो गई है! आपका बदलाव मालिक (Owner) को तुरंत दिख गया है।`
      });
      return;
    }

    const newBooking: Booking = {
      id: 'bk_' + Date.now(),
      bookingNumber: `SKB-2026-${Math.floor(100 + Math.random() * 900)}`,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerId: currentUserId,
      bookedByRole: currentUserRole,
      eventDate,
      eventEndDate: eventEndDate || eventDate,
      totalDays: totalDays || 1,
      eventType,
      duration: bookingDuration,
      location: location.trim(),
      selectedItems: selectedBookingItems.length > 0 ? selectedBookingItems : undefined,
      subtotalAmount: isOwnerQuotedEvent ? undefined : calculatedTotal,
      discountCode: effectiveDiscountCode,
      discountAmount: effectiveDiscountAmount > 0 ? effectiveDiscountAmount : undefined,
      rewardUsed: appliedRewardAmount > 0 ? appliedRewardAmount : undefined,
      rewardEarned: currentBookingRewardEarned,
      applyAvailableRewardOnQuote: isOwnerQuotedEvent && applyReward && rewardSummary.availableReward > 0,
      totalAmount: finalTotal,
      advancePaid: 0,
      balanceDue: finalTotal,
      paymentMode,
      status: isOwnerQuotedEvent ? 'quote_pending' : 'pending_payment',
      specialNotes: specialNotes.trim(),
      requirementPhoto: requirementPhoto || undefined,
      requirementItemsText: requirementItemsText.trim() || undefined,
      isCustomPhotoQuote: isOwnerQuotedEvent,
      createdAt: new Date().toISOString()
    };

    const qrAmount =
      !isOwnerQuotedEvent && paymentMode === 'UPI' && finalTotal > 0 ? finalTotal : undefined;
    onAddNewBooking(newBooking, qrAmount);

    setRewardBanner({
      bookingNumber: newBooking.bookingNumber,
      earned: currentBookingRewardEarned,
      used: appliedRewardAmount
    });

    closeBookingPopup();
  };

  // Visible bookings based on role
  const visibleBookings = bookings.filter((b) => {
    if (currentUserRole === 'customer' && currentUserId) {
      return b.customerId === currentUserId || b.customerPhone === currentUserMobile;
    }
    return true;
  });

  // Filtered Bookings
  const filteredBookings = visibleBookings.filter((b) => {
    const matchesSearch =
      b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.customerPhone.includes(searchTerm) ||
      b.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const minBookableDate = getMinBookableDateStr();

  return (
    <>
      {/* BOOKING MANAGEMENT TAB SECTION (Original Dark Obsidian & Gold Theme) */}
      {(showLedger || editSavedBanner || rewardBanner) && (
        <section id="booking" className="py-6 bg-neutral-950 text-neutral-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">

            {/* Inline Confirmation Banner After Customer Edits a Booking */}
            {editSavedBanner && (
              <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex items-start gap-2.5 text-xs text-emerald-200">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-white">{editSavedBanner.message}</div>
                    {editSavedBanner.booking.editSummary && (
                      <div className="text-[11px] text-emerald-300 mt-0.5">
                        बदलाव: {editSavedBanner.booking.editSummary}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {editSavedBanner.booking.totalAmount > 0 && editSavedBanner.booking.balanceDue > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const b = editSavedBanner.booking;
                        setEditSavedBanner(null);
                        onOpenUPIForBooking(b, b.balanceDue);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Pay ₹{editSavedBanner.booking.balanceDue.toLocaleString('en-IN')}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setEditSavedBanner(null)}
                    className="p-1.5 text-emerald-300 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Booking & Reward Confirmation Banner After New Booking */}
            {rewardBanner && (
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-950/60 border border-emerald-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-start gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-emerald-500 text-black shrink-0">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div className="text-neutral-200 space-y-1">
                    <div className="font-bold text-sm text-white">
                      बुकिंग {rewardBanner.bookingNumber} सफल हो गई!
                    </div>
                    {rewardBanner.used > 0 && (
                      <div className="text-emerald-400 font-semibold">
                        ₹{rewardBanner.used.toLocaleString('en-IN')} रिवॉर्ड ऑफ़ लागू हो गया है
                      </div>
                    )}
                    <div className="text-[11px] text-neutral-400">
                      {rewardBanner.earned > 0
                        ? `इस बुकिंग पर ${rewardPercent}% रिवॉर्ड = ₹${rewardBanner.earned.toLocaleString('en-IN')} मिला (अगली बुकिंग में ऑफ़ होगा)।`
                        : `मालिक द्वारा रेट तय होते ही ${rewardPercent}% रिवॉर्ड आपके खाते में जुड़ जाएगा।`}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRewardBanner(null)}
                  className="p-2 text-neutral-400 hover:text-white cursor-pointer self-end sm:self-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {showLedger && (
              <>
                {/* Bookings Header Bar */}
                <div className="p-5 sm:p-6 rounded-3xl bg-neutral-900 border border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-amber-400 flex flex-wrap items-center gap-2">
                      <span>Booking History & Management</span>
                      <span aria-hidden="true" className="text-neutral-600">·</span>
                      <span className="text-neutral-400">Next Day Onwards ({minBookableDate}+)</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                      My Bookings, Payments & Official Slips
                    </h2>
                    <p className="text-xs sm:text-sm text-neutral-400">
                      पेमेंट से पहले एडिट करें, रसीद देखें, या नई बुकिंग के लिए बड़ा फॉर्म पॉपअप खोलें।
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={openBookingPopup}
                    className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer shadow-sm whitespace-nowrap shrink-0"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>+ Book New Event / Add Pcs</span>
                  </button>
                </div>

                {/* Search & Status Filters */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search booking number, location..."
                      className="w-full pl-10 pr-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 shadow-sm"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 p-1 bg-neutral-900 rounded-xl border border-neutral-800 text-xs overflow-x-auto shadow-sm">
                    {[
                      { key: 'all', label: `All (${visibleBookings.length})` },
                      { key: 'utr_submitted', label: 'UTR Pending' },
                      { key: 'pending_payment', label: 'Payment Pending' },
                      { key: 'quote_pending', label: 'Rate Pending' },
                      { key: 'confirmed', label: 'Confirmed' },
                      { key: 'cancelled', label: 'Cancelled' }
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setStatusFilter(tab.key as any)}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap ${
                          statusFilter === tab.key
                            ? 'bg-amber-400 text-black'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clean Bookings Table */}
                <div className="overflow-x-auto rounded-3xl border border-neutral-800 bg-neutral-900 shadow-lg">
                  <table className="w-full text-left text-xs text-neutral-300">
                    <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800 uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="px-4 py-3.5 font-bold">Slip No. & Dates</th>
                        <th className="px-4 py-3.5 font-bold">Event & Items (Pcs)</th>
                        <th className="px-4 py-3.5 font-bold">Location</th>
                        <th className="px-4 py-3.5 font-bold text-right">Total (₹)</th>
                        <th className="px-4 py-3.5 font-bold text-right">Paid / Due</th>
                        <th className="px-4 py-3.5 font-bold text-center">Status</th>
                        <th className="px-4 py-3.5 font-bold text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/80">
                      {filteredBookings.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-10 text-center text-neutral-400">
                            कोई बुकिंग नहीं मिली। नई बुकिंग करने के लिए <strong className="text-amber-400">"+ Book New Event / Add Pcs"</strong> दबाएँ।
                          </td>
                        </tr>
                      ) : (
                        filteredBookings.map((b) => (
                          <tr key={b.id} className="hover:bg-neutral-950/60 transition-colors">
                            <td className="px-4 py-3.5 whitespace-nowrap font-mono">
                              <div className="font-bold text-white">{b.bookingNumber}</div>
                              <div className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5">
                                <Calendar className="w-3 h-3 text-amber-400" />
                                <span>
                                  {b.eventDate}
                                  {b.eventEndDate && b.eventEndDate !== b.eventDate ? ` → ${b.eventEndDate}` : ''}
                                </span>
                              </div>
                              {b.totalDays && b.totalDays > 1 && (
                                <span className="text-[10px] text-amber-400 font-sans font-semibold">
                                  ({b.totalDays} दिन का कार्यक्रम)
                                </span>
                              )}
                              {b.editedByCustomer && (
                                <div className="text-[10px] text-amber-400 font-sans font-semibold mt-0.5">
                                  Edited ({b.editCount || 1}×)
                                </div>
                              )}
                            </td>

                            <td className="px-4 py-3.5">
                              {b.requirementPhoto ? (
                                <div className="flex items-center gap-2">
                                  <img
                                    src={b.requirementPhoto}
                                    alt="Paper Slip"
                                    onClick={() => setViewingPhotoUrl(b.requirementPhoto || null)}
                                    className="w-9 h-11 object-cover rounded border border-amber-400 cursor-pointer shadow-sm"
                                  />
                                  <div>
                                    <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
                                      Paper Slip
                                    </span>
                                    <div className="text-[10px] text-neutral-400 mt-0.5 max-w-[180px] truncate">
                                      {b.requirementItemsText}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <span className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-white text-[11px] font-bold capitalize">
                                    {b.eventType === 'custom_items'
                                      ? 'Custom Pcs Setup'
                                      : b.eventType === 'birthday'
                                      ? 'Birthday (Only Night)'
                                      : b.eventType}
                                  </span>
                                  {b.selectedItems && b.selectedItems.length > 0 && (
                                    <div className="text-[11px] text-neutral-400 max-w-[220px]">
                                      {b.selectedItems.map((it) => `${it.name.split(' ')[0]} × ${it.qty}`).join(', ')}
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>

                            <td className="px-4 py-3.5 max-w-[180px]">
                              <div className="flex items-start gap-1">
                                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                <span className="truncate" title={b.location}>{b.location}</span>
                              </div>
                            </td>

                            <td className="px-4 py-3.5 text-right font-mono font-bold whitespace-nowrap tabular-nums">
                              {b.totalAmount === 0 || b.status === 'quote_pending' ? (
                                <div>
                                  <span className="text-amber-400 text-sm">₹00</span>
                                  <div className="text-[10px] text-neutral-400 font-sans">मालिक रेट तय करेंगे</div>
                                  {b.discountCode && (
                                    <div className="text-[10px] text-emerald-400">Code: {b.discountCode}</div>
                                  )}
                                </div>
                              ) : (
                                <div>
                                  <span className="text-white text-sm">₹{b.totalAmount.toLocaleString('en-IN')}</span>
                                  <div className="text-[10px] text-neutral-400">{b.paymentMode}</div>
                                  {b.discountCode && (b.discountAmount || 0) > 0 && (
                                    <div className="text-[10px] text-emerald-400">
                                      -₹{b.discountAmount?.toLocaleString('en-IN')} ({b.discountCode})
                                    </div>
                                  )}
                                  {(b.rewardUsed || 0) > 0 && (
                                    <div className="text-[10px] text-emerald-400">
                                      -₹{b.rewardUsed?.toLocaleString('en-IN')} Reward Off
                                    </div>
                                  )}
                                  {getBookingRewardEarned(b, rewardPercent) > 0 && (
                                    <div className="text-[10px] text-amber-400">
                                      +₹{getBookingRewardEarned(b, rewardPercent).toLocaleString('en-IN')} ({rewardPercent}% Reward)
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>

                            <td className="px-4 py-3.5 text-right font-mono whitespace-nowrap tabular-nums">
                              {b.totalAmount === 0 || b.status === 'quote_pending' ? (
                                <span className="text-neutral-500 text-[11px]">रेट तय होने पर</span>
                              ) : (
                                <>
                                  <div className="text-emerald-400 font-bold">
                                    Paid: ₹{b.advancePaid.toLocaleString('en-IN')}
                                  </div>
                                  <div className="text-amber-400 text-[11px] font-semibold">
                                    Due: ₹{b.balanceDue.toLocaleString('en-IN')}
                                  </div>
                                  {b.pendingUtrNumber && b.status === 'utr_submitted' && (
                                    <div className="text-[10px] text-cyan-300 mt-0.5">
                                      UTR: {b.pendingUtrNumber}
                                    </div>
                                  )}
                                </>
                              )}
                            </td>

                            <td className="px-4 py-3.5 text-center whitespace-nowrap">
                              {b.status === 'cancelled' ? (
                                <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold border bg-rose-950/60 text-rose-300 border-rose-700/60">
                                  Cancelled
                                </span>
                              ) : b.status === 'quote_pending' || b.totalAmount === 0 ? (
                                <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold border bg-amber-950/60 text-amber-300 border-amber-700/60">
                                  Owner Rate Pending
                                </span>
                              ) : b.status === 'utr_submitted' ? (
                                <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold border bg-cyan-950/60 text-cyan-300 border-cyan-700/60">
                                  UTR Verify Pending
                                </span>
                              ) : b.status === 'confirmed' || b.status === 'completed' ? (
                                <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold border bg-emerald-950/60 text-emerald-300 border-emerald-700/60 capitalize">
                                  {b.status}
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold border bg-amber-950/60 text-amber-300 border-amber-700/60">
                                  Payment Pending
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-3.5 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-2">
                                {canCustomerEditBooking(b) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (onStartEditBooking) {
                                        onStartEditBooking(b);
                                      }
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-400 text-amber-300 hover:text-black border border-amber-500/40 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                    title="Edit Booking Before Payment"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>Edit</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => onViewSlip(b)}
                                  className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                                >
                                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Slip</span>
                                </button>

                                {b.status !== 'cancelled' && b.totalAmount > 0 && b.balanceDue > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => onOpenUPIForBooking(b, b.balanceDue)}
                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                                  >
                                    <QrCode className="w-3.5 h-3.5" />
                                    <span>
                                      {b.status === 'utr_submitted'
                                        ? 'Pay Again'
                                        : `Pay ₹${b.balanceDue.toLocaleString('en-IN')}`}
                                    </span>
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
                                        className="px-2 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
                                      >
                                        Confirm
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setConfirmCancelId(null)}
                                        className="px-2 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 text-xs cursor-pointer"
                                      >
                                        No
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setConfirmCancelId(b.id)}
                                      className="px-2.5 py-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 border border-rose-700/50 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                                      title="Cancel Booking"
                                    >
                                      <XCircle className="w-3.5 h-3.5" />
                                      <span>Cancel</span>
                                    </button>
                                  )
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

          </div>
        </section>
      )}

      {/* FOCUSED BOOKING DETAILS POPUP MODAL (Original Dark Obsidian & Gold Theme) */}
      {modalVisible && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-black/80 backdrop-blur-sm"
          onClick={closeBookingPopup}
        >
          <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl bg-neutral-950 text-neutral-100 border border-neutral-800 shadow-2xl overflow-hidden"
          >
            {/* Minimal Modal Header */}
            <div className="px-5 sm:px-6 py-3.5 bg-neutral-900 text-white border-b border-neutral-800 flex items-center justify-between gap-4 shrink-0">
              <h3 className="text-base sm:text-lg font-extrabold text-amber-400">
                {editingBooking
                  ? `बुकिंग एडिट करें (${editingBooking.bookingNumber})`
                  : 'बुकिंग विवरण भरें (Booking Details)'}
              </h3>

              <button
                type="button"
                onClick={closeBookingPopup}
                className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white cursor-pointer shrink-0"
                aria-label="Close Booking Popup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Focused Form Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-700/60 text-rose-200 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 01. Essential Customer & Event Fields */}
              <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-sm space-y-3.5">
                <div className="text-xs font-extrabold text-amber-400 uppercase tracking-wide border-b border-neutral-800 pb-2">
                  01. Customer & Event Details
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1">
                      Customer Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1">
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="10-digit mobile"
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-sm font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1">
                      Event Date *
                    </label>
                    <button
                      type="button"
                      onClick={() => setCalendarModalOpen(true)}
                      className="w-full min-h-[40px] px-3 py-2 bg-neutral-950 border border-amber-500/50 hover:bg-neutral-800 rounded-xl text-left flex items-center justify-between gap-2 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                        {eventDate ? (
                          <span className="text-xs font-mono font-bold text-white truncate tabular-nums">
                            {eventDate}{eventEndDate && eventEndDate !== eventDate ? ` → ${eventEndDate}` : ''} ({totalDays}d)
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-amber-300 truncate">
                            {minBookableDate}+ चुनें
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] bg-amber-400 text-black font-bold px-2 py-0.5 rounded-md shrink-0">
                        Pick
                      </span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1">
                      Booking Type *
                    </label>
                    <select
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value as EventType)}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="custom_items">Equipment Items (Pcs)</option>
                      <option value="birthday">Birthday Party (₹{birthdayPrice.toLocaleString('en-IN')})</option>
                      <option value="wedding">Wedding (Owner Rate)</option>
                      <option value="party">Party / Function (Owner Rate)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-neutral-300 mb-1">
                      Event Location *
                    </label>
                    <input
                      type="text"
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Village / Ward / Venue"
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* Voice Mic Quick Add Bar */}
              <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={handleToggleVoiceMic}
                    className={`min-h-[40px] px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer shrink-0 transition-all ${
                      isListening
                        ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse shadow-md'
                        : 'bg-amber-400 hover:bg-amber-300 text-black'
                    }`}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="w-4 h-4" />
                        <span>Stop Listening...</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4" />
                        <span>Mic से बोलकर जोड़ें</span>
                      </>
                    )}
                  </button>

                  <span className="text-[11px] text-neutral-300 truncate">
                    बोलें: "Horn 100 pcs, Box set" — सामान अपने-आप जुड़ जाएगा
                  </span>
                </div>

                {voiceFeedback && (
                  <div
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold border ${
                      voiceFeedback.type === 'success'
                        ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300'
                        : voiceFeedback.type === 'error'
                        ? 'bg-rose-950/60 border-rose-700/60 text-rose-300'
                        : 'bg-amber-950/60 border-amber-700/60 text-amber-300'
                    }`}
                  >
                    {voiceFeedback.text}
                  </div>
                )}
              </div>

              {/* 02. Equipment Items (Only for itemized / birthday bookings) */}
              {!isOwnerQuotedEvent && (
                <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-sm space-y-3">
                  <div className="flex items-center justify-between gap-2 border-b border-neutral-800 pb-2">
                    <div className="flex items-center gap-2 text-xs font-extrabold text-amber-400 uppercase tracking-wide">
                      <Layers className="w-4 h-4 text-amber-400" />
                      <span>02. Select Equipment (Pcs)</span>
                    </div>
                    <span className="text-xs font-mono font-extrabold text-emerald-400 tabular-nums">
                      ₹{calculatedTotal.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {equipmentPlans.map((plan) => {
                      const qty = itemQuantities[plan.id] || 0;
                      const itemImg =
                        plan.imageUrl !== undefined
                          ? (plan.imageUrl || undefined)
                          : RATE_PLAN_IMAGES[plan.id];
                      return (
                        <div
                          key={plan.id}
                          className={`p-2.5 rounded-xl border transition-all flex flex-col justify-between gap-2 ${
                            qty > 0
                              ? 'bg-amber-500/10 border-amber-400/70'
                              : 'bg-neutral-950 border-neutral-800'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {itemImg && (
                                <img
                                  src={itemImg}
                                  alt={plan.nameEn || plan.nameHi}
                                  referrerPolicy="no-referrer"
                                  className="w-9 h-9 rounded-lg object-cover border border-neutral-700 shrink-0"
                                />
                              )}
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-white truncate">
                                  {plan.nameEn || plan.nameHi}
                                </div>
                                <div className="text-[11px] font-mono text-amber-400 font-bold tabular-nums">
                                  ₹{plan.price.toLocaleString('en-IN')} / {plan.unitLabel || 'pc'}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-medium text-neutral-400">Qty:</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => updateItemQty(plan.id, -1)}
                                className="w-7 h-7 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white flex items-center justify-center cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <input
                                type="number"
                                min={0}
                                value={qty}
                                onChange={(e) => setExactItemQty(plan.id, parseInt(e.target.value, 10))}
                                className="w-12 text-center py-0.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-400 tabular-nums"
                              />
                              <button
                                type="button"
                                onClick={() => updateItemQty(plan.id, 1)}
                                className="w-7 h-7 rounded-lg bg-amber-400 hover:bg-amber-300 text-black flex items-center justify-center cursor-pointer font-bold"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 03. Requirement Slip Photo (Optional) */}
              <div
                ref={paperSlipSectionRef}
                className="p-4 sm:p-5 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-amber-400 uppercase tracking-wide">
                    <Camera className="w-4 h-4 text-amber-400" />
                    <span>03. Requirement Slip Photo (Optional)</span>
                  </div>

                  {!requirementPhoto && (
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        id="paper-slip-file"
                      />
                      <label
                        htmlFor="paper-slip-file"
                        className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-black font-bold rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Slip Photo</span>
                      </label>
                    </div>
                  )}
                </div>

                {requirementPhoto && (
                  <div className="p-2.5 bg-neutral-950 rounded-xl border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <img
                        src={requirementPhoto}
                        alt="Requirement Slip"
                        className="w-12 h-14 object-cover rounded-lg border border-amber-400 cursor-pointer shrink-0"
                        onClick={() => setViewingPhotoUrl(requirementPhoto)}
                      />
                      <input
                        type="text"
                        value={requirementItemsText}
                        onChange={(e) => setRequirementItemsText(e.target.value)}
                        placeholder="Slip items note..."
                        className="flex-1 sm:w-72 px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-700/60 rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                )}
              </div>

              {/* 04. Payment Mode, Coupon Code & Notes */}
              <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-sm space-y-3.5">
                <div className="text-xs font-extrabold text-amber-400 uppercase tracking-wide border-b border-neutral-800 pb-2">
                  04. Payment, Coupon & Notes
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                      Payment Mode *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMode('UPI');
                          setDiscountError('');
                        }}
                        className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                          paymentMode === 'UPI'
                            ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                        }`}
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>UPI / QR</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMode('Cash');
                          setDiscountError('');
                        }}
                        className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                          paymentMode === 'Cash'
                            ? 'bg-amber-950/60 border-amber-400 text-amber-300'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                        }`}
                      >
                        <Banknote className="w-4 h-4" />
                        <span>Cash</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-neutral-300 mb-1.5 flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-amber-400" />
                      <span>Coupon Code (Optional)</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={discountCodeInput}
                        onChange={(e) => {
                          setDiscountCodeInput(e.target.value.toUpperCase());
                          if (discountError) setDiscountError('');
                        }}
                        disabled={!!effectiveDiscountCode}
                        placeholder="Enter coupon code"
                        className="flex-1 px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs font-mono font-bold uppercase text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 disabled:opacity-60"
                      />
                      {effectiveDiscountCode ? (
                        <button
                          type="button"
                          onClick={handleRemoveDiscount}
                          className="px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-700/60 text-xs font-bold cursor-pointer"
                        >
                          Remove
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleApplyDiscount()}
                          className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold cursor-pointer"
                        >
                          Apply
                        </button>
                      )}
                    </div>

                    {discountCodes.some((c) => c.active) && !effectiveDiscountCode && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        {discountCodes
                          .filter((c) => c.active)
                          .map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => handleApplyDiscount(c.code)}
                              className="px-2 py-0.5 rounded-md bg-neutral-950 hover:bg-amber-400 text-amber-300 hover:text-black border border-amber-500/40 font-mono font-bold text-[11px] cursor-pointer transition-colors"
                            >
                              {c.code}
                            </button>
                          ))}
                      </div>
                    )}

                    {discountError && (
                      <div className="text-[11px] text-rose-400 font-medium mt-1">
                        {discountError}
                      </div>
                    )}

                    {!discountError && appliedDiscountCode && activeDiscountEval && !activeDiscountEval.valid && (
                      <div className="text-[11px] text-rose-400 font-medium mt-1">
                        {activeDiscountEval.error}
                      </div>
                    )}

                    {effectiveDiscountCode && (
                      <div className="text-[11px] text-emerald-400 font-bold mt-1">
                        {effectiveDiscountCode} Applied
                        {effectiveDiscountAmount > 0 ? ` (-₹${effectiveDiscountAmount.toLocaleString('en-IN')})` : ''}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">
                    Notes / Instructions (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    placeholder="Event timing or special request..."
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Sticky Modal Footer with Total & Primary Submit */}
            <div className="px-5 sm:px-6 py-3.5 bg-neutral-900 border-t border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="font-mono">
                <span className="text-neutral-400 block text-[10px] uppercase font-sans font-bold">
                  {isOwnerQuotedEvent ? 'Rate' : 'Total Payable'}
                </span>
                {isOwnerQuotedEvent ? (
                  <span className="text-amber-400 font-extrabold text-sm">Owner Set Rate (₹00)</span>
                ) : (
                  <div className="flex items-baseline gap-2 flex-wrap tabular-nums">
                    <span className="text-white font-extrabold text-lg">
                      ₹{finalTotal.toLocaleString('en-IN')}
                    </span>
                    {(effectiveDiscountAmount > 0 || appliedRewardAmount > 0) && (
                      <span className="text-neutral-500 line-through text-xs">
                        ₹{calculatedTotal.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeBookingPopup}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="min-h-[42px] px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  {editingBooking ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  ) : !isOwnerQuotedEvent && finalTotal > 0 && paymentMode === 'UPI' ? (
                    <>
                      <QrCode className="w-4 h-4" />
                      <span>Book & Pay (₹{finalTotal.toLocaleString('en-IN')})</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Submit Booking</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Interactive Touch Date Range Calendar Modal */}
      <DateRangeCalendarModal
        isOpen={calendarModalOpen}
        onClose={() => setCalendarModalOpen(false)}
        startDate={eventDate}
        endDate={eventEndDate}
        onSelectRange={(start, end, days) => {
          setEventDate(start);
          setEventEndDate(end);
          setTotalDays(days);
        }}
      />

      {/* High-Resolution Photo Viewer Modal */}
      {viewingPhotoUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative max-w-2xl w-full bg-neutral-900 border border-neutral-700 rounded-2xl p-4 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Camera className="w-4 h-4 text-amber-400" />
                <span>Customer Handwritten Requirement Slip</span>
              </div>
              <button
                type="button"
                onClick={() => setViewingPhotoUrl(null)}
                className="p-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-auto rounded-lg bg-neutral-950 flex items-center justify-center p-2 border border-neutral-800">
              <img
                src={viewingPhotoUrl}
                alt="Enlarged Customer List"
                className="max-h-[70vh] w-auto object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
