import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import '../globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Roof Report Widget',
  description: 'Get your free satellite roof analysis',
};

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (
    <html lang="en">
      <head>
        {googleMapsApiKey && (
          <Script
            src={`https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places,marker&v=weekly`}
            strategy="beforeInteractive"
          />
        )}
      </head>
      <body className={`${inter.className} bg-white antialiased`}>
        {children}
      </body>
    </html>
  );
}
