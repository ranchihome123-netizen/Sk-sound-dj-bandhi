import {
  ConfirmationResult,
  RecaptchaVerifier,
  getAuth,
  signInWithPhoneNumber
} from 'firebase/auth';
import { auth as appAuth } from '../firebase';

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

let mountNonce = 0;

export function normalizeTenDigitMobile(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits;
}

export function formatE164Phone(input: string): string | null {
  const trimmed = input.trim().replace(/[\s\-()]/g, '');
  if (!trimmed) return null;

  if (trimmed.startsWith('+')) {
    return /^\+[1-9]\d{9,14}$/.test(trimmed) ? trimmed : null;
  }

  const digits = trimmed.replace(/\D/g, '');
  if (/^91\d{10}$/.test(digits)) {
    return `+${digits}`;
  }
  if (/^\d{10}$/.test(digits)) {
    return `+91${digits}`;
  }
  return null;
}

export function clearRecaptchaVerifier(containerId?: string): void {
  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch {
      // Ignore cleanup errors if DOM element was already removed
    }
    window.recaptchaVerifier = undefined;
  }
  if (containerId) {
    const wrapper = document.getElementById(containerId);
    if (wrapper) {
      wrapper.innerHTML = '';
    }
  }
}

export async function sendRealPhoneOtp(
  phoneInput: string,
  containerId: string
): Promise<ConfirmationResult> {
  const phoneNumber = formatE164Phone(phoneInput);
  if (!phoneNumber) {
    throw new Error('INVALID_PHONE_LOCAL');
  }

  const wrapper = document.getElementById(containerId);
  if (!wrapper) {
    throw new Error('RECAPTCHA_CONTAINER_MISSING');
  }

  clearRecaptchaVerifier(containerId);

  // Create a fresh child node every time so Google reCAPTCHA never errors on reuse
  mountNonce += 1;
  const freshMount = document.createElement('div');
  freshMount.id = `${containerId}_slot_${mountNonce}`;
  wrapper.appendChild(freshMount);

  const auth = getAuth(appAuth.app);
  auth.languageCode = 'en';

  window.recaptchaVerifier = new RecaptchaVerifier(auth, freshMount, {
    size: 'invisible',
    'expired-callback': () => {
      clearRecaptchaVerifier(containerId);
    }
  });

  const appVerifier = window.recaptchaVerifier;

  try {
    await appVerifier.render();
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
    window.confirmationResult = confirmationResult;
    return confirmationResult;
  } catch (err) {
    clearRecaptchaVerifier(containerId);
    throw err;
  }
}

export async function verifyRealPhoneOtp(
  confirmationResult: ConfirmationResult | undefined,
  otpCode: string
): Promise<{ uid: string; phoneNumber: string }> {
  const activeConfirmation = confirmationResult || window.confirmationResult;
  if (!activeConfirmation) {
    throw new Error('OTP_SESSION_MISSING');
  }

  const cleanCode = otpCode.trim();
  if (!/^\d{6}$/.test(cleanCode)) {
    throw new Error('INVALID_OTP_FORMAT');
  }

  const credential = await activeConfirmation.confirm(cleanCode);
  return {
    uid: credential.user.uid,
    phoneNumber: credential.user.phoneNumber || ''
  };
}

export function mapPhoneOtpErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code?: unknown }).code || '')
      : '';

  if (msg === 'INVALID_PHONE_LOCAL' || code === 'auth/invalid-phone-number') {
    return 'Kripya sahi 10-digit mobile number daalein (e.g. 9876543210).';
  }
  if (msg === 'INVALID_OTP_FORMAT') {
    return 'Kripya SMS me aaya poora 6-digit OTP code daalein.';
  }
  if (msg === 'OTP_SESSION_MISSING') {
    return 'Pehle "Send OTP" par click karke SMS OTP mangwayein.';
  }
  if (code === 'auth/invalid-verification-code') {
    return 'Galat OTP code! SMS me aaya 6-digit OTP check karke dobara daalein.';
  }
  if (code === 'auth/code-expired' || code === 'auth/session-expired') {
    return 'OTP expire ho gaya hai. Kripya "Resend OTP" par click karein.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Phone OTP abhi Firebase Console me enabled nahi hai. Firebase Console -> Authentication -> Sign-in method me "Phone" enable karein.';
  }
  if (code === 'auth/billing-not-enabled') {
    return 'Real SMS OTP bhejne ke liye Firebase project me Phone Auth SMS quota / billing enable hona zaroori hai.';
  }
  if (code === 'auth/unauthorized-domain') {
    const host = typeof window !== 'undefined' ? window.location.hostname : '';
    return `Domain (${host}) Firebase Authorized Domains me add nahi hai. Firebase Console -> Authentication -> Settings -> Authorized domains me "${host}" add karein.`;
  }
  if (code === 'auth/too-many-requests' || code === 'auth/quota-exceeded') {
    return 'Is number par abhi zyada OTP bheje ja chuke hain. Kripya thodi der baad try karein.';
  }
  if (code === 'auth/captcha-check-failed') {
    return 'reCAPTCHA verification fail ho gaya. Kripya dobara "Send OTP" par click karein.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Internet connection kamzor hai. Network check karke dobara OTP bhejein.';
  }

  return `OTP verification failed (${code || msg}). Kripya dobara try karein.`;
}
