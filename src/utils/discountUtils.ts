import { DiscountCode } from '../types';

export interface DiscountEvaluationResult {
  valid: boolean;
  error?: string;
  discountCodeObj?: DiscountCode;
  discountAmount: number;
  finalTotal: number;
}

export function evaluateDiscountCode(
  rawCode: string,
  discountCodes: DiscountCode[],
  subtotal: number,
  paymentMode: 'UPI' | 'Cash',
  allowZeroSubtotalQuote = false
): DiscountEvaluationResult {
  const cleanCode = rawCode.trim().toUpperCase();
  if (!cleanCode) {
    return { valid: false, error: 'कृपया डिस्काउंट कोड दर्ज करें।', discountAmount: 0, finalTotal: subtotal };
  }

  const found = discountCodes.find((d) => d.code.toUpperCase() === cleanCode);
  if (!found) {
    return {
      valid: false,
      error: `कोड "${cleanCode}" अमान्य है। सही कोड मालिक से प्राप्त करें।`,
      discountAmount: 0,
      finalTotal: subtotal
    };
  }

  if (!found.active) {
    return {
      valid: false,
      error: `कोड "${found.code}" अभी बंद (Inactive) है।`,
      discountAmount: 0,
      finalTotal: subtotal
    };
  }

  if (found.paymentModeScope !== 'ALL' && found.paymentModeScope !== paymentMode) {
    return {
      valid: false,
      error: `कोड "${found.code}" केवल ${found.paymentModeScope} पेमेंट मोड पर लागू है।`,
      discountAmount: 0,
      finalTotal: subtotal
    };
  }

  if (!allowZeroSubtotalQuote && found.minOrderAmount && subtotal < found.minOrderAmount) {
    return {
      valid: false,
      error: `इस कोड के लिए न्यूनतम बुकिंग राशि ₹${found.minOrderAmount.toLocaleString('en-IN')} होनी चाहिए।`,
      discountAmount: 0,
      finalTotal: subtotal
    };
  }

  if (subtotal <= 0) {
    return {
      valid: true,
      discountCodeObj: found,
      discountAmount: 0,
      finalTotal: 0
    };
  }

  const rawDiscount =
    found.discountType === 'percent'
      ? Math.round((subtotal * found.discountValue) / 100)
      : found.discountValue;

  const discountAmount = Math.max(0, Math.min(subtotal, rawDiscount));
  const finalTotal = Math.max(0, subtotal - discountAmount);

  return {
    valid: true,
    discountCodeObj: found,
    discountAmount,
    finalTotal
  };
}
