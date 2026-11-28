import React from 'react';
import { DJLogo } from './DJLogo';
import { Phone, MapPin, QrCode } from 'lucide-react';
import { BusinessConfig } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface FooterProps {
  business: BusinessConfig;
  onOpenUPI: () => void;
  lang?: 'hi' | 'en';
  theme?: 'light' | 'dark';
}

export const Footer: React.FC<FooterProps> = ({ business, onOpenUPI, theme = 'dark' }) => {
  const isLight = theme === 'light';

  return (
    <footer
      className={
        isLight
          ? 'bg-[#082f30] border-t border-teal-900 text-teal-100/80 text-xs py-10'
          : 'bg-neutral-950 border-t border-neutral-800 text-neutral-400 text-xs py-10'
      }
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div
          className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b ${
            isLight ? 'border-teal-800/70' : 'border-neutral-900'
          }`}
        >
          
          {/* Brand info */}
          <div className="flex items-center gap-3">
            <DJLogo size={44} />
            <div>
              <div className="text-sm font-bold text-white">
                {business.businessNameEn || 'SK Sound DJ Bandhi'}
              </div>
              <div className={`text-xs ${isLight ? 'text-teal-100/75' : 'text-neutral-400'}`}>
                Proprietor: Sikandra Kumar Pandit · Bandhi, Khorimahuwa, Rajdhanwar (Giridih, Jharkhand)
              </div>
            </div>
          </div>

          {/* Contact quick links */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <a
              href={`tel:${business.phone}`}
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>+91 {business.phone}</span>
            </a>

            <button
              onClick={onOpenUPI}
              className="flex items-center gap-1.5 hover:text-amber-300 transition-colors cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-400" />
              <span>Pay via UPI QR</span>
            </button>

            <PWAInstallButton variant="footer" />
          </div>

        </div>

        {/* Bottom copyright line */}
        <div
          className={`pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] ${
            isLight ? 'text-teal-200/60' : 'text-neutral-500'
          }`}
        >
          <div>
            © {new Date().getFullYear()} {business.businessNameEn || 'SK Sound DJ Bandhi'} (Sikandra Kumar Pandit). All Rights Reserved.
          </div>
          <div>
            Bandhi, Khorimahuwa, Rajdhanwar DJ Sound & Events (Mob. +91 {business.phone})
          </div>
        </div>

      </div>
    </footer>
  );
};
