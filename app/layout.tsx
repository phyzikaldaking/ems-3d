import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/next';

const siteUrl = 'https://ems-3d.vercel.app';

export const metadata: Metadata = {
  title: 'Epic MusicSpace — The City',
  description:
    'The Las Vegas Strip of the music industry. A walkable metaverse city with districts for every genre.',
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: 'Epic MusicSpace — The City',
    description:
      'The Las Vegas Strip of the music industry. A walkable metaverse city with districts for every genre.',
    url: siteUrl,
    siteName: 'Epic MusicSpace',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Epic MusicSpace — The City',
    description:
      'The Las Vegas Strip of the music industry. A walkable metaverse city with districts for every genre.',
  },
  icons: {
    icon: '/favicon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0a10',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          background: '#0a0a10',
          color: '#f4f4f8',
          overflow: 'hidden',
          fontFamily:
            'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
