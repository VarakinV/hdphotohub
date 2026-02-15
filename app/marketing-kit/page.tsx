import type { Metadata } from 'next';
import Image from 'next/image';
import { MarketingKitHero } from '@/components/landing/MarketingKitHero';
import { ScrollStack } from '@/components/landing/ScrollStack';
import { LoyaltyCounter } from '@/components/landing/LoyaltyCounter';
import { WhyRealtorsSection } from '@/components/landing/ParallaxSection';
import { FaqAccordion } from '@/components/landing/FaqAccordion';
import { ExitIntentPopup } from '@/components/landing/ExitIntentPopup';

export const metadata: Metadata = {
  title: 'Complete Marketing Kit for Calgary Realtors | Photos4RealEstate',
  description:
    'Get a complete marketing kit with every listing: 9 reels, 2 slideshows, 3 PDF flyers, and 3 property websites. 25% off your first order.',
  alternates: { canonical: '/marketing-kit' },
  openGraph: {
    title: 'Complete Marketing Kit for Calgary Realtors',
    description:
      'Get a complete marketing kit with every listing: 9 reels, 2 slideshows, 3 PDF flyers, and 3 property websites. 25% off your first order.',
    url: '/marketing-kit',
    siteName: 'Photos4RealEstate',
    images: ['/Map-Pin-Logo.svg'],
  },
  robots: { index: true, follow: true },
};

const scrollStackItems = [
  {
    title: '9 Social Media Reels',
    description: 'Short-form vertical videos ready for Instagram, Facebook, and more.',
    image: 'https://photos4remedia.s3.ca-central-1.amazonaws.com/shotstack-templates/Reels.jpg',
  },
  {
    title: '2 Professional Slideshows',
    description: 'Perfect for sharing with buyers and on social platforms.',
    image: 'https://photos4remedia.s3.ca-central-1.amazonaws.com/shotstack-templates/Slideshows.jpg',
  },
  {
    title: '3 Property Websites',
    description: 'Dedicated listing websites ready to share instantly with buyers. Professional presentation. Zero extra work for you.',
    image: 'https://photos4remedia.s3.ca-central-1.amazonaws.com/shotstack-templates/Responsive+Preview.jpg',
  },
  {
    title: '3 PDF Property Flyers',
    description: 'Modern, branded, print-ready flyers you can send to clients or use for open houses.',
    image: 'https://photos4remedia.s3.ca-central-1.amazonaws.com/shotstack-templates/PDFs.jpg',
  },
];

const faqs = [
  {
    question: 'Is everything really included?',
    answer: 'Yes — every package includes 9 reels, 2 slideshows, 3 PDF flyers, and 3 property websites.',
  },
  {
    question: 'How long does delivery take?',
    answer: 'Most orders are delivered next day.',
  },
  {
    question: 'Is the 25% discount automatic?',
    answer: 'Use code 25%OFF when placing an order.',
  },
  {
    question: 'Do I earn loyalty points on my first order?',
    answer: 'Yes. Every order earns points — including your discounted first booking.',
  },
];

export default function MarketingKitPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50 border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a
            href="https://photos4realestate.ca/"
            className="flex items-center gap-3"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="relative h-8 w-8">
              <Image
                src="/Map-Pin-Logo.svg"
                alt="Photos4RealEstate logo"
                fill
                className="object-contain"
                sizes="32px"
                priority
              />
            </div>
            <div className="leading-tight select-none">
              <div className="font-semibold text-white">Photos 4 Real Estate</div>
              <div className="text-xs text-white/70">Marketing Kit</div>
            </div>
          </a>
          <a
            href="https://photos4realestate.ca/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 rounded-md border border-white/30 text-white text-sm hover:bg-white/10 transition-colors"
          >
            Main Website
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <MarketingKitHero />

      {/* What's Included Section */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            Everything You Need to Market Your Listing
          </h2>
          <p className="text-center text-gray-600 mb-16 max-w-3xl mx-auto text-lg">
            When you book with Photos 4 Real Estate, you don&apos;t just get photos. You get a complete 
            marketing kit built to help your listing stand out online, on social media, and with buyers.
          </p>
          <ScrollStack items={scrollStackItems} />
          <p className="text-center text-xl font-semibold text-gray-800 mt-8">
            This is your full marketing kit — included with every package.
          </p>
        </div>
      </section>

      {/* 25% Off Section */}
      <section className="py-24 bg-gradient-to-br from-[#ca4153] via-[#d65a6a] to-[#ca4153] text-white relative">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            25% Off Your First Order
          </h2>
          <p className="text-white/90 text-lg max-w-2xl mx-auto mb-8">
            If you&apos;re booking with Photos 4 Real Estate for the first time, you receive 25% off 
            your first order — including the full marketing kit.
            <br /><br />
            <span className="font-semibold">Professional listing media. Complete marketing package. Now discounted.</span>
          </p>
          <a
            href="https://photos4realestate.ca/book-online/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md bg-white text-[#ca4153] font-semibold px-8 py-4 text-lg shadow-lg hover:opacity-90 transition-all duration-200 hover:scale-105"
          >
            Claim 25% Discount
          </a>
          <p className="mt-4 text-white/80 text-sm">
            Use code <span className="font-bold text-white bg-white/20 px-2 py-1 rounded">25%OFF</span>
          </p>
        </div>
      </section>

      {/* Loyalty Points Section */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
            Earn Loyalty Points with Every Order
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-12">
            Every booking earns you points toward future services.
            <br />
            The more listings you market with us, the more you save.
            <br />
            Built to support busy Calgary Realtors long-term.
          </p>
          <LoyaltyCounter targetValue={3500} duration={2000} />
        </div>
      </section>

      {/* Why Realtors Choose Us Section */}
      <WhyRealtorsSection />

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <FaqAccordion faqs={faqs} />
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-[#131c3b] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-[#ca4153]/20 to-transparent" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Upgrade Your Listing Marketing?
          </h2>
          <p className="text-white/80 text-lg max-w-2xl mx-auto mb-8">
            Book your listing with Photos 4 Real Estate and receive a complete marketing kit —
            plus 25% off your first order.
          </p>
          <a
            href="https://photos4realestate.ca/book-online/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md bg-[#ca4153] text-white font-semibold px-8 py-4 text-lg shadow-lg hover:bg-[#b13a49] transition-all duration-200 hover:scale-105"
          >
            Book Now
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#131c3b] text-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-start gap-3">
                <div className="relative h-6 w-6 shrink-0 mt-0.5">
                  <Image
                    src="/Map-Pin-Logo.svg"
                    alt="Photos4RealEstate logo"
                    fill
                    className="object-contain"
                    sizes="24px"
                  />
                </div>
                <div className="leading-tight">
                  <div className="font-semibold text-[#cb4153]">
                    Photos 4 Real Estate
                  </div>
                  <div className="text-xs text-gray-300">
                    Complete Marketing Kit
                  </div>
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-300">
                Professional real estate photography and complete marketing kit for Calgary Realtors.
              </p>
            </div>

            <div>
              <div className="font-medium mb-2">Marketing Kit Includes</div>
              <ul className="space-y-1 text-sm text-gray-300">
                <li>9 Social Media Reels</li>
                <li>2 Professional Slideshows</li>
                <li>3 Property Websites</li>
                <li>3 PDF Flyers</li>
              </ul>
            </div>

            <div>
              <div className="font-medium mb-2">For Professionals</div>
              <ul className="space-y-1 text-sm text-gray-300">
                <li>Real Estate Agents</li>
                <li>Property Managers</li>
                <li>Marketing Teams</li>
              </ul>
            </div>

            <div>
              <div className="font-medium mb-2">Coverage</div>
              <p className="text-sm text-gray-300">
                Serving real estate professionals in Calgary, Airdrie, Cochrane,
                Okotoks, and surrounding areas.
              </p>
            </div>
          </div>

          <hr className="my-8 border-white/15" />

          <div className="text-sm text-gray-300">
            <p>
              Photos4RealEstate provides professional photography and a complete marketing
              kit for every listing. 9 reels, 2 slideshows, 3 flyers, and 3 property websites
              — all included with every package.
            </p>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-xs text-gray-500">
            <span>© {new Date().getFullYear()} Photos4RealEstate. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <a
                href="https://photos4realestate.ca/terms-and-conditions/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Terms
              </a>
              <a
                href="https://photos4realestate.ca/privacy-policy/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Privacy
              </a>
              <a
                href="https://photos4realestate.ca/contact-us/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Exit Intent Popup */}
      <ExitIntentPopup
        bookingUrl="https://photos4realestate.ca/book-online/"
        promoCode="25%OFF"
      />
    </main>
  );
}

