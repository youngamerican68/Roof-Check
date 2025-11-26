import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'RoofCheck - Free Satellite Roof Report',
  description:
    'Get your free satellite roof analysis. See your roof size, estimated replacement cost, and what to ask contractors — in 60 seconds.',
  keywords: ['roof estimate', 'roof replacement cost', 'satellite roof analysis', 'roofing contractor'],
  openGraph: {
    title: 'RoofCheck - Free Satellite Roof Report',
    description: 'Get your free satellite roof analysis in 60 seconds.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (
    <html lang="en">
      <head>
        {/* Load Google Maps JavaScript API */}
        {googleMapsApiKey && (
          <Script
            src={`https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places,marker&v=weekly`}
            strategy="beforeInteractive"
          />
        )}
      </head>
      <body className={`${inter.className} bg-slate-50 text-slate-900 antialiased`}>
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <header className="bg-white border-b border-slate-200">
            <div className="max-w-5xl mx-auto px-4 py-4">
              <a href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                </div>
                <span className="text-xl font-bold text-slate-900">RoofCheck</span>
              </a>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-grow">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-slate-900 text-slate-400 py-8">
            <div className="max-w-5xl mx-auto px-4">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-emerald-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-slate-300">RoofCheck</span>
                </div>
                <p className="text-sm text-center md:text-right">
                  Satellite roof analysis powered by Google Solar API.
                  <br className="md:hidden" />
                  <span className="hidden md:inline"> </span>
                  Not a professional inspection.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
