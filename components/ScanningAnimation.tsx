'use client';

import { useState, useEffect, useCallback } from 'react';
import { SCANNING_MESSAGES, MIN_ANIMATION_DURATION } from '@/lib/utils/constants';

interface ScanningAnimationProps {
  onComplete?: () => void;
  messages?: string[];
  isReady?: boolean; // External signal that API call is done
}

export default function ScanningAnimation({
  onComplete,
  messages = SCANNING_MESSAGES as unknown as string[],
  isReady = false,
}: ScanningAnimationProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  // Cycle through messages
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => {
        const next = prev + 1;
        return next < messages.length ? next : prev;
      });
    }, Math.floor(MIN_ANIMATION_DURATION / messages.length));

    return () => clearInterval(interval);
  }, [messages.length]);

  // Progress animation
  useEffect(() => {
    const duration = MIN_ANIMATION_DURATION;
    const steps = 100;
    const stepDuration = duration / steps;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 1;
        if (next >= steps) {
          clearInterval(interval);
          setMinTimeElapsed(true);
          return 100;
        }
        return next;
      });
    }, stepDuration);

    return () => clearInterval(interval);
  }, []);

  // Complete when both conditions are met
  const handleComplete = useCallback(() => {
    if (isReady && minTimeElapsed && onComplete) {
      onComplete();
    }
  }, [isReady, minTimeElapsed, onComplete]);

  useEffect(() => {
    handleComplete();
  }, [handleComplete]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      {/* Scanning visualization */}
      <div className="relative w-64 h-64 mb-8">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-4 border-slate-200" />

        {/* Animated progress ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx="128"
            cy="128"
            r="124"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            className="text-emerald-500"
            style={{
              strokeDasharray: `${2 * Math.PI * 124}`,
              strokeDashoffset: `${2 * Math.PI * 124 * (1 - progress / 100)}`,
              transition: 'stroke-dashoffset 0.1s ease-out',
            }}
          />
        </svg>

        {/* Scanning line */}
        <div className="absolute inset-4 rounded-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/30 to-transparent animate-scan" />
        </div>

        {/* House icon in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-emerald-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </div>
        </div>

        {/* Radar sweep effect */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(from 0deg, transparent 0deg, rgba(16, 185, 129, 0.2) 60deg, transparent 120deg)`,
            animation: 'spin 2s linear infinite',
          }}
        />
      </div>

      {/* Status message */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Analyzing Your Roof
        </h2>
        <p className="text-lg text-emerald-600 font-medium h-7 transition-opacity duration-300">
          {messages[currentMessageIndex]}
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs mt-8">
        <div className="flex justify-between text-sm text-slate-500 mb-2">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex gap-2 mt-6">
        {messages.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index <= currentMessageIndex
                ? 'bg-emerald-500'
                : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
