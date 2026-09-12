'use client';

import { cn } from '@/lib/utils';
import type { DeliveryNavItem } from '@/components/delivery/types';

function NavButton({
  item,
  active,
  onClick,
  variant,
}: {
  item: DeliveryNavItem;
  active: boolean;
  onClick: () => void;
  variant: 'sidebar' | 'pill';
}) {
  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'shrink-0 rounded-full px-3.5 py-2 text-[15px] font-medium whitespace-nowrap transition-colors',
          active
            ? 'bg-navy-900 text-white'
            : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:text-navy-900'
        )}
      >
        {item.label}
        {item.count != null ? (
          <span className={cn('ml-1.5 tabular-nums', active ? 'text-white/70' : 'text-gray-400')}>
            {item.count}
          </span>
        ) : null}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'true' : undefined}
      className={cn(
        'flex w-full items-center justify-between border-l-2 px-3 py-2 text-left text-[15px] transition-colors',
        active
          ? 'border-brick-500 bg-brick-500/5 font-medium text-navy-900'
          : 'border-transparent text-gray-500 hover:text-navy-900'
      )}
    >
      <span>{item.label}</span>
      {item.count != null ? (
        <span className="ml-3 tabular-nums text-gray-400">{item.count}</span>
      ) : null}
    </button>
  );
}

export function DeliveryMobileNav({
  items,
  activeId,
  onNavigate,
}: {
  items: DeliveryNavItem[];
  activeId: string | null;
  onNavigate: (id: string) => void;
}) {
  return (
    <div className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/95 backdrop-blur lg:hidden">
      <nav
        className="flex gap-1.5 overflow-x-auto px-3 py-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Delivery sections"
      >
        {items.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            active={activeId === item.id}
            onClick={() => onNavigate(item.id)}
            variant="pill"
          />
        ))}
      </nav>
    </div>
  );
}

export function DeliveryDesktopNav({
  core,
  kit,
  activeId,
  onNavigate,
}: {
  core: DeliveryNavItem[];
  kit: DeliveryNavItem[];
  activeId: string | null;
  onNavigate: (id: string) => void;
}) {
  return (
    <aside className="hidden lg:block">
      <nav className="sticky top-6 space-y-6" aria-label="Delivery sections">
        {core.length > 0 && (
          <div>
            <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
              Core deliverables
            </div>
            <ul className="space-y-0.5">
              {core.map((item) => (
                <li key={item.id}>
                  <NavButton
                    item={item}
                    active={activeId === item.id}
                    onClick={() => onNavigate(item.id)}
                    variant="sidebar"
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
        {kit.length > 0 && (
          <div>
            <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
              Marketing kit
            </div>
            <ul className="space-y-0.5">
              <li>
                <NavButton
                  item={{ id: 'marketing-kit', label: 'Jump to kit' }}
                  active={activeId === 'marketing-kit'}
                  onClick={() => onNavigate('marketing-kit')}
                  variant="sidebar"
                />
              </li>
              {kit.map((item) => (
                <li key={item.id}>
                  <NavButton
                    item={item}
                    active={activeId === item.id}
                    onClick={() => onNavigate(item.id)}
                    variant="sidebar"
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>
    </aside>
  );
}
