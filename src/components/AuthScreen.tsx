import React, { useEffect, useRef, useState } from 'react';
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
  X
} from 'lucide-react';
import { DJLogo } from './DJLogo';
import { PWAInstallButton } from './PWAInstallButton';

const normalizeTenDigitMobile = (raw: string): string => {
  const digits = raw.replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
};

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

  // Owner credentials (username & password both masked by default)
  const [ownerUsername, setOwnerUsername] = useState('owner');
  const [showOwnerUsername, setShowOwnerUsername] = useState(false);
  const [ownerPassword, setOwnerPassword] = useState('');
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);

  // Customer credentials
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerPassword, setCustomerPassword] = useState('');
  const [showCustomerPassword, setShowCustomerPassword] = useState(false);

  // Registration credentials
  const [regName, setRegName] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regPhoto, setRegPhoto] = useState('');

  // Forgot password state
  const [forgotMobile, setForgotMobile] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [exitToast, setExitToast] = useState(false);

  const authBackStateRef = useRef({ activeRoleTab, customerView });
  const backPressedOnceRef = useRef(false);
  const exitToastTimerRef = useRef<number | null>(null);
  authBackStateRef.current = { activeRoleTab, customerView };

  useEffect(() => {
    const armAuthGuard = () => {
      if (!window.history.state?.skAuthGuard) {
        window.history.pushState({ skAuthGuard: true }, '');
      }
    };

    armAuthGuard();

    const handleUserGesture = () => {
      if (!backPressedOnceRef.current) {
        armAuthGuard();
      }
    };

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
          armAuthGuard();
        }, 2500);
      }
    };

    window.addEventListener('pointerdown', handleUserGesture, { passive: true });
    window.addEventListener('keydown', handleUserGesture, { passive: true });
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('pointerdown', handleUserGesture);
      window.removeEventListener('keydown', handleUserGesture);
      window.removeEventListener('popstate', handlePopState);
      if (exitToastTimerRef.current) {
        window.clearTimeout(exitToastTimerRef.current);
      }
    };
  }, []);

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

  // Customer Registration Submit (Direct, No OTP)
  const handleCustomerRegister = (e: React.FormEvent) => {
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

    const newCust: CustomerUser = {
      id: 'cust_' + Date.now(),
      name: regName.trim(),
      mobile: cleanMobile,
      password: regPassword,
      photoUrl: regPhoto,
      createdAt: new Date().toISOString()
    };

    onRegisterCustomer(newCust);
    setSuccessMsg('Account created successfully! Logging you in...');
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
    }, 700);
  };

  // Direct Reset Password (No OTP)
  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanTen = normalizeTenDigitMobile(forgotMobile);
    if (cleanTen.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    const matchedCustomer = customerList.find((c) => normalizeTenDigitMobile(c.mobile) === cleanTen);
    if (!matchedCustomer) {
      setErrorMsg('Mobile number not found in customer records.');
      return;
    }

    if (!newPassword || newPassword.length < 3) {
      setErrorMsg('Password must be at least 3 characters long.');
      return;
    }

    if (confirmNewPassword && newPassword !== confirmNewPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    const ok = onResetCustomerPassword(matchedCustomer.mobile, newPassword);
    if (ok) {
      setSuccessMsg('Password changed successfully! You can now sign in.');
      setTimeout(() => {
        setCustomerView('login');
        setCustomerMobile(cleanTen);
        setCustomerPassword(newPassword);
        setNewPassword('');
        setConfirmNewPassword('');
        setSuccessMsg('');
      }, 1100);
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
                        Mobile Number *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-amber-400 font-bold">
                          +91
                        </span>
                        <input
                          type="tel"
                          required
                          value={regMobile}
                          onChange={(e) => setRegMobile(e.target.value)}
                          placeholder="10-digit mobile number"
                          className="w-full pl-11 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

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
                      className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs rounded-lg transition-colors cursor-pointer shadow mt-2"
                    >
                      Register & Sign In
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

                {/* 3. Forgot Password (Direct Reset, No OTP) */}
                {customerView === 'forgot_password' && (
                  <form onSubmit={handleResetPassword} className="space-y-3.5">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                        <KeyRound className="w-4 h-4 text-amber-400" />
                        <span>Reset Password</span>
                      </h3>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Enter your registered mobile number and set a new password.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Registered Mobile Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={forgotMobile}
                        onChange={(e) => setForgotMobile(e.target.value)}
                        placeholder="10-digit mobile number"
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-amber-400"
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

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Confirm New Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-lg transition-colors cursor-pointer shadow mt-2"
                    >
                      Save New Password
                    </button>

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
                    Owner Username (Hidden)
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showOwnerUsername ? 'text' : 'password'}
                      required
                      autoComplete="off"
                      value={ownerUsername}
                      onChange={(e) => setOwnerUsername(e.target.value)}
                      placeholder="•••••"
                      className="w-full pl-9 pr-10 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOwnerUsername(!showOwnerUsername)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white cursor-pointer"
                      title={showOwnerUsername ? 'Hide username' : 'Show username'}
                    >
                      {showOwnerUsername ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
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
