"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function LandingHeader() {
  const [open, setOpen] = useState(false);

  const NavLinks = (
    <>
      <a href="#features" className="hover:text-[#ca4153]">Features</a>
      <a href="#how-it-works" className="hover:text-[#ca4153]">How it works</a>
      <a href="#cta" className="hover:text-[#ca4153]">Get started</a>
      <a href="#testimonials" className="hover:text-[#ca4153]">Testimonials</a>
      <Link
        href="/login"
        className="inline-flex items-center px-4 py-2 rounded-md border border-gray-200 hover:bg-gray-50"
      >
        Login
      </Link>
    </>
  );

  return (
    <header className="border-b">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-8">
            <Image src="/Map-Pin-Logo.svg" alt="Photos4RealEstate logo" fill className="object-contain" sizes="32px" priority />
          </div>
          <div className="leading-tight select-none">
            <div className="font-semibold text-[#cb4153]">Media Portal</div>
            <div className="text-xs text-gray-500">Elevate Your Real Estate Listings</div>
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-6 text-sm" aria-label="Main">
          {NavLinks}
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="sm:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile panel */}
      {open && (
        <div className="sm:hidden border-t">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col gap-3 text-sm" onClick={() => setOpen(false)}>
              {NavLinks}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

