import { Booking } from '../types';

export const DEFAULT_REWARD_PERCENT = 5;

/**
 * Computes reward on any positive booking amount using the owner-configured percentage.
 */
export function calculateBookingReward(
  amount: number,
  rewardPercent: number = DEFAULT_REWARD_PERCENT
): number {
  if (!amount || amount <= 0 || !rewardPercent || rewardPercent <= 0) return 0;
  return Math.round(amount * (rewardPercent / 100));
}

// Backwards-compatible helper name
export function calculateFivePercentReward(
  amount: number,
  rewardPercent: number = DEFAULT_REWARD_PERCENT
): number {
  return calculateBookingReward(amount, rewardPercent);
}

/**
 * Returns the reward earned by a specific booking.
 * Cancelled bookings yield 0 reward.
 */
export function getBookingRewardEarned(
  booking: Booking,
  fallbackPercent: number = DEFAULT_REWARD_PERCENT
): number {
  if (booking.status === 'cancelled') return 0;
  if (booking.rewardEarned !== undefined) {
    return Math.max(0, booking.rewardEarned);
  }
  if (booking.bookedByRole === 'customer' && booking.totalAmount > 0) {
    return calculateBookingReward(booking.totalAmount, fallbackPercent);
  }
  return 0;
}

export interface CustomerRewardSummary {
  totalEarned: number;
  totalUsed: number;
  availableReward: number;
}

/**
 * Calculates total earned, total redeemed, and currently available reward
 * balance for a customer across their non-cancelled bookings.
 */
export function getCustomerRewardSummary(
  bookings: Booking[],
  customerId?: string,
  customerPhone?: string,
  excludeBookingId?: string,
  fallbackPercent: number = DEFAULT_REWARD_PERCENT
): CustomerRewardSummary {
  if (!customerId && !customerPhone) {
    return { totalEarned: 0, totalUsed: 0, availableReward: 0 };
  }

  let totalEarned = 0;
  let totalUsed = 0;

  for (const b of bookings) {
    if (excludeBookingId && b.id === excludeBookingId) continue;
    if (b.status === 'cancelled') continue;

    const matchesId = Boolean(customerId && b.customerId && b.customerId === customerId);
    const matchesPhone = Boolean(customerPhone && b.customerPhone === customerPhone);
    if (!matchesId && !matchesPhone) continue;

    totalEarned += getBookingRewardEarned(b, fallbackPercent);
    totalUsed += Math.max(0, b.rewardUsed || 0);
  }

  const availableReward = Math.max(0, totalEarned - totalUsed);
  return { totalEarned, totalUsed, availableReward };
}
