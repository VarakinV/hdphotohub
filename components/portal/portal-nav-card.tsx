'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  ClipboardList,
  Star,
  Settings2,
  X,
  FileText,
} from 'lucide-react';

const items = [
  { href: '/portal', label: 'Portal', Icon: LayoutDashboard },
  { href: '/portal/orders', label: 'My Orders', Icon: ClipboardList },
  { href: '/portal/review', label: 'Write a Review', Icon: Star },
  { href: '/portal/invoices', label: 'Invoices', Icon: FileText },
];

export default function PortalNavCard() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const [anim, setAnim] = useState(false);

  useEffect(() => {
    if (expanded) {
      const t = setTimeout(() => setAnim(true), 0);
      return () => clearTimeout(t);
    } else {
      setAnim(false);
    }
  }, [expanded]);

  return (
    <Card className="relative bg-transparent shadow-none rounded-none py-0 md:bg-white md:shadow md:rounded-lg md:p-3">
      {/* Mobile toggle */}
      <Button
        variant="outline"
        size="icon"
        className="md:hidden mb-2"
        onClick={() => setExpanded((v) => !v)}
        aria-label="Open Portal Menu"
      >
        <Settings2 className="h-5 w-5" />
      </Button>

      {/* Mobile expanded panel */}
      {expanded && (
        <>
          {/* Scrim */}
          <div
            className={`md:hidden fixed inset-0 z-40 bg-black/40 transition-opacity duration-150 ${
              anim ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={() => setExpanded(false)}
          />
          {/* Slide-in panel */}
          <div
            className={`md:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white shadow-lg p-3 transition-transform duration-200 ${
              anim ? 'translate-x-0' : '-translate-x-3'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Portal Menu</span>
              <button
                onClick={() => setExpanded(false)}
                aria-label="Close"
                className="p-1 rounded hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav aria-label="Portal navigation">
              <ul className="space-y-1">
                {items.map(({ href, label, Icon }) => {
                  const active = pathname.startsWith(href);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        className={`flex items-center gap-3 px-2 py-2 rounded hover:bg-gray-50 transition-colors ${
                          active ? 'text-primary font-medium' : 'text-gray-700'
                        }`}
                        onClick={() => setExpanded(false)}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span className="truncate">{label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </>
      )}

      {/* Desktop full nav */}
      <div className="hidden md:block mb-2 text-sm font-medium text-gray-700">
        Portal Menu
      </div>
      <nav className="hidden md:block" aria-label="Portal navigation (desktop)">
        <ul className="space-y-1">
          {items.map(({ href, label, Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 px-2 py-2 rounded hover:bg-gray-50 transition-colors ${
                    active ? 'text-primary font-medium' : 'text-gray-700'
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="truncate">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </Card>
  );
}
