import { cn } from '@/lib/utils';

type PillTone = 'success' | 'info' | 'warn' | 'danger' | 'muted' | 'brand';

const TONES: Record<PillTone, string> = {
  success: 'pill-success',
  info: 'pill-info',
  warn: 'pill-warn',
  danger: 'pill-danger',
  muted: 'pill-muted',
  brand: 'pill-brand',
};

const LABELS: Record<string, { label: string; tone: PillTone }> = {
  // Orders
  DRAFT: { label: 'Draft', tone: 'muted' },
  PUBLISHED: { label: 'Published', tone: 'success' },
  ARCHIVED: { label: 'Archived', tone: 'brand' },
  // Bookings
  PENDING: { label: 'Pending', tone: 'warn' },
  CONFIRMED: { label: 'Confirmed', tone: 'success' },
  CANCELLED: { label: 'Cancelled', tone: 'danger' },
  // Templates
  ACTIVE: { label: 'Active', tone: 'success' },
  INACTIVE: { label: 'Inactive', tone: 'warn' },
};

export function statusMeta(status: string): { label: string; tone: PillTone } {
  return (
    LABELS[status] || {
      label: status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, ' '),
      tone: 'muted',
    }
  );
}

export function StatusPill({
  status,
  label,
  tone,
  className,
}: {
  status: string;
  label?: string;
  tone?: PillTone;
  className?: string;
}) {
  const meta = statusMeta(status);
  return (
    <span className={cn('pill', TONES[tone ?? meta.tone], className)}>
      {label ?? meta.label}
    </span>
  );
}
