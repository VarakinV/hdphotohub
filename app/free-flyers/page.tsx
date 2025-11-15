import Image from 'next/image';
import { FreeFlyersForm } from '@/components/free-flyers/FreeFlyersForm';
import { Toaster } from '@/components/ui/sonner';

export const metadata = {
  title: 'Generate Free Real Estate Flyers | Media Portal',
  description:
    'Upload your photos, add your details, and we will automatically generate 3 printable flyers for you. We will email you when they are ready.',
};

export default function FreeFlyersPage() {
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
                <Image src="/Map-Pin-Logo.svg" alt="Photos4RealEstate logo" fill className="object-contain" sizes="32px" />
              </div>
              <div className="leading-tight select-none">
                <div className="font-semibold text-[#cb4153]">Photos 4 Real Estate</div>
                <div className="text-xs text-gray-500">Elevate Your Real Estate Listings</div>
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

      <main className="mx-auto max-w-5xl p-6 md:p-8 space-y-6">
        <Toaster position="bottom-right" />
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">Free Flyers</h1>
          <p className="mt-1 text-sm md:text-base text-gray-600">
            Upload 6 photos, add your details, and we will automatically generate 3 printable flyers for you.
          </p>
        </div>
        <div className="rounded-md border p-4 md:p-6 bg-white">
          <FreeFlyersForm />
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-8 border-t border-white/10 bg-[#131c3b] text-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 text-center text-sm">
          <div>
            Powered by{' '}
            <a href="https://photos4realestate.ca/" target="_blank" rel="noopener noreferrer" className="underline">Photos 4 Real Estate</a>{' '}
            · © {new Date().getFullYear()} All Rights Reserved
          </div>
          <div className="mt-2 space-x-4">
            <a href="https://photos4realestate.ca/terms-and-conditions/" target="_blank" rel="noopener noreferrer" className="underline">Terms</a>
            <a href="https://photos4realestate.ca/privacy-policy/" target="_blank" rel="noopener noreferrer" className="underline">Privacy</a>
            <a href="https://photos4realestate.ca/contact-us/" target="_blank" rel="noopener noreferrer" className="underline">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

