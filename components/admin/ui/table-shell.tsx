import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Card wrapper for list pages: toolbar row, responsive table area, pager. */
export function TableShell({
  toolbar,
  children,
  footer,
  className,
}: {
  toolbar?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {toolbar}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="table-responsive">{children}</div>
        {footer}
      </div>
    </div>
  );
}
