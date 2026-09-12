import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { AuthSessionProvider } from '@/components/providers/session-provider';
import { AdminThemeProvider } from '@/components/providers/theme-provider';
import Script from 'next/script';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-space-grotesk',
});

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
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
      {/* suppressHydrationWarning: browser extensions (e.g. Grammarly) inject
          attributes into <body> before React hydrates, which otherwise logs a
          spurious hydration mismatch in dev. next-themes also needs it to
          patch the class attribute before hydration. */}
      <body
        className="font-[family-name:var(--font-inter)]"
        suppressHydrationWarning
      >
        {/* Google Tag Manager (script) */}
        <Script id="gtm-base" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;
            j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
            f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-NMRQLKX4');`}
        </Script>
        {/* End Google Tag Manager (script) */}
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-NMRQLKX4"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        <AdminThemeProvider>
          <AuthSessionProvider>{children}</AuthSessionProvider>
        </AdminThemeProvider>
      </body>
    </html>
  );
}
