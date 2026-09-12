'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { LogOut, Menu, Moon, Settings, Sun, UserRound } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getRouteMeta } from './nav-config';

export function AdminTopbar({ onOpenMobile }: { onOpenMobile: () => void }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { data: session } = useSession();
  const user = session?.user;

  useEffect(() => setMounted(true), []);

  const pathname = usePathname();
  const { title, subtitle } = getRouteMeta(pathname);
  const name = user?.name || user?.email || 'Admin';
  const initials =
    (user?.name?.trim()?.split(/\s+/).map((p) => p[0]).slice(0, 2).join('') ||
      user?.email?.[0] ||
      'U').toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-[68px] items-center gap-3.5 border-b border-border bg-card px-4 sm:px-6">
      <button
        type="button"
        onClick={onOpenMobile}
        aria-label="Open menu"
        className="flex items-center justify-center rounded-lg p-1.5 text-foreground hover:bg-surface-2 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="min-w-0">
        <h1 className="truncate font-display text-[17px] font-semibold leading-tight">
          {title}
        </h1>
        <p className="hidden truncate text-[12px] text-muted-foreground sm:block">
          {subtitle}
        </p>
      </div>
      <div className="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle dark mode"
          title="Toggle dark mode"
          className="flex h-9 w-9 items-center justify-center rounded-[10px] text-muted-foreground hover:bg-surface-2 hover:text-foreground"
        >
          {mounted && theme === 'dark' ? (
            <Sun className="h-[18px] w-[18px]" />
          ) : (
            <Moon className="h-[18px] w-[18px]" />
          )}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Open user menu"
              className="relative rounded-full outline-none focus-visible:ring-2 focus-visible:ring-brick-500"
            >
              <Avatar className="h-[34px] w-[34px]">
                {(user as any)?.avatarUrl || (user as any)?.image ? (
                  <AvatarImage
                    src={(user as any)?.avatarUrl || (user as any)?.image}
                    alt={name}
                  />
                ) : (
                  <AvatarFallback className="bg-navy-700 font-display text-[12.5px] font-semibold text-white">
                    {initials}
                  </AvatarFallback>
                )}
              </Avatar>
              <span
                aria-hidden
                className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-card bg-navy-700 text-white shadow-sm dark:bg-navy-600"
              >
                <Settings className="h-2.5 w-2.5" strokeWidth={2.5} />
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => (window.location.href = '/my-profile')}>
              <UserRound className="h-4 w-4" /> My Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
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
      </div>
    </header>
  );
}
