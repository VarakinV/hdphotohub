import type { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-5 py-14 text-center text-muted-foreground">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-surface-2 text-brick-500">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="font-display text-base font-semibold text-foreground">
        {title}
      </h3>
      {description && (
        <p className="mt-1.5 max-w-[36ch] text-[13px]">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
