import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Camera, Video, FileText, Map, Shield, LayoutGrid } from 'lucide-react';

import { LandingHeader } from '@/components/landing/landing-header';
import { Testimonials } from '@/components/landing/testimonials';
import { HeroParticles } from '@/components/landing/hero-particles';
import { HowItWorks } from '@/components/landing/how-it-works';

export const metadata: Metadata = {
  title: 'Media Portal | Fast, Professional Real Estate Media Delivery',
  description:
    'Deliver stunning property photos, videos, floor plans, and virtual tours to your clients with one secure link. Built for real estate photographers and agents.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Photos4RealEstate Media Portal',
    description:
      'Upload once. Deliver everywhere. Photos, videos, floor plans, and more in a single, professional portal.',
    url: '/',
    siteName: 'Photos4RealEstate',
    images: ['/Map-Pin-Logo.svg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Photos4RealEstate Media Portal',
    description:
      'Fast, professional real estate media delivery. One secure link for everything.',
    images: ['/Map-Pin-Logo.svg'],
  },
  robots: { index: true, follow: true },
};

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <LandingHeader />

      {/* Hero with particles */}
      <section className="relative isolate overflow-hidden">
        <HeroParticles />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-28 sm:py-32 text-white">
          <div className="flex flex-col items-start max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight">
              Professional Real Estate Media Delivery Made Simple
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-white/90">
              Deliver stunning property photos, videos, floor plans, and virtual
              tours to your clients with one secure link.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-md bg-white text-[#ca4153] font-semibold px-6 py-3 shadow hover:opacity-90"
              >
                Get Started
              </Link>
              <a
                href="#cta"
                className="inline-flex items-center justify-center rounded-md bg-transparent border border-white/70 text-white px-6 py-3 hover:bg-white/10"
              >
                View Demo Delivery Page
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">
              Built for Photographers. Loved by Realtors.
            </h2>
            <p className="mt-4 text-gray-700">
              At Photos4RealEstate, we help real estate photographers streamline
              their workflow. Upload property photos, videos, floor plans, and
              attachments in one place, and deliver them to agents instantly
              through a branded, mobile-friendly delivery page.
            </p>
            <p className="mt-3 text-gray-700">
              Realtors can download high-resolution images, MLS-ready versions,
              videos, and more — all from one professional portal.
            </p>
          </div>
          <HowItWorks />
        </div>
      </section>

      {/* Features with dark animated glow */}
      <section id="features" className="relative isolate overflow-hidden">
        <div className="feature-glow" aria-hidden="true" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-white">
            Everything you need to deliver
          </h2>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Feature
              icon={<Camera className="h-6 w-6 text-[#ca4153]" />}
              title="Photo Delivery"
              desc="Upload once, deliver in print-size and MLS-ready sizes."
            />
            <Feature
              icon={<Video className="h-6 w-6 text-[#ca4153]" />}
              title="Video Hosting & Downloads"
              desc="Share branded/unbranded property tour videos."
            />
            <Feature
              icon={<Map className="h-6 w-6 text-[#ca4153]" />}
              title="Floor Plans & RMS Measurements"
              desc="Upload accurate plans for real estate listings."
            />
            <Feature
              icon={<FileText className="h-6 w-6 text-[#ca4153]" />}
              title="Document Sharing"
              desc="Share PDFs like feature sheets or brochures."
            />
            <Feature
              icon={<LayoutGrid className="h-6 w-6 text-[#ca4153]" />}
              title="Virtual Tours & Embeds"
              desc="iGUIDE, Matterport, or 3D tour links embedded directly."
            />
            <Feature
              icon={<Shield className="h-6 w-6 text-[#ca4153]" />}
              title="Secure Links"
              desc="Delivery pages are private and accessible only by your client."
            />
          </div>
        </div>
      </section>

      <Testimonials />

      {/* CTA */}
      <section id="cta" className="relative isolate">
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#ca4153] via-[#d65a6a] to-[#ca4153]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-28 text-white text-center">
          <h2 className="text-2xl sm:text-3xl font-bold">
            Ready to Streamline Your Media Delivery?
          </h2>
          <p className="mt-2 text-sm sm:text-base text-white/90">
            Join hundreds of real estate professionals who trust
            Photos4RealEstate for their media delivery needs.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-md bg-white text-[#ca4153] px-5 py-2.5 font-semibold shadow-sm hover:opacity-90"
            >
              Get Started Today
            </Link>
            <a
              href="#contact"
              className="inline-flex items-center justify-center rounded-md bg-white/10 text-white px-5 py-2.5 font-semibold ring-1 ring-white/40 hover:bg-white/15"
            >
              Schedule a Demo
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#131c3b] text-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          {/* Top grid */}
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
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
                    Media Portal
                  </div>
                  <div className="text-xs text-gray-300">
                    Elevate Your Real Estate Listings
                  </div>
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-300">
                Professional real estate media delivery platform designed for
                photographers and real estate agents.
              </p>
            </div>

            {/* Services */}
            <div>
              <div className="font-medium mb-2">Services</div>
              <ul className="space-y-1 text-sm text-gray-300">
                <li>Photo Delivery</li>
                <li>Video Hosting</li>
                <li>Floor Plans</li>
                <li>Virtual Tours</li>
                <li>Document Sharing</li>
              </ul>
            </div>

            {/* For Professionals */}
            <div>
              <div className="font-medium mb-2">For Professionals</div>
              <ul className="space-y-1 text-sm text-gray-300">
                <li>Real Estate Agents</li>
                <li>Photographers</li>
                <li>Property Managers</li>
                <li>Marketing Teams</li>
              </ul>
            </div>

            {/* Coverage */}
            <div>
              <div className="font-medium mb-2">Coverage</div>
              <p className="text-sm text-gray-300">
                Serving photographers and real estate professionals across
                Canada and the US.
              </p>
            </div>
          </div>

          {/* Divider */}
          <hr className="my-8 border-white/15" />

          {/* SEO copy */}
          <div className="text-sm text-gray-300">
            <p>
              Photos4RealEstate is a real estate media delivery platform
              designed for photographers and real estate agents. From
              professional real estate photography and drone video tours to
              floor plans and virtual tours, our system makes property marketing
              seamless.
            </p>
            <p className="mt-3">
              Realtors can access their photos anytime, anywhere, and
              photographers can deliver media with a single click. Serving
              photographers and real estate professionals across Canada and the
              US.
            </p>
          </div>

          {/* Copyright */}
          <div className="mt-8 text-center text-xs text-gray-500">
            © {new Date().getFullYear()} Photos4RealEstate. All rights reserved.
          </div>
        </div>
      </footer>

      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Photos4RealEstate Media Portal',
            url:
              (typeof window !== 'undefined' ? window.location.origin : '') ||
              'https://app.photos4realestate.ca',
            potentialAction: {
              '@type': 'SearchAction',
              target: '/search?query={search_term_string}',
              'query-input': 'required name=search_term_string',
            },
          }),
        }}
      />
    </main>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-lg border bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-[#ca4153]/30 focus-within:ring-2 focus-within:ring-[#ca4153]/40">
      <div className="flex items-center gap-3">
        {icon}
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="mt-2 text-sm text-gray-600">{desc}</p>
    </div>
  );
}
