'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ApiKeySection({ rooferId, apiKey }: { rooferId: string; apiKey: string }) {
  const router = useRouter();
  const [showKey, setShowKey] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    if (!confirm('Are you sure you want to regenerate your API key? This will invalidate your current key and require updating your embed code.')) {
      return;
    }

    setRegenerating(true);
    try {
      const response = await fetch('/api/roofer/regenerate-key', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate key');
      }

      router.refresh();
    } catch (error) {
      console.error('Error regenerating key:', error);
      alert('Failed to regenerate API key');
    } finally {
      setRegenerating(false);
    }
  };

  const maskedKey = showKey ? apiKey : apiKey.slice(0, 7) + '•'.repeat(20) + apiKey.slice(-4);

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Your API key is used to authenticate widget requests. Keep it secure.
      </p>

      <div className="flex items-center gap-4">
        <div className="flex-1 bg-slate-100 px-4 py-2 rounded-lg font-mono text-sm">
          {maskedKey}
        </div>
        <button
          onClick={() => setShowKey(!showKey)}
          className="px-3 py-2 text-slate-600 hover:text-slate-900 transition-colors"
          title={showKey ? 'Hide key' : 'Show key'}
        >
          {showKey ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
        <button
          onClick={handleCopy}
          className="px-3 py-2 text-slate-600 hover:text-slate-900 transition-colors"
          title="Copy key"
        >
          {copied ? (
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium disabled:opacity-50"
        >
          {regenerating ? 'Regenerating...' : 'Regenerate API Key'}
        </button>
        <p className="text-sm text-slate-500">
          This will invalidate your current embed code
        </p>
      </div>
    </div>
  );
}
