import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { CountryCode } from '../types';

interface CountrySelectScreenProps {
  currentCountry: CountryCode | null;
  onSelectCountry: (country: CountryCode) => void;
}

export const CountrySelectScreen: React.FC<CountrySelectScreenProps> = ({
  currentCountry,
  onSelectCountry,
}) => {
  const [selected, setSelected] = useState<CountryCode | null>(currentCountry);

  const handlePick = (code: CountryCode) => {
    setSelected(code);
    window.setTimeout(() => {
      onSelectCountry(code);
    }, 340);
  };

  const options: Array<{
    code: CountryCode;
    title: string;
    subtitle: string;
    image: string;
    alt: string;
  }> = [
    {
      code: 'BD',
      title: 'Bangladesh',
      subtitle: '৳ Taka · Dhaka bazaar',
      image: '/images/food/country-bd.jpg',
      alt: 'Bangladeshi home-cooked curry meal',
    },
    {
      code: 'US',
      title: 'United States',
      subtitle: '$ Dollars · Walmart',
      image: '/images/food/country-us.jpg',
      alt: 'United States home grocery meal',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
      className="relative z-10 min-h-screen flex flex-col justify-center px-5 py-10 max-w-3xl mx-auto"
    >
      <div className="text-center mb-8">
        <h1 className="font-display text-[32px] sm:text-[40px] font-extrabold text-[#1C2B1A] leading-tight text-balance">
          Choose Your Market
        </h1>
        <p className="mt-2.5 text-sm sm:text-base text-[#7A8A76] max-w-md mx-auto">
          Pick where you shop so every recipe and weekly budget uses local market estimates. You can change this anytime in Profile.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:gap-6">
        {options.map((opt, idx) => {
          const isSelected = selected === opt.code;
          return (
            <motion.button
              key={opt.code}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.25 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handlePick(opt.code)}
              className={`relative rounded-[24px] p-3.5 sm:p-5 text-left transition-all duration-200 flex flex-col items-center ${
                isSelected
                  ? 'bg-[#7CB342] text-white shadow-[0_14px_30px_rgba(124,179,66,0.35)]'
                  : 'bg-white text-[#1C2B1A] shadow-[0_8px_24px_rgba(28,43,26,0.08)] hover:shadow-[0_12px_28px_rgba(28,43,26,0.12)]'
              }`}
            >
              {/* Checkmark circle */}
              <span
                className={`absolute top-3 right-3 h-7 w-7 rounded-full flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-white text-[#7CB342] scale-100'
                    : 'bg-[#E9F2E3] text-transparent scale-90'
                }`}
              >
                <Check className="h-4 w-4 stroke-[3]" />
              </span>

              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full p-1.5 bg-white shadow-md overflow-hidden mt-2 mb-4">
                <img
                  src={opt.image}
                  alt={opt.alt}
                  referrerPolicy="no-referrer"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>

              <h2
                className={`font-display text-lg sm:text-xl font-bold text-center ${
                  isSelected ? 'text-white' : 'text-[#1C2B1A]'
                }`}
              >
                {opt.title}
              </h2>
              <p
                className={`mt-1 text-xs sm:text-sm font-medium text-center ${
                  isSelected ? 'text-white/95' : 'text-[#7A8A76]'
                }`}
              >
                {opt.subtitle}
              </p>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};
