'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { StatusPill } from '@/components/admin/ui/status-pill';

export default function BookingDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    load();
  }, [id]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/bookings/${id}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error('Failed to load booking', e);
    } finally {
      setLoading(false);
    }
  };

  function money(cents: number) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [newStartLocal, setNewStartLocal] = useState<string>('');

  useEffect(() => {
    if (!data?.start) return;
    // initialize datetime-local value from booking.start
    const d = new Date(data.start);
    const pad = (n: number) => String(n).padStart(2, '0');
    const local = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setNewStartLocal(local);
  }, [data?.start]);

  const handleReschedule = async () => {
    try {
      setSaving(true);
      if (!newStartLocal) return;
      const iso = new Date(newStartLocal).toISOString();
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start: iso }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to reschedule');
      toast.success('Booking rescheduled');
      await load();
    } catch (e: any) {
      toast.error(e.message || 'Failed to reschedule');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to cancel');
      toast.success('Booking cancelled');
      await load();
    } catch (e: any) {
      toast.error(e.message || 'Failed to cancel');
    } finally {
      setSaving(false);
    }
  };

  const handleSyncFromGoogle = async () => {
    try {
      setSyncing(true);
      const res = await fetch(`/api/bookings/${id}/sync-from-google`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Sync failed');
      toast.success('Synced from Google');
      await load();
    } catch (e: any) {
      toast.error(e.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="w-full">
      <Toaster position="bottom-right" />
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-faint" />
        </div>
      ) : !data ? (
        <div className="py-20 text-center text-[#c23434] dark:text-[#f09a9a]">
          Booking not found
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="rounded-2xl border border-border bg-card p-4.5 sm:p-6">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <h2 className="font-display text-[18px] font-semibold">Booking</h2>
              <StatusPill status={data.status} />
            </div>
            <div className="grid grid-cols-1 gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
              <div>
                <span className="field-label">When</span>
                {new Date(data.start).toLocaleString()} –{' '}
                {new Date(data.end).toLocaleTimeString(undefined, {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </div>
              <div>
                <span className="field-label">Time Zone</span>
                {data.timeZone}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4">
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="datetime-local"
                  value={newStartLocal}
                  onChange={(e) => setNewStartLocal(e.target.value)}
                  className="max-w-xs"
                />
                <Button
                  onClick={handleReschedule}
                  disabled={saving || !newStartLocal}
                >
                  {saving ? 'Rescheduling…' : 'Reschedule'}
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="destructive"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  {saving ? 'Cancelling…' : 'Cancel Booking'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSyncFromGoogle}
                  disabled={syncing}
                >
                  {syncing ? 'Syncing…' : 'Sync from Google'}
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4.5 sm:p-6">
            <h2 className="font-display mb-3 text-[16px] font-semibold">Property</h2>
            <div className="text-sm font-medium">
              {data.propertyFormattedAddress || data.propertyAddress}
            </div>
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              {data.unitNumber ? <div>Unit #: {data.unitNumber}</div> : null}
              {data.propertySizeSqFt ? (
                <div>Size: {data.propertySizeSqFt} sq ft</div>
              ) : null}
              {(data.basementMeasure || data.basementPhoto) ? (
                <div>
                  Basement:{' '}
                  {[data.basementMeasure && 'Measure', data.basementPhoto && 'Photo']
                    .filter(Boolean)
                    .join(', ')}
                </div>
              ) : null}
              {(data.garageMeasure || data.garagePhoto) ? (
                <div>
                  Detached Garage:{' '}
                  {[data.garageMeasure && 'Measure', data.garagePhoto && 'Photo']
                    .filter(Boolean)
                    .join(', ')}
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4.5 sm:p-6">
            <h2 className="font-display mb-3 text-[16px] font-semibold">Contact</h2>
            <div className="text-sm font-medium">{data.contactName}</div>
            <div className="text-sm text-muted-foreground">{data.contactEmail}</div>
            {data.contactPhone ? (
              <div className="text-sm text-muted-foreground">{data.contactPhone}</div>
            ) : null}
            {data.notes ? (
              <div className="mt-2 text-sm">
                <span className="field-label">Notes</span>
                {data.notes}
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-border bg-card p-4.5 sm:p-6">
            <h2 className="font-display mb-3 text-[16px] font-semibold">
              Selected Services
            </h2>
            <div className="text-sm">
              {data.items?.map((it: any) => (
                <div key={it.id} className="border-b border-border py-2.5 last:border-b-0">
                  <div className="flex flex-wrap justify-between gap-2">
                    <span className="font-medium">{it.serviceName}</span>
                    <span className="num">
                      {money(it.unitPriceCents)}{' '}
                      {it.taxCents ? (
                        <span className="text-xs text-muted-foreground">
                          (+{money(it.taxCents)} tax)
                        </span>
                      ) : null}
                    </span>
                  </div>
                  {it.quantityLabel ? (
                    <div className="mt-1 text-xs text-muted-foreground">
                      Quantity: {it.quantity}{' '}
                      {it.quantity === 1 || String(it.quantityLabel).endsWith('s')
                        ? it.quantityLabel
                        : `${it.quantityLabel}s`}
                    </div>
                  ) : null}
                  <div className="mt-1 text-xs text-muted-foreground">
                    {it.service?.category?.name ? (
                      <div>
                        <span className="text-faint">Service Category:</span>{' '}
                        {it.service.category.name}
                      </div>
                    ) : null}
                    {it.service?.category?.description ? (
                      <div>
                        <span className="text-faint">
                          Service Category Description:
                        </span>{' '}
                        {it.service.category.description}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-col items-end gap-1 border-t border-border pt-3 text-sm">
              <div className="flex gap-4">
                <span>Subtotal: {money(data.subtotalCents)}</span>
                <span>Tax: {money(data.taxCents)}</span>
              </div>
              {data.discountCents > 0 && (
                <div className="flex gap-4 text-[#c23434] dark:text-[#f09a9a]">
                  <span>
                    Discount
                    {data.appliedPromoCode?.code
                      ? ` (${data.appliedPromoCode.code})`
                      : ''}
                    :
                  </span>
                  <span>-{money(data.discountCents)}</span>
                </div>
              )}
              <div className="num text-base font-semibold">
                Total: {money(data.totalCents)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
