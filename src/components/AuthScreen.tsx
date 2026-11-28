import React, { useEffect, useRef, useState } from 'react';
import { ConfirmationResult } from 'firebase/auth';
import { CustomerUser, AuthSession, BusinessConfig } from '../types';
import {
  Lock,
  User,
  Phone,
  ShieldCheck,
  KeyRound,
  ArrowRight,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Eye,
  EyeOff,
  Camera,
  Upload,
  X,
  MessageSquareCode,
  Loader2
} from 'lucide-react';
import { DJLogo } from './DJLogo';
import { PWAInstallButton } from './PWAInstallButton';
import { saveVerifiedCustomerProfile } from '../firebase';
import {
  clearRecaptchaVerifier,
  formatE164Phone,
  mapPhoneOtpErrorMessage,
  normalizeTenDigitMobile,
  sendRealPhoneOtp,
  verifyRealPhoneOtp
} from '../utils/phoneOtpAuth';

const RECAPTCHA_CONTAINER_ID = 'recaptcha-container-customer-auth';

interface AuthScreenProps {
  business: BusinessConfig;
  customerList: CustomerUser[];
  onLoginSuccess: (session: AuthSession) => void;
  onRegisterCustomer: (newCustomer: CustomerUser) => void;
  onResetCustomerPassword: (mobile: string, newPass: string) => boolean;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  business,
  customerList,
  onLoginSuccess,
  onRegisterCustomer,
  onResetCustomerPassword
}) => {
  const [activeRoleTab, setActiveRoleTab] = useState<'customer' | 'owner'>('customer');
  const [customerView, setCustomerView] = useState<'login' | 'register' | 'forgot_password'>('login');

  // Owner credentials
  const [ownerUsername, setOwnerUsername] = useState('owner');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);

  // Customer credentials
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerPassword, setCustomerPassword] = useState('');
  const [showCustomerPassword, setShowCustomerPassword] = useState(false);

  // Registration credentials + Real SMS OTP state
  const [regName, setRegName] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regPhoto, setRegPhoto] = useState('');
  const [regOtp, setRegOtp] = useState('');
  const [regOtpSent, setRegOtpSent] = useState(false);
  const [regOtpVerified, setRegOtpVerified] = useState(false);
  const [regVerifiedUid, setRegVerifiedUid] = useState('');
  const [regSendingOtp, setRegSendingOtp] = useState(false);
  const [regVerifyingOtp, setRegVerifyingOtp] = useState(false);
  const [regResendSec, setRegResendSec] = useState(0);
  const regConfirmationRef = useRef<ConfirmationResult | null>(null);

  // Forgot password + Real SMS OTP state
  const [forgotMobile, setForgotMobile] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [forgotSendingOtp, setForgotSendingOtp] = useState(false);
  const [forgotVerifyingOtp, setForgotVerifyingOtp] = useState(false);
  const [forgotResendSec, setForgotResendSec] = useState(0);
  const [newPassword, setNewPassword] = useState('');
  const forgotConfirmationRef = useRef<ConfirmationResult | null>(null);

  // Feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [exitToast, setExitToast] = useState(false);

  const authBackStateRef = useRef({ activeRoleTab, customerView });
  const backPressedOnceRef = useRef(false);
  const exitToastTimerRef = useRef<number | null>(null);
  authBackStateRef.current = { activeRoleTab, customerView };

  useEffect(() => {
    if (!window.history.state?.skAuthGuard) {
      window.history.pushState({ skAuthGuard: true }, '');
    }

    const handlePopState = () => {
      const state = authBackStateRef.current;

      if (state.activeRoleTab === 'owner') {
        setActiveRoleTab('customer');
        setErrorMsg('');
        setSuccessMsg('');
        window.history.pushState({ skAuthGuard: true }, '');
        return;
      }

      if (state.customerView !== 'login') {
        setCustomerView('login');
        setErrorMsg('');
        setSuccessMsg('');
        window.history.pushState({ skAuthGuard: true }, '');
        return;
      }

      if (!backPressedOnceRef.current) {
        backPressedOnceRef.current = true;
        setExitToast(true);
        if (exitToastTimerRef.current) {
          window.clearTimeout(exitToastTimerRef.current);
        }
        exitToastTimerRef.current = window.setTimeout(() => {
          backPressedOnceRef.current = false;
          setExitToast(false);
          if (!window.history.state?.skAuthGuard) {
            window.history.pushState({ skAuthGuard: true }, '');
          }
        }, 2500);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (exitToastTimerRef.current) {
        window.clearTimeout(exitToastTimerRef.current);
      }
      clearRecaptchaVerifier(RECAPTCHA_CONTAINER_ID);
    };
  }, []);

  useEffect(() => {
    if (regResendSec <= 0) return;
    const t = setTimeout(() => setRegResendSec((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
  }, [regResendSec]);

  useEffect(() => {
    if (forgotResendSec <= 0) return;
    const t = setTimeout(() => setForgotResendSec((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
  }, [forgotResendSec]);

  // Owner Login Submit (Strictly verifies credentials, password is hidden)
  const handleOwnerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (ownerUsername.trim().toLowerCase() === 'owner' && ownerPassword.trim() === '5121526') {
      onLoginSuccess({
        role: 'owner',
        user: {
          id: 'owner_sikandar',
          name: 'Sikandar Kumar Pandit (Owner)',
          mobile: business.phone,
          roleLabel: 'Proprietor / Owner'
        }
      });
    } else {
      setErrorMsg('Incorrect owner username or password. Please verify and try again.');
    }
  };

  // Customer Login Submit
  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const normalizedInput = normalizeTenDigitMobile(customerMobile);
    const customer = customerList.find(
      (c) =>
        (c.mobile.trim() === customerMobile.trim() ||
          (normalizedInput.length === 10 &&
            normalizeTenDigitMobile(c.mobile) === normalizedInput)) &&
        c.password === customerPassword
    );

    if (customer) {
      onLoginSuccess({
        role: 'customer',
        user: {
          id: customer.id,
          name: customer.name,
          mobile: customer.mobile,
          photoUrl: customer.photoUrl,
          roleLabel: 'Customer'
        }
      });
    } else {
      setErrorMsg('Incorrect mobile number or password. If you are a new customer, please register below.');
    }
  };

  const handleRegPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('कृपया केवल फोटो इमेज (JPG/PNG) चुनें।');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const rawUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const maxSide = 360;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          setRegPhoto(canvas.toDataURL('image/jpeg', 0.82));
        } else {
          setRegPhoto(rawUrl);
        }
        setErrorMsg('');
      };
      img.onerror = () => {
        setRegPhoto(rawUrl);
        setErrorMsg('');
      };
      img.src = rawUrl;
    };
    reader.readAsDataURL(file);
  };

  // Send Real SMS OTP for Customer Registration
  const handleSendRegOtp = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    const e164 = formatE164Phone(regMobile);
    if (!e164) {
      setErrorMsg('Kripya sahi 10-digit mobile number daalein (e.g. 9876543210).');
      return;
    }

    const cleanTen = normalizeTenDigitMobile(regMobile);
    if (customerList.some((c) => normalizeTenDigitMobile(c.mobile) === cleanTen)) {
      setErrorMsg('Yeh mobile number pehle se registered hai. Kripya Sign In karein.');
      return;
    }

    setRegSendingOtp(true);
    try {
      const confirmation = await sendRealPhoneOtp(e164, RECAPTCHA_CONTAINER_ID);
      regConfirmationRef.current = confirmation;
      setRegOtpSent(true);
      setRegOtpVerified(false);
      setRegOtp('');
      setRegResendSec(60);
      setSuccessMsg(`${e164} par Real SMS OTP bhej diya gaya hai. Kripya 6-digit OTP daalein.`);
    } catch (err) {
      setErrorMsg(mapPhoneOtpErrorMessage(err));
    } finally {
      setRegSendingOtp(false);
    }
  };

  // Verify Real SMS OTP for Customer Registration
  const handleVerifyRegOtp = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    if (!regConfirmationRef.current) {
      setErrorMsg('Pehle "Send OTP" par click karke SMS OTP mangwayein.');
      return;
    }
    setRegVerifyingOtp(true);
    try {
      const verified = await verifyRealPhoneOtp(regConfirmationRef.current, regOtp);
      setRegOtpVerified(true);
      setRegVerifiedUid(verified.uid);
      setSuccessMsg('Mobile number Real SMS OTP se verify ho gaya!');
    } catch (err) {
      setErrorMsg(mapPhoneOtpErrorMessage(err));
    } finally {
      setRegVerifyingOtp(false);
    }
  };

  // Customer Registration Submit
  const handleCustomerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!regPhoto) {
      setErrorMsg('रजिस्टर करने के लिए अपनी फोटो अपलोड करना अनिवार्य है (Customer Photo Required)।');
      return;
    }
    if (!regName.trim() || !regMobile.trim() || !regPassword) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    const cleanMobile = normalizeTenDigitMobile(regMobile);
    if (cleanMobile.length !== 10) {
      setErrorMsg('Kripya sahi 10-digit mobile number daalein.');
      return;
    }

    if (customerList.some((c) => normalizeTenDigitMobile(c.mobile) === cleanMobile)) {
      setErrorMsg('This mobile number is already registered. Please sign in.');
      return;
    }

    let verifiedUid = regVerifiedUid;
    if (!regOtpVerified) {
      if (!regOtpSent || !regConfirmationRef.current) {
        setErrorMsg('Pehle apne mobile number par Real SMS OTP bhejkar verify karein.');
        return;
      }
      if (!/^\d{6}$/.test(regOtp.trim())) {
        setErrorMsg('Kripya mobile par aaya 6-digit SMS OTP daalein.');
        return;
      }
      setRegVerifyingOtp(true);
      try {
        const verified = await verifyRealPhoneOtp(regConfirmationRef.current, regOtp);
        verifiedUid = verified.uid;
        setRegOtpVerified(true);
        setRegVerifiedUid(verified.uid);
      } catch (err) {
        setErrorMsg(mapPhoneOtpErrorMessage(err));
        setRegVerifyingOtp(false);
        return;
      }
      setRegVerifyingOtp(false);
    }

    if (verifiedUid) {
      await saveVerifiedCustomerProfile({
        uid: verifiedUid,
        name: regName.trim(),
        phone: formatE164Phone(regMobile) || `+91${cleanMobile}`
      });
    }

    const newCust: CustomerUser = {
      id: verifiedUid || 'cust_' + Date.now(),
      name: regName.trim(),
      mobile: cleanMobile,
      password: regPassword,
      photoUrl: regPhoto,
      createdAt: new Date().toISOString()
    };

    onRegisterCustomer(newCust);
    setSuccessMsg('OTP Verified & Account created successfully! Logging you in...');
    setTimeout(() => {
      onLoginSuccess({
        role: 'customer',
        user: {
          id: newCust.id,
          name: newCust.name,
          mobile: newCust.mobile,
          photoUrl: newCust.photoUrl,
          roleLabel: 'Customer'
        }
      });
    }, 900);
  };

  // Send Real SMS OTP for Forgot Password
  const handleSendOtp = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    const e164 = formatE164Phone(forgotMobile);
    if (!e164) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }
    const cleanTen = normalizeTenDigitMobile(forgotMobile);
    const customer = customerList.find((c) => normalizeTenDigitMobile(c.mobile) === cleanTen);
    if (!customer) {
      setErrorMsg('Mobile number not found in customer records.');
      return;
    }

    setForgotSendingOtp(true);
    try {
      const confirmation = await sendRealPhoneOtp(e164, RECAPTCHA_CONTAINER_ID);
      forgotConfirmationRef.current = confirmation;
      setOtpSent(true);
      setForgotOtp('');
      setForgotResendSec(60);
      setSuccessMsg(`${e164} par Real SMS OTP bhej diya gaya hai.`);
    } catch (err) {
      setErrorMsg(mapPhoneOtpErrorMessage(err));
    } finally {
      setForgotSendingOtp(false);
    }
  };

  // Reset Password after Real OTP Verification
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!otpSent || !forgotConfirmationRef.current) {
      setErrorMsg('Pehle "Send OTP" par click karke Real SMS OTP mangwayein.');
      return;
    }
    if (!newPassword || newPassword.length < 3) {
      setErrorMsg('Password must be at least 3 characters long.');
      return;
    }

    setForgotVerifyingOtp(true);
    try {
      await verifyRealPhoneOtp(forgotConfirmationRef.current, forgotOtp);
    } catch (err) {
      setErrorMsg(mapPhoneOtpErrorMessage(err));
      setForgotVerifyingOtp(false);
      return;
    }
    setForgotVerifyingOtp(false);

    const cleanTen = normalizeTenDigitMobile(forgotMobile);
    const matchedCustomer = customerList.find((c) => normalizeTenDigitMobile(c.mobile) === cleanTen);
    const ok = onResetCustomerPassword(matchedCustomer ? matchedCustomer.mobile : forgotMobile.trim(), newPassword);
    if (ok) {
      setSuccessMsg('OTP verified & password changed successfully! You can now log in.');
      setTimeout(() => {
        setCustomerView('login');
        setCustomerMobile(cleanTen);
        setCustomerPassword(newPassword);
        setOtpSent(false);
        setForgotOtp('');
        setSuccessMsg('');
      }, 1400);
    }
  };

  const ownerPhotoSrc = business.ownerPhoto?.includes('/public/')
    ? '/owner_sikandar_pandit.jpg'
    : (business.ownerPhoto || '/owner_sikandar_pandit.jpg');

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      
      {/* Background Atmosphere */}
      <div className="absolute inset-0 z-0 opacity-25 pointer-events-none">
        <img
          src="/src/assets/images/dj_sound_stage_1794452317483.jpg"
          alt="DJ Stage Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-neutral-950/85" />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-5">
        
        {/* Prominent Business & Owner Profile Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/40 border-2 border-amber-500/50 shadow-2xl backdrop-blur-md flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="w-22 h-28 sm:w-24 sm:h-32 rounded-xl overflow-hidden border-2 border-amber-400 shadow-xl bg-neutral-950 relative">
              <img
                src={ownerPhotoSrc}
                alt="Sikandra Kumar Pandit"
                className="w-full h-full object-cover object-top"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/owner_sikandar_pandit.jpg';
                }}
              />
              <div className="absolute bottom-0 inset-x-0 bg-neutral-950/90 text-[10px] text-amber-300 text-center py-0.5 font-bold border-t border-amber-400/40">
                मालिक / Owner
              </div>
            </div>
            <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-black p-1 rounded-full shadow" title="Verified Owner">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="overflow-hidden flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <DJLogo size={30} />
              <h2 className="text-base font-extrabold text-white truncate tracking-tight">
                {business.businessNameEn || 'SK Sound DJ Bandhi'}
              </h2>
            </div>
            
            <div className="text-xs text-neutral-200">
              <span className="text-neutral-400 text-[11px] block">Proprietor / मालिक:</span>
              <span className="text-amber-300 font-extrabold text-sm">
                Sikandra Kumar Pandit
              </span>
            </div>

            <div className="text-[11px] text-neutral-300 flex items-start gap-1 leading-tight">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>Bandhi, Jharkhand Dham Road, Khorimahuwa, Rajdhanwar</span>
            </div>

            <div className="flex items-center gap-3 pt-0.5 text-[11px] font-mono">
              <span className="text-emerald-400 font-bold">+91 {business.phone}</span>
            </div>
          </div>
        </div>

        {/* Mobile App Install & Share Card */}
        <PWAInstallButton variant="card" />

        {/* Main Card */}
        <div className="rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden">
          
          {/* Top Switcher: Customer vs Owner */}
          <div className="grid grid-cols-2 bg-neutral-950 p-1 border-b border-neutral-800 text-xs">
            <button
              onClick={() => {
                setActiveRoleTab('customer');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`py-2.5 px-4 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeRoleTab === 'customer'
                  ? 'bg-amber-400 text-black shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Customer Sign In</span>
            </button>

            <button
              onClick={() => {
                setActiveRoleTab('owner');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`py-2.5 px-4 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeRoleTab === 'owner'
                  ? 'bg-amber-400 text-black shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Owner Portal</span>
            </button>
          </div>

          <div className="p-6 space-y-4">
            
            {/* Feedback Messages */}
            {errorMsg && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-lg text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* TAB 1: CUSTOMER VIEW */}
            {activeRoleTab === 'customer' && (
              <>
                {/* 1. Customer Sign In */}
                {customerView === 'login' && (
                  <form onSubmit={handleCustomerSubmit} className="space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-white">
                        Customer Sign In
                      </h3>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Log in to view owner details, DJ rates, book events & make payments.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Mobile Number *
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          required
                          value={customerMobile}
                          onChange={(e) => setCustomerMobile(e.target.value)}
                          placeholder="10-digit mobile number"
                          className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-neutral-300">
                          Password *
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomerView('forgot_password');
                            setErrorMsg('');
                            setSuccessMsg('');
                            setForgotMobile(customerMobile);
                          }}
                          className="text-[11px] text-amber-400 hover:underline cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showCustomerPassword ? 'text' : 'password'}
                          required
                          value={customerPassword}
                          onChange={(e) => setCustomerPassword(e.target.value)}
                          placeholder="Enter your password"
                          className="w-full pl-9 pr-10 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-amber-400"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCustomerPassword(!showCustomerPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                        >
                          {showCustomerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 shadow"
                    >
                      <span>Sign In & Continue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <div className="pt-3 border-t border-neutral-800 text-center">
                      <span className="text-xs text-neutral-400">New customer? </span>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerView('register');
                          setErrorMsg('');
                          setSuccessMsg('');
                        }}
                        className="text-xs font-bold text-amber-400 hover:underline cursor-pointer"
                      >
                        Create an Account (Set Password)
                      </button>
                    </div>
                  </form>
                )}

                {/* 2. Customer Registration */}
                {customerView === 'register' && (
                  <form onSubmit={handleCustomerRegister} className="space-y-3.5">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                        <UserPlus className="w-4 h-4 text-amber-400" />
                        <span>New Customer Registration</span>
                      </h3>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Register your account with photo and password.
                      </p>
                    </div>

                    {/* Mandatory Customer Photo Upload */}
                    <div className="p-3 rounded-xl bg-neutral-950 border border-amber-500/40 space-y-2">
                      <label className="block text-xs font-bold text-amber-300">
                        अपनी फोटो अपलोड करें (Customer Photo) *
                      </label>

                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-dashed border-amber-400/60 bg-neutral-900 flex items-center justify-center shrink-0">
                          {regPhoto ? (
                            <img
                              src={regPhoto}
                              alt="Customer Preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Camera className="w-6 h-6 text-amber-400/70" />
                          )}
                        </div>

                        <div className="flex-1 space-y-1.5">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleRegPhotoChange}
                            id="customer-reg-photo"
                            className="hidden"
                          />
                          <div className="flex flex-wrap items-center gap-2">
                            <label
                              htmlFor="customer-reg-photo"
                              className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>{regPhoto ? 'फोटो बदलें' : 'फोटो चुनें *'}</span>
                            </label>
                            {regPhoto && (
                              <button
                                type="button"
                                onClick={() => setRegPhoto('')}
                                className="px-2 py-1.5 rounded-lg bg-neutral-800 hover:bg-rose-950 text-rose-400 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                                <span>हटाएं</span>
                              </button>
                            )}
                          </div>
                          <p className="text-[11px] text-neutral-400">
                            {regPhoto ? 'फोटो सफलतापूर्वक जुड़ गई।' : 'रजिस्ट्रेशन के लिए फोटो डालना अनिवार्य है।'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="e.g. Amit Kumar Singh"
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Mobile Number (Real SMS OTP Verification) *
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-amber-400 font-bold">
                            +91
                          </span>
                          <input
                            type="tel"
                            required
                            value={regMobile}
                            onChange={(e) => {
                              setRegMobile(e.target.value);
                              if (regOtpSent || regOtpVerified) {
                                setRegOtpSent(false);
                                setRegOtpVerified(false);
                                setRegVerifiedUid('');
                                setRegOtp('');
                                regConfirmationRef.current = null;
                              }
                            }}
                            placeholder="10-digit mobile number"
                            className="w-full pl-11 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-amber-400"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleSendRegOtp}
                          disabled={regSendingOtp || regResendSec > 0}
                          className="px-3 py-2 bg-amber-400 hover:bg-amber-300 disabled:bg-neutral-800 disabled:text-neutral-400 text-black font-bold text-xs rounded-lg cursor-pointer whitespace-nowrap flex items-center gap-1.5 transition-colors"
                        >
                          {regSendingOtp ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Sending...</span>
                            </>
                          ) : regResendSec > 0 ? (
                            <span>Resend ({regResendSec}s)</span>
                          ) : (
                            <span>{regOtpSent ? 'Resend OTP' : 'Send OTP'}</span>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Real 6-Digit SMS OTP Verification Box */}
                    {regOtpSent && (
                      <div
                        className={`p-3 rounded-xl border space-y-2 ${
                          regOtpVerified
                            ? 'bg-emerald-950/50 border-emerald-700'
                            : 'bg-neutral-950 border-amber-500/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                            <MessageSquareCode className="w-3.5 h-3.5" />
                            <span>Enter 6-Digit SMS OTP *</span>
                          </label>
                          {regOtpVerified && (
                            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Verified
                            </span>
                          )}
                        </div>

                        {!regOtpVerified && (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              inputMode="numeric"
                              maxLength={6}
                              value={regOtp}
                              onChange={(e) => setRegOtp(e.target.value.replace(/\D/g, ''))}
                              placeholder="6-digit OTP"
                              className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm font-mono tracking-[0.25em] text-center text-amber-300 focus:outline-none focus:border-amber-400"
                            />
                            <button
                              type="button"
                              onClick={handleVerifyRegOtp}
                              disabled={regVerifyingOtp || regOtp.length < 6}
                              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-neutral-800 disabled:text-neutral-500 text-black font-bold text-xs rounded-lg cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                            >
                              {regVerifyingOtp ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Checking...</span>
                                </>
                              ) : (
                                <span>Verify OTP</span>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Create Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Choose your password"
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Confirm Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={regVerifyingOtp || regSendingOtp}
                      className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-black font-bold text-xs rounded-lg transition-colors cursor-pointer shadow mt-2"
                    >
                      {regOtpVerified
                        ? 'Register & Sign In'
                        : regOtpSent
                        ? 'Verify OTP & Register'
                        : 'Verify Mobile with OTP & Register'}
                    </button>

                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={() => setCustomerView('login')}
                        className="text-xs text-neutral-400 hover:text-white cursor-pointer"
                      >
                        &larr; Already have an account? Sign In
                      </button>
                    </div>
                  </form>
                )}

                {/* 3. Forgot Password */}
                {customerView === 'forgot_password' && (
                  <form onSubmit={handleResetPassword} className="space-y-3.5">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                        <KeyRound className="w-4 h-4 text-amber-400" />
                        <span>Reset Password with Real SMS OTP</span>
                      </h3>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Enter your registered mobile number, receive SMS OTP and set your new password.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Registered Mobile Number *
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="tel"
                          required
                          value={forgotMobile}
                          onChange={(e) => {
                            setForgotMobile(e.target.value);
                            if (otpSent) {
                              setOtpSent(false);
                              setForgotOtp('');
                              forgotConfirmationRef.current = null;
                            }
                          }}
                          placeholder="10-digit mobile number"
                          className="flex-1 px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-amber-400"
                        />
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={forgotSendingOtp || forgotResendSec > 0}
                          className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-60 text-amber-400 font-semibold text-xs rounded-lg border border-neutral-700 cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                        >
                          {forgotSendingOtp ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Sending...</span>
                            </>
                          ) : forgotResendSec > 0 ? (
                            <span>Resend ({forgotResendSec}s)</span>
                          ) : (
                            <span>{otpSent ? 'Resend OTP' : 'Send OTP'}</span>
                          )}
                        </button>
                      </div>
                    </div>

                    {otpSent && (
                      <>
                        <div>
                          <label className="block text-xs font-semibold text-neutral-300 mb-1">
                            Enter 6-Digit SMS OTP Code *
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            required
                            maxLength={6}
                            value={forgotOtp}
                            onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                            placeholder="6-digit SMS code"
                            className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm font-mono tracking-[0.25em] text-center text-amber-300 focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-300 mb-1">
                            New Password *
                          </label>
                          <input
                            type="password"
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={forgotVerifyingOtp}
                          className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-black font-bold text-xs rounded-lg transition-colors cursor-pointer shadow mt-2"
                        >
                          {forgotVerifyingOtp ? 'Verifying OTP...' : 'Verify OTP & Save New Password'}
                        </button>
                      </>
                    )}

                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={() => setCustomerView('login')}
                        className="text-xs text-neutral-400 hover:text-white cursor-pointer"
                      >
                        &larr; Return to Sign In
                      </button>
                    </div>
                  </form>
                )}

                {/* Invisible Firebase Phone Auth reCAPTCHA Mount Point */}
                <div id={RECAPTCHA_CONTAINER_ID} />
              </>
            )}

            {/* TAB 2: OWNER LOGIN (Password hidden, no leak to customers) */}
            {activeRoleTab === 'owner' && (
              <form onSubmit={handleOwnerSubmit} className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Owner Portal Login</span>
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Authorized access for Sikandar Kumar Pandit only.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={ownerUsername}
                      onChange={(e) => setOwnerUsername(e.target.value)}
                      placeholder="Enter owner username"
                      className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Confidential Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showOwnerPassword ? 'text' : 'password'}
                      required
                      value={ownerPassword}
                      onChange={(e) => setOwnerPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                      title={showOwnerPassword ? 'Hide password' : 'Show password'}
                    >
                      {showOwnerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[11px] text-neutral-500 mt-1 block">
                    Password is kept strictly confidential and masked.
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 shadow"
                >
                  <span>Sign In as Owner</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}

          </div>

        </div>

      </div>

      {exitToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-neutral-900 border border-amber-400/70 text-amber-300 text-xs font-bold shadow-2xl whitespace-nowrap animate-pulse">
          ऐप बंद करने के लिए 1 बार और Back दबाएँ · Press Back again to exit
        </div>
      )}

    </div>
  );
};
