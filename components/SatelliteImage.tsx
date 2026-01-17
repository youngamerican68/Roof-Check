'use client';

import { useState } from 'react';

interface SatelliteImageProps {
  src: string;
  alt: string;
  address: string;
}

export default function SatelliteImage({ src, alt, address }: SatelliteImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative rounded-xl overflow-hidden shadow-lg border border-slate-200">
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 bg-slate-100 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-slate-300 border-t-emerald-500 rounded-full animate-spin" />
            <span className="text-sm text-slate-500">Loading satellite view...</span>
          </div>
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 bg-slate-100 flex items-center justify-center z-10">
          <div className="text-center p-4">
            <svg
              className="w-12 h-12 text-slate-400 mx-auto mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm text-slate-500">Unable to load satellite image</p>
          </div>
        </div>
      )}

      {/* Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="w-full h-auto aspect-[4/3] object-cover"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />

      {/* Location pin indicator */}
      <div className="absolute bottom-3 left-3">
        <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
          <div className="w-2 h-2 bg-red-500 rounded-full" />
          <span className="text-white text-xs font-medium">Satellite View</span>
        </div>
      </div>
    </div>
  );
}
