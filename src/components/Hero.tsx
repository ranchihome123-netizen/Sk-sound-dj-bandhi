import React from 'react';
import { Calendar, QrCode, Phone, MessageSquare, MapPin, Volume2, Sparkles, CheckCircle2, KeyRound } from 'lucide-react';
import { DJLogo } from './DJLogo';
import { BusinessConfig, AuthSession } from '../types';

interface HeroProps {
  business: BusinessConfig;
  authSession: AuthSession | null;
  onOpenBooking: () => void;
  onOpenUPI: () => void;
  onOpenAuth: () => void;
  lang?: 'hi' | 'en';
}

export const Hero: React.FC<HeroProps> = ({
  business,
  authSession,
  onOpenBooking,
  onOpenUPI,
  onOpenAuth
}) => {
  return (
    <section className="relative overflow-hidden bg-neutral-950 pt-6 pb-12 lg:pt-10 lg:pb-16 border-b border-neutral-800">
      {/* Background DJ stage atmospheric photo with gradient scrim */}
      <div className="absolute inset-0 z-0 opacity-25">
        <img
          src="/src/assets/images/dj_sound_stage_1794452317483.jpg"
          alt="DJ Sound Stage Setup"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent" />
        <div className="absolute inset-0 bg-radial-gradient from-amber-500/10 via-transparent to-neutral-950/90" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main 2-Column Split: Visual Anchor & Proposition */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Proposition & CTAs (7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-6">
            
            {/* Top kicker */}
            <div className="inline-flex items-center gap-2 text-xs font-medium text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-md border border-amber-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Jharkhand's #1 High-Power Sound & Baraat Special DJ</span>
            </div>

            {/* Display Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              <span className="text-amber-400">{business.businessNameEn || 'SK Sound DJ Bandhi'}</span>
              <br />
              <span className="text-2xl sm:text-3xl lg:text-4xl font-normal text-neutral-200">
                Wedding, Baraat & Grand Events Sound
              </span>
            </h1>

            {/* Subtext with Location & Owner */}
            <p className="text-base sm:text-lg text-neutral-300 max-w-2xl leading-relaxed">
              Proprietor: <strong className="text-white font-semibold">Sikandra Kumar Pandit</strong>. Official Address: <strong className="text-white font-semibold">Bandhi, Khorimahuwa, Rajdhanwar</strong>. High-definition punch bass, sharpy beam moving lights, silent generator and full stage audio setup ready for Half Day and Full Day bookings.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onOpenBooking}
                className="px-6 py-3 text-sm font-bold text-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-lg shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                Book DJ Event
              </button>

              <button
                onClick={onOpenUPI}
                className="px-5 py-3 text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-amber-400/50 rounded-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-amber-400" />
                Open UPI Scanner
              </button>

              {!authSession && (
                <button
                  onClick={onOpenAuth}
                  className="px-4 py-3 text-sm font-medium text-amber-300 bg-neutral-900/90 hover:bg-neutral-800 border border-amber-500/30 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  Sign In (Customer / Owner)
                </button>
              )}

              <a
                href={`https://wa.me/${business.whatsapp}?text=Hello%20Sikandra%20ji,%20I%20would%20like%20to%20inquire%20and%20book%20${encodeURIComponent(business.businessNameEn || 'SK Sound DJ Bandhi')}.`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-3 text-sm font-medium text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-800/50 rounded-lg transition-colors flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                WhatsApp Chat
              </a>
            </div>

            {/* Trust points inline */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-xs text-neutral-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>Half Day & Full Day Shifts</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>Instant PhonePe / GPay / Paytm UPI QR Scanner</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>Verified Digital Receipt & Timing Guarantee</span>
              </div>
            </div>
          </div>

          {/* Right Column: Owner Card with Sikandra Pandit's Photo (5 cols) */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden bg-neutral-900/90 border border-neutral-800 p-4 shadow-xl">
              
              {/* Photo & Badge Grid */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-4 items-center">
                
                {/* Real Photo of Owner Sikandra Kumar Pandit */}
                <div className="relative w-44 sm:w-48 lg:w-full h-56 sm:h-64 lg:h-72 rounded-xl overflow-hidden shrink-0 border border-neutral-700 shadow-inner">
                  <img
                    src={business.ownerPhoto}
                    alt="Sikandra Kumar Pandit - Owner SK Sound DJ Bandhi"
                    className="w-full h-full object-cover object-top"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent opacity-80" />
                  
                  {/* Verified Owner Ribbon */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs bg-neutral-950/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-neutral-700/60 text-white">
                    <span className="font-semibold text-amber-300">Sikandra Kumar Pandit</span>
                    <span className="text-neutral-300">Proprietor / Owner</span>
                  </div>
                </div>

                {/* Owner info details card */}
                <div className="flex-1 w-full space-y-3">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                    <DJLogo size={36} showText={true} />
                  </div>

                  <div className="space-y-1.5 text-xs text-neutral-300">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-white">Location:</strong> Bandhi, Khorimahuwa, Rajdhanwar
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        <strong className="text-white">Call / Contact:</strong> +91 {business.phone}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        <strong className="text-white">Setup:</strong> 2 Bass to 8 Bass + Sharpy Truss System
                      </span>
                    </div>
                  </div>

                  {/* Owner statement */}
                  <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800/80 text-xs italic text-neutral-300">
                    "We provide the most powerful, crystalline sound systems and concert lighting for weddings, baraats, and stage events at fair, transparent rates."
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4-Column Feature/KPI Strip below hero */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-neutral-800/80">
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4">
            <span className="text-xs text-neutral-400 block">Proprietor</span>
            <span className="text-sm sm:text-base font-bold text-white mt-1 block">
              Sikandra Kumar Pandit
            </span>
            <span className="text-xs text-amber-400 mt-1 block">Phone: +91 {business.phone}</span>
          </div>

          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4">
            <span className="text-xs text-neutral-400 block">Official Address</span>
            <span className="text-sm sm:text-base font-bold text-white mt-1 block">
              Bandhi, Khorimahuwa
            </span>
            <span className="text-xs text-neutral-400 mt-1 block">Rajdhanwar, Giridih</span>
          </div>

          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4">
            <span className="text-xs text-neutral-400 block">Booking Duration</span>
            <span className="text-sm sm:text-base font-bold text-white mt-1 block">
              Half Day / Full Day
            </span>
            <span className="text-xs text-emerald-400 mt-1 block">Full Night Baraat Special</span>
          </div>

          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4">
            <span className="text-xs text-neutral-400 block">Payment Mode</span>
            <span className="text-sm sm:text-base font-bold text-white mt-1 block">
              Direct UPI QR Scanner
            </span>
            <span className="text-xs text-amber-400 mt-1 block">Available on Payment Click</span>
          </div>
        </div>

      </div>
    </section>
  );
};
