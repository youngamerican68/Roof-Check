'use client';

import { useState, useEffect } from 'react';

interface StickyCTAProps {
  onClick: () => void;
  text?: string;
  showAfterScroll?: number; // pixels
}

export default function StickyCTA({
  onClick,
  text = 'Email My Full Report',
  showAfterScroll = 300,
}: StickyCTAProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > showAfterScroll);
    };

    // Check initial position
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showAfterScroll]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-white via-white to-transparent md:hidden">
      <button
        onClick={onClick}
        className="w-full py-4 px-6 bg-emerald-500 hover:bg-emerald-600
                   text-white font-semibold rounded-xl shadow-lg
                   shadow-emerald-500/25 transition-all duration-200
                   flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        {text}
      </button>
    </div>
  );
}
