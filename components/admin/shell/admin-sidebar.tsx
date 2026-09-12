'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { ChevronLeft, LogOut, UserRound, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NAV_GROUPS, isNavItemActive, type NavItem } from './nav-config';

export const SIDEBAR_COLLAPSED_KEY = 'admin-sidebar-collapsed';

function initialsOf(name?: string | null, email?: string | null) {
  const n = (name || '').trim();
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0] || '') + ((parts[1]?.[0] || '') || '')).toUpperCase();
  }
  return (email?.[0] || 'U').toUpperCase();
}

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
}

export function AdminSidebar({
  collapsed,
  mobileOpen,
  onToggleCollapse,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isSuperadmin = (session?.user as any)?.role === 'SUPERADMIN';
  const user = session?.user;

  const filterItems = (items: NavItem[]) =>
    items.filter((it) => !it.superadminOnly || isSuperadmin);

  const name = user?.name || user?.email || 'Admin';
  const initials = initialsOf(user?.name, user?.email);

  return (
    <>
      {/* Mobile backdrop */}
      <div
        aria-hidden={!mobileOpen}
        onClick={onCloseMobile}
        className={`fixed inset-0 z-40 bg-[rgba(9,13,28,0.55)] transition-opacity duration-200 lg:hidden ${
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-white/[0.06] bg-[linear-gradient(180deg,#131d3b_0%,#0f1730_100%)] text-[#c9cfe6] transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-[var(--shadow-pop)]' : '-translate-x-full lg:shadow-none'
        } ${collapsed ? 'lg:w-20' : ''}`}
        aria-label="Admin navigation"
      >
        {/* Brand */}
        <div
          className={`flex items-center gap-3 border-b border-white/[0.08] px-4 pb-4 pt-5 ${
            collapsed ? 'lg:justify-center lg:px-2' : ''
          }`}
        >
          <svg
            viewBox="0 0 40 48"
            className="h-[41px] w-[34px] shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <path d="M20 2C10.6 2 3 9.3 3 18.4 3 30.6 20 46 20 46s17-15.4 17-27.6C37 9.3 29.4 2 20 2z" fill="#cb4154" />
            <circle cx="20" cy="18.5" r="11" fill="#ffffff" />
            <g transform="translate(20,18.5)">
              <path d="M-3.6 -3.6 -2.6 -5.6H2.6L3.6 -3.6" fill="#cb4154" />
              <rect x="-7" y="-3.6" width="14" height="8.6" rx="1.6" fill="#cb4154" />
              <circle cx="0" cy="0.5" r="3" fill="#ffffff" />
              <circle cx="0" cy="0.5" r="1.4" fill="#cb4154" />
              <rect x="4.3" y="-2.3" width="1.6" height="1.1" rx="0.5" fill="#ffffff" />
            </g>
          </svg>
          <div className={`min-w-0 whitespace-nowrap ${collapsed ? 'lg:hidden' : ''}`}>
            <div className="font-display text-[15px] font-semibold leading-tight text-white">
              Photos 4 Real Estate
            </div>
            <div className="text-[11.5px] text-[#8791b8]">Admin portal</div>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close menu"
            className="ml-auto rounded-lg p-1.5 text-[#c9cfe6] hover:bg-white/[0.08] lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 pt-4 [scrollbar-width:thin]">
          {NAV_GROUPS.map((group) => {
            const items = filterItems(group.items);
            if (items.length === 0) return null;
            return (
              <div key={group.title} className="mb-4">
                <div
                  className={`px-2.5 pb-1.5 text-[11px] font-semibold text-[#6d759c] ${
                    collapsed ? 'lg:hidden' : ''
                  }`}
                >
                  {group.title}
                </div>
                <ul>
                  {items.map((it) => {
                    const active =
                      isNavItemActive(pathname, it.href) ||
                      (it.href === '/admin/dashboard' && pathname === '/admin');
                    const Icon = it.icon;
                    return (
                      <li key={it.href} className="my-0.5">
                        <Link
                          href={it.href}
                          onClick={onCloseMobile}
                          title={it.label}
                          aria-current={active ? 'page' : undefined}
                          className={`flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-[13.5px] font-medium transition-colors ${
                            active
                              ? 'bg-brick-500 text-white'
                              : 'text-[#c9cfe6] hover:bg-white/[0.06] hover:text-white'
                          } ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}
                        >
                          <Icon
                            className={`h-[18px] w-[18px] shrink-0 ${
                              active ? 'text-white' : 'text-[#9aa2c6]'
                            }`}
                          />
                          <span className={`truncate ${collapsed ? 'lg:hidden' : ''}`}>
                            {it.label}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* Footer user */}
        <div
          className={`flex shrink-0 items-center gap-2.5 border-t border-white/[0.08] p-3 ${
            collapsed ? 'lg:flex-col lg:p-3.5' : ''
          }`}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Open user menu"
                className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-brick-500"
              >
                <Avatar className="h-[34px] w-[34px]">
                  {(user as any)?.avatarUrl || (user as any)?.image ? (
                    <AvatarImage
                      src={(user as any)?.avatarUrl || (user as any)?.image}
                      alt={name}
                    />
                  ) : (
                    <AvatarFallback className="bg-brick-500 font-display text-[12.5px] font-semibold text-white">
                      {initials}
                    </AvatarFallback>
                  )}
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="lg:hidden">
              <DropdownMenuLabel>{name}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => (window.location.href = '/my-profile')}>
                <UserRound className="h-4 w-4" /> My Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  signOut({ redirect: true, callbackUrl: '/login' });
                }}
              >
                <LogOut className="h-4 w-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className={`min-w-0 ${collapsed ? 'lg:hidden' : ''}`}>
            <div className="truncate text-[12.5px] font-semibold text-[#e7eaf7]">{name}</div>
            <div className="text-[11px] text-[#8791b8]">
              {(user as any)?.role === 'SUPERADMIN' ? 'Superadmin' : 'Admin'}
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`ml-auto hidden h-[30px] w-[30px] items-center justify-center rounded-lg border border-white/[0.14] text-[#c9cfe6] hover:bg-white/[0.08] lg:flex ${
              collapsed ? 'lg:ml-0' : ''
            }`}
          >
            <ChevronLeft className={`h-4 w-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </aside>
    </>
  );
}
