import React, { useState } from 'react';
import { Download, CheckCircle2, Smartphone, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'card';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'compact' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    if (variant === 'card') {
      return (
        <div className="flex items-center gap-3 rounded-2xl bg-[#F2F8ED] px-4 py-3 text-sm font-medium text-[#1C2B1A]">
          <CheckCircle2 className="h-5 w-5 text-[#7CB342] shrink-0" />
          <span>Installed on this device — works offline anytime.</span>
        </div>
      );
    }
    return null;
  }

  const handlePress = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      {variant === 'compact' ? (
        isInstallable || isIOS ? (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handlePress}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-[#1C2B1A] shadow-sm hover:bg-[#F5F9F2] transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
            aria-label="Add FreshPlate to Home Screen"
          >
            <Download className="h-3.5 w-3.5 text-[#7CB342]" />
            <span>Install</span>
          </motion.button>
        ) : null
      ) : (
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handlePress}
          className="w-full flex items-center justify-between gap-3 rounded-full bg-[#8DC63F] hover:bg-[#7CB342] px-5 py-3.5 text-white font-semibold shadow-md transition-colors min-h-[48px]"
        >
          <span className="flex items-center gap-2.5">
            <Smartphone className="h-5 w-5" />
            <span>{isInstallable ? 'Add to Home Screen' : 'How to Install on Phone'}</span>
          </span>
          <Download className="h-5 w-5" />
        </motion.button>
      )}

      <AnimatePresence>
        {showGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#1C2B1A]/35 p-4"
            onClick={() => setShowGuide(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-[24px] bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-lg font-bold text-[#1C2B1A]">
                  {isIOS ? 'Add to Home Screen (iOS)' : 'Install FreshPlate'}
                </h3>
                <button
                  onClick={() => setShowGuide(false)}
                  className="h-10 w-10 rounded-full bg-[#E9F2E3] flex items-center justify-center text-[#1C2B1A]"
                  aria-label="Close install guide"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {isIOS ? (
                <ol className="space-y-2.5 text-sm text-[#7A8A76] leading-relaxed">
                  <li>1. Tap the <strong className="text-[#1C2B1A]">Share</strong> icon in Safari’s toolbar.</li>
                  <li>2. Scroll down and tap <strong className="text-[#1C2B1A]">Add to Home Screen</strong>.</li>
                  <li>3. Tap <strong className="text-[#1C2B1A]">Add</strong> — it launches full-screen offline.</li>
                </ol>
              ) : (
                <ol className="space-y-2.5 text-sm text-[#7A8A76] leading-relaxed">
                  <li>1. Open your browser menu (<strong className="text-[#1C2B1A]">⋮</strong> or address bar install icon).</li>
                  <li>2. Select <strong className="text-[#1C2B1A]">Install app</strong> or <strong className="text-[#1C2B1A]">Add to Home Screen</strong>.</li>
                  <li>3. All recipes, prices, and your planner stay saved on your phone.</li>
                </ol>
              )}
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setShowGuide(false)}
                className="mt-5 w-full rounded-full bg-[#8DC63F] py-3 text-sm font-bold text-white min-h-[44px]"
              >
                Got it
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export const OfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-full bg-[#FFF9EC] border border-[#FFC53D] px-4 py-1.5 text-xs font-semibold text-[#1C2B1A] shadow-md whitespace-nowrap">
      Offline Mode — Saved recipes & prices active
    </div>
  );
};
