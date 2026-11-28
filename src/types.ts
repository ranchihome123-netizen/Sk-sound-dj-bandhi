export type UserRole = 'owner' | 'customer';

export type EventDuration = 'half_day' | 'full_day' | 'night_shift' | 'custom_days' | 'none';

export type BookingStatus =
  | 'quote_pending'
  | 'pending_payment'
  | 'pending_advance'
  | 'utr_submitted'
  | 'confirmed'
  | 'completed'
  | 'cancelled';

export type EventType =
  | 'custom_items' // Item-wise setup (Box, Light, LED, Sharpy, Horn in pcs)
  | 'birthday' // Birthday party (₹6,000 Only Night)
  | 'wedding' // Wedding (Owner sets price, Start-End dates)
  | 'party' // Party / Function (Owner sets price, Start-End dates)
  | 'baraat'
  | 'stage_show'
  | 'religious'
  | 'roadshow'
  | 'other';

export type DefaultRateCategory =
  | 'dj'
  | 'light'
  | 'utensils'
  | 'table_chair'
  | 'clothes'
  | 'equipment'
  | 'event';

export type RateCategory = DefaultRateCategory | (string & {});

export interface PriceCategoryMeta {
  key: string;
  labelEn: string;
  labelHi: string;
}

export interface DJRatePlan {
  id: string;
  nameHi: string;
  nameEn: string;
  descriptionHi: string;
  descriptionEn?: string;
  durationLabel: string;
  unitLabel?: string; // e.g., 'Per Setup', 'Per Pc', 'Only Night', 'Owner Set'
  price: number; // 0 when isOwnerQuoted is true
  isOwnerQuoted?: boolean; // true for Wedding / Party (पैसा नहीं दिखेगा, मालिक तय करेंगे)
  category?: RateCategory;
  imageUrl?: string;
  popular?: boolean;
  recommendedFor: string;
}

export interface BookingItem {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
  unitLabel: string;
  subtotal: number;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  utr: string;
  verifiedAt: string;
  mode: 'UPI' | 'Cash';
}

export type DiscountPaymentScope = 'ALL' | 'UPI' | 'Cash';

export interface DiscountCode {
  id: string;
  code: string;
  discountType: 'percent' | 'flat';
  discountValue: number;
  paymentModeScope: DiscountPaymentScope;
  minOrderAmount?: number;
  description?: string;
  active: boolean;
  createdAt: string;
}

export interface Booking {
  id: string;
  bookingNumber: string;
  customerName: string;
  customerPhone: string;
  customerId?: string;
  bookedByRole?: 'owner' | 'customer';
  eventDate: string; // Start Date (कब से)
  eventEndDate?: string; // End Date (कब तक)
  totalDays?: number; // Total Days (कितने दिन का)
  eventType: EventType;
  duration: EventDuration;
  location: string;
  selectedItems?: BookingItem[];
  withGenerator?: boolean;
  generatorCharge?: number;
  subtotalAmount?: number;
  discountCode?: string;
  discountAmount?: number;
  rewardUsed?: number; // Reward balance redeemed (off) on this booking
  rewardEarned?: number; // 5% reward earned from this booking for future bookings
  applyAvailableRewardOnQuote?: boolean; // Whether customer opted to apply available reward once owner quotes price
  totalAmount: number;
  advancePaid: number; // Total verified paid amount
  balanceDue: number;
  pendingPaymentAmount?: number; // Amount claimed via UTR awaiting owner verification
  pendingUtrNumber?: string; // UTR submitted by customer awaiting owner success click
  paymentMode: 'UPI' | 'Cash';
  upiRefNumber?: string;
  paymentVerifiedAt?: string;
  paymentHistory?: PaymentRecord[];
  status: BookingStatus;
  specialNotes?: string;
  requirementPhoto?: string;
  requirementItemsText?: string;
  isCustomPhotoQuote?: boolean;
  ownerQuotedAt?: string;
  editedByCustomer?: boolean;
  customerEditedAt?: string;
  editCount?: number;
  editSummary?: string;
  ownerEditReviewed?: boolean;
  createdAt: string;
}

export interface StaffDutyRecord {
  id: string;
  date: string;
  bookingId?: string;
  eventName?: string;
  location?: string;
  duration: EventDuration;
  wageAmount: number;
  note?: string;
}

export interface StaffPaymentRecord {
  id: string;
  date: string;
  amount: number;
  type: 'advance' | 'salary_settlement';
  mode: 'Cash' | 'UPI';
  note?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  username?: string;
  photoUrl: string;
  role: 'DJ Operator' | 'Sound Engineer' | 'Driver' | 'Lighting Tech' | 'Helper / Labour';
  phone: string;
  password?: string;
  halfDayRate: number;
  fullDayRate: number;
  totalEarned: number;
  advanceGiven: number;
  balanceDue: number;
  dutyHistory: StaffDutyRecord[];
  paymentHistory: StaffPaymentRecord[];
  active: boolean;
}

export interface CustomerUser {
  id: string;
  name: string;
  mobile: string;
  password: string;
  photoUrl?: string;
  createdAt: string;
}

export interface BusinessConfig {
  businessNameHi: string;
  businessNameEn: string;
  taglineHi: string;
  ownerNameHi: string;
  ownerNameEn: string;
  ownerPhoto: string;
  addressHi: string;
  addressEn: string;
  phone: string;
  whatsapp: string;
  upiId: string;
  upiPayeeName: string;
  rewardPercent?: number;
  activeOfferNote?: string;
}

export interface OfferBroadcast {
  id: string;
  offerPercent: number;
  title: string;
  message: string;
  discountCode?: string;
  sentAt: string;
  recipientCount: number;
}

export interface CustomerNotification {
  id: string;
  customerId?: string;
  customerPhone: string;
  customerName: string;
  type: 'booking_success' | 'booking_cancelled' | 'offer_broadcast';
  title: string;
  message: string;
  whatsappUrl: string;
  bookingNumber?: string;
  createdAt: string;
  read?: boolean;
}

export interface AuthSession {
  role: UserRole;
  user: {
    id: string;
    name: string;
    mobile?: string;
    photoUrl?: string;
    roleLabel?: string;
  };
}
