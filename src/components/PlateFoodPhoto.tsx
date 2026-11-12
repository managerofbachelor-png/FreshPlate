import React, { useState } from 'react';

interface PlateFoodPhotoProps {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  showGarnish?: boolean;
  className?: string;
}

export const PlateFoodPhoto: React.FC<PlateFoodPhotoProps> = ({
  src,
  alt,
  size = 'md',
  showGarnish = true,
  className = '',
}) => {
  const [errored, setErrored] = useState(false);

  const dims =
    size === 'sm'
      ? 'w-16 h-16'
      : size === 'lg'
        ? 'w-56 h-56 sm:w-64 sm:h-64'
        : 'w-28 h-28 sm:w-32 sm:h-32';

  const pad = size === 'lg' ? 'p-2.5' : size === 'sm' ? 'p-1' : 'p-1.5';

  return (
    <div className={`relative inline-flex items-center justify-center select-none ${className}`}>
      {/* Mint leaves garnish behind top-left of plate */}
      {showGarnish && size !== 'sm' && (
        <svg
          className={`pointer-events-none absolute ${
            size === 'lg' ? '-top-2 -left-3 w-16 h-16' : '-top-1.5 -left-2 w-8 h-8'
          } z-10 drop-shadow-sm`}
          viewBox="0 0 64 64"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M12 38C10 18 26 6 44 10C42 28 28 40 12 38Z"
            fill="#7CB342"
          />
          <path
            d="M12 38C22 28 31 20 40 13"
            stroke="#548B28"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M28 44C26 30 38 20 52 24C50 38 38 46 28 44Z"
            fill="#8DC63F"
          />
          <path
            d="M28 44C36 37 42 31 48 26"
            stroke="#5F972E"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      )}

      {/* Ceramic plate with soft shadow */}
      <div
        className={`${dims} ${pad} rounded-full bg-white plate-ring-shadow relative overflow-hidden flex items-center justify-center`}
      >
        {!errored ? (
          <img
            src={src}
            alt={alt}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setErrored(true)}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <div className="w-full h-full rounded-full bg-gradient-to-br from-[#DCEBCE] to-[#B7D79E] flex items-center justify-center text-[#4E8A1F] font-display text-xs font-bold p-2 text-center">
            {alt}
          </div>
        )}
      </div>

      {/* Tiny glossy cherry tomato beside bottom-left/right of plate */}
      {showGarnish && size !== 'sm' && (
        <svg
          className={`pointer-events-none absolute ${
            size === 'lg' ? 'bottom-1 left-2 w-10 h-10' : 'bottom-0 right-0 w-5 h-5'
          } z-10 drop-shadow-md`}
          viewBox="0 0 40 40"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="20" cy="22" r="14" fill="#E4572E" />
          <ellipse cx="15" cy="17" rx="4" ry="2.2" transform="rotate(-30 15 17)" fill="#FF9273" opacity="0.7" />
          <path
            d="M20 9C17 7 14 9 16 11C18 10 22 10 24 11C26 9 23 7 20 9Z"
            fill="#4E8A1F"
          />
          <path d="M20 9L20 5" stroke="#4E8A1F" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      )}
    </div>
  );
};
