'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Layers,
  Wrench,
  Percent,
  ChevronRight,
  Calendar,
  Settings as SettingsIcon,
  Ban,
} from 'lucide-react';

const primaryItems = [
  { href: '/admin/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/admin/clients', label: 'Clients', Icon: Users },
  { href: '/admin/orders', label: 'Orders', Icon: ClipboardList },
  {
    href: '/admin/service-categories',
    label: 'Service Categories',
    Icon: Layers,
  },
  { href: '/admin/services', label: 'Services', Icon: Wrench },
  { href: '/admin/taxes', label: 'Taxes', Icon: Percent },
];

const businessSettings = [
  {
    href: '/admin/booking-settings',
    label: 'Booking Settings',
    Icon: SettingsIcon,
  },
  { href: '/admin/availability', label: 'Availability', Icon: Calendar },
  { href: '/admin/blackouts', label: 'Blackouts', Icon: Ban },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <aside
      className={`bg-white border-r h-[calc(100vh-0px)] sticky top-0 flex flex-col ${
        open ? 'w-64' : 'w-16'
      } transition-all duration-200`}
    >
      <button
        className="md:hidden mt-2 ml-2 inline-flex items-center justify-center rounded border p-1 text-gray-600"
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle sidebar"
      >
        <ChevronRight
          className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <nav className="flex-1 py-4">
        <ul className="space-y-1">
          {primaryItems.map(({ href, label, Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 ${
                    active ? 'text-primary font-medium' : 'text-gray-700'
                  }`}
                  onClick={() => setOpen(false)}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {open && <span className="truncate">{label}</span>}
                </Link>
              </li>
            );
          })}

          {/* Business Settings section */}
          <li className="pt-3">
            <div className="px-3 text-xs uppercase tracking-wide text-gray-400">
              {open ? 'Business Settings' : '\u00A0'}
            </div>
          </li>
          {businessSettings.map(({ href, label, Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 ${
                    active ? 'text-primary font-medium' : 'text-gray-700'
                  }`}
                  onClick={() => setOpen(false)}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {open && <span className="truncate">{label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
