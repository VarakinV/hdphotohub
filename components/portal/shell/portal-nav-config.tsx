import {
  Clapperboard,
  ClipboardList,
  FileText,
  QrCode,
  Sparkles,
  Star,
  type LucideIcon,
} from 'lucide-react';

export interface PortalNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const PORTAL_NAV_ITEMS: PortalNavItem[] = [
  { href: '/portal', label: 'Portal', icon: Clapperboard },
  { href: '/portal/orders', label: 'My Orders', icon: ClipboardList },
  { href: '/portal/points-history', label: 'Points History', icon: Sparkles },
  { href: '/portal/review', label: 'Write a Review', icon: Star },
  { href: '/portal/invoices', label: 'Invoices', icon: FileText },
  { href: '/portal/qr-codes', label: 'My QR Codes', icon: QrCode },
];

export function isPortalNavActive(
  pathname: string,
  href: string
): boolean {
  if (href === '/portal') {
    return pathname === '/portal';
  }
  return pathname === href || pathname.startsWith(href + '/');
}

export interface PortalRouteMeta {
  title: string;
  subtitle: string;
}

const ROUTE_META: { prefix: string; meta: PortalRouteMeta }[] = [
  { prefix: '/portal/orders', meta: { title: 'My Orders', subtitle: 'View and manage your orders' } },
  { prefix: '/portal/points-history', meta: { title: 'Points History', subtitle: 'Your earned and redeemed points' } },
  { prefix: '/portal/review', meta: { title: 'Write a Review', subtitle: 'We appreciate your reviews!' } },
  { prefix: '/portal/invoices', meta: { title: 'Your Invoices', subtitle: 'View and open your invoices from Wave' } },
  { prefix: '/portal/qr-codes', meta: { title: 'My QR Codes', subtitle: 'Manage QR codes for your property listings' } },
  { prefix: '/portal', meta: { title: 'Customer Portal', subtitle: 'Access your recent orders and tools' } },
];

export function getPortalRouteMeta(pathname: string): PortalRouteMeta {
  const matches = ROUTE_META.filter(
    (r) => pathname === r.prefix || pathname.startsWith(r.prefix + '/')
  );
  if (matches.length === 0) {
    return { title: 'Portal', subtitle: 'Photos 4 Real Estate client portal' };
  }
  return matches.reduce((best, cur) =>
    cur.prefix.length > best.prefix.length ? cur : best
  ).meta;
}
