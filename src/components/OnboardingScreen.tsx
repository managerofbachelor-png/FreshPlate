import React from 'react';
import { motion } from 'motion/react';
import { ChevronsRight, Check } from 'lucide-react';
import { HeroVeggieBox3D } from './HeroVeggieBox3D';

interface OnboardingScreenProps {
  onGetStarted: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onGetStarted }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="min-h-screen w-full fresh-hero-gradient flex flex-col justify-between px-5 pt-10 pb-8 sm:py-10 overflow-x-hidden"
    >
      <div className="mx-auto w-full max-w-4xl flex flex-col lg:flex-row lg:items-center lg:gap-10 flex-1 justify-between">
        {/* Headline Block */}
        <div className="lg:w-1/2 text-left pt-2 sm:pt-4">
          <h1 className="font-display text-[38px] sm:text-[44px] leading-[1.1] font-extrabold text-white tracking-tight text-balance">
            Delicious Meals That Match Your Mood
          </h1>
          <p className="mt-3.5 text-sm sm:text-base font-normal text-white/90 max-w-md leading-relaxed">
            Real market grocery budgets, easy home recipes, BMI insights, and high-protein gym meals — all offline on your phone.
          </p>
        </div>

        {/* 3D Veggie Box Hero */}
        <div className="lg:w-1/2 flex items-center justify-center my-2 lg:my-0">
          <HeroVeggieBox3D />
        </div>
      </div>

      {/* Bottom "Get Started" Pill Bar matching Fresh Market reference */}
      <div className="mx-auto w-full max-w-md pt-2">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onGetStarted}
          className="group w-full rounded-full bg-white/85 hover:bg-white p-2 flex items-center justify-between shadow-[0_14px_34px_rgba(28,43,26,0.22)] transition-colors min-h-[64px]"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#8DC63F] text-white shadow-md group-hover:bg-[#7CB342] transition-colors shrink-0">
            <ChevronsRight className="h-6 w-6" />
          </span>
          <span className="font-display text-base font-bold text-[#1C2B1A] tracking-tight">
            Get Started
          </span>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E9F2E3] text-[#4E8A1F] shrink-0">
            <Check className="h-5 w-5" />
          </span>
        </motion.button>
      </div>
    </motion.div>
  );
};
