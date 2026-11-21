import React, { useState } from 'react';
import { Booking, EventType, BusinessConfig, CustomerNotification } from '../types';
import { 
  Calendar, 
  MapPin, 
  Phone, 
  Trash2, 
  Plus, 
  FileText, 
  QrCode, 
  Search, 
  CheckCircle, 
  X,
  ShieldCheck, 
  Edit3, 
  Check,
  Camera,
  Coins,
  Eye,
  BadgeCheck,
  MessageSquare
} from 'lucide-react';
import { DateRangeCalendarModal, getMinBookableDateStr } from './DateRangeCalendarModal';
import { getBookingRewardEarned } from '../utils/rewardUtils';

interface OwnerBookingManagerProps {
  business?: BusinessConfig;
  rewardPercent?: number;
  onUpdateBusinessName?: (newName: string) => void;
  bookings: Booking[];
  onAddBookingToList: (booking: Booking) => void;
  onDeleteBookingFromList: (bookingId: string) => void;
  onUpdateBookingStatus: (bookingId: string, status: Booking['status']) => void;
  onUpdateBookingPrice?: (bookingId: string, newTotal: number, newPaid?: number) => void;
  onApproveUtrPayment?: (bookingId: string) => void;
  onMarkEditReviewed?: (bookingId: string) => void;
  lastWhatsappDispatch?: CustomerNotification | null;
  onDismissWhatsappDispatch?: () => void;
  onViewSlip: (booking: Booking) => void;
  onOpenUPIForBooking: (booking: Booking, amount: number) => void;
  lang?: 'hi' | 'en';
}

export const OwnerBookingManager: React.FC<OwnerBookingManagerProps> = ({
  business,
  rewardPercent = 5,
  onUpdateBusinessName,
  bookings,
  onAddBookingToList,
  onDeleteBookingFromList,
  onUpdateBookingStatus,
  onUpdateBookingPrice,
  onApproveUtrPayment,
  onMarkEditReviewed,
  lastWhatsappDispatch = null,
  onDismissWhatsappDispatch,
  onViewSlip,
  onOpenUPIForBooking
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'edited' | 'utr_submitted' | 'quote_pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBusinessName, setEditingBusinessName] = useState(false);
  const [bizNameInput, setBizNameInput] = useState(business?.businessNameEn || 'SK Sound DJ Bandhi');
  const [ownerFeedback, setOwnerFeedback] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Photo viewer modal state
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);

  // Set Price / Quotation Modal for Owner
  const [priceModalBooking, setPriceModalBooking] = useState<Booking | null>(null);
  const [inputPriceTotal, setInputPriceTotal] = useState<number>(5000);
  const [inputPricePaid, setInputPricePaid] = useState<number>(0);

  // Touch Calendar for Owner manual add
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Manual Add State (Adding offline/phone booking to list)
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventEndDate, setEventEndDate] = useState('');
  const [totalDays, setTotalDays] = useState<number>(1);
  const [eventType, setEventType] = useState<EventType>('wedding');
  const [location, setLocation] = useState('Bandhi, Khorimahuwa, Rajdhanwar');
  const [totalAmount, setTotalAmount] = useState<number>(20000);
  const [paidAmount, setPaidAmount] = useState<number>(5000);
  const [notes, setNotes] = useState('');

  // Handle Manual Add by Owner
  const handleOwnerAddBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || !custPhone.trim() || !eventDate) {
      setOwnerFeedback('Please fill in customer name, mobile number, and event date.');
      return;
    }
    const minDate = getMinBookableDateStr();
    if (eventDate < minDate) {
      setOwnerFeedback(`आज या पिछली तारीख की बुकिंग नहीं हो सकती — केवल कल (${minDate}) से आगे की तारीख चुनें।`);
      return;
    }

    const balanceDue = Math.max(0, totalAmount - paidAmount);
    const nowIso = new Date().toISOString();

    const newBooking: Booking = {
      id: 'bk_' + Date.now(),
      bookingNumber: `SKB-2026-${Math.floor(100 + Math.random() * 900)}`,
      customerName: custName.trim(),
      customerPhone: custPhone.trim(),
      bookedByRole: 'owner',
      eventDate,
      eventEndDate: eventEndDate || eventDate,
      totalDays: totalDays || 1,
      eventType,
      duration: 'custom_days',
      location: location.trim(),
      totalAmount,
      advancePaid: paidAmount,
      balanceDue,
      paymentMode: 'Cash',
      paymentVerifiedAt: paidAmount > 0 ? nowIso : undefined,
      paymentHistory: paidAmount > 0
        ? [{ id: 'pay_' + Date.now(), amount: paidAmount, utr: 'OWNER-ENTRY', verifiedAt: nowIso, mode: 'Cash' }]
        : [],
      status: paidAmount > 0 ? 'confirmed' : 'pending_payment',
      specialNotes: notes.trim(),
      createdAt: nowIso
    };

    onAddBookingToList(newBooking);
    setShowAddModal(false);
    setCustName('');
    setCustPhone('');
    setEventDate('');
    setEventEndDate('');
    setTotalDays(1);
    setNotes('');
    setOwnerFeedback(`Booking ${newBooking.bookingNumber} added to the master list successfully!`);
  };

  // Open Set Price Modal for a booking
  const handleOpenSetPriceModal = (booking: Booking) => {
    setPriceModalBooking(booking);
    setInputPriceTotal(booking.totalAmount > 0 ? booking.totalAmount : 5000);
    setInputPricePaid(booking.advancePaid || 0);
  };

  const handleSavePriceModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceModalBooking) return;

    if (onUpdateBookingPrice) {
      onUpdateBookingPrice(priceModalBooking.id, inputPriceTotal, inputPricePaid);
    }
    setOwnerFeedback(`रेट ₹${inputPriceTotal.toLocaleString('en-IN')} सफलतापूर्वक दर्ज हो गया! कस्टमर के पोर्टल पर अब पेमेंट के लिए यह राशि दिखने लगेगी।`);
    setPriceModalBooking(null);
  };

  // Filter Bookings
  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.customerPhone.includes(searchTerm) ||
      b.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.pendingUtrNumber && b.pendingUtrNumber.includes(searchTerm)) ||
      (b.requirementItemsText && b.requirementItemsText.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'edited'
        ? Boolean(b.editedByCustomer)
        : b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const utrPendingCount = bookings.filter((b) => b.status === 'utr_submitted').length;
  const quotePendingCount = bookings.filter((b) => b.status === 'quote_pending').length;
  const editedCount = bookings.filter((b) => Boolean(b.editedByCustomer)).length;
  const unreviewedEditCount = bookings.filter((b) => Boolean(b.editedByCustomer) && !b.ownerEditReviewed).length;

  return (
    <section id="booking" className="py-12 bg-neutral-950 border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Prominent Owner Official Address & Info Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/30 border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-400/10 text-amber-400 border border-amber-400/20 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {editingBusinessName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={bizNameInput}
                      onChange={(e) => setBizNameInput(e.target.value)}
                      placeholder="e.g. SK Sound DJ Bandhi"
                      className="px-2 py-1 bg-neutral-950 border border-amber-400 rounded text-xs font-bold text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (bizNameInput.trim() && onUpdateBusinessName) {
                          onUpdateBusinessName(bizNameInput.trim());
                        }
                        setEditingBusinessName(false);
                      }}
                      className="p-1 bg-amber-400 text-black rounded hover:bg-amber-300 text-xs font-bold cursor-pointer"
                      title="Save Business Name"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBizNameInput(business?.businessNameEn || 'SK Sound DJ Bandhi');
                        setEditingBusinessName(false);
                      }}
                      className="p-1 bg-neutral-800 text-neutral-400 rounded hover:text-white text-xs cursor-pointer"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 className="text-base font-extrabold text-amber-300">
                      {business?.businessNameEn || 'SK Sound DJ Bandhi'}
                    </h1>
                    <button
                      type="button"
                      onClick={() => setEditingBusinessName(true)}
                      className="p-1 text-neutral-400 hover:text-amber-400 rounded hover:bg-neutral-800 transition-colors cursor-pointer"
                      title="Change Business Name"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
              <div className="text-xs sm:text-sm text-neutral-300 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Bandhi, Khorimahuwa, Rajdhanwar (Giridih, Jharkhand)</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
            <div className="bg-neutral-950/80 px-3 py-1.5 rounded-lg border border-neutral-800">
              <span className="text-neutral-400 block text-[10px]">Proprietor</span>
              <span className="text-amber-300 font-bold">Sikandra Kumar Pandit</span>
            </div>
            <div className="bg-neutral-950/80 px-3 py-1.5 rounded-lg border border-neutral-800">
              <span className="text-neutral-400 block text-[10px]">Contact Mobile</span>
              <span className="text-emerald-400 font-bold">+91 9973492726</span>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-neutral-800 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-md border border-amber-500/20 mb-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>Owner Control · Master Booking & UTR Approval</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              All Bookings, UTR Verification & Custom Quotes
            </h2>
            <p className="text-sm text-neutral-400 mt-1">
              कस्टमर का UTR नंबर जांच कर "Payment Success" पर क्लिक करें (बुकिंग कन्फर्म हो जाएगी), या Wedding / Party / पर्ची फोटो का रेट सेट करें।
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow"
            >
              <Plus className="w-4 h-4" />
              Add Booking to List
            </button>
          </div>
        </div>

        {/* Inline Feedback Banner */}
        {ownerFeedback && (
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-700/60 flex items-center justify-between gap-3 text-xs text-emerald-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{ownerFeedback}</span>
            </div>
            <button
              type="button"
              onClick={() => setOwnerFeedback('')}
              className="p-1 text-emerald-300 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* WhatsApp Dispatch Alert When Booking Confirmed or Cancelled */}
        {lastWhatsappDispatch && (
          <div className="p-4 rounded-xl bg-emerald-950/45 border border-emerald-600/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 text-xs">
              <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-emerald-300">
                  {lastWhatsappDispatch.title} · +91 {lastWhatsappDispatch.customerPhone}
                </div>
                <div className="text-neutral-300 whitespace-pre-line mt-1 leading-relaxed">
                  {lastWhatsappDispatch.message}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={lastWhatsappDispatch.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Send on WhatsApp</span>
              </a>
              {onDismissWhatsappDispatch && (
                <button
                  type="button"
                  onClick={onDismissWhatsappDispatch}
                  className="p-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Customer Edited Alert Banner */}
        {editedCount > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-950/35 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-2.5 text-xs">
              <Edit3 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <span className="font-bold text-amber-300">
                  {unreviewedEditCount > 0
                    ? `${unreviewedEditCount} New Customer Edit${unreviewedEditCount > 1 ? 's' : ''} Pending Review`
                    : `${editedCount} Customer-Edited Booking${editedCount > 1 ? 's' : ''}`}
                </span>
                <span className="text-neutral-300 block sm:inline sm:ml-2">
                  कस्टमर ने पेमेंट से पहले बुकिंग में बदलाव किया है — नीचे Edited टैब या तालिका में पूरा विवरण देखें।
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === 'edited' ? 'all' : 'edited')}
              className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs whitespace-nowrap cursor-pointer transition-colors"
            >
              {statusFilter === 'edited' ? 'Show All Bookings' : `View Edited (${editedCount})`}
            </button>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name, mobile, slip no, or UTR number..."
              className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-neutral-900 rounded-lg border border-neutral-800 text-xs overflow-x-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-amber-500 text-black font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              All ({bookings.length})
            </button>
            <button
              onClick={() => setStatusFilter('edited')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === 'edited'
                  ? 'bg-amber-400 text-black font-semibold'
                  : unreviewedEditCount > 0
                  ? 'text-amber-300 hover:text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Customer Edited ({editedCount})
            </button>
            <button
              onClick={() => setStatusFilter('utr_submitted')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === 'utr_submitted'
                  ? 'bg-cyan-400 text-black font-semibold'
                  : 'text-cyan-300 hover:text-white'
              }`}
            >
              UTR Verify ({utrPendingCount})
            </button>
            <button
              onClick={() => setStatusFilter('quote_pending')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === 'quote_pending'
                  ? 'bg-amber-500 text-black font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Rate Pending ({quotePendingCount})
            </button>
            <button
              onClick={() => setStatusFilter('confirmed')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === 'confirmed'
                  ? 'bg-amber-500 text-black font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Confirmed
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === 'completed'
                  ? 'bg-amber-500 text-black font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setStatusFilter('cancelled')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === 'cancelled'
                  ? 'bg-rose-500 text-white font-semibold'
                  : 'text-rose-300 hover:text-white'
              }`}
            >
              Cancelled ({bookings.filter((b) => b.status === 'cancelled').length})
            </button>
          </div>
        </div>

        {/* Bookings Ledger Table */}
        <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-900 shadow-xl">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3.5 font-semibold">Slip No. & Dates</th>
                <th className="px-4 py-3.5 font-semibold">Customer & Phone</th>
                <th className="px-4 py-3.5 font-semibold">Event / Items / Photo</th>
                <th className="px-4 py-3.5 font-semibold text-right">Total (₹)</th>
                <th className="px-4 py-3.5 font-semibold text-right">Paid / Due / UTR</th>
                <th className="px-4 py-3.5 font-semibold text-center">Status</th>
                <th className="px-4 py-3.5 font-semibold text-center">Owner Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                    No bookings found matching your search.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr
                    key={b.id}
                    className={`transition-colors ${
                      b.editedByCustomer && !b.ownerEditReviewed
                        ? 'bg-amber-950/20 hover:bg-amber-950/30'
                        : 'hover:bg-neutral-800/40'
                    }`}
                  >
                    
                    {/* Booking Number & Date Range */}
                    <td className="px-4 py-3.5 font-mono">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-amber-400">{b.bookingNumber}</span>
                        {b.editedByCustomer && (
                          <span
                            className={`text-[10px] font-sans font-bold px-1.5 py-0.5 rounded border ${
                              !b.ownerEditReviewed
                                ? 'bg-amber-400 text-black border-amber-300'
                                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            }`}
                          >
                            {!b.ownerEditReviewed
                              ? `Customer Edited (${b.editCount || 1}×)`
                              : `Edited (${b.editCount || 1}×)`}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-neutral-300 flex items-center gap-1 mt-0.5 whitespace-nowrap">
                        <Calendar className="w-3 h-3 text-neutral-500" />
                        <span>
                          {b.eventDate}
                          {b.eventEndDate && b.eventEndDate !== b.eventDate ? ` → ${b.eventEndDate}` : ''}
                        </span>
                      </div>
                      {b.totalDays && (
                        <div className="text-[10px] text-amber-300 font-sans">
                          ({b.totalDays} दिन का कार्यक्रम)
                        </div>
                      )}
                      {b.editedByCustomer && (
                        <div className="mt-1.5 p-2 rounded-lg bg-neutral-950 border border-amber-500/30 font-sans max-w-[220px] space-y-1">
                          {b.customerEditedAt && (
                            <div className="text-[10px] text-amber-300 font-medium">
                              Edited: {new Date(b.customerEditedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                          {b.editSummary && (
                            <div className="text-[10px] text-neutral-300 leading-snug">
                              {b.editSummary}
                            </div>
                          )}
                          {!b.ownerEditReviewed && onMarkEditReviewed && (
                            <button
                              type="button"
                              onClick={() => onMarkEditReviewed(b.id)}
                              className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                              <span>Mark Seen</span>
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-semibold text-white">{b.customerName}</div>
                      <a
                        href={`tel:${b.customerPhone}`}
                        className="text-[11px] text-neutral-400 hover:text-emerald-400 font-mono flex items-center gap-1 mt-0.5"
                      >
                        <Phone className="w-3 h-3 text-emerald-400" />
                        <span>+91 {b.customerPhone}</span>
                      </a>
                      <div className="text-[10px] text-neutral-400 max-w-[160px] truncate mt-0.5" title={b.location}>
                        {b.location}
                      </div>
                    </td>

                    {/* Event / Items / Photo Slip */}
                    <td className="px-4 py-3.5">
                      {b.requirementPhoto ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={b.requirementPhoto}
                            alt="Slip Photo"
                            onClick={() => setActivePhotoUrl(b.requirementPhoto || null)}
                            className="w-10 h-12 object-cover rounded border-2 border-amber-400 cursor-pointer shadow"
                          />
                          <div>
                            <button
                              type="button"
                              onClick={() => setActivePhotoUrl(b.requirementPhoto || null)}
                              className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              <span>पर्ची फोटो देखें</span>
                            </button>
                            {b.requirementItemsText && (
                              <div className="text-[10px] text-neutral-400 max-w-[160px] truncate" title={b.requirementItemsText}>
                                {b.requirementItemsText}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-amber-300 text-[11px] font-semibold capitalize">
                            {b.eventType === 'custom_items' ? 'Custom Pcs Setup' : b.eventType}
                          </span>
                          {b.selectedItems && b.selectedItems.length > 0 && (
                            <div className="text-[10px] text-neutral-400 max-w-[200px]">
                              {b.selectedItems.map((it) => `${it.name.split(' ')[0]} × ${it.qty}`).join(', ')}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Total Amount */}
                    <td className="px-4 py-3.5 text-right font-mono font-bold whitespace-nowrap">
                      {b.totalAmount === 0 || b.status === 'quote_pending' ? (
                        <div>
                          <span className="text-amber-400 text-sm font-extrabold">₹00</span>
                          <span className="text-[10px] text-rose-400 block font-sans">रेट डालना बाकी</span>
                          {b.discountCode && (
                            <span className="text-[10px] text-emerald-400 block">
                              Code: {b.discountCode} ({b.paymentMode})
                            </span>
                          )}
                          {b.applyAvailableRewardOnQuote && (
                            <span className="text-[10px] text-emerald-400 block">
                              {rewardPercent}% Reward Wallet Auto-Off
                            </span>
                          )}
                        </div>
                      ) : (
                        <div>
                          <span className="text-white text-sm">₹{b.totalAmount.toLocaleString('en-IN')}</span>
                          <div className="text-[10px] text-neutral-400">Mode: {b.paymentMode}</div>
                          {b.discountCode && (b.discountAmount || 0) > 0 && (
                            <div className="text-[10px] text-emerald-400">
                              -₹{b.discountAmount?.toLocaleString('en-IN')} ({b.discountCode})
                            </div>
                          )}
                          {(b.rewardUsed || 0) > 0 && (
                            <div className="text-[10px] text-emerald-400">
                              -₹{b.rewardUsed?.toLocaleString('en-IN')} ({rewardPercent}% Reward Off)
                            </div>
                          )}
                          {getBookingRewardEarned(b, rewardPercent) > 0 && (
                            <div className="text-[10px] text-amber-300">
                              +₹{getBookingRewardEarned(b, rewardPercent).toLocaleString('en-IN')} Reward ({rewardPercent}%)
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Paid / Due / Pending UTR */}
                    <td className="px-4 py-3.5 text-right font-mono whitespace-nowrap">
                      {b.totalAmount === 0 || b.status === 'quote_pending' ? (
                        <span className="text-neutral-500 text-[11px]">—</span>
                      ) : (
                        <>
                          <div className="text-emerald-400 font-semibold">
                            Paid: ₹{b.advancePaid.toLocaleString('en-IN')}
                          </div>
                          <div className="text-rose-400 text-[11px]">
                            Due: ₹{b.balanceDue.toLocaleString('en-IN')}
                          </div>
                          {b.pendingUtrNumber && b.status === 'utr_submitted' && (
                            <div className="mt-1 px-1.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-700 text-cyan-300 text-[10px] inline-block">
                              UTR: {b.pendingUtrNumber} (₹{b.pendingPaymentAmount})
                            </div>
                          )}
                        </>
                      )}
                    </td>

                    {/* Status Dropdown */}
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <select
                        value={b.status}
                        onChange={(e) => onUpdateBookingStatus(b.id, e.target.value as Booking['status'])}
                        className={`text-xs font-semibold px-2 py-1 rounded border bg-neutral-950 cursor-pointer focus:outline-none ${
                          b.status === 'confirmed' || b.status === 'completed'
                            ? 'text-emerald-400 border-emerald-800'
                            : b.status === 'utr_submitted'
                            ? 'text-cyan-300 border-cyan-600 bg-cyan-950/50'
                            : b.status === 'quote_pending'
                            ? 'text-amber-300 border-amber-600 bg-amber-950/60'
                            : 'text-amber-400 border-amber-800'
                        }`}
                      >
                        <option value="quote_pending">Rate Pending</option>
                        <option value="pending_payment">Payment Pending</option>
                        <option value="utr_submitted">UTR Submitted</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>

                    {/* Actions: Payment Success (Approve UTR), Set Rate, Slip, QR, Delete */}
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        
                        {/* OWNER PAYMENT SUCCESS BUTTON WHEN CUSTOMER SENDS UTR */}
                        {b.status === 'utr_submitted' && onApproveUtrPayment && (
                          <button
                            onClick={() => onApproveUtrPayment(b.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center gap-1 cursor-pointer shadow animate-pulse"
                            title="Verify UTR & Mark Payment Success to Confirm Booking"
                          >
                            <BadgeCheck className="w-4 h-4" />
                            <span>Payment Success</span>
                          </button>
                        )}

                        {/* OWNER ENTERS PRICE (ex. 5000 or Wedding/Party/Photo Quote) */}
                        <button
                          onClick={() => handleOpenSetPriceModal(b)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow ${
                            b.totalAmount === 0 || b.status === 'quote_pending'
                              ? 'bg-amber-400 hover:bg-amber-300 text-black animate-pulse'
                              : 'bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-neutral-700'
                          }`}
                          title="Set / Update Rate"
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span>{b.totalAmount === 0 ? 'रेट डालें' : 'रेट बदलें'}</span>
                        </button>

                        <button
                          onClick={() => onViewSlip(b)}
                          className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-neutral-700 transition-colors cursor-pointer"
                          title="View Digital Slip"
                        >
                          <FileText className="w-4 h-4" />
                        </button>

                        {b.status !== 'cancelled' && b.balanceDue > 0 && (
                          <button
                            onClick={() => onOpenUPIForBooking(b, b.balanceDue)}
                            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-emerald-900/60 text-emerald-400 border border-neutral-700 transition-colors cursor-pointer"
                            title="Open UPI QR Scanner"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                        )}

                        {confirmDeleteId === b.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteBookingFromList(b.id);
                                setConfirmDeleteId(null);
                              }}
                              className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 rounded bg-neutral-800 text-neutral-300 text-[11px] cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(b.id)}
                            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-rose-950 text-neutral-400 hover:text-rose-400 border border-neutral-700 transition-colors cursor-pointer"
                            title="Delete Booking from List"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* MODAL: OWNER ENTERS PRICE (ex. ₹5,000) */}
      {priceModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg bg-neutral-900 border border-amber-500/50 rounded-2xl shadow-2xl overflow-hidden p-6 my-8">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" />
                <span>बुकिंग का रेट तय करें (Set Price)</span>
              </h3>
              <button
                onClick={() => setPriceModalBooking(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePriceModal} className="space-y-4">
              <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Booking Number:</span>
                  <span className="font-mono font-bold text-amber-400">{priceModalBooking.bookingNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Customer:</span>
                  <span className="font-semibold text-white">{priceModalBooking.customerName} (+91 {priceModalBooking.customerPhone})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Dates (कब से कब):</span>
                  <span className="text-amber-300 font-mono">
                    {priceModalBooking.eventDate}
                    {priceModalBooking.eventEndDate && priceModalBooking.eventEndDate !== priceModalBooking.eventDate
                      ? ` → ${priceModalBooking.eventEndDate}`
                      : ''}{' '}
                    ({priceModalBooking.totalDays || 1} दिन)
                  </span>
                </div>
                {priceModalBooking.requirementItemsText && (
                  <div className="border-t border-neutral-800 pt-1.5 text-neutral-300">
                    <span className="text-amber-400 font-bold block mb-0.5">मांगा गया सामान:</span>
                    <span>{priceModalBooking.requirementItemsText}</span>
                  </div>
                )}
                {priceModalBooking.discountCode && (
                  <div className="border-t border-neutral-800 pt-1.5 text-emerald-400 font-semibold">
                    Discount Code Attached: {priceModalBooking.discountCode} ({priceModalBooking.paymentMode} Mode) — रेट सेव करने पर छूट स्वतः लागू होगी
                  </div>
                )}
              </div>

              {priceModalBooking.requirementPhoto && (
                <div className="p-3 bg-neutral-950 rounded-xl border border-amber-500/30 flex items-center gap-3">
                  <img
                    src={priceModalBooking.requirementPhoto}
                    alt="Customer Slip"
                    className="w-16 h-20 object-cover rounded-lg border border-amber-400 cursor-pointer shadow"
                    onClick={() => setActivePhotoUrl(priceModalBooking.requirementPhoto || null)}
                  />
                  <div className="text-xs">
                    <div className="font-bold text-white flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5 text-amber-400" />
                      <span>कस्टमर की कॉपी पर्ची</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActivePhotoUrl(priceModalBooking.requirementPhoto || null)}
                      className="mt-1.5 text-xs text-amber-300 font-semibold underline cursor-pointer"
                    >
                      फुल साइज फोटो देखें (Zoom)
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-neutral-200 mb-1">
                  कुल तय रेट डालें (Total Amount ₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">₹</span>
                  <input
                    type="number"
                    required
                    min={1}
                    value={inputPriceTotal}
                    onChange={(e) => setInputPriceTotal(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2.5 bg-neutral-950 border border-amber-400 rounded-lg text-lg font-mono font-bold text-amber-300 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  पहले से प्राप्त राशि (Paid Amount ₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">₹</span>
                  <input
                    type="number"
                    min={0}
                    max={inputPriceTotal}
                    value={inputPricePaid}
                    onChange={(e) => setInputPricePaid(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm font-mono text-emerald-400 font-bold focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPriceModalBooking(null)}
                  className="flex-1 py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium text-xs rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs rounded-lg cursor-pointer shadow flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>रेट सेव करें (₹{inputPriceTotal.toLocaleString('en-IN')})</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Add Booking Modal for Owner */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl overflow-hidden p-6 my-8">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Add Offline Booking to Master List</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOwnerAddBooking} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    placeholder="e.g. Rajesh Verma"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    placeholder="10-digit mobile"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-300 mb-1">
                  कब से कब तक (Calendar टच करें) *
                </label>
                <button
                  type="button"
                  onClick={() => setCalendarOpen(true)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-amber-500/60 rounded-lg text-left text-xs text-white flex items-center justify-between cursor-pointer"
                >
                  <span>
                    {eventDate
                      ? `${eventDate}${eventEndDate && eventEndDate !== eventDate ? ` → ${eventEndDate}` : ''} (${totalDays} दिन)`
                      : 'कैलेंडर टच करके तारीख चुनें'}
                  </span>
                  <Calendar className="w-4 h-4 text-amber-400" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Event Type *
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as EventType)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="wedding">Wedding</option>
                    <option value="party">Party</option>
                    <option value="birthday">Birthday (Only Night)</option>
                    <option value="custom_items">Custom Box & Lighting</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Event Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Total Agreed Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Amount Paid (₹)
                  </label>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm font-mono text-emerald-400 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Special Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Box Setup + 200 Light + 4 Sharpy"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium text-xs rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs rounded-lg cursor-pointer shadow"
                >
                  Add to List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Touch Calendar Modal for Owner Add */}
      <DateRangeCalendarModal
        isOpen={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        startDate={eventDate}
        endDate={eventEndDate}
        onSelectRange={(start, end, days) => {
          setEventDate(start);
          setEventEndDate(end);
          setTotalDays(days);
        }}
      />

      {/* High-Resolution Photo Viewer Modal for Owner */}
      {activePhotoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative max-w-2xl w-full bg-neutral-900 border border-neutral-700 rounded-2xl p-4 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Camera className="w-4 h-4 text-amber-400" />
                <span>Customer Requirement Slip Photo</span>
              </div>
              <button
                onClick={() => setActivePhotoUrl(null)}
                className="p-1 rounded bg-neutral-800 text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-auto rounded-lg bg-neutral-950 flex items-center justify-center p-2 border border-neutral-800">
              <img
                src={activePhotoUrl}
                alt="Enlarged Customer List"
                className="max-h-[70vh] w-auto object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}

    </section>
  );
};
