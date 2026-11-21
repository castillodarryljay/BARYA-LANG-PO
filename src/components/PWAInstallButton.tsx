import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

interface PWAInstallButtonProps {
  variant?: 'primary' | 'compact';
  showFallbackTrigger?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'primary',
  showFallbackTrigger = true,
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, installApp } = usePWA();
  const [showGuide, setShowGuide] = useState(false);

  // Automatically suppress once launched in installed standalone / WebAPK mode
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await installApp();
      if (!accepted) return;
      return;
    }
    setShowGuide(true);
  };

  if (!isInstallable && !isIOS && !showFallbackTrigger) {
    return null;
  }

  const label = isInstallable
    ? 'Install App'
    : isIOS
      ? 'Install on iOS'
      : isAndroid
        ? 'Install Android App'
        : 'Install App';

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={
          variant === 'primary'
            ? `min-h-[40px] px-3.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap ${
                isInstallable
                  ? 'bg-amber-500 hover:bg-amber-400 text-[#1a110b] pixel-btn'
                  : 'bg-[#241912]/90 hover:bg-[#332319] border border-amber-700/60 text-amber-100'
              }`
            : `min-h-[40px] px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap ${
                isInstallable
                  ? 'bg-amber-500 hover:bg-amber-400 text-[#1a110b]'
                  : 'bg-[#2b1d14] hover:bg-[#3a281c] border border-amber-700/60 text-amber-100'
              }`
        }
      >
        {isInstallable ? (
          <Download className="w-4 h-4 shrink-0" />
        ) : (
          <Smartphone className="w-4 h-4 shrink-0 text-amber-400" />
        )}
        <span>{label}</span>
      </button>

      {showGuide &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-install-guide-title"
            className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
          >
          <div className="bg-[#231912] border border-amber-700/60 rounded-2xl max-w-md w-full p-5 space-y-4 text-left shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3
                  id="pwa-install-guide-title"
                  className="font-pixel text-xl text-amber-200"
                >
                  Install Barya Lang (Offline App)
                </h3>
                <p className="text-xs text-amber-200/70 mt-0.5">
                  Plays 100% offline in Airplane Mode once installed.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Close install instructions"
                className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg bg-[#18110c] border border-amber-900/60 text-amber-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <ol className="text-sm text-amber-100/90 space-y-2 list-decimal list-inside leading-relaxed">
                <li>
                  Tap the <strong>Share</strong> icon in Safari’s bottom toolbar.
                </li>
                <li>
                  Scroll down and tap <strong>Add to Home Screen</strong>.
                </li>
                <li>
                  Tap <strong>Add</strong> — launch anytime from your home screen offline!
                </li>
              </ol>
            ) : (
              <div className="space-y-3 text-sm text-amber-100/90 leading-relaxed">
                <div className="bg-[#18110c] border border-amber-900/50 rounded-xl p-3 space-y-1.5">
                  <div className="font-semibold text-amber-300 text-xs uppercase tracking-wide">
                    Android Chrome (Automatic WebAPK Install)
                  </div>
                  <ol className="text-xs sm:text-sm space-y-1 list-decimal list-inside">
                    <li>
                      Open this site’s HTTPS link in <strong>Google Chrome</strong>.
                    </li>
                    <li>
                      Tap the <strong>⋮ Menu</strong> button (top-right) and select{' '}
                      <strong>Install app</strong> (or <strong>Add to Home screen → Install</strong>).
                    </li>
                    <li>
                      Chrome automatically builds and installs a native Android WebAPK into your App Drawer!
                    </li>
                  </ol>
                </div>

                <div className="bg-[#18110c] border border-amber-900/50 rounded-xl p-3 space-y-1">
                  <div className="font-semibold text-sky-300 text-xs uppercase tracking-wide">
                    Desktop Chrome / Edge
                  </div>
                  <p className="text-xs text-amber-100/80">
                    Click the <strong>Install icon</strong> in the right side of the address bar to install as a standalone offline desktop app.
                  </p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full min-h-[44px] rounded-xl bg-amber-500 hover:bg-amber-400 text-[#1a110b] font-bold text-sm"
            >
              Got it
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
