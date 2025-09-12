'use client';

import { motion, type Variants } from 'framer-motion';

export function HowItWorks() {
  const container: Variants = {
    hidden: { opacity: 1 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.05 },
    },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
    },
  };

  // Hover effect for icon discs handled inline on motion.span

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <h3 className="font-semibold text-center">How it works</h3>

      <motion.div
        id="how-it-works"
        className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-8"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-20% 0px -20% 0px' }}
      >
        {/* Step 1 */}
        <motion.div className="text-center" variants={item}>
          <div className="relative inline-grid place-items-center">
            <motion.span
              className="inline-grid place-items-center h-16 w-16 rounded-full bg-rose-50 ring-1 ring-rose-100/60 shadow-sm text-[#cb4153]"
              whileHover={{ y: -2, scale: 1.04 }}
            >
              <svg
                aria-hidden
                className="h-7 w-7"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 5 17 10" />
                <line x1="12" y1="5" x2="12" y2="21" />
              </svg>
            </motion.span>
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-6 w-6 rounded-full bg-[#cb4153] text-white text-xs font-semibold grid place-items-center">
              1
            </span>
          </div>
          <div className="mt-5 font-semibold">Upload Media</div>
          <p className="mt-1 text-sm text-gray-600">
            Add property photos, videos, and attachments.
          </p>
        </motion.div>

        {/* Step 2 */}
        <motion.div className="text-center" variants={item}>
          <div className="relative inline-grid place-items-center">
            <motion.span
              className="inline-grid place-items-center h-16 w-16 rounded-full bg-rose-50 ring-1 ring-rose-100/60 shadow-sm text-[#cb4153]"
              whileHover={{ y: -2, scale: 1.04 }}
            >
              <svg
                aria-hidden
                className="h-7 w-7"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1" />
                <path d="M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1" />
              </svg>
            </motion.span>
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-6 w-6 rounded-full bg-[#cb4153] text-white text-xs font-semibold grid place-items-center">
              2
            </span>
          </div>
          <div className="mt-5 font-semibold">Generate Delivery Page</div>
          <p className="mt-1 text-sm text-gray-600">
            System creates a professional media portal instantly.
          </p>
        </motion.div>

        {/* Step 3 */}
        <motion.div className="text-center" variants={item}>
          <div className="relative inline-grid place-items-center">
            <motion.span
              className="inline-grid place-items-center h-16 w-16 rounded-full bg-rose-50 ring-1 ring-rose-100/60 shadow-sm text-[#cb4153]"
              whileHover={{ y: -2, scale: 1.04 }}
            >
              <svg
                aria-hidden
                className="h-7 w-7"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 2L11 13" />
                <path d="M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </motion.span>
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-6 w-6 rounded-full bg-[#cb4153] text-white text-xs font-semibold grid place-items-center">
              3
            </span>
          </div>
          <div className="mt-5 font-semibold">Send to Client</div>
          <p className="mt-1 text-sm text-gray-600">
            Share one secure link with your realtor.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
