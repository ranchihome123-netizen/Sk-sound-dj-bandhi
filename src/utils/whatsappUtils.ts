import { Booking } from '../types';

export function formatWhatsAppMobile(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length >= 10) {
    return `91${digits.slice(-10)}`;
  }
  return digits;
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const waPhone = formatWhatsAppMobile(phone);
  if (!waPhone) {
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
  }
  return `https://api.whatsapp.com/send?phone=${waPhone}&text=${encodeURIComponent(message)}`;
}

export function buildBookingSuccessMessage(
  booking: Booking,
  businessName: string,
  ownerPhone: string,
  rewardPercent: number = 5
): string {
  const dateText =
    booking.eventEndDate && booking.eventEndDate !== booking.eventDate
      ? `${booking.eventDate} से ${booking.eventEndDate}`
      : booking.eventDate;
  const amountLine =
    booking.totalAmount > 0
      ? `कुल राशि: ₹${booking.totalAmount.toLocaleString('en-IN')}`
      : 'रेट मालिक (Owner) द्वारा जल्द तय किया जाएगा';
  const rewardLine =
    booking.rewardEarned && booking.rewardEarned > 0
      ? `\nआपको ${rewardPercent}% रिवॉर्ड (₹${booking.rewardEarned.toLocaleString('en-IN')}) मिला है जो आपकी अगली बुकिंग में ऑफ़ होगा।`
      : `\nइस बुकिंग पर ${rewardPercent}% रिवॉर्ड ऑफर लागू है (अगली बुकिंग में ऑफ़ होगा)।`;

  return `नमस्ते ${booking.customerName} जी,\n${businessName} में आपका बुकिंग सफल हो गया है! (Booking Successful)\nबुकिंग नंबर: ${booking.bookingNumber}\nतारीख: ${dateText}\nस्थान: ${booking.location}\n${amountLine}${rewardLine}\nसंपर्क: +91 ${ownerPhone}`;
}

export function buildBookingCancelMessage(
  booking: Booking,
  businessName: string,
  ownerPhone: string
): string {
  const dateText =
    booking.eventEndDate && booking.eventEndDate !== booking.eventDate
      ? `${booking.eventDate} से ${booking.eventEndDate}`
      : booking.eventDate;

  return `नमस्ते ${booking.customerName} जी,\n${businessName} की आपकी बुकिंग (${booking.bookingNumber}, तारीख: ${dateText}) रद्द (Cancelled) कर दी गई है।\nयदि आपको दोबारा बुकिंग करनी हो या कोई सहायता चाहिए, तो संपर्क करें: +91 ${ownerPhone}`;
}

export function buildOfferBroadcastMessage(
  offerPercent: number,
  businessName: string,
  ownerPhone: string,
  customNote?: string
): string {
  const noteLine = customNote?.trim() ? `\n${customNote.trim()}` : '';

  return `*${businessName} — स्पेशल ऑफर!*\nअभी बुकिंग करने पर *${offerPercent}% डिस्काउंट / रिवॉर्ड* मिल रहा है (यह ऑफर अभी चालू है)।${noteLine}\nतुरंत बुकिंग करें या कॉल करें: +91 ${ownerPhone}`;
}
