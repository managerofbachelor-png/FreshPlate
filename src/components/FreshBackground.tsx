import React, { useEffect, useState } from 'react';

export const FreshBackground: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      setScrollY(window.scrollY || 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const slowOffset = Math.min(80, scrollY * 0.14);
  const slowerOffset = Math.min(120, scrollY * 0.08);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" aria-hidden="true">
      {/* Base pale sage canvas */}
      <div className="absolute inset-0 bg-[#E9F2E3]" />

      {/* Soft lighter green & cream organic blobs with subtle scroll parallax */}
      <div
        className="absolute -top-24 -left-20 h-96 w-96 rounded-full bg-[#F5FAEE] opacity-80 blur-3xl transition-transform duration-100"
        style={{ transform: `translate3d(0, ${-slowOffset}px, 0)` }}
      />
      <div
        className="absolute top-1/3 -right-24 h-[28rem] w-[28rem] rounded-full bg-[#FFF9EC] opacity-75 blur-3xl transition-transform duration-100"
        style={{ transform: `translate3d(0, ${-slowerOffset}px, 0)` }}
      />
      <div
        className="absolute bottom-12 left-1/4 h-80 w-80 rounded-full bg-[#DCEBCE] opacity-70 blur-3xl transition-transform duration-100"
        style={{ transform: `translate3d(0, ${-slowOffset * 0.6}px, 0)` }}
      />

      {/* Faint dotted-leaf organic patterns */}
      <svg
        className="absolute top-24 right-6 w-36 h-36 opacity-[0.12] text-[#4E8A1F]"
        style={{ transform: `translate3d(0, ${-slowerOffset * 0.7}px, 0)` }}
        viewBox="0 0 120 120"
        fill="none"
      >
        <path
          d="M20 96C24 52 54 22 100 24C98 70 68 98 20 96Z"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeDasharray="4 6"
        />
        <path
          d="M20 96C46 72 68 50 96 28"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="3 5"
        />
      </svg>

      <svg
        className="absolute bottom-36 left-4 w-44 h-44 opacity-[0.10] text-[#7AB648]"
        style={{ transform: `translate3d(0, ${-slowOffset * 0.45}px, 0) rotate(-18deg)` }}
        viewBox="0 0 120 120"
        fill="none"
      >
        <path
          d="M16 92C22 44 56 16 104 20C100 68 68 96 16 92Z"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeDasharray="4 6"
        />
        <circle cx="88" cy="84" r="10" stroke="#E4572E" strokeWidth="2" strokeDasharray="3 4" />
      </svg>
    </div>
  );
};
