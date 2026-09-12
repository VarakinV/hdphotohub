import { ReactNode } from 'react';

export function PageHead({
  title,
  subtitle,
  actions,
  className,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mb-5 flex flex-wrap items-start justify-between gap-4 ${
        className || ''
      }`}
    >
      <div className="min-w-0">
        <h2 className="font-display text-[22px] font-semibold leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-0.5 text-[13.5px] text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex w-full flex-wrap gap-2.5 sm:w-auto">
          {actions}
        </div>
      )}
    </div>
  );
}
