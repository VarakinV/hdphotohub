import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function KpiCard({
  icon: Icon,
  label,
  value,
  delta,
  tone = 'brick',
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  delta?: string;
  tone?: 'brick' | 'navy';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border bg-card p-4.5',
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          'absolute inset-y-0 left-0 w-[3px]',
          tone === 'brick' ? 'bg-brick-500' : 'bg-navy-700'
        )}
      />
      <div className="mb-3.5 flex items-center justify-between">
        <span
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-[10px]',
            tone === 'brick'
              ? 'bg-brick-tint text-brick-500'
              : 'border border-border bg-surface-2 text-navy-700 dark:text-[#aab4e6]'
          )}
        >
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
      <div className="text-[12.5px] font-medium text-muted-foreground">{label}</div>
      <div className="num mt-0.5 text-[30px] font-bold leading-none">{value}</div>
      {delta && <div className="mt-1.5 text-xs text-faint">{delta}</div>}
    </div>
  );
}
