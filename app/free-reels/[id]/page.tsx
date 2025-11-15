import Image from 'next/image';
import { FreeReelsLeadClient } from '@/components/free-reels/FreeReelsLeadClient';

export default async function FreeReelsLeadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="min-h-screen bg-white">
      {/* Header (match booking page) */}
      <header className="border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a
            href="https://photos4realestate.ca/"
            className="flex items-center gap-3"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="flex items-center gap-3">
              <div className="relative h-8 w-8">
                <Image
                  src="/Map-Pin-Logo.svg"
                  alt="Photos4RealEstate logo"
                  fill
                  className="object-contain"
                  sizes="32px"
                />
              </div>
              <div className="leading-tight select-none">
                <div className="font-semibold text-[#cb4153]">
                  Photos 4 Real Estate
                </div>
                <div className="text-xs text-gray-500">
                  Elevate Your Real Estate Listings
                </div>
              </div>
            </div>
          </a>
          <a
            href="https://photos4realestate.ca/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 cursor-pointer"
          >
            Home
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-4 md:p-8 space-y-8">
        <FreeReelsLeadClient id={id} />
      </main>

      {/* Footer (match booking page) */}
      <footer className="mt-8 border-t border-white/10 bg-[#131c3b] text-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 text-center text-sm">
          <div>
            Powered by{' '}
            <a
              href="https://photos4realestate.ca/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Photos 4 Real Estate
            </a>{' '}
            · © {new Date().getFullYear()} All Rights Reserved
          </div>
          <div className="mt-2 space-x-4">
            <a
              href="https://photos4realestate.ca/terms-and-conditions/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Terms
            </a>
            <a
              href="https://photos4realestate.ca/privacy-policy/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Privacy
            </a>
            <a
              href="https://photos4realestate.ca/contact-us/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
