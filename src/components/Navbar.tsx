import React, { useState, useRef, useEffect } from 'react';
import { DJLogo } from './DJLogo';
import {
  Phone,
  Menu,
  X,
  CalendarCheck,
  User,
  LogOut,
  ShieldCheck,
  KeyRound,
  Bell,
  MessageSquare,
  Gift,
  CheckCircle,
  XCircle,
  CheckCheck
} from 'lucide-react';
import { AuthSession, BusinessConfig, CustomerNotification } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  business?: BusinessConfig;
  onOpenBooking: () => void;
  onOpenUPI: (amount?: number, note?: string) => void;
  onOpenAuth: () => void;
  authSession: AuthSession | null;
  onLogout: () => void;
  activeSection: string;
  setActiveSection: (sec: string) => void;
  lang: 'hi' | 'en';
  setLang: (lang: 'hi' | 'en') => void;
  notifications?: CustomerNotification[];
  onMarkNotificationRead?: (id: string) => void;
  onMarkAllNotificationsRead?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  business,
  onOpenBooking,
  onOpenAuth,
  authSession,
  onLogout,
  activeSection,
  setActiveSection,
  notifications = [],
  onMarkNotificationRead,
  onMarkAllNotificationsRead
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'offer_broadcast' | 'booking_success' | 'booking_cancelled'>('all');
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filteredNotifications =
    notifFilter === 'all' ? notifications : notifications.filter((n) => n.type === notifFilter);

  // Dynamic nav links according to logged in role
  const getNavLinks = () => {
    if (!authSession) {
      return [
        { id: 'home', label: 'Home' },
        { id: 'packages', label: 'DJ Rates' },
        { id: 'booking', label: 'Bookings' },
        { id: 'location', label: 'Location' },
      ];
    }
    if (authSession.role === 'owner') {
      return [
        { id: 'owner-income', label: 'Income Report' },
        { id: 'upcoming-bookings', label: 'Upcoming (7d)' },
        { id: 'owner-discounts', label: 'Discounts' },
        { id: 'packages', label: 'Item Rates' },
        { id: 'booking', label: 'All Bookings' },
        { id: 'staff', label: 'Staff' },
        { id: 'location', label: 'Location' },
      ];
    }
    // Customer (My Bookings first, then Rate List, then Location)
    return [
      { id: 'home', label: 'My Account' },
      { id: 'booking', label: 'My Bookings' },
      { id: 'packages', label: 'Rate List' },
      { id: 'location', label: 'Location' },
    ];
  };

  const navLinks = getNavLinks();

  const handleNavClick = (id: string) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4 sm:gap-6">
        
        {/* Zone 1: Brand Wordmark with Owner Photo */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 text-left group shrink-0 focus-visible:outline-none cursor-pointer"
          >
            <DJLogo size={38} />
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-bold tracking-tight text-white group-hover:text-amber-400 transition-colors whitespace-nowrap">
                {business?.businessNameEn || 'SK Sound DJ Bandhi'}
              </span>
              <span className="text-[10px] text-neutral-400 hidden sm:inline whitespace-nowrap">
                Bandhi, Khorimahuwa, Rajdhanwar
              </span>
            </div>
          </button>

          {/* Owner Photo in Navbar Header */}
          <div className="hidden sm:flex items-center gap-2 pl-2.5 border-l border-neutral-800">
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-amber-400 shrink-0 shadow bg-neutral-900">
              <img
                src={business?.ownerPhoto?.includes('/public/') ? '/owner_sikandar_pandit.jpg' : (business?.ownerPhoto || '/owner_sikandar_pandit.jpg')}
                alt="Sikandra Kumar Pandit"
                className="w-full h-full object-cover object-top"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/owner_sikandar_pandit.jpg';
                }}
              />
            </div>
            <div className="flex flex-col text-[11px] leading-tight">
              <span className="text-white font-bold flex items-center gap-1">
                <span>सिकंदर पंडित</span>
                <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1 py-0.2 rounded font-mono">मालिक</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">+91 9973492726</span>
            </div>
          </div>
        </div>

        {/* Zone 2: Single-line Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs sm:text-sm font-medium text-neutral-300">
          {navLinks.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`hover:text-amber-400 transition-colors whitespace-nowrap cursor-pointer py-1 ${
                activeSection === item.id ? 'text-amber-400 font-semibold border-b-2 border-amber-400' : ''
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: Upper Right Install App + Notification Bell + Primary Action + Login/User Badge */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">

          <PWAInstallButton variant="navbar" />

          {/* Notification Bell (Offer, Confirmed & Cancelled WhatsApp Alerts) */}
          {authSession && (
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotifOpen((prev) => !prev)}
                aria-label="Notifications"
                title="WhatsApp Notifications (Offer / Confirmed / Cancelled)"
                className={`relative p-2 rounded-xl border transition-colors cursor-pointer ${
                  notifOpen
                    ? 'bg-amber-400 text-slate-950 border-amber-400'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-amber-300 border-neutral-700'
                }`}
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-extrabold font-mono flex items-center justify-center shadow ring-2 ring-neutral-950">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="fixed sm:absolute right-3 sm:right-0 top-16 sm:top-full sm:mt-2 w-[calc(100vw-1.5rem)] sm:w-[400px] max-h-[78vh] flex flex-col rounded-2xl bg-[#0e1525] border border-slate-700 shadow-2xl z-50 overflow-hidden">
                  {/* Dropdown Header */}
                  <div className="px-4 py-3 bg-[#080d18] border-b border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-amber-400" />
                      <div>
                        <div className="text-xs font-bold text-white">
                          WhatsApp Notifications
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Offer · Booking Confirm · Cancel Alerts
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {unreadCount > 0 && onMarkAllNotificationsRead && (
                        <button
                          type="button"
                          onClick={onMarkAllNotificationsRead}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCheck className="w-3 h-3" />
                          <span>Read All</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setNotifOpen(false)}
                        className="p-1 text-slate-400 hover:text-white cursor-pointer"
                        aria-label="Close Notifications"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Filter Tabs: All / Offer / Confirmed / Cancelled */}
                  <div className="px-3 py-2 bg-[#0b1120] border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px]">
                    {[
                      { key: 'all', label: `All (${notifications.length})` },
                      { key: 'offer_broadcast', label: 'Offer' },
                      { key: 'booking_success', label: 'Confirm' },
                      { key: 'booking_cancelled', label: 'Cancelled' }
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setNotifFilter(tab.key as any)}
                        className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                          notifFilter === tab.key
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Notification List */}
                  <div className="overflow-y-auto p-3 space-y-2.5 flex-1">
                    {filteredNotifications.length === 0 ? (
                      <div className="py-10 px-4 text-center space-y-2">
                        <Bell className="w-7 h-7 text-slate-600 mx-auto" />
                        <p className="text-xs text-slate-400">
                          अभी कोई नोटिफिकेशन नहीं है। ऑफर, बुकिंग कन्फर्म या कैंसिल होने पर यहाँ WhatsApp नोटिफिकेशन दिखेगा।
                        </p>
                      </div>
                    ) : (
                      filteredNotifications.slice(0, 25).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (!n.read && onMarkNotificationRead) {
                              onMarkNotificationRead(n.id);
                            }
                          }}
                          className={`p-3 rounded-xl border text-xs space-y-2 transition-colors ${
                            n.type === 'booking_cancelled'
                              ? 'bg-rose-950/25 border-rose-800/60'
                              : n.type === 'offer_broadcast'
                              ? 'bg-amber-950/25 border-amber-600/40'
                              : 'bg-emerald-950/25 border-emerald-800/60'
                          } ${!n.read ? 'ring-1 ring-amber-400/50' : 'opacity-90'}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 font-bold">
                              {n.type === 'booking_cancelled' ? (
                                <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                              ) : n.type === 'offer_broadcast' ? (
                                <Gift className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              ) : (
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              )}
                              <span
                                className={
                                  n.type === 'booking_cancelled'
                                    ? 'text-rose-300'
                                    : n.type === 'offer_broadcast'
                                    ? 'text-amber-300'
                                    : 'text-emerald-300'
                                }
                              >
                                {n.title}
                              </span>
                              {!n.read && (
                                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Unread" />
                              )}
                            </div>

                            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                              {new Date(n.createdAt).toLocaleString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-200 whitespace-pre-line leading-relaxed max-h-28 overflow-y-auto">
                            {n.message}
                          </p>

                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
                            <span className="text-[10px] font-mono text-slate-400">
                              +91 {n.customerPhone}
                            </span>

                            <a
                              href={n.whatsappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => {
                                if (!n.read && onMarkNotificationRead) {
                                  onMarkNotificationRead(n.id);
                                }
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-bold inline-flex items-center gap-1 shadow"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>WhatsApp पर खोलें</span>
                            </a>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Auth state / Login button */}
          {authSession ? (
            <div className="flex items-center gap-1.5">
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-700 text-xs">
                {authSession.role === 'owner' ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                ) : authSession.user.photoUrl ? (
                  <img
                    src={authSession.user.photoUrl}
                    alt={authSession.user.name}
                    className="w-5 h-5 rounded-full object-cover border border-amber-400"
                  />
                ) : (
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span className="font-semibold text-white max-w-[120px] truncate">
                  {authSession.user.name.split(' ')[0]}
                </span>
                <span className="text-[10px] text-amber-400 uppercase">
                  ({authSession.role === 'owner' ? 'Owner' : 'Customer'})
                </span>
              </div>

              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-rose-400 border border-neutral-700 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white border border-neutral-700 transition-all cursor-pointer whitespace-nowrap"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Sign In</span>
            </button>
          )}

          {/* Primary Action Button (Only for customer) */}
          {authSession?.role !== 'owner' && (
            <button
              onClick={onOpenBooking}
              className="px-3.5 py-2 text-xs font-bold text-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-lg shadow-sm shadow-amber-500/20 transition-all cursor-pointer whitespace-nowrap hidden sm:inline-flex items-center gap-1.5"
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Book DJ</span>
            </button>
          )}

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-neutral-300 hover:text-white rounded-lg focus:outline-none"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-neutral-900/98 border-b border-neutral-800 px-4 py-4 space-y-3">
          
          {authSession && (
            <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-amber-400" />
                <span className="text-white font-semibold">{authSession.user.name}</span>
                <span className="text-neutral-400 capitalize">({authSession.role})</span>
              </div>
              <button
                onClick={onLogout}
                className="text-xs text-rose-400 font-semibold hover:underline"
              >
                Sign Out
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pb-2 border-b border-neutral-800">
            {navLinks.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`text-left text-sm py-2 px-3 rounded-md transition-colors ${
                  activeSection === item.id
                    ? 'bg-amber-500/10 text-amber-400 font-semibold'
                    : 'text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="pt-2 flex flex-col gap-2">
            {authSession?.role !== 'owner' && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenBooking();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-sm cursor-pointer"
              >
                <CalendarCheck className="w-4 h-4" />
                Book DJ / बुकिंग करें
              </button>
            )}

            {!authSession && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-amber-400 text-black font-bold text-sm"
              >
                <KeyRound className="w-4 h-4" />
                Sign In (Customer / Owner)
              </button>
            )}

            <a
              href="tel:9973492726"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-sm"
            >
              <Phone className="w-4 h-4 text-emerald-400" />
              Call Sikandra Kumar Pandit (+91 9973492726)
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
