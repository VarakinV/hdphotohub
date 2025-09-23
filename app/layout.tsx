import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthSessionProvider } from '@/components/providers/session-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://app.photos4realestate.ca'),
  title: 'Media Portal - Real Estate Photography Delivery',
  description: 'Professional real estate photography delivery platform',
  icons: {
    icon: '/Map-Pin-Logo.svg',
    shortcut: '/Map-Pin-Logo.svg',
    apple: '/Map-Pin-Logo.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
