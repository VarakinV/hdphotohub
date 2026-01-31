import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Film, Presentation, FileText, QrCode } from 'lucide-react';
import { FreeToolsHero } from '@/components/landing/FreeToolsHero';

export const metadata: Metadata = {
  title: 'Free Real Estate Marketing Tools | Photos4RealEstate',
  description:
    'Generate listing reels, property flyers, slideshows, and QR codes using your photos. No design skills. No credit card. Free to use.',
  alternates: { canonical: '/ft' },
  openGraph: {
    title: 'Free Real Estate Marketing Tools for Calgary Realtors',
    description:
      'Generate listing reels, property flyers, slideshows, and QR codes using your photos. No design skills. No credit card. Free to use.',
    url: '/ft',
    siteName: 'Photos4RealEstate',
    images: ['/Map-Pin-Logo.svg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Real Estate Marketing Tools',
    description:
      'Generate listing reels, property flyers, slideshows, and QR codes. Free to use.',
    images: ['/Map-Pin-Logo.svg'],
  },
  robots: { index: true, follow: true },
};

const tools = [
  {
    icon: Film,
    title: 'Free Reel Generator',
    description:
      'Generate 3 social media reels for your listings in minutes. Perfect for Instagram, Facebook, and TikTok.',
    cta: 'Create Free Reels',
    href: '/free-reels',
  },
  {
    icon: Presentation,
    title: 'Free Slideshow Generator',
    description:
      'Create 1 professional slideshow with smooth transitions, ready to share online or via email.',
    cta: 'Create Free Slideshow',
    href: '/free-slideshow',
  },
  {
    icon: FileText,
    title: 'Free Flyer Generator',
    description:
      'Design 3 beautiful PDF property flyers in seconds. Print or share online — no design skills needed.',
    cta: 'Create Free Flyers',
    href: '/free-flyers',
  },
  {
    icon: QrCode,
    title: 'Free Fancy QR Code Generator',
    description:
      'Generate 3 standard QR codes + 1 custom QR code linking to your listings or property websites.',
    cta: 'Create Free QR Codes',
    href: '/free-qr',
  },
];

const steps = [
  {
    number: '1',
    title: 'Upload your listing photos',
    description: 'Drag & drop or select images from your computer.',
  },
  {
    number: '2',
    title: 'Add Listing Information',
    description: 'Enter property details and your contact info.',
  },
  {
    number: '3',
    title: 'Download & share instantly',
    description: 'Use your marketing content anywhere, in minutes.',
  },
];

const faqs = [
  {
    question: 'Are these real estate marketing tools really free?',
    answer: 'Yes. All tools on this page are completely free to use. There are no subscriptions, trials, or hidden fees.',
  },
  {
    question: 'Do I need design or video editing experience?',
    answer: 'No. All tools are designed for realtors with no design or technical experience. Simply upload your photos, enter basic details, and generate your marketing assets.',
  },
  {
    question: "Can I use these tools even if I don't order photography from Photos 4 Real Estate?",
    answer: "Absolutely. These tools are available to all realtors, whether or not you're an existing client.",
  },
  {
    question: 'Are the generated assets suitable for MLS and social media?',
    answer: 'Yes. All outputs are designed specifically for real estate marketing, including social media platforms, email marketing, print materials, and property websites.',
  },
  {
    question: 'Can I use the content for paid ads?',
    answer: 'Yes. You may use the generated videos, flyers, and QR codes for organic marketing or paid advertising.',
  },
  {
    question: 'Are there usage limits?',
    answer: 'Currently, there are no strict usage limits. You can generate content as needed for your listings.',
  },
  {
    question: 'Will more free tools be added?',
    answer: 'Yes. We are continuously expanding the free tools section with new features and tools designed for real estate marketing.',
  },
  {
    question: 'Do the tools work on mobile devices?',
    answer: 'Yes. All tools are web-based and can be accessed from desktop, tablet, and mobile devices.',
  },
];

export default function FreeToolsPage() {
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
              <div className="text-xs text-white/70">Free Marketing Tools</div>
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
      <FreeToolsHero />

      {/* Tool Cards Section */}
      <section id="tools" className="py-20 bg-gray-50 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
            What You Can Create for Free
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {tools.map((tool) => (
              <ToolCard key={tool.title} {...tool} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            How It Works
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            No design tools. No learning curve. Built for busy Realtors.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#ca4153] text-white text-xl font-bold mb-4">
                  {step.number}
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
            FAQ — Free Real Estate Marketing Tools
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 bg-[#131c3b] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-[#ca4153]/20 to-transparent" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-6">
            Trusted by Calgary Realtors
          </h2>
          <p className="text-center text-white/80 max-w-3xl mx-auto text-lg">
            Photos 4 Real Estate tools are designed specifically for Realtors in
            Calgary and surrounding areas. Whether you&apos;re a new agent or an
            experienced professional, our free tools make marketing your listings
            simple and effective.
          </p>
          <div className="mt-12 flex flex-wrap justify-center items-center gap-8 opacity-60">
            <div className="text-2xl font-bold text-white/50">RE/MAX</div>
            <div className="text-2xl font-bold text-white/50">Century 21</div>
            <div className="text-2xl font-bold text-white/50">Royal LePage</div>
            <div className="text-2xl font-bold text-white/50">Coldwell Banker</div>
            <div className="text-2xl font-bold text-white/50">eXp Realty</div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-gradient-to-br from-[#ca4153] via-[#d65a6a] to-[#ca4153] text-white relative">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Create Better Listing Marketing?
          </h2>
          <p className="text-white/90 text-lg max-w-2xl mx-auto mb-8">
            Try our free tools now and see how fast you can turn one listing into
            reels, flyers and slideshows.
          </p>
          <a
            href="#tools"
            className="inline-flex items-center justify-center rounded-md bg-white text-[#ca4153] font-semibold px-8 py-4 text-lg shadow-lg hover:opacity-90 transition-opacity"
          >
            Use Free Tools
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
                    Free Marketing Tools
                  </div>
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-300">
                Free real estate marketing tools designed for Realtors in Calgary
                and surrounding areas.
              </p>
            </div>

            <div>
              <div className="font-medium mb-2">Free Tools</div>
              <ul className="space-y-1 text-sm text-gray-300">
                <li><Link href="/free-reels" className="hover:text-white">Reel Generator</Link></li>
                <li><Link href="/free-slideshow" className="hover:text-white">Slideshow Generator</Link></li>
                <li><Link href="/free-flyers" className="hover:text-white">Flyer Generator</Link></li>
                <li><Link href="/free-qr" className="hover:text-white">QR Code Generator</Link></li>
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
              Photos4RealEstate provides free marketing tools for real estate
              professionals. Generate social media reels, property slideshows,
              PDF flyers, and QR codes — all designed to help you market your
              listings effectively.
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
    </main>
  );
}

function ToolCard({
  icon: Icon,
  title,
  description,
  cta,
  href,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  cta: string;
  href: string;
}) {
  return (
    <div className="group rounded-xl border bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-[#ca4153]/30">
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#ca4153]/10">
          <Icon className="h-6 w-6 text-[#ca4153]" />
        </div>
        <h3 className="text-xl font-semibold">{title}</h3>
      </div>
      <p className="text-gray-600 mb-6">{description}</p>
      <Link
        href={href}
        className="inline-flex items-center justify-center w-full rounded-md bg-[#ca4153] text-white font-medium px-6 py-3 hover:bg-[#b13a49] transition-colors"
      >
        {cta}
      </Link>
    </div>
  );
}

