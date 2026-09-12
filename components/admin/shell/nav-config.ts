import {
  Ban,
  Calendar,
  Clapperboard,
  Clock,
  GalleryHorizontalEnd,
  Image,
  Layers,
  LayoutDashboard,
  Megaphone,
  Package,
  Percent,
  QrCode,
  Settings,
  ShieldCheck,
  Tag,
  Truck,
  Users,
  Video,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  superadminOnly?: boolean;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Core',
    items: [
      { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/clients', label: 'Clients', icon: Users },
      { href: '/admin/orders', label: 'Orders', icon: Package },
      { href: '/admin/bookings', label: 'Bookings', icon: Calendar },
    ],
  },
  {
    title: 'Business settings',
    items: [
      { href: '/admin/booking-settings', label: 'Booking settings', icon: Settings },
      { href: '/admin/travel-fees', label: 'Travel fees', icon: Truck },
      { href: '/admin/availability', label: 'Availability', icon: Clock },
      { href: '/admin/blackouts', label: 'Blackouts', icon: Ban },
      { href: '/admin/service-categories', label: 'Service categories', icon: Layers },
      { href: '/admin/services', label: 'Services', icon: Wrench },
      { href: '/admin/taxes', label: 'Taxes', icon: Percent },
      { href: '/admin/promo-codes', label: 'Promo codes', icon: Tag },
    ],
  },
  {
    title: 'Manage',
    items: [
      { href: '/admin/qr-codes', label: 'QR codes', icon: QrCode },
      { href: '/admin/templates', label: 'Video templates', icon: Video },
      { href: '/admin/social-templates', label: 'Social media templates', icon: Megaphone },
      { href: '/admin/users', label: 'Users', icon: ShieldCheck, superadminOnly: true },
    ],
  },
  {
    title: 'Lead generation',
    items: [
      { href: '/admin/free-reels-orders', label: 'Free reels', icon: Clapperboard },
      { href: '/admin/free-flyers-orders', label: 'Free flyers', icon: Image },
      { href: '/admin/free-qr-orders', label: 'Free QR codes', icon: QrCode },
      { href: '/admin/free-slideshow-orders', label: 'Free slideshow', icon: GalleryHorizontalEnd },
    ],
  },
];

export interface RouteMeta {
  title: string;
  subtitle: string;
}

/** Longest-prefix route metadata for the topbar page heading. */
const ROUTE_META: { prefix: string; meta: RouteMeta }[] = [
  { prefix: '/admin/dashboard', meta: { title: 'Admin dashboard', subtitle: 'Overview of your business and recent activity' } },
  { prefix: '/admin/clients/users', meta: { title: 'Clients', subtitle: 'Client portal users' } },
  { prefix: '/admin/clients', meta: { title: 'Clients', subtitle: 'Manage your realtor clients' } },
  { prefix: '/admin/orders/new', meta: { title: 'Orders', subtitle: 'Create a new order' } },
  { prefix: '/admin/orders', meta: { title: 'Orders', subtitle: 'All orders across your business' } },
  { prefix: '/admin/bookings', meta: { title: 'Bookings', subtitle: 'All bookings across your business' } },
  { prefix: '/admin/users', meta: { title: 'Users', subtitle: 'Manage admin accounts' } },
  { prefix: '/admin/qr-codes', meta: { title: 'QR codes', subtitle: 'QR codes linked to your orders' } },
  { prefix: '/admin/templates', meta: { title: 'Video templates', subtitle: 'Remotion reel templates' } },
  { prefix: '/admin/social-templates', meta: { title: 'Social media templates', subtitle: 'Prompt templates for social posts' } },
  { prefix: '/admin/booking-settings', meta: { title: 'Booking settings', subtitle: 'Configure your booking flow' } },
  { prefix: '/admin/travel-fees', meta: { title: 'Travel fees', subtitle: 'Distance-based fee rules' } },
  { prefix: '/admin/availability', meta: { title: 'Availability', subtitle: 'Weekly working hours' } },
  { prefix: '/admin/blackouts', meta: { title: 'Blackouts', subtitle: 'Dates you are unavailable' } },
  { prefix: '/admin/service-categories', meta: { title: 'Service categories', subtitle: 'Group services into categories' } },
  { prefix: '/admin/services', meta: { title: 'Services', subtitle: 'Services you offer' } },
  { prefix: '/admin/taxes', meta: { title: 'Taxes', subtitle: 'Tax rates by region' } },
  { prefix: '/admin/promo-codes', meta: { title: 'Promo codes', subtitle: 'Discount codes for clients' } },
  { prefix: '/admin/free-reels-orders', meta: { title: 'Free reels', subtitle: 'Lead generation reels requests' } },
  { prefix: '/admin/free-flyers-orders', meta: { title: 'Free flyers', subtitle: 'Lead generation flyers requests' } },
  { prefix: '/admin/free-qr-orders', meta: { title: 'Free QR codes', subtitle: 'Lead generation QR requests' } },
  { prefix: '/admin/free-slideshow-orders', meta: { title: 'Free slideshow', subtitle: 'Lead generation slideshow requests' } },
];

export function getRouteMeta(pathname: string): RouteMeta {
  const matches = ROUTE_META.filter((r) => pathname === r.prefix || pathname.startsWith(r.prefix + '/') || pathname.startsWith(r.prefix));
  if (matches.length === 0) {
    return { title: 'Admin', subtitle: 'Photos 4 Real Estate admin portal' };
  }
  // Prefer the most specific (longest) prefix match
  return matches.reduce((best, cur) =>
    cur.prefix.length > best.prefix.length ? cur : best
  ).meta;
}

export function isNavItemActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  return pathname.startsWith(href + '/');
}
