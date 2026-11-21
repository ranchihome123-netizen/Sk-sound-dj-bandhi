import React from 'react';

interface DJLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export const DJLogo: React.FC<DJLogoProps> = ({ size = 48, className = '', showText = false }) => {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div 
        style={{ width: size, height: size }} 
        className="relative shrink-0 rounded-full select-none shadow-md shadow-amber-500/10"
      >
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Metallic Gold Gradient */}
            <linearGradient id="goldMetallic" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF2B2" />
              <stop offset="25%" stopColor="#D4AF37" />
              <stop offset="50%" stopColor="#AA771C" />
              <stop offset="75%" stopColor="#F5D77F" />
              <stop offset="100%" stopColor="#996515" />
            </linearGradient>

            <linearGradient id="circleBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E1E24" />
              <stop offset="100%" stopColor="#0B0B0E" />
            </linearGradient>

            <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* Outer Black Disc */}
          <circle cx="100" cy="100" r="96" fill="url(#circleBg)" stroke="#3A3833" strokeWidth="2.5" />
          <circle cx="100" cy="100" r="92" fill="none" stroke="url(#goldMetallic)" strokeWidth="1" strokeOpacity="0.4" />

          {/* S & K Monogram matching user logo */}
          <g filter="url(#goldGlow)" fill="url(#goldMetallic)">
            {/* 'K' glyph base */}
            <path
              d="M 98 52 
                 L 116 52 
                 L 116 94 
                 L 148 52 
                 L 172 52 
                 L 132 105 
                 L 175 148 
                 L 149 148 
                 L 116 112 
                 L 116 148 
                 L 98 148 
                 Z"
            />

            {/* 'S' intertwined curve with high elegance */}
            <path
              d="M 94 65 
                 C 82 50, 56 48, 44 64 
                 C 34 76, 38 94, 52 102 
                 L 72 113 
                 C 86 121, 90 134, 82 143 
                 C 72 153, 50 152, 38 138 
                 L 32 147 
                 C 47 163, 79 164, 94 148 
                 C 107 133, 103 111, 86 101 
                 L 66 90 
                 C 55 83, 50 72, 57 64 
                 C 64 56, 82 56, 90 68 
                 Z"
            />
          </g>

          {/* Blue Verified Checkmark Badge at bottom right (matches the uploaded image badge) */}
          <g transform="translate(132, 132) scale(0.85)">
            {/* 12-point scalloped seal */}
            <path
              fill="#2563EB"
              stroke="#FFFFFF"
              strokeWidth="2"
              d="M 32 0 
                 L 38 10 L 50 8 L 52 20 L 64 24 L 60 36 L 68 46 L 59 54 L 62 66 L 50 69 L 46 80 L 34 78 L 26 87 L 18 80 L 7 83 L 5 71 L -6 68 L -4 56 L -13 47 L -7 37 L -13 26 L -2 22 L 0 10 L 12 11 L 18 0 Z"
              transform="translate(26, 12) scale(0.65)"
            />
            {/* White checkmark */}
            <path
              d="M 32 38 L 39 45 L 53 29"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
            SK Sound DJ
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Bandhi
            </span>
          </span>
          <span className="text-xs text-neutral-400">
            Sikandra Kumar Pandit · Rajdhanwar
          </span>
        </div>
      )}
    </div>
  );
};
