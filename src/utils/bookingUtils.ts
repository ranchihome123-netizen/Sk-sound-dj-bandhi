import { Booking } from '../types';

/**
 * Customer can edit a booking only BEFORE payment is submitted/verified.
 * Locked once any payment is credited (advancePaid > 0), UTR is submitted,
 * or booking is confirmed/completed/cancelled.
 */
export function canCustomerEditBooking(booking: Booking): boolean {
  if ((booking.advancePaid || 0) > 0) return false;
  if (
    booking.status === 'utr_submitted' ||
    booking.status === 'confirmed' ||
    booking.status === 'completed' ||
    booking.status === 'cancelled'
  ) {
    return false;
  }
  return true;
}

export function buildCustomerEditSummary(prev: Booking, next: Booking): string {
  const changes: string[] = [];

  const prevRange =
    prev.eventEndDate && prev.eventEndDate !== prev.eventDate
      ? `${prev.eventDate} → ${prev.eventEndDate}`
      : prev.eventDate;
  const nextRange =
    next.eventEndDate && next.eventEndDate !== next.eventDate
      ? `${next.eventDate} → ${next.eventEndDate}`
      : next.eventDate;

  if (prevRange !== nextRange) {
    changes.push(`Date: ${prevRange} → ${nextRange}`);
  }

  if (prev.eventType !== next.eventType) {
    changes.push(`Type: ${prev.eventType} → ${next.eventType}`);
  }

  const prevItemsStr = (prev.selectedItems || [])
    .map((i) => `${i.id}:${i.qty}`)
    .sort()
    .join(',');
  const nextItemsStr = (next.selectedItems || [])
    .map((i) => `${i.id}:${i.qty}`)
    .sort()
    .join(',');
  if (prevItemsStr !== nextItemsStr) {
    const nextSummary =
      next.selectedItems && next.selectedItems.length > 0
        ? next.selectedItems.map((i) => `${i.name.split(' ')[0]}×${i.qty}`).join(', ')
        : 'Cleared';
    changes.push(`Items: ${nextSummary}`);
  }

  if (prev.location.trim() !== next.location.trim()) {
    changes.push(`Location updated`);
  }

  if ((prev.requirementPhoto || '') !== (next.requirementPhoto || '')) {
    changes.push(next.requirementPhoto ? 'Slip photo updated' : 'Slip photo removed');
  }

  if (prev.paymentMode !== next.paymentMode) {
    changes.push(`Mode: ${prev.paymentMode} → ${next.paymentMode}`);
  }

  if ((prev.discountCode || '') !== (next.discountCode || '')) {
    changes.push(next.discountCode ? `Code: ${next.discountCode}` : 'Discount code removed');
  }

  if ((prev.rewardUsed || 0) !== (next.rewardUsed || 0)) {
    changes.push(
      `Reward Off: ₹${(prev.rewardUsed || 0).toLocaleString('en-IN')} → ₹${(next.rewardUsed || 0).toLocaleString('en-IN')}`
    );
  }

  if (prev.totalAmount !== next.totalAmount) {
    changes.push(
      `Total: ₹${prev.totalAmount.toLocaleString('en-IN')} → ₹${next.totalAmount.toLocaleString('en-IN')}`
    );
  }

  if ((prev.specialNotes || '').trim() !== (next.specialNotes || '').trim()) {
    changes.push('Notes updated');
  }

  if (changes.length === 0) {
    return 'Customer re-saved booking details';
  }

  return changes.join(' · ');
}
