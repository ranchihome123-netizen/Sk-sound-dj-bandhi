import React from 'react';
import { Booking } from '../types';
import {
  CalendarClock,
  Phone,
  MessageSquare,
  MapPin,
  FileText,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Edit3
} from 'lucide-react';

interface OwnerUpcomingBookingsProps {
  bookings: Booking[];
  onViewSlip: (booking: Booking) => void;
}

const parseLocalDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
};

export const OwnerUpcomingBookings: React.FC<OwnerUpcomingBookingsProps> = ({
  bookings,
  onViewSlip
}) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfNext7Days = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);

  const upcomingBookings = bookings
    .filter((b) => {
      if (b.status === 'cancelled') return false;
      const startDate = parseLocalDate(b.eventDate);
      if (!startDate) return false;
      const endDate = parseLocalDate(b.eventEndDate || b.eventDate) || startDate;

      // Include bookings starting within [today, today + 7 days] or currently ongoing within that window
      return startDate <= endOfNext7Days && endDate >= startOfToday;
    })
    .sort((a, b) => {
      const da = parseLocalDate(a.eventDate)?.getTime() || 0;
      const db = parseLocalDate(b.eventDate)?.getTime() || 0;
      return da - db;
    });

  const getCountdownInfo = (eventDate: string) => {
    const start = parseLocalDate(eventDate);
    if (!start) return { label: 'Upcoming', urgent: false };
    const diffMs = start.getTime() - startOfToday.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: 'Ongoing Today (चालू)', urgent: true };
    }
    if (diffDays === 0) {
      return { label: 'Today (आज)', urgent: true };
    }
    if (diffDays === 1) {
      return { label: 'Tomorrow (कल)', urgent: true };
    }
    return { label: `In ${diffDays} Days (${diffDays} दिन बाद)`, urgent: false };
  };

  const formatPhoneForWhatsApp = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    return digits.length === 10 ? `91${digits}` : digits;
  };

  const getEventTitle = (b: Booking) => {
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

  return (
    <section
      id="upcoming-bookings"
      className="py-10 bg-gradient-to-b from-amber-950/20 via-neutral-950 to-neutral-950 border-b border-neutral-800"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 bg-amber-500/15 px-3 py-1 rounded-md border border-amber-500/30 mb-2">
              <CalendarClock className="w-3.5 h-3.5 text-amber-400" />
              <span>Next 7 Days Schedule · Owner Priority Alert</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span>Upcoming Bookings (अगले 7 दिन)</span>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-400 text-black">
                {upcomingBookings.length}
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
              अगले 7 दिनों में आने वाले सभी कार्यक्रमों की सूची — कस्टमर को सीधे कॉल या WhatsApp करें।
            </p>
          </div>

          <a
            href="#booking"
            className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-amber-300 border border-neutral-700 text-xs font-semibold transition-colors whitespace-nowrap w-fit"
          >
            View All Bookings &rarr;
          </a>
        </div>

        {/* Upcoming Cards Grid */}
        {upcomingBookings.length === 0 ? (
          <div className="p-8 rounded-2xl bg-neutral-900/70 border border-neutral-800 text-center space-y-2">
            <Calendar className="w-8 h-8 text-neutral-500 mx-auto" />
            <h3 className="text-sm font-bold text-neutral-200">
              No Upcoming Bookings in Next 7 Days
            </h3>
            <p className="text-xs text-neutral-400">
              अगले 7 दिनों में कोई कार्यक्रम शेड्यूल नहीं है। आगे की बुकिंग देखने के लिए नीचे All Bookings तालिका देखें।
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {upcomingBookings.map((b) => {
              const countdown = getCountdownInfo(b.eventDate);
              const waPhone = formatPhoneForWhatsApp(b.customerPhone);
              const waMessage = `नमस्ते ${b.customerName} जी, SK Sound DJ Bandhi (Sikandra Kumar Pandit) की ओर से आपकी आगामी बुकिंग (${b.bookingNumber}, तारीख: ${b.eventDate}) के बारे में संपर्क कर रहे हैं।`;

              return (
                <div
                  key={b.id}
                  className={`rounded-2xl border p-5 flex flex-col justify-between gap-4 transition-all shadow-xl ${
                    countdown.urgent
                      ? 'bg-gradient-to-br from-amber-950/35 via-neutral-900 to-neutral-900 border-amber-400/70 ring-1 ring-amber-400/30'
                      : 'bg-neutral-900 border-amber-500/30 hover:border-amber-400/60'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Badges: Countdown + Status */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold ${
                          countdown.urgent
                            ? 'bg-amber-400 text-black animate-pulse'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>{countdown.label}</span>
                      </span>

                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded border capitalize ${
                          b.status === 'confirmed' || b.status === 'completed'
                            ? 'bg-emerald-950/70 text-emerald-400 border-emerald-700'
                            : b.status === 'utr_submitted'
                            ? 'bg-cyan-950/70 text-cyan-300 border-cyan-700'
                            : 'bg-amber-950/70 text-amber-300 border-amber-700'
                        }`}
                      >
                        {b.status === 'utr_submitted'
                          ? 'UTR Verify Pending'
                          : b.status === 'quote_pending'
                          ? 'Rate Pending'
                          : b.status === 'pending_payment'
                          ? 'Payment Pending'
                          : b.status}
                      </span>
                    </div>

                    {/* Customer Name & Booking Number */}
                    <div className="border-b border-neutral-800 pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-base font-extrabold text-white truncate">
                          {b.customerName}
                        </h3>
                        <span className="font-mono text-[11px] font-bold text-amber-400 shrink-0">
                          {b.bookingNumber}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-emerald-400 font-semibold mt-0.5">
                        +91 {b.customerPhone}
                      </div>
                    </div>

                    {/* Dates, Event & Location */}
                    <div className="space-y-1.5 text-xs text-neutral-300">
                      <div className="flex items-center gap-1.5 font-mono text-amber-200">
                        <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>
                          {b.eventDate}
                          {b.eventEndDate && b.eventEndDate !== b.eventDate ? ` → ${b.eventEndDate}` : ''}
                          {b.totalDays && b.totalDays > 1 ? ` (${b.totalDays} दिन)` : ''}
                        </span>
                      </div>

                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2" title={b.location}>
                          {b.location}
                        </span>
                      </div>

                      <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800/80 text-[11px]">
                        <div className="font-semibold text-white">{getEventTitle(b)}</div>
                        {b.selectedItems && b.selectedItems.length > 0 ? (
                          <div className="text-neutral-400 mt-0.5">
                            {b.selectedItems.map((it) => `${it.name.split(' ')[0]} × ${it.qty}`).join(', ')}
                          </div>
                        ) : b.requirementItemsText ? (
                          <div className="text-neutral-400 mt-0.5 truncate">{b.requirementItemsText}</div>
                        ) : null}
                      </div>

                      {b.editedByCustomer && (
                        <div className="p-2 rounded-lg bg-amber-950/35 border border-amber-500/40 text-[11px] space-y-0.5">
                          <div className="font-bold text-amber-300 flex items-center gap-1">
                            <Edit3 className="w-3 h-3 shrink-0" />
                            <span>
                              Customer Edited ({b.editCount || 1}×)
                              {!b.ownerEditReviewed ? ' · New' : ''}
                            </span>
                          </div>
                          {b.editSummary && (
                            <div className="text-neutral-300 leading-snug">{b.editSummary}</div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Payment Snapshot */}
                    <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 font-mono">
                      {b.totalAmount === 0 || b.status === 'quote_pending' ? (
                        <span className="text-amber-300 font-sans text-[11px] flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>रेट सेट करना बाकी (₹00)</span>
                        </span>
                      ) : (
                        <>
                          <div>
                            <span className="text-[10px] text-neutral-500 block font-sans">Total</span>
                            <span className="text-white font-bold">₹{b.totalAmount.toLocaleString('en-IN')}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-neutral-500 block font-sans">Paid</span>
                            <span className="text-emerald-400 font-bold">₹{b.advancePaid.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-neutral-500 block font-sans">Due</span>
                            <span className={b.balanceDue > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold inline-flex items-center gap-0.5'}>
                              {b.balanceDue > 0 ? `₹${b.balanceDue.toLocaleString('en-IN')}` : (
                                <>
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Paid</span>
                                </>
                              )}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Quick Customer Contact Actions */}
                  <div className="pt-2 border-t border-neutral-800 flex items-center gap-2">
                    <a
                      href={`tel:${b.customerPhone}`}
                      className="flex-1 py-2 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </a>

                    <a
                      href={`https://wa.me/${waPhone}?text=${encodeURIComponent(waMessage)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => onViewSlip(b)}
                      className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-neutral-700 transition-colors cursor-pointer"
                      title="View Booking Slip"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
};
