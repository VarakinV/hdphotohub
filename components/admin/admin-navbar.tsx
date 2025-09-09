'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Menu, Settings } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogoutButton } from '@/components/auth/logout-button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function NavLinks({
  isSuperadmin,
  onNavigate,
}: {
  isSuperadmin: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = useMemo(() => {
    const base = [
      { href: '/admin/dashboard', label: 'Dashboard' },
      { href: '/admin/clients', label: 'Clients' },
      { href: '/admin/orders', label: 'Orders' },
    ];
    if (isSuperadmin) base.push({ href: '/admin/users', label: 'Users' });
    return base;
  }, [isSuperadmin]);

  return (
    <nav className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
      {items.map((it) => {
        const active = pathname.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            onClick={onNavigate}
            className={`px-2 py-1 rounded hover:text-primary transition-colors ${
              active ? 'text-primary font-medium' : 'text-gray-700'
            }`}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminNavbar() {
  const { data: session } = useSession();
  const isSuperadmin = (session?.user as any)?.role === 'SUPERADMIN';
  const [open, setOpen] = useState(false);

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Brand / Title */}
          <Link
            href="/admin/dashboard"
            className="text-lg font-semibold text-gray-900"
          >
            Admin
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex md:flex-1 md:justify-center">
            <NavLinks isSuperadmin={isSuperadmin} />
          </div>

          {/* Desktop user menu (Shadcn/Radix, click to open) */}
          <div className="hidden md:block relative">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 rounded-full outline-none focus:ring-2 focus:ring-primary/30"
                  aria-label="Open user menu"
                >
                  <Avatar className="size-8">
                    {(session?.user as any)?.avatarUrl ||
                    (session?.user as any)?.image ? (
                      <AvatarImage
                        src={
                          (session?.user as any)?.avatarUrl ||
                          (session?.user as any)?.image
                        }
                        alt={session?.user?.name || 'User'}
                      />
                    ) : (
                      <AvatarFallback>
                        {(
                          session?.user?.name?.[0] ||
                          session?.user?.email?.[0] ||
                          'U'
                        ).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <Settings className="h-4 w-4 text-gray-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {session?.user?.name || session?.user?.email || 'Account'}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    window.location.href = '/my-profile';
                  }}
                >
                  My Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={async (e) => {
                    e.preventDefault();
                    await signOut({ redirect: true, callbackUrl: '/login' });
                  }}
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile toggle */}
          <div className="md:hidden">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setOpen((v) => !v)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden mt-3 border-t pt-3 space-y-3">
            <NavLinks
              isSuperadmin={isSuperadmin}
              onNavigate={() => setOpen(false)}
            />
            <div className="flex items-center gap-3">
              <Link
                href="/my-profile"
                onClick={() => setOpen(false)}
                className="px-2 py-1 rounded text-gray-700 hover:text-primary"
              >
                My Profile
              </Link>
              <LogoutButton />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
