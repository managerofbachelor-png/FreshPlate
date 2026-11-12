import React, { useEffect } from 'react';
import { motion } from 'motion/react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  useEffect(() => {
    const timer = window.setTimeout(onComplete, 1450);
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      onClick={onComplete}
      className="fixed inset-0 z-50 fresh-hero-gradient flex flex-col items-center justify-center px-6 cursor-pointer select-none"
    >
      {/* FreshPlate Transparent Logo Mark */}
      <motion.div
        initial={{ scale: 0.72, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 20 }}
        className="relative flex items-center justify-center w-32 h-32 mb-5"
      >
        <img
          src="/assets/aistudio/freshplate_transparent_1b70ecf0.png"
          alt="FreshPlate logo"
          className="w-full h-full object-contain drop-shadow-[0_14px_28px_rgba(28,43,26,0.28)]"
        />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.35, ease: 'easeOut' }}
        className="font-display text-4xl font-extrabold text-white tracking-tight"
      >
        FreshPlate
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.9 }}
        transition={{ delay: 0.55, duration: 0.35 }}
        className="mt-2 text-sm font-medium text-white/90"
      >
        Fresh Market · Simple Weekly Meals
      </motion.p>
    </motion.div>
  );
};
