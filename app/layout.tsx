import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, Space_Grotesk } from 'next/font/google';

import './globals.css';

const headlineFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-headline',
  weight: ['400', '500', '700'],
});

const monoFont = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'Epic MusicSpace — The City',
  description:
    'A premium, walkable music-industry city with genre districts, artist infrastructure, and 3D discovery built for scale.',
  keywords: [
    'music metaverse',
    'artist platform',
    'music marketplace',
    'virtual city',
    'Epic MusicSpace',
  ],
  openGraph: {
    title: 'Epic MusicSpace — The City',
    description:
      'Navigate a premium 3D music city with label towers, marketplaces, studios, and fan experiences across every genre.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Epic MusicSpace — The City',
    description:
      'A premium 3D music city where artists, labels, fans, and commerce live in one navigable world.',
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
      <body className={`${headlineFont.variable} ${monoFont.variable} app-body`}>
        {children}
      </body>
    </html>
  );
}
