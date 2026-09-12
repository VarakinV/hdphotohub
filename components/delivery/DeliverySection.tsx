'use client';

import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DeliverySection({
  id,
  title,
  description,
  count,
  open,
  onToggle,
  headerActions,
  previewThumbs,
  children,
  variant = 'card',
}: {
  id: string;
  title: string;
  description?: string;
  count?: number;
  open: boolean;
  onToggle: () => void;
  headerActions?: React.ReactNode;
  previewThumbs?: string[];
  children: React.ReactNode;
  variant?: 'card' | 'flush';
}) {
  const thumbs = (previewThumbs || []).filter(Boolean).slice(0, 6);

  return (
    <section
      id={id}
      className={cn(
        'scroll-mt-20 lg:scroll-mt-8',
        variant === 'card' &&
          'overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]'
      )}
    >
      <div
        className={cn(
          'flex items-center gap-3 px-5 py-4 md:px-6',
          variant === 'flush' && 'px-5 md:px-6'
        )}
      >
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={`${id}-panel`}
        >
          <div className="min-w-0 max-w-full shrink">
            <div className="flex items-center gap-2.5">
              <h2 className="truncate text-xl font-semibold text-navy-900 md:text-2xl">
                {title}
              </h2>
              {typeof count === 'number' && (
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-medium tabular-nums text-gray-500">
                  {count}
                </span>
              )}
            </div>
            {description ? (
              <p className="mt-1 max-w-2xl text-sm text-gray-500 md:text-[15px]">{description}</p>
            ) : null}
          </div>
          {thumbs.length > 0 && (
            <div className="ml-auto hidden shrink-0 items-center xl:flex">
              {thumbs.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={`${src}-${i}`}
                  src={src}
                  alt=""
                  className="h-10 w-10 rounded-md object-cover ring-2 ring-white"
                  style={{ marginLeft: i === 0 ? 0 : -6 }}
                />
              ))}
            </div>
          )}
        </button>
        {headerActions ? (
          <div className="hidden shrink-0 sm:block">{headerActions}</div>
        ) : null}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
          className="shrink-0 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-navy-900"
        >
          <ChevronDown
            className={cn(
              'h-5 w-5 transition-transform duration-200',
              open && 'rotate-180'
            )}
          />
        </button>
      </div>
      {headerActions ? (
        <div className="px-5 pb-3 sm:hidden md:px-6">{headerActions}</div>
      ) : null}
      {open ? (
        <div
          id={`${id}-panel`}
          className="border-t border-gray-100 px-5 py-4 md:px-6 md:py-5"
        >
          {children}
        </div>
      ) : null}
    </section>
  );
}

export function ViewAllButton({
  total,
  noun,
  expanded,
  onClick,
}: {
  total: number;
  noun: string;
  expanded: boolean;
  onClick: () => void;
}) {
  return (
    <div className="mt-5 flex justify-center">
      <button
        type="button"
        onClick={onClick}
        className="rounded-full bg-navy-700 px-5 py-2.5 text-[15px] font-medium text-white shadow-sm transition-colors hover:bg-navy-600"
      >
        {expanded ? 'Show less' : `View all ${total} ${noun}`}
      </button>
    </div>
  );
}

export function MoreTile({
  remaining,
  onClick,
  className,
}: {
  remaining: number;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center rounded-xl bg-gray-100 text-center text-gray-500 transition-colors hover:bg-gray-200/80 hover:text-navy-900',
        className
      )}
    >
      <span className="text-[15px] font-medium">+{remaining} more</span>
      <span className="text-[15px]">View all</span>
    </button>
  );
}
