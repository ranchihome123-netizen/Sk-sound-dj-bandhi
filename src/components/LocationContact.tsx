import React from 'react';
import { MapPin, Phone, MessageSquare, Clock, ShieldCheck, Navigation, CheckCircle2 } from 'lucide-react';
import { DJLogo } from './DJLogo';
import { BusinessConfig } from '../types';

interface LocationContactProps {
  business: BusinessConfig;
  onOpenUPI: () => void;
  lang?: 'hi' | 'en';
  theme?: 'light' | 'dark';
}

export const LocationContact: React.FC<LocationContactProps> = ({
  business,
  onOpenUPI,
  theme = 'dark'
}) => {
  const isLight = theme === 'light';

  return (
    <section
      id="location"
      className={
        isLight
          ? 'py-10 bg-[#f4f2ec] text-slate-900'
          : 'py-14 bg-neutral-950 border-b border-neutral-800'
      }
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className={`text-xs font-bold mb-1.5 flex items-center justify-center gap-1.5 ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
            <MapPin className="w-3.5 h-3.5" />
            <span>Location & Headquarters</span>
          </div>
          <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Official Location & Address
          </h2>
          <p className={`mt-2 text-sm sm:text-base ${isLight ? 'text-slate-600' : 'text-neutral-400'}`}>
            {business.businessNameEn || 'SK Sound DJ Bandhi'}'s headquarters is situated at Bandhi, Khorimahuwa, Rajdhanwar (Giridih, Jharkhand).
          </p>
        </div>

        {/* 2-Column Grid: Address & Profile + Map */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Details (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Owner & Address Card */}
            <div
              className={`p-6 rounded-3xl border space-y-4 ${
                isLight ? 'bg-white border-stone-200 shadow-sm' : 'bg-neutral-900 border-neutral-800'
              }`}
            >
              <div className={`flex items-center gap-3 border-b pb-4 ${isLight ? 'border-stone-200' : 'border-neutral-800'}`}>
                <DJLogo size={48} showText={!isLight} />
                {isLight && (
                  <div>
                    <div className="text-base font-extrabold text-slate-900">
                      {business.businessNameEn || 'SK Sound DJ Bandhi'}
                    </div>
                    <div className="text-xs text-slate-500">
                      Sikandra Kumar Pandit · Rajdhanwar
                    </div>
                  </div>
                )}
              </div>

              <div className={`space-y-3 text-sm ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-xl border shrink-0 ${
                      isLight ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-neutral-950 border-neutral-800 text-amber-400'
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className={`text-xs block ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>Official Address:</span>
                    <strong className={`block mt-0.5 text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      Bandhi, Khorimahuwa, Rajdhanwar
                    </strong>
                    <span className={`text-xs block mt-0.5 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                      District: Giridih, State: Jharkhand (PIN Code: 825412)
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-xl border shrink-0 ${
                      isLight ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-neutral-950 border-neutral-800 text-amber-400'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className={`text-xs block ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>Proprietor / Owner:</span>
                    <strong className={`block mt-0.5 text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      Sikandra Kumar Pandit
                    </strong>
                    <span className={`text-xs block mt-0.5 font-semibold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                      Verified Business Owner
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-xl border shrink-0 ${
                      isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-neutral-950 border-neutral-800 text-emerald-400'
                    }`}
                  >
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className={`text-xs block ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>Direct Phone & WhatsApp:</span>
                    <a
                      href={`tel:${business.phone}`}
                      className={`text-base font-bold font-mono transition-colors block mt-0.5 ${
                        isLight ? 'text-emerald-700 hover:text-emerald-600' : 'text-emerald-400 hover:text-emerald-300'
                      }`}
                    >
                      +91 {business.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-xl border shrink-0 ${
                      isLight ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-neutral-950 border-neutral-800 text-amber-400'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className={`text-xs block ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>Booking Support Hours:</span>
                    <span className={`block mt-0.5 font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      24×7 Call & In-App Booking Available
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <a
                  href={`tel:${business.phone}`}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                  Call Now (+91 {business.phone})
                </a>

                <a
                  href={`https://wa.me/${business.whatsapp}?text=Hello%20Sikandra%20ji,%20I%20want%20to%20book%20DJ%20at%20Bandhi%20Khorimahuwa%20Rajdhanwar.`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  WhatsApp Chat
                </a>
              </div>
            </div>

            {/* Service Area Card */}
            <div
              className={`p-5 rounded-3xl border ${
                isLight ? 'bg-white border-stone-200 shadow-sm' : 'bg-neutral-900 border-neutral-800'
              }`}
            >
              <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Service Coverage Radius:
              </h4>
              <p className={`text-xs mb-3 ${isLight ? 'text-slate-600' : 'text-neutral-400'}`}>
                Based in Bandhi, Khorimahuwa, Rajdhanwar, we provide wedding and baraat DJ sound service throughout the following regions:
              </p>
              <div className={`grid grid-cols-2 gap-2 text-xs ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
                  <span>Bandhi, Khorimahuwa</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
                  <span>Rajdhanwar Main Market</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
                  <span>Khorimahuwa Chowk</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
                  <span>Sariya & Bagodar</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
                  <span>Jamua & Giridih</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
                  <span>Birni & Nearby Areas</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Interactive Map (7 cols) */}
          <div className="lg:col-span-7">
            <div
              className={`rounded-3xl overflow-hidden border p-2.5 shadow-sm ${
                isLight ? 'bg-white border-stone-200' : 'bg-neutral-900 border-neutral-800 shadow-xl'
              }`}
            >
              <div className={`p-3 flex items-center justify-between border-b text-xs ${isLight ? 'border-stone-200' : 'border-neutral-800'}`}>
                <div className="flex items-center gap-2">
                  <Navigation className={`w-4 h-4 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
                  <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Live Map: Bandhi, Khorimahuwa, Rajdhanwar (Jharkhand)
                  </span>
                </div>
                <span className={`text-[11px] hidden sm:inline ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                  Giridih District
                </span>
              </div>

              {/* Map Iframe */}
              <div className={`w-full h-80 sm:h-96 rounded-2xl overflow-hidden relative mt-2 ${isLight ? 'bg-stone-100' : 'bg-neutral-950'}`}>
                <iframe
                  title="Rajdhanwar Bandhi Khorimahuwa Location Map"
                  src="https://maps.google.com/maps?q=Rajdhanwar,Giridih,Jharkhand&t=&z=13&ie=UTF8&iwloc=&output=embed"
                  className={`w-full h-full border-0 ${isLight ? '' : 'filter invert-[0.9] hue-rotate-180 contrast-125'}`}
                  loading="lazy"
                  allowFullScreen
                />
              </div>

              {/* Directions helper note */}
              <div className={`p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${isLight ? 'text-slate-600' : 'text-neutral-400'}`}>
                <span>
                  For directions or location pin sharing, call or WhatsApp Sikandra Kumar Pandit directly.
                </span>
                <button
                  onClick={onOpenUPI}
                  className={`font-bold cursor-pointer underline text-left ${isLight ? 'text-amber-700 hover:text-amber-600' : 'text-amber-400 hover:text-amber-300'}`}
                >
                  Open UPI QR Scanner &rarr;
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
