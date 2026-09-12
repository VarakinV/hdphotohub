import type { LucideIcon } from 'lucide-react';
import { Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function IconAction({
  icon: Icon,
  label,
  onClick,
  danger,
  disabled,
  loading,
  href,
  download,
  target,
}: {
  icon: LucideIcon;
  label: string;
  onClick?: () => void | Promise<void>;
  danger?: boolean;
  disabled?: boolean;
  loading?: boolean;
  href?: string;
  download?: boolean | string;
  target?: string;
}) {
  const cls = cn(
    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-transparent text-muted-foreground transition-colors hover:border-navy-600 hover:text-foreground',
    danger &&
      'border-[#f3d3d3] bg-brick-tint text-[#c23434] hover:border-[#e8b4b4] hover:bg-brick-tint-strong hover:text-[#a82828] dark:border-[#4a2530] dark:text-[#f09a9a] dark:hover:border-[#6a3540] dark:hover:text-[#f0b0b0]',
    (disabled || loading) && 'pointer-events-none opacity-50'
  );
  const inner = loading ? (
    <Loader2 className="h-4 w-4 animate-spin" />
  ) : (
    <Icon className="h-4 w-4" />
  );
  if (href) {
    return (
      <a
        href={href}
        download={download}
        target={target}
        rel={target === '_blank' ? 'noreferrer' : undefined}
        aria-label={label}
        title={label}
        className={cls}
      >
        {inner}
      </a>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={label}
      title={label}
      className={cls}
    >
      {inner}
    </button>
  );
}

export function DeleteIconButton({
  label = 'Delete',
  ...props
}: Omit<Parameters<typeof IconAction>[0], 'icon' | 'danger' | 'label'> & {
  label?: string;
}) {
  return <IconAction {...props} icon={Trash2} danger label={label} />;
}

export function Toolbar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mb-3.5 flex flex-wrap items-center gap-2.5',
        className
      )}
    >
      {children}
    </div>
  );
}

export function ResultCount({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2.5 text-[12.5px] text-muted-foreground">{children}</div>
  );
}
