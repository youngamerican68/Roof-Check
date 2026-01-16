'use client';

import { useState } from 'react';

export function EmbedCodeSection({ apiKey }: { apiKey: string }) {
  const [copied, setCopied] = useState(false);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.roofcheck.com';
  const embedCode = `<div id="roofcheck-widget"></div>
<script src="${appUrl}/widget.js" data-roofer-key="${apiKey}"></script>`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Add this code to your website to display the RoofCheck widget:
      </p>

      <div className="relative">
        <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm font-mono">
          {embedCode}
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-md transition-colors flex items-center gap-2"
        >
          {copied ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="text-sm text-amber-800">
            <p className="font-medium">Domain verification required</p>
            <p className="mt-1">
              Make sure to add your domain to the allowed domains list above. The widget will only work on verified domains.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
