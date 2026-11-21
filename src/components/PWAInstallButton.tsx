import React, { useState } from 'react';
import { Download, Share2, Copy, Check, X } from 'lucide-react';
import { usePWAInstall, useOnlineStatus } from '../utils/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'navbar' | 'card' | 'footer';
  appUrl?: string;
}

const DEFAULT_SHARE_URL = 'https://ais-pre-pwjbnkang3xs47xxwowpp3-859217604739.asia-northeast1.run.app';

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'navbar',
  appUrl
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [modalOpen, setModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl =
    appUrl ||
    (typeof window !== 'undefined' && !window.location.origin.includes('localhost')
      ? window.location.origin
      : DEFAULT_SHARE_URL);

  const handleInstallClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) return;
    }
    setModalOpen(true);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `*SK Sound DJ Bandhi App*\n${shareUrl}`
  )}`;

  // Hide native install trigger when already running in standalone installed PWA mode,
  // unless rendered in footer/card where sharing the app link is still useful.
  if (isInstalled && variant === 'navbar') {
    return null;
  }

  return (
    <>
      {variant === 'navbar' ? (
        <button
          type="button"
          onClick={handleInstallClick}
          className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/40 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          title="Install Mobile App & Share Link"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{isInstallable ? 'Install App' : 'Get App'}</span>
        </button>
      ) : variant === 'card' ? (
        <div className="p-3.5 rounded-2xl bg-[#0e1525]/95 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <img
              src="/pwa-192x192.png"
              alt="SK Sound DJ App"
              className="w-10 h-10 rounded-xl border border-amber-400/60 shrink-0"
            />
            <div className="text-xs">
              <div className="font-bold text-white">SK Sound DJ Mobile App</div>
              <div className="text-[11px] text-slate-400">
                फ़ोन में सीधे इंस्टॉल करें या WhatsApp पर ऐप लिंक भेजें
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isInstalled && (
              <button
                type="button"
                onClick={handleInstallClick}
                className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isInstallable ? 'Install App' : 'Download / Install'}</span>
              </button>
            )}
            <a
              href={whatsappShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-semibold text-xs inline-flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Link</span>
            </a>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleInstallClick}
          className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>Install / Share App</span>
        </button>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#0e1525] border border-slate-700 shadow-2xl overflow-hidden">
            <div className="px-5 py-4 bg-[#080d18] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src="/pwa-192x192.png"
                  alt="SK Sound DJ"
                  className="w-8 h-8 rounded-lg border border-amber-400/60"
                />
                <div>
                  <h3 className="text-sm font-bold text-white">Install & Share Mobile App</h3>
                  <p className="text-[11px] text-slate-400">SK Sound DJ Bandhi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-200">
              {isInstallable && (
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await install();
                    if (ok) setModalOpen(false);
                  }}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>अभी फ़ोन में इंस्टॉल करें (1-Tap Install)</span>
                </button>
              )}

              {/* Shareable App Link (Only Copy Link & Send on WhatsApp) */}
              <div className="p-3.5 rounded-xl bg-[#080d18] border border-slate-800 space-y-2.5">
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 break-all">
                  {shareUrl}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Link Copied!' : 'Copy App Link'}</span>
                  </button>
                  <a
                    href={whatsappShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center justify-center gap-1.5"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>WhatsApp पर भेजें</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-xl">
      <span className="h-2 w-2 rounded-full bg-slate-950 animate-pulse" />
      <span>Offline Mode — Cached app data active</span>
    </div>
  );
};
